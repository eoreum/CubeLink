#include <Servo.h>
#include <EEPROM.h>

/*
 * ============================================================
 *  CUBELINK Bridge Firmware v1.4.1 (dual Studio/standalone candidate)
 *
 *  v1.4.1 standalone behavior:
 *   - Power-only boot keeps every servo detached and stationary.
 *   - Neutral joysticks are calibrated before standalone arming is accepted.
 *   - A cleanly parked arm can enter joystick mode with the existing corner gesture.
 *   - After an interrupted session, both joystick buttons held for 2 seconds
 *     confirm that the user has physically returned the arm to the storage pose.
 *   - In standalone mode, both joystick buttons held for 2 seconds park the arm
 *     one axis at a time and detach every servo before power-off.
 *  ─────────────────────────────────────────────
 *  v1.4 safety behavior:
 *   • Boot never attaches or moves a servo automatically.
 *   • A confirmed physical storage pose is recorded in EEPROM.
 *   • Interrupted sessions require physical recovery confirmation.
 *   • Initialization and parking move one axis at a time.
 *  ─────────────────────────────────────────────
 *  v1.2 → v1.3 핵심 변경 (자율 모드 진입 방식 전면 교체):
 *   • [제거] PC_TIMEOUT 기반 자동 자율 모드 진입 (타이밍 버그 원인)
 *       - USB만 꽂고 웹앱 연결 전이라도 자율 모드로 오인 진입하던 문제 해결
 *   • [신규] 드론식 ARMING: 양쪽 스틱을 "대각선 아래 바깥"으로 2초 홀드 시 자율 모드 시동
 *       - 왼쪽 스틱  대각선 아래 = -Y(작아짐) + X(커짐)
 *       - 오른쪽 스틱 대각선 아래 = +Y(커짐)  + X(커짐)
 *   • [신규] DISARM: 자율 모드 중 30초 무동작 시 자동 해제, 또는 USB 명령 수신 시 즉시 해제
 *   • 시동/해제 시 LED 패턴으로 사용자에게 알림
 *  ─────────────────────────────────────────────
 *  유지된 v1.2 기능:
 *   • 조이스틱 중립값 자동 캘리브레이션
 *   • 관절별 안전 각도 제한(SAFE LIMIT) 상단 분리
 *   • 관절별 안전 제한과 순차 이동 함수
 *   • P → PONG 응답, 알 수 없는 명령 안전 무시
 *  ─────────────────────────────────────────────
 *  동작 요약:
 *   - 기본 상태 = 실시간 대기(IDLE). PC 명령(S/L) 오면 실시간 제어.
 *   - 자율 모드는 "오직 ARMING 동작"으로만 진입 → 타이밍과 무관.
 *   - 웹앱은 1초마다 P(ping)를 보내 연결 유지(선택).
 * ============================================================
 */

//#include <Servo.h>

// ───────────────── 핀 정의 ─────────────────
const uint8_t PIN_BASE     = 6;   // 베이스 (MG90S)
const uint8_t PIN_LOWER    = 9;   // 하완   (MG90S)
const uint8_t PIN_UPPER    = 10;  // 상완   (SG90)
const uint8_t PIN_GRIPPER  = 11;  // 그리퍼 (SG90)

const uint8_t PIN_TRIG     = 4;
const uint8_t PIN_ECHO     = 5;
const uint8_t PIN_LED      = 13;

const uint8_t PIN_JOY1_X   = A0;  // 왼쪽 X
const uint8_t PIN_JOY1_Y   = A1;  // 왼쪽 Y
const uint8_t PIN_JOY1_SW  = 2;

const uint8_t PIN_JOY2_X   = A2;  // 오른쪽 X
const uint8_t PIN_JOY2_Y   = A3;  // 오른쪽 Y
const uint8_t PIN_JOY2_SW  = 7;

// ═══════════════ 관절별 안전 각도 제한 ═══════════════
//  ★ 실험하면서 이 값만 고치면 됩니다 (실시간·자율 공통) ★
const int BASE_MIN    = 0,   BASE_MAX    = 180;
const int LOWER_MIN   = 0,   LOWER_MAX   = 180;
const int UPPER_MIN   = 0,   UPPER_MAX   = 180;
const int GRIPPER_MIN = 50,  GRIPPER_MAX = 120;  // 그리퍼: 조사 중(보수값)
// ════════════════════════════════════════════════════

