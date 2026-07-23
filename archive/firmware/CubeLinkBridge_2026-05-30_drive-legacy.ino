/*
 * ============================================================
 *  CUBELINK Bridge Firmware v1.0
 *  ─────────────────────────────────────────────
 *  • 1회 업로드 후 모든 수업은 웹앱(GitHub Pages)에서 진행
 *  • 4축 서보 제어 + 조이스틱 2개 + 초음파 + LED
 *  • 양방향 디지털 트윈 통신 (S/L/J/U/READY 프로토콜)
 *  ─────────────────────────────────────────────
 *  보드: Arduino Nano / Uno (ATmega328P)
 *  통신 속도: 115200 bps
 * ============================================================
 *
 *  📥 수신 프로토콜 (웹앱 → 보드)
 *    S,<pin>,<angle>\n   서보 각도 제어   (예: S,6,120)
 *    L,<pin>,<0|1>\n     LED/디지털 출력  (예: L,13,1)
 *    P\n                 PING — 보드가 READY 재전송
 *
 *  📤 송신 프로토콜 (보드 → 웹앱)
 *    READY,CUBELINK,v1.0\n     부팅/PING 응답 (보드 식별)
 *    U,<distance_cm>\n         초음파 거리
 *    J1,<x>,<y>,<sw>\n         조이스틱 1 (왼쪽: A0/A1/D2)
 *    J2,<x>,<y>,<sw>\n         조이스틱 2 (오른쪽: A2/A3/D7)
 *    A,<pin>,<angle>\n         서보 현재 각도 ACK
 * ============================================================
 */

#include <Servo.h>

// ───────────────── 핀 정의 ─────────────────
const uint8_t PIN_BASE     = 6;   // 서보 1 — 베이스
const uint8_t PIN_LOWER    = 9;   // 서보 2 — 하단 관절
const uint8_t PIN_UPPER    = 10;  // 서보 3 — 상단 관절
const uint8_t PIN_GRIPPER  = 11;  // 서보 4 — 그리퍼

const uint8_t PIN_TRIG     = 4;
const uint8_t PIN_ECHO     = 5;
const uint8_t PIN_LED      = 13;

const uint8_t PIN_JOY1_X   = A0;
const uint8_t PIN_JOY1_Y   = A1;
const uint8_t PIN_JOY1_SW  = 2;

const uint8_t PIN_JOY2_X   = A2;
const uint8_t PIN_JOY2_Y   = A3;
const uint8_t PIN_JOY2_SW  = 7;

// ───────────────── 서보 객체 ─────────────────
Servo servoBase, servoLower, servoUpper, servoGripper;

// 마지막 명령 각도 기억 (같은 값 반복 write 방지)
int lastAngle[12]; // index = pin

// ───────────────── 통신 버퍼 ─────────────────
const uint8_t BUF_SIZE = 24;
char  rxBuf[BUF_SIZE];
uint8_t rxLen = 0;

// ───────────────── 송신 주기 ─────────────────
unsigned long tUltrasonic = 0;
unsigned long tJoystick   = 0;
const unsigned long PERIOD_US   = 80;   // 초음파 80ms 간격
const unsigned long PERIOD_JOY  = 50;   // 조이스틱 50ms 간격

// 조이스틱 데드존 (값이 충분히 변할 때만 송신 — 트래픽 절약)
const int JOY_DEADZONE = 8;
int lastJ1x = -999, lastJ1y = -999, lastJ1sw = -1;
int lastJ2x = -999, lastJ2y = -999, lastJ2sw = -1;

// ============================================
//  setup
// ============================================
void setup() {
  Serial.begin(115200);

  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_JOY1_SW, INPUT_PULLUP);
  pinMode(PIN_JOY2_SW, INPUT_PULLUP);

  // 서보 부착 + 90° 차렷
  servoBase.attach(PIN_BASE);       servoBase.write(90);
  servoLower.attach(PIN_LOWER);     servoLower.write(90);
  servoUpper.attach(PIN_UPPER);     servoUpper.write(90);
  servoGripper.attach(PIN_GRIPPER); servoGripper.write(90);

  for (uint8_t i = 0; i < 12; i++) lastAngle[i] = 90;

  digitalWrite(PIN_LED, HIGH); // 준비 완료 표시

  // 부팅 안정화 후 보드 식별 신호 송신
  delay(300);
  sendReady();
}

// ============================================
//  loop — 비차단(non-blocking) 설계
// ============================================
void loop() {
  readSerial();             // 1) 명령 수신·파싱
  sendUltrasonicIfDue();    // 2) 초음파 송신
  sendJoysticksIfDue();     // 3) 조이스틱 송신
}

