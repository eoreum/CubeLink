// CubeLink Conveyor Firmware v1.1.0
// Arduino Nano + TB6612FNG-compatible motor driver + HC-SR04
// Pin map: D3 PWMA, D7 AIN1, D8 AIN2, D12 STBY, D4 TRIG, D5 ECHO

const uint8_t PIN_PWMA = 3;
const uint8_t PIN_AIN1 = 7;
const uint8_t PIN_AIN2 = 8;
const uint8_t PIN_STBY = 12;
const uint8_t PIN_TRIG = 4;
const uint8_t PIN_ECHO = 5;

char inputBuffer[80];
uint8_t inputLength = 0;
char motorDirection = 'S';
uint8_t motorSpeedPercent = 0;
uint8_t requestedSpeedPercent = 60;
unsigned long lastTelemetryAt = 0;

void applyMotor(char direction, int speedPercent) {
  speedPercent = constrain(speedPercent, 0, 100);
  requestedSpeedPercent = speedPercent;
  if (direction == 'S' || speedPercent == 0) {
    analogWrite(PIN_PWMA, 0);
    digitalWrite(PIN_AIN1, LOW);
    digitalWrite(PIN_AIN2, LOW);
    motorDirection = 'S';
    motorSpeedPercent = 0;
    return;
  }
  digitalWrite(PIN_STBY, HIGH);
  digitalWrite(PIN_AIN1, direction == 'F' ? HIGH : LOW);
  digitalWrite(PIN_AIN2, direction == 'F' ? LOW : HIGH);
  analogWrite(PIN_PWMA, map(speedPercent, 0, 100, 0, 255));
  motorDirection = direction;
  motorSpeedPercent = speedPercent;
}

float readDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long duration = pulseIn(PIN_ECHO, HIGH, 25000UL);
  if (duration == 0) return 400.0;
  return duration * 0.0343 / 2.0;
}

void sendHello() {
  Serial.println(F("HELLO,CUBELINK_CONVEYOR,1.1.0"));
  Serial.println(F("DEVICE=CUBELINK_CONVEYOR"));
  Serial.println(F("FW=1.1.0"));
  Serial.println(F("PROTOCOL=1"));
  Serial.println(F("CAP=MOTOR,ULTRASONIC,STATUS"));
  Serial.println(F("END"));
}

void sendStatus() {
  Serial.print(F("STATUS,DIR="));
  if (motorDirection == 'F') Serial.print(F("F"));
  else if (motorDirection == 'R') Serial.print(F("R"));
  else Serial.print(F("STOP"));
  Serial.print(F(",SPEED="));
  Serial.print(motorSpeedPercent);
  Serial.print(F(",DIST="));
  Serial.println(readDistanceCm(), 1);
}

void handleCommand(char *command) {
  while (*command == ' ') command++;
  for (char *p = command; *p; p++) if (*p >= 'a' && *p <= 'z') *p -= 32;

  if (!strcmp(command, "HELLO") || !strcmp(command, "HELLO?") || !strcmp(command, "ID")) {
    sendHello();
  } else if (!strcmp(command, "STATUS") || !strcmp(command, "STATUS?") || !strcmp(command, "P")) {
    sendStatus();
  } else if (!strncmp(command, "MOTOR,F,", 8)) {
    applyMotor('F', atoi(command + 8)); Serial.println(F("OK,MOTOR,F"));
  } else if (!strncmp(command, "MOTOR,R,", 8)) {
    applyMotor('R', atoi(command + 8)); Serial.println(F("OK,MOTOR,R"));
  } else if (!strcmp(command, "MOTOR,STOP") || !strcmp(command, "STOP") || !strcmp(command, "S") || !strcmp(command, "CONVEYOR,STOP")) {
    applyMotor('S', 0); Serial.println(F("OK,MOTOR,STOP"));
  } else if (!strncmp(command, "SPEED,", 6)) {
    requestedSpeedPercent = constrain(atoi(command + 6), 0, 100);
    if (motorDirection != 'S') applyMotor(motorDirection, requestedSpeedPercent);
    Serial.println(F("OK,SPEED"));
  } else if (!strncmp(command, "F,", 2)) {
    applyMotor('F', atoi(command + 2)); Serial.println(F("OK,MOTOR,F"));
  } else if (!strncmp(command, "R,", 2)) {
    applyMotor('R', atoi(command + 2)); Serial.println(F("OK,MOTOR,R"));
  } else if (!strcmp(command, "CONVEYOR,START")) {
    applyMotor('F', requestedSpeedPercent ? requestedSpeedPercent : 60); Serial.println(F("OK,MOTOR,F"));
  } else {
    Serial.println(F("ERR,UNKNOWN_COMMAND"));
  }
}

void setup() {
  pinMode(PIN_PWMA, OUTPUT);
  pinMode(PIN_AIN1, OUTPUT);
  pinMode(PIN_AIN2, OUTPUT);
  pinMode(PIN_STBY, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_STBY, HIGH);
  applyMotor('S', 0);
  Serial.begin(115200);
  delay(250);
  Serial.println(F("READY,CUBELINK_CONVEYOR"));
}

void loop() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (inputLength) {
        inputBuffer[inputLength] = '\0';
        handleCommand(inputBuffer);
        inputLength = 0;
      }
    } else if (inputLength < sizeof(inputBuffer) - 1) {
      inputBuffer[inputLength++] = c;
    } else {
      inputLength = 0;
      Serial.println(F("ERR,COMMAND_TOO_LONG"));
    }
  }

  if (millis() - lastTelemetryAt >= 200) {
    lastTelemetryAt = millis();
    Serial.print(F("U,"));
    Serial.println(readDistanceCm(), 1);
  }
}