// ───────────────── 서보 객체 ─────────────────
Servo servoBase, servoLower, servoUpper, servoGripper;
int lastAngle[12];

struct SafetyState {
  uint16_t magic;
  uint8_t safelyParked;
  uint8_t checksum;
};

const uint16_t SAFETY_MAGIC = 0x434C;
const int SAFETY_EEPROM_ADDRESS = 0;
const int PARK_BASE = 90;
const int PARK_LOWER = 10;
const int PARK_UPPER = 10;
const int PARK_GRIPPER = 90;
SafetyState safetyState;
bool servosActive = false;

// ───────────────── 통신 버퍼 ─────────────────
const uint8_t BUF_SIZE = 24;
char  rxBuf[BUF_SIZE];
uint8_t rxLen = 0;

// ───────────────── 송신 주기 ─────────────────
unsigned long tUltrasonic = 0;
unsigned long tJoystick   = 0;
const unsigned long PERIOD_US   = 80;
const unsigned long PERIOD_JOY  = 50;

const int JOY_DEADZONE = 8;
int lastJ1x = -999, lastJ1y = -999, lastJ1sw = -1;
int lastJ2x = -999, lastJ2y = -999, lastJ2sw = -1;

// ═══════════════ 자율 모드 (v1.3 ARMING 방식) ═══════════════
bool autoMode = false;                  // 현재 자율 모드 여부
bool autoReady = false;                 // v1.3.1: 스틱이 중립으로 돌아온 후에만 제어 시작
bool armEnabled = false;                // v1.3.1: 스틱이 한 번 중립을 거쳐야 ARM 감시 시작 (부팅 오진입 방지)
bool joystickCalibrated = false;

// 자율 모드 서보 이동
unsigned long tAutoMove = 0;
const unsigned long AUTO_STEP_PERIOD = 15;   // 15ms마다 1도
int curBase = 90, curLower = 90, curUpper = 90, curGripper = 90;

// 조이스틱 중립값 캘리브레이션
int centerJ1x = 512, centerJ1y = 512;
int centerJ2x = 512, centerJ2y = 512;
const int JOY_THRESHOLD = 120;          // 자율 제어 동작 임계값 (중립 대비)
const int AXIS_SWITCH_MARGIN = 35;       // 대각선 경계에서 축이 빠르게 바뀌는 현상 방지
const uint8_t AXIS_NONE = 0;
const uint8_t AXIS_X = 1;
const uint8_t AXIS_Y = 2;
uint8_t lastAxisJ1 = AXIS_NONE;
uint8_t lastAxisJ2 = AXIS_NONE;

// ─── ARMING(시동) 파라미터 ───
//  실물에서 스틱을 끝까지 밀어도 이 값에 못 미치면 ARM_EDGE를 낮추세요
const int ARM_EDGE = 250;               // 중립(약512)에서 이만큼 벗어나면 "끝까지 민 것"
const unsigned long ARM_HOLD_TIME = 2000;   // 2초 홀드
unsigned long armHoldStart = 0;
bool armPosePrev = false;

const int BOOT_CENTER_WINDOW = 180;
const unsigned long CENTER_HOLD_TIME = 500;
const unsigned long RECOVERY_HOLD_TIME = 2000;
const unsigned long STANDALONE_PARK_HOLD_TIME = 2000;
unsigned long centerHoldStart = 0;
unsigned long recoveryHoldStart = 0;
unsigned long standaloneParkHoldStart = 0;
bool centerPosePrev = false;
bool recoveryButtonsPrev = false;
bool standaloneParkButtonsPrev = false;

// ─── DISARM(해제) 파라미터 ───
const unsigned long AUTO_IDLE_TIMEOUT = 30000;  // 30초 무동작 시 자동 해제
unsigned long lastAutoActivity = 0;