// ============================================
//  시리얼 수신 — 라인 단위 파싱
//  parseInt() 대신 직접 파싱 → 타임아웃 없고 훨씬 빠름
// ============================================
void readSerial() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();

    if (c == '\n' || c == '\r') {
      if (rxLen > 0) {
        rxBuf[rxLen] = '\0';
        handleCommand(rxBuf);
        rxLen = 0;
      }
    } else if (rxLen < BUF_SIZE - 1) {
      rxBuf[rxLen++] = c;
    } else {
      // 오버플로 방지 — 버퍼 리셋
      rxLen = 0;
    }
  }
}

void handleCommand(const char* line) {
  // 첫 글자가 명령 종류
  char cmd = line[0];

  if (cmd == 'S') {
    // S,<pin>,<angle>
    int pin, angle;
    if (parseTwoInts(line + 1, pin, angle)) {
      moveServo(pin, angle);
    }
  }
  else if (cmd == 'L') {
    // L,<pin>,<0|1>
    int pin, val;
    if (parseTwoInts(line + 1, pin, val)) {
      pinMode(pin, OUTPUT);
      digitalWrite(pin, val ? HIGH : LOW);
    }
  }
  else if (cmd == 'P') {
    // PING — 보드 식별 재전송
    sendReady();
  }
}

// "<sep><int><sep><int>" 형태 파싱
bool parseTwoInts(const char* s, int& a, int& b) {
  // 앞쪽 구분자(콤마/공백) 스킵
  while (*s == ',' || *s == ' ') s++;
  if (!*s) return false;

  a = atoi(s);
  // 다음 콤마까지 진행
  while (*s && *s != ',') s++;
  if (*s != ',') return false;
  s++;
  b = atoi(s);
  return true;
}

// ============================================
//  서보 이동 — 안전 제한 + 변화 감지
// ============================================
void moveServo(int pin, int angle) {
  angle = constrain(angle, 0, 180);

  // 같은 각도면 무시 (지터 방지, 트래픽 절약)
  if (pin >= 0 && pin < 12 && lastAngle[pin] == angle) return;

  switch (pin) {
    case PIN_BASE:    servoBase.write(angle);    break;
    case PIN_LOWER:   servoLower.write(angle);   break;
    case PIN_UPPER:   servoUpper.write(angle);   break;
    case PIN_GRIPPER: servoGripper.write(angle); break;
    default: return;
  }

  if (pin >= 0 && pin < 12) lastAngle[pin] = angle;

  // 웹앱에 ACK (디지털 트윈 동기화용)
  Serial.print("A,");
  Serial.print(pin);
  Serial.print(',');
  Serial.println(angle);
}

// ============================================
//  초음파 송신
// ============================================
void sendUltrasonicIfDue() {
  unsigned long now = millis();
  if (now - tUltrasonic < PERIOD_US) return;
  tUltrasonic = now;

  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 25000UL); // 25ms 타임아웃
  int distance;
  if (duration <= 0) {
    distance = 999;             // 측정 실패
  } else {
    distance = (int)(duration / 58.82);
    if (distance < 1 || distance > 400) distance = 999;
  }

  Serial.print("U,");
  Serial.println(distance);
}

// ============================================
//  조이스틱 송신 — 데드존 적용
// ============================================
void sendJoysticksIfDue() {
  unsigned long now = millis();
  if (now - tJoystick < PERIOD_JOY) return;
  tJoystick = now;

  int x1 = analogRead(PIN_JOY1_X);
  int y1 = analogRead(PIN_JOY1_Y);
  int s1 = digitalRead(PIN_JOY1_SW); // 풀업 → 눌리면 LOW(0)

  int x2 = analogRead(PIN_JOY2_X);
  int y2 = analogRead(PIN_JOY2_Y);
  int s2 = digitalRead(PIN_JOY2_SW);

  // 변화가 있을 때만 송신
  if (changedEnough(x1, lastJ1x) || changedEnough(y1, lastJ1y) || s1 != lastJ1sw) {
    Serial.print("J1,");
    Serial.print(x1); Serial.print(',');
    Serial.print(y1); Serial.print(',');
    Serial.println(s1);
    lastJ1x = x1; lastJ1y = y1; lastJ1sw = s1;
  }

  if (changedEnough(x2, lastJ2x) || changedEnough(y2, lastJ2y) || s2 != lastJ2sw) {
    Serial.print("J2,");
    Serial.print(x2); Serial.print(',');
    Serial.print(y2); Serial.print(',');
    Serial.println(s2);
    lastJ2x = x2; lastJ2y = y2; lastJ2sw = s2;
  }
}

bool changedEnough(int now, int before) {
  if (before == -999) return true; // 첫 송신
  return abs(now - before) >= JOY_DEADZONE;
}

// ============================================
//  보드 식별 신호
// ============================================
void sendReady() {
  Serial.println(F("READY,CUBELINK,v1.0"));
}