// LED 알림용
unsigned long tLedNotify = 0;
int ledNotifyCount = 0;
// ════════════════════════════════════════════════════════════

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

  loadSafetyState();
  for (uint8_t i = 0; i < 12; i++) lastAngle[i] = 90;
  curBase = PARK_BASE;
  curLower = PARK_LOWER;
  curUpper = PARK_UPPER;
  curGripper = PARK_GRIPPER;
  servosActive = false;

  digitalWrite(PIN_LED, HIGH);   // 기본(실시간 대기) = LED 켜짐

  delay(300);
  sendReady();
}

// ============================================
//  loop
// ============================================
void loop() {
  readSerial();
  serviceStandaloneStartup();

  if (!autoMode) {
    // ── 실시간 대기/제어 모드 (기본 상태) ──
    sendUltrasonicIfDue();
    sendJoysticksIfDue();
    checkArming();
  } else {
    // ── 자율 조이스틱 모드 ──
    if (!checkStandalonePark()) {
      runAutoJoystick();
      checkDisarm();        // 30초 무동작 시 자동 해제
    }
  }

   serviceLedNotify();   // ★ 추가: 모드 무관하게 LED 알림 처리
}

// ============================================
//  시리얼 수신
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
      rxLen = 0;
    }
  }
}

void handleCommand(const char* line) {
  char cmd = line[0];

  // v1.3: USB 명령(S/L)이 오면 자율 모드 즉시 해제 (실시간 우선)
  if (autoMode && (cmd == 'S' || cmd == 'L')) {
    disarmAuto();
  }

  if (cmd == 'S') {
    if (!servosActive) {
      Serial.println(F("ERR,NOT_INITIALIZED"));
      return;
    }
    int pin, angle;
    if (parseTwoInts(line + 1, pin, angle)) {
      moveServo(pin, angle);
      syncCurAngle(pin, angle);
    }
  }
  else if (cmd == 'L') {
    int pin, val;
    if (parseTwoInts(line + 1, pin, val)) {
      if (pin == PIN_LED) {              // ★ LED(13)만 허용
      digitalWrite(pin, val ? HIGH : LOW);
      }
    }
  }
  else if (cmd == 'P') {
    Serial.print(F("PONG,CUBELINK,v1.4.1,"));
    Serial.println(safetyState.safelyParked ? F("SAFE") : F("RECOVERY_REQUIRED"));
  }
  else if (cmd == 'I') {
    initializeFromPark();
  }
  else if (cmd == 'K') {
    parkAndShutdown();
  }
  else if (cmd == 'R') {
    if (servosActive) {
      Serial.println(F("ERR,SERVOS_ACTIVE"));
    } else {
      setSafelyParked(true);
      Serial.println(F("RECOVERY_ACCEPTED"));
    }
  }
  // 그 외 알 수 없는 명령은 안전하게 무시 (전방 호환성)
}

bool parseTwoInts(const char* s, int& a, int& b) {
  while (*s == ',' || *s == ' ') s++;
  if (!*s) return false;
  a = atoi(s);
  while (*s && *s != ',') s++;
  if (*s != ',') return false;
  s++;
  b = atoi(s);
  return true;
}

// ============================================
//  v1.3: ARMING (시동) 감시 — 실시간 대기 중에만 호출
//  조건: 왼쪽은 오른쪽 위, 오른쪽은 오른쪽 아래로 끝까지 + 2초 홀드
//
//  [설치 방향을 반영한 원시값 조건]
//   왼쪽 스틱  오른쪽 위   = X 작아짐 + Y 작아짐
//   오른쪽 스틱 오른쪽 아래 = X 커짐   + Y 커짐
// ============================================
void checkArming() {
  if (!joystickCalibrated) return;
  if (!servosActive && !safetyState.safelyParked) return;

  int x1 = analogRead(PIN_JOY1_X);
  int y1 = analogRead(PIN_JOY1_Y);
  int x2 = analogRead(PIN_JOY2_X);
  int y2 = analogRead(PIN_JOY2_Y);

  // v1.3.1: 부팅 오진입 방지 — 스틱이 한 번 중립을 거쳐야 ARM 감시 시작
  if (!armEnabled) {
    bool allCentered =
        (abs(x1 - centerJ1x) < JOY_THRESHOLD) && (abs(y1 - centerJ1y) < JOY_THRESHOLD) &&
        (abs(x2 - centerJ2x) < JOY_THRESHOLD) && (abs(y2 - centerJ2y) < JOY_THRESHOLD);
    if (allCentered) armEnabled = true;   // 중립 확인됨 → 이제부터 ARM 감시 허용
    digitalWrite(PIN_LED, HIGH);          // 대기 LED 유지
    armPosePrev = false;
    return;                               // 아직 ARM 감시 안 함
  }

  // 왼쪽: 실물 오른쪽 위 = 원시 X 작아짐 + 원시 Y 작아짐
  bool leftCorner  = (x1 < centerJ1x - ARM_EDGE) && (y1 < centerJ1y - ARM_EDGE);
  // 오른쪽: 실물 오른쪽 아래 = 원시 X 커짐 + 원시 Y 커짐
  bool rightCorner = (x2 > centerJ2x + ARM_EDGE) && (y2 > centerJ2y + ARM_EDGE);

  bool armPose = leftCorner && rightCorner;

  unsigned long now = millis();

  if (armPose) {
    if (!armPosePrev) {
      armHoldStart = now;          // 시동 자세 시작
    } else if (now - armHoldStart >= ARM_HOLD_TIME) {
      armAuto();                   // 2초 유지 → 시동!
    }
    digitalWrite(PIN_LED, (now / 100) % 2 ? HIGH : LOW);  // 홀드 중 빠른 깜빡
  } else {
    digitalWrite(PIN_LED, HIGH);   // 자세 풀리면 대기 LED 복귀
  }
  armPosePrev = armPose;
}

// 자율 모드 진입
void armAuto() {
  if (!servosActive && !activateStandaloneFromPark()) {
    armPosePrev = false;
    return;
  }

  autoMode = true;
  armPosePrev = false;
  autoReady = false;
  lastAxisJ1 = AXIS_NONE;
  lastAxisJ2 = AXIS_NONE;
  lastAutoActivity = millis();
  Serial.println(F("STANDALONE_ACTIVE"));
  ledNotify(3);
}


// 자율 모드 해제
void disarmAuto() {
  autoMode = false;
  armPosePrev = false;
  autoReady = false;                // v1.3.1: 다음 진입 시 다시 중립 대기
  armEnabled = false;               // v1.3.1: 다음 진입도 중립 확인 후 ARM 감시
  lastAxisJ1 = AXIS_NONE;
  lastAxisJ2 = AXIS_NONE;
  digitalWrite(PIN_LED, HIGH);
  ledNotify(2);                     // 해제 알림: 2회 깜빡
}

// ============================================
//  v1.3: DISARM 감시 — 자율 모드 중에만 호출
//  30초 동안 스틱 조작이 없으면 자동 해제
// ============================================
void checkDisarm() {
  if (millis() - lastAutoActivity >= AUTO_IDLE_TIMEOUT) {
    disarmAuto();
  }
}

// ============================================
//  관절별 안전 각도 클램프
// ============================================
int clampAngle(int pin, int angle) {
  switch (pin) {
    case PIN_BASE:    return constrain(angle, BASE_MIN,    BASE_MAX);
    case PIN_LOWER:   return constrain(angle, LOWER_MIN,   LOWER_MAX);
    case PIN_UPPER:   return constrain(angle, UPPER_MIN,   UPPER_MAX);
    case PIN_GRIPPER: return constrain(angle, GRIPPER_MIN, GRIPPER_MAX);
    default:          return constrain(angle, 0, 180);
  }
}

// ============================================
//  서보 이동 (실시간 모드용)
// ============================================
void moveServo(int pin, int angle) {
  angle = clampAngle(pin, angle);
  if (pin >= 0 && pin < 12 && lastAngle[pin] == angle) return;

  switch (pin) {
    case PIN_BASE:    servoBase.write(angle);    break;
    case PIN_LOWER:   servoLower.write(angle);   break;
    case PIN_UPPER:   servoUpper.write(angle);   break;
    case PIN_GRIPPER: servoGripper.write(angle); break;
    default: return;
  }
  if (pin >= 0 && pin < 12) lastAngle[pin] = angle;

  Serial.print("A,");
  Serial.print(pin); Serial.print(',');
  Serial.println(angle);
}

void syncCurAngle(int pin, int angle) {
  angle = clampAngle(pin, angle);
  switch (pin) {
    case PIN_BASE:    curBase = angle;    break;
    case PIN_LOWER:   curLower = angle;   break;
    case PIN_UPPER:   curUpper = angle;   break;
    case PIN_GRIPPER: curGripper = angle; break;
  }
}

// ============================================
//  조이스틱 중립값 측정
// ============================================
void calibrateJoystickCenter() {
  long s1x = 0, s1y = 0, s2x = 0, s2y = 0;
  const int N = 16;
  for (int i = 0; i < N; i++) {
    s1x += analogRead(PIN_JOY1_X);
    s1y += analogRead(PIN_JOY1_Y);
    s2x += analogRead(PIN_JOY2_X);
    s2y += analogRead(PIN_JOY2_Y);
    delay(2);
  }
  centerJ1x = s1x / N;  centerJ1y = s1y / N;
  centerJ2x = s2x / N;  centerJ2y = s2y / N;
}

// Power-only startup service. Servos remain detached here.
void serviceStandaloneStartup() {
  unsigned long now = millis();

  if (!joystickCalibrated) {
    int x1 = analogRead(PIN_JOY1_X);
    int y1 = analogRead(PIN_JOY1_Y);
    int x2 = analogRead(PIN_JOY2_X);
    int y2 = analogRead(PIN_JOY2_Y);
    bool centered =
        (abs(x1 - 512) < BOOT_CENTER_WINDOW) &&
        (abs(y1 - 512) < BOOT_CENTER_WINDOW) &&
        (abs(x2 - 512) < BOOT_CENTER_WINDOW) &&
        (abs(y2 - 512) < BOOT_CENTER_WINDOW);

    if (centered) {
      if (!centerPosePrev) {
        centerHoldStart = now;
      } else if (now - centerHoldStart >= CENTER_HOLD_TIME) {
        calibrateJoystickCenter();
        joystickCalibrated = true;
        armEnabled = true;
        centerPosePrev = false;
        Serial.println(F("JOYSTICK_CALIBRATED"));
        ledNotify(1);
      }
    } else {
      centerPosePrev = false;
      centerHoldStart = 0;
    }
    if (!joystickCalibrated) centerPosePrev = centered;
    return;
  }

  // Interrupted session: user must first place the arm in its physical
  // storage pose, then hold both joystick buttons for two seconds.
  if (!servosActive && !safetyState.safelyParked) {
    bool bothPressed =
        digitalRead(PIN_JOY1_SW) == LOW &&
        digitalRead(PIN_JOY2_SW) == LOW;

    if (bothPressed) {
      if (!recoveryButtonsPrev) {
        recoveryHoldStart = now;
      } else if (now - recoveryHoldStart >= RECOVERY_HOLD_TIME) {
        setSafelyParked(true);
        recoveryButtonsPrev = false;
        recoveryHoldStart = 0;
        armEnabled = false;  // Require neutral once more before arming.
        Serial.println(F("RECOVERY_ACCEPTED_JOYSTICK"));
        ledNotify(4);
        return;
      }
      digitalWrite(PIN_LED, (now / 120) % 2 ? HIGH : LOW);
    } else {
      recoveryButtonsPrev = false;
      recoveryHoldStart = 0;
    }
    recoveryButtonsPrev = bothPressed;
  }
}

bool activateStandaloneFromPark() {
  if (!safetyState.safelyParked || servosActive) return servosActive;

  // The arming gesture is accepted only after a confirmed physical park.
  // Mark the session unsafe before energizing the first servo.
  setSafelyParked(false);
  curBase = PARK_BASE;
  curLower = PARK_LOWER;
  curUpper = PARK_UPPER;
  curGripper = PARK_GRIPPER;

  // Attach one axis at a time. No automatic move to 90 degrees is performed.
  attachAtAngle(servoBase, PIN_BASE, curBase);
  lastAngle[PIN_BASE] = curBase;
  attachAtAngle(servoGripper, PIN_GRIPPER, curGripper);
  lastAngle[PIN_GRIPPER] = curGripper;
  attachAtAngle(servoLower, PIN_LOWER, curLower);
  lastAngle[PIN_LOWER] = curLower;
  attachAtAngle(servoUpper, PIN_UPPER, curUpper);
  lastAngle[PIN_UPPER] = curUpper;
  servosActive = true;
  return true;
}

bool checkStandalonePark() {
  bool bothPressed =
      digitalRead(PIN_JOY1_SW) == LOW &&
      digitalRead(PIN_JOY2_SW) == LOW;
  unsigned long now = millis();

  if (bothPressed) {
    if (!standaloneParkButtonsPrev) {
      standaloneParkHoldStart = now;
    } else if (now - standaloneParkHoldStart >= STANDALONE_PARK_HOLD_TIME) {
      standaloneParkButtonsPrev = false;
      standaloneParkHoldStart = 0;
      parkAndShutdown();
      return true;
    }
    digitalWrite(PIN_LED, (now / 120) % 2 ? HIGH : LOW);
  } else {
    standaloneParkButtonsPrev = false;
    standaloneParkHoldStart = 0;
  }
  standaloneParkButtonsPrev = bothPressed;
  return false;
}

// Select only one axis for each joystick. The 45-degree diagonal is the
// boundary; near that boundary the previously selected axis is retained.
uint8_t selectDominantAxis(int dx, int dy, uint8_t previousAxis) {
  int ax = abs(dx);
  int ay = abs(dy);

  if (ax < JOY_THRESHOLD && ay < JOY_THRESHOLD) return AXIS_NONE;

  if (previousAxis == AXIS_X && ax >= JOY_THRESHOLD && ax + AXIS_SWITCH_MARGIN >= ay) {
    return AXIS_X;
  }
  if (previousAxis == AXIS_Y && ay >= JOY_THRESHOLD && ay + AXIS_SWITCH_MARGIN >= ax) {
    return AXIS_Y;
  }

  if (ax >= ay) return ax >= JOY_THRESHOLD ? AXIS_X : AXIS_NONE;
  return ay >= JOY_THRESHOLD ? AXIS_Y : AXIS_NONE;
}

// ============================================
//  v1.3: 자율 조이스틱 모드
//  설치 기준: 조이스틱 원시 X축의 0 방향이 실물의 위쪽을 향한다.
//  따라서 원시 X는 물리적인 위/아래 조작, 원시 Y는 좌/우 조작이다.
//  매핑:
//   왼쪽  Y → 베이스 6 / 왼쪽  X → 하완 9
//   오른쪽 Y → 그리퍼 11 / 오른쪽 X → 상완 10
//  한 스틱을 대각선으로 움직여도 우세축 하나의 서보만 움직인다.
// ============================================
void runAutoJoystick() {
  unsigned long now = millis();
  if (now - tAutoMove < AUTO_STEP_PERIOD) return;
  tAutoMove = now;

  int x1 = analogRead(PIN_JOY1_X);
  int y1 = analogRead(PIN_JOY1_Y);
  int x2 = analogRead(PIN_JOY2_X);
  int y2 = analogRead(PIN_JOY2_Y);

  // v1.3.1: 모든 스틱이 중립 근처로 돌아올 때까지 제어 보류 (진입 자세 → 강제 이동 방지)
  if (!autoReady) {
    bool allCentered =
        (abs(x1 - centerJ1x) < JOY_THRESHOLD) && (abs(y1 - centerJ1y) < JOY_THRESHOLD) &&
        (abs(x2 - centerJ2x) < JOY_THRESHOLD) && (abs(y2 - centerJ2y) < JOY_THRESHOLD);
    if (allCentered) {
      autoReady = true;            // 이제부터 조이스틱 제어 시작
    }
    // 아직 중립 복귀 전 → 90도 유지, 아무 동작 안 함
    servoBase.write(curBase);
    servoLower.write(curLower);
    servoUpper.write(curUpper);
    servoGripper.write(curGripper);
    return;
  }

  bool moved = false;
  int dx1 = x1 - centerJ1x;
  int dy1 = y1 - centerJ1y;
  int dx2 = x2 - centerJ2x;
  int dy2 = y2 - centerJ2y;
  uint8_t axis1 = selectDominantAxis(dx1, dy1, lastAxisJ1);
  uint8_t axis2 = selectDominantAxis(dx2, dy2, lastAxisJ2);
  lastAxisJ1 = axis1;
  lastAxisJ2 = axis2;

  if (axis1 == AXIS_Y) {
    // 왼쪽 물리 좌/우(원시 Y) → 베이스(6)
    if (dy1 < -JOY_THRESHOLD)      { curBase = constrain(curBase - 1, BASE_MIN, BASE_MAX); moved = true; }
    else if (dy1 > JOY_THRESHOLD)  { curBase = constrain(curBase + 1, BASE_MIN, BASE_MAX); moved = true; }
  } else if (axis1 == AXIS_X) {
    // 왼쪽 물리 위/아래(원시 X) → 하완(9)
    if (dx1 < -JOY_THRESHOLD)      { curLower = constrain(curLower + 1, LOWER_MIN, LOWER_MAX); moved = true; }
    else if (dx1 > JOY_THRESHOLD)  { curLower = constrain(curLower - 1, LOWER_MIN, LOWER_MAX); moved = true; }
  }

  if (axis2 == AXIS_Y) {
    // 오른쪽 물리 좌/우(원시 Y) → 그리퍼(11)
    if (dy2 < -JOY_THRESHOLD)      { curGripper = constrain(curGripper + 1, GRIPPER_MIN, GRIPPER_MAX); moved = true; }
    else if (dy2 > JOY_THRESHOLD)  { curGripper = constrain(curGripper - 1, GRIPPER_MIN, GRIPPER_MAX); moved = true; }
  } else if (axis2 == AXIS_X) {
    // 오른쪽 물리 위/아래(원시 X) → 상완(10)
    if (dx2 < -JOY_THRESHOLD)      { curUpper = constrain(curUpper - 1, UPPER_MIN, UPPER_MAX); moved = true; }
    else if (dx2 > JOY_THRESHOLD)  { curUpper = constrain(curUpper + 1, UPPER_MIN, UPPER_MAX); moved = true; }
  }

  if (moved) {
    lastAutoActivity = now;
    lastAngle[PIN_BASE] = curBase;
    lastAngle[PIN_LOWER] = curLower;
    lastAngle[PIN_UPPER] = curUpper;
    lastAngle[PIN_GRIPPER] = curGripper;
  }

  servoBase.write(curBase);
  servoLower.write(curLower);
  servoUpper.write(curUpper);
  servoGripper.write(curGripper);

  // 자율 모드 표시: LED 느린 깜빡임 (알림 중이 아닐 때)
  if (ledNotifyCount == 0) {
    digitalWrite(PIN_LED, (now / 500) % 2 ? HIGH : LOW);
  }
}

// ============================================
//  LED 알림 (시동/해제 시 깜빡임) — 비차단
// ============================================
void ledNotify(int count) {
  ledNotifyCount = count * 2;   // ON/OFF 1쌍 = 2
  tLedNotify = millis();
}
void serviceLedNotify() {
  if (ledNotifyCount <= 0) return;
  unsigned long now = millis();
  if (now - tLedNotify >= 80) {
    tLedNotify = now;
    ledNotifyCount--;
    digitalWrite(PIN_LED, ledNotifyCount % 2 ? HIGH : LOW);
  }
}

// ============================================
//  초음파 송신 (실시간 모드)
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

  long duration = pulseIn(PIN_ECHO, HIGH, 25000UL);
  int distance;
  if (duration <= 0) {
    distance = 999;
  } else {
    distance = (int)(duration / 58.82);
    if (distance < 1 || distance > 400) distance = 999;
  }
  Serial.print("U,");
  Serial.println(distance);
}

// ============================================
//  조이스틱 송신 (실시간 모드 - 시뮬 시각화용)
// ============================================
void sendJoysticksIfDue() {
  unsigned long now = millis();
  if (now - tJoystick < PERIOD_JOY) return;
  tJoystick = now;

  int x1 = analogRead(PIN_JOY1_X);
  int y1 = analogRead(PIN_JOY1_Y);
  int s1 = digitalRead(PIN_JOY1_SW);
  int x2 = analogRead(PIN_JOY2_X);
  int y2 = analogRead(PIN_JOY2_Y);
  int s2 = digitalRead(PIN_JOY2_SW);

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
  if (before == -999) return true;
  return abs(now - before) >= JOY_DEADZONE;
}

uint8_t safetyChecksum(const SafetyState& state) {
  return (uint8_t)(state.magic ^ (state.magic >> 8) ^ state.safelyParked ^ 0xA5);
}

void loadSafetyState() {
  EEPROM.get(SAFETY_EEPROM_ADDRESS, safetyState);
  if (safetyState.magic != SAFETY_MAGIC ||
      safetyState.checksum != safetyChecksum(safetyState) ||
      safetyState.safelyParked > 1) {
    safetyState.magic = SAFETY_MAGIC;
    safetyState.safelyParked = 0;
    safetyState.checksum = safetyChecksum(safetyState);
    EEPROM.put(SAFETY_EEPROM_ADDRESS, safetyState);
  }
}

void setSafelyParked(bool parked) {
  uint8_t value = parked ? 1 : 0;
  if (safetyState.safelyParked == value) return;
  safetyState.magic = SAFETY_MAGIC;
  safetyState.safelyParked = value;
  safetyState.checksum = safetyChecksum(safetyState);
  EEPROM.put(SAFETY_EEPROM_ADDRESS, safetyState);
}

void attachAtAngle(Servo& servo, uint8_t pin, int angle) {
  servo.write(angle);
  servo.attach(pin);
  delay(150);
}

void smoothServoTo(Servo& servo, uint8_t pin, int& current, int target, int stepDelayMs) {
  target = clampAngle(pin, target);
  while (current != target) {
    current += (current < target) ? 1 : -1;
    servo.write(current);
    lastAngle[pin] = current;
    delay(stepDelayMs);
  }
  delay(120);
}

void initializeFromPark() {
  if (servosActive) {
    Serial.println(F("INIT_OK"));
    return;
  }
  if (!safetyState.safelyParked) {
    Serial.println(F("ERR,RECOVERY_REQUIRED"));
    return;
  }

  // Mark the session unsafe before any servo can move.
  setSafelyParked(false);
  curBase = PARK_BASE;
  curLower = PARK_LOWER;
  curUpper = PARK_UPPER;
  curGripper = PARK_GRIPPER;
  attachAtAngle(servoBase, PIN_BASE, curBase);
  attachAtAngle(servoLower, PIN_LOWER, curLower);
  attachAtAngle(servoUpper, PIN_UPPER, curUpper);
  attachAtAngle(servoGripper, PIN_GRIPPER, curGripper);
  servosActive = true;

  // One axis at a time; loaded arm axes move more slowly.
  smoothServoTo(servoBase, PIN_BASE, curBase, 90, 20);
  smoothServoTo(servoLower, PIN_LOWER, curLower, 90, 30);
  smoothServoTo(servoUpper, PIN_UPPER, curUpper, 90, 30);
  smoothServoTo(servoGripper, PIN_GRIPPER, curGripper, 90, 20);
  Serial.println(F("INIT_OK"));
}

void parkAndShutdown() {
  if (!servosActive) {
    Serial.println(F("ERR,NOT_INITIALIZED"));
    return;
  }
  if (autoMode) disarmAuto();

  smoothServoTo(servoBase, PIN_BASE, curBase, PARK_BASE, 20);
  smoothServoTo(servoGripper, PIN_GRIPPER, curGripper, PARK_GRIPPER, 20);
  smoothServoTo(servoLower, PIN_LOWER, curLower, PARK_LOWER, 30);
  smoothServoTo(servoUpper, PIN_UPPER, curUpper, PARK_UPPER, 30);
  setSafelyParked(true);
  servoBase.detach();
  servoLower.detach();
  servoUpper.detach();
  servoGripper.detach();
  servosActive = false;
  armEnabled = false;
  Serial.println(F("PARKED"));
}

void sendReady() {
  Serial.print(F("READY,CUBELINK,v1.4.1,"));
  Serial.println(safetyState.safelyParked ? F("SAFE") : F("RECOVERY_REQUIRED"));
}
