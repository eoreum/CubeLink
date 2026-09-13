/**
 * CUBELINK Studio v2.7.2 - 메인 애플리케이션 제어 로직
 * 핵심 개선 (v2.7.1 → v2.7.2):
 *  - blocks.js 실제 필드명에 맞춰 evalValue 전면 보정
 *    · cubelink_joystick_read: NAME/PROP (값 '왼쪽'/'오른쪽', 'X'/'Y'/'BTN')
 *    · cubelink_v2_joystick_x/y/btn: JNAME 필드 인식
 *    · cubelink_map: VAL 입력 + FL/FH/TL/TH 필드
 *    · cubelink_map_simple: VAL/FL/FH/TL/TH 모두 필드
 *    · cubelink_analogread: A0~A3 → 조이스틱 raw 값 자동 매핑
 *    · cubelink_digitalread: PIN 2/7 → 조이스틱 SW 자동 매핑 (INPUT_PULLUP 반전)
 *    · cubelink_ultrasonic: window._ultrasonicValue 폴백
 *  - runProgram에 신규 블록 처리 추가
 *    · cubelink_v2_joystick_init / cubelink_v2_if / cubelink_v2_if_else
 *    · cubelink_serial_begin / cubelink_v2_serial_begin
 *    · cubelink_serial_println_text/num/value
 *    · cubelink_pinmode (시뮬레이션에서는 로그만)
 *  - 기존 안전장치(MAX_TOTAL_LOOPS, safeAngle, yield) 그대로 유지
 *  - updateJoystickUI 자동 래핑 유지
 *  - arduino_setup_loop 더미 코드 생성기 유지
 */
(function() {
  'use strict';

  const ELECTRON_APP_VERSION = window.cubelink && window.cubelink.getVersion
    ? String(window.cubelink.getVersion())
    : '';
  const ELECTRON_UI_INIT_KEY = ELECTRON_APP_VERSION
    ? `cubelink_electron_ui_initialized_${ELECTRON_APP_VERSION.replace(/[^0-9A-Za-z_-]/g, '_')}`
    : '';

  function initializeFreshElectronState() {
    if (!window.cubelink || !ELECTRON_UI_INIT_KEY || localStorage.getItem(ELECTRON_UI_INIT_KEY) === '1') return;

    // 새 설치판을 처음 실행할 때 이전 설치가 남긴 학습 화면만 초기화한다.
    // 하드웨어별 영점 보정값은 안전을 위해 보존한다.
    Object.keys(localStorage).forEach((key) => {
      const isWorkspace = key.startsWith('cubelink_ws_');
      const isLearningUI = key === 'cubelink_missions_done' || key === 'cubelink_group_open';
      const isOldInitMarker = key.startsWith('cubelink_electron_ui_initialized_');
      if (isWorkspace || isLearningUI || isOldInitMarker) localStorage.removeItem(key);
    });
    localStorage.setItem(
      'cubelink_group_open',
      JSON.stringify({ basic: true, intermediate: false, advanced: false })
    );
    localStorage.setItem(ELECTRON_UI_INIT_KEY, '1');
    console.log('✨ CubeLink Studio 새 설치 화면 초기화 완료');
  }

  initializeFreshElectronState();

  /**
   * Blockly의 기본 변수 만들기/이름 바꾸기는 window.prompt에 의존한다.
   * 설치형 Electron에서 네이티브 prompt가 뒤로 숨거나 열리지 않는 경우가
   * 있으므로, 프로그램 화면 안에서 항상 보이는 입력창으로 교체한다.
   */
  function installBlocklyVariablePrompt() {
    if (!window.Blockly || !Blockly.dialog || typeof Blockly.dialog.setPrompt !== 'function') return;
    if (window._cubeLinkVariablePromptInstalled) return;
    window._cubeLinkVariablePromptInstalled = true;

    Blockly.dialog.setPrompt((message, defaultValue, callback) => {
      const old = document.getElementById('cubelinkVariablePrompt');
      if (old) old.remove();

      const overlay = document.createElement('div');
      overlay.id = 'cubelinkVariablePrompt';
      overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:2147483647',
        'display:flex', 'align-items:center', 'justify-content:center',
        'background:rgba(0,0,0,.68)'
      ].join(';');

      const panel = document.createElement('div');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', '변수 이름 입력');
      panel.style.cssText = [
        'width:min(420px,calc(100vw - 40px))', 'padding:22px',
        'border:2px solid #D4AF37', 'border-radius:12px',
        'background:#202020', 'color:#fff',
        'box-shadow:0 18px 60px rgba(0,0,0,.65)'
      ].join(';');

      const label = document.createElement('div');
      label.textContent = String(message || '새 변수 이름:');
      label.style.cssText = 'font-size:16px;font-weight:700;margin-bottom:12px;white-space:pre-wrap;';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = String(defaultValue || '');
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.style.cssText = [
        'box-sizing:border-box', 'width:100%', 'padding:11px 12px',
        'border:1px solid #777', 'border-radius:7px',
        'background:#fff', 'color:#111', 'font-size:17px', 'outline:none'
      ].join(';');

      const buttons = document.createElement('div');
      buttons.style.cssText = 'display:flex;justify-content:flex-end;gap:9px;margin-top:16px;';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = '취소';
      cancel.className = 'btn';
      const ok = document.createElement('button');
      ok.type = 'button';
      ok.textContent = '확인';
      ok.className = 'btn primary';

      let finished = false;
      const finish = (value) => {
        if (finished) return;
        finished = true;
        overlay.remove();
        callback(value);
        setTimeout(() => {
          try { window.workspace?.getParentSvg?.().focus(); } catch (_) {}
        }, 0);
      };

      cancel.addEventListener('click', () => finish(null));
      ok.addEventListener('click', () => finish(input.value));
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          finish(input.value);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          finish(null);
        }
      });
      overlay.addEventListener('mousedown', (event) => {
        if (event.target === overlay) finish(null);
      });

      buttons.append(cancel, ok);
      panel.append(label, input, buttons);
      overlay.append(panel);
      document.body.append(overlay);
      requestAnimationFrame(() => {
        input.focus();
        input.select();
      });
    });
  }

  installBlocklyVariablePrompt();

/* ════════════════════════════════════════════════════════════════════
   ░░░ v2.8.0 — 미션 검증 시스템 통합 (v2.6.5 자산 이식) ░░░
   ════════════════════════════════════════════════════════════════════ */

  /* ────────────────────────────────────────────────────────────────
     [1] 미션 9개 — 3그룹 (기초/중급/고급)
     각 미션은 verify(ws, sim, evt, state) 함수로 검증
     - ws: Blockly workspace
     - sim: 시뮬레이터 객체 (현재는 사용 안 함, 호환성용)
     - evt: 시뮬 이벤트 {type:'led'/'servo'/'serial'/'joystick', ...}
     - state: 누적 상태 객체 (미션별로 독립)
     ──────────────────────────────────────────────────────────────── */
  const MISSIONS = [
    // ───── 🟢 기초과정 ─────
    {
      id: 'm1', level: 'basic',
      title: '미션 1: LED 켜기',
      desc: '13번 LED를 계속 켜세요.',
          hint: '⚠ 표준 아두이노 패턴을 지키세요!\n\n📍 setup() 안에: pinMode(13, OUTPUT) — 초기 설정\n📍 loop() 안에: digitalWrite(13, HIGH) — 반복 동작\n\n💡 시뮬레이터에서 ▶ 시작 버튼을 눌러 동작을 확인하세요.',
     verify: (ws, sim, evt, state) => {
        const setup = getActiveBlocks(ws).setup;
        const loop  = getActiveBlocks(ws).loop;
        // ★ pinMode는 setup에 있어야 함
        const hasPinModeInSetup = setup.some(b =>
          b.type === 'cubelink_pinmode' &&
          parseInt(b.getFieldValue('PIN')) === 13 &&
          b.getFieldValue('MODE') === 'OUTPUT');
        // ★ digitalWrite HIGH는 loop에 있어야 함
        const hasWriteInLoop = loop.some(b =>
          b.type === 'cubelink_digitalwrite' &&
          parseInt(b.getFieldValue('PIN')) === 13 &&
          b.getFieldValue('VAL') === 'HIGH');
        if (!hasPinModeInSetup || !hasWriteInLoop) return false;
        return evt.type === 'led' && evt.pin === 13 && evt.on === true;
      }

    },
    {
      id: 'm2', level: 'basic',
      title: '미션 2: LED 깜빡이기',
      desc: '0.5초 간격으로 13번 LED를 깜빡이세요.',
          hint: '⚠ 표준 아두이노 패턴을 지키세요!\n\n📍 setup() 안에: pinMode(13, OUTPUT)\n📍 loop() 안에: HIGH → delay(500) → LOW → delay(500)\n\n💡 깜빡임은 반복 동작이므로 loop에 들어가야 합니다.',
      verify: (ws, sim, evt, state) => {
        const setup = getActiveBlocks(ws).setup;
        const loop  = getActiveBlocks(ws).loop;
        // ★ pinMode는 setup에 있어야 함
        const hasPinModeInSetup = setup.some(b =>
          b.type === 'cubelink_pinmode' &&
          parseInt(b.getFieldValue('PIN')) === 13 &&
          b.getFieldValue('MODE') === 'OUTPUT');
        if (!hasPinModeInSetup) return false;
        // ★ HIGH/LOW + delay는 loop에 있어야 함 (깜빡임은 반복 동작)
        const writesInLoop = loop.filter(b => b.type === 'cubelink_digitalwrite');
        const hasHighInLoop = writesInLoop.some(b => b.getFieldValue('VAL') === 'HIGH');
        const hasLowInLoop  = writesInLoop.some(b => b.getFieldValue('VAL') === 'LOW');
        const hasDelayInLoop = loop.some(b =>
          ['cubelink_delay', 'cubelink_delay_sec', 'cubelink_v2_delay_ms'].includes(b.type));
        if (!hasHighInLoop || !hasLowInLoop || !hasDelayInLoop) return false;
        // 동적: LED 토글 4회 누적
        if (evt.type === 'led' && evt.pin === 13) {
          if (state.last === undefined) state.last = null;
          if (state.last !== evt.on) {
            state.toggles = (state.toggles || 0) + 1;
            state.last = evt.on;
          }
          if (state.toggles >= 4) return true;
        }
        return false;
      }


    },
    {
      id: 'm3', level: 'basic',
      title: '미션 3: 베이스 좌우 회전',
      desc: 'PIN 6번 베이스 서보를 45도로 돌렸다가 2초 후 135도로 움직여 보세요.',
       hint: '1) 서보 핀 6을 45도로 부드럽게 회전\n2) 2초(또는 2000ms) 기다리기\n3) 서보 핀 6을 135도로 부드럽게 회전\n💡 사이에 ‘기다리기’ 블록이 있어야 움직임이 보입니다.',
     verify: (ws, sim, evt, state) => {
        const allActive = getActiveBlocks(ws).all;
        // PIN 6 서보 이동 블록 2개 이상
        const servo6Blocks = allActive.filter(b =>
          ['cubelink_servo_move_simple', 'cubelink_servo_move',
           'cubelink_servo_smooth_simple', 'cubelink_servo_smooth',
           'cubelink_v2_servo_set', 'cubelink_v2_servo_set_value'].includes(b.type)
          && String(b.getFieldValue('PIN')) === '6'
        );
        if (servo6Blocks.length < 2) return false;
        // 어디든 delay 존재
        const hasDelay = allActive.some(b =>
          ['cubelink_delay', 'cubelink_delay_sec', 'cubelink_v2_delay_ms'].includes(b.type));
        if (!hasDelay) return false;
        // 동적: PIN 6 서보 각도 2가지 이상 발생
        if (evt.type === 'servo' && parseInt(evt.pin) === 6) {
          state.angles = state.angles || new Set();
          state.angles.add(parseInt(evt.angle));
          if (state.angles.size >= 2) return true;
        }
        return false;
      }
    },
    // ───── 🟡 중급과정 ─────
    {
      id: 'm4', level: 'intermediate',
      title: '미션 4: 시리얼 출력 3회',
      desc: '시리얼 모니터에 무엇이든 3번 이상 출력하세요.',
      hint: '⚠ 가장 먼저 “시리얼 통신 시작” 블록을 setup에 놓아야 해요!\n그다음 loop에 시리얼 출력 블록을 사용하세요.',
      verify: (ws, sim, evt, state) => {
        const setupBlocks = getActiveBlocks(ws).setup;
        const hasBegin = setupBlocks.some(b =>
          b.type === 'cubelink_serial_begin' || b.type === 'cubelink_v2_serial_begin');
        const hasPrint = getActiveBlocks(ws).all.some(b =>
          ['cubelink_serial_println_text','cubelink_serial_println_num','cubelink_serial_println_value'].includes(b.type));
        if (!hasBegin || !hasPrint) return false;
        if (evt.type === 'serial') {
          state.count = (state.count || 0) + 1;
          if (state.count >= 3) return true;
        }
        return false;
      }
    },
    {
      id: 'm5', level: 'intermediate',
      title: '미션 5: 시리얼 카운터 변수',
      desc: '변수를 1씩 늘려가며 시리얼로 5번 출력하세요.',
      hint: '1) 변수 메뉴에서 변수(예: count)를 만드세요\n2) setup에서 “시리얼 통신 시작”\n3) loop에서 count = count + 1 → 시리얼에 값 출력 → 잠시 기다리기\n💡 변수와 반복의 기본기를 익히는 단계입니다.',
      verify: (ws, sim, evt, state) => {
        const all = getActiveBlocks(ws).all;
        const hasBegin = getActiveBlocks(ws).setup.some(b =>
          b.type === 'cubelink_serial_begin' || b.type === 'cubelink_v2_serial_begin');
        const hasVarSet = all.some(b => b.type === 'variables_set');
        const hasChange = all.some(b => b.type === 'math_change' || b.type === 'variables_set');
        const hasPrintVar = all.some(b => {
          if (b.type !== 'cubelink_serial_println_value') return false;
          const val = b.getInputTargetBlock('VAL');
          return val && containsBlockType(val, 'variables_get');
        });
        if (!hasBegin || !hasVarSet || !hasChange || !hasPrintVar) return false;
        if (evt.type === 'serial') {
          state.count = (state.count || 0) + 1;
          if (state.count >= 5) return true;
        }
        return false;
      }
    },
    {
      id: 'm6', level: 'intermediate',
      title: '미션 6: 그리퍼 집게 작동하기',
        desc: 'PIN 11번 그리퍼 서보를 120도(열기)로 설정 후, 1초 뒤 50도(잡기)로 움직여 보세요.',
      hint: '1) 서보 핀 11을 120도로 회전 (열기)\n2) 1초 기다리기\n3) 서보 핀 11을 50도로 회전 (잡기)\n⚠ 안전 범위 50~120도를 지키세요. 너무 닫으면 부하가 걸립니다.',
    verify: (ws, sim, evt, state) => {
        const allActive = getActiveBlocks(ws).all;
        const servo11Blocks = allActive.filter(b =>
          ['cubelink_servo_move_simple', 'cubelink_servo_move',
           'cubelink_servo_smooth_simple', 'cubelink_servo_smooth',
           'cubelink_v2_servo_set', 'cubelink_v2_servo_set_value'].includes(b.type)
          && String(b.getFieldValue('PIN')) === '11'
        );
        if (servo11Blocks.length < 2) return false;
        const hasDelay = allActive.some(b =>
          ['cubelink_delay', 'cubelink_delay_sec', 'cubelink_v2_delay_ms'].includes(b.type));
        if (!hasDelay) return false;
        // 동적: PIN 11 서보 각도 2가지 이상 발생 (둘 다 50~120 범위 권장)
        if (evt.type === 'servo' && parseInt(evt.pin) === 11) {
          state.angles = state.angles || new Set();
          state.angles.add(parseInt(evt.angle));
          if (state.angles.size >= 2) return true;
        }
        return false;
      }
    },

    // ───── 🔴 고급과정 ─────
    {
      id: 'm7', level: 'advanced',
      title: '미션 7: 초음파 거리 측정',
      desc: '초음파 센서(Trig D4 / Echo D5)로 거리를 측정해 시리얼 모니터에 출력하세요.',
      hint: '⚠ 시리얼 통신 시작 블록이 setup에 먼저 와야 해요!\n초음파 블록을 “시리얼에 값 출력” 블록의 값 슬롯에 끼워넣으세요.',
      verify: (ws, sim, evt, state) => {
        const hasBegin = getActiveBlocks(ws).setup.some(b =>
          b.type === 'cubelink_serial_begin' || b.type === 'cubelink_v2_serial_begin');
        const hasUSinSerial = getActiveBlocks(ws).all.some(b => {
          if (b.type !== 'cubelink_serial_println_value') return false;
          const val = b.getInputTargetBlock('VAL');
          return val && containsBlockType(val, 'cubelink_ultrasonic');
        });
        if (!hasBegin || !hasUSinSerial) return false;
        if (evt.type === 'serial') {
          state.count = (state.count || 0) + 1;
          if (state.count >= 1) return true;
        }
        return false;
      }
    },
    {
      id: 'm8', level: 'advanced',
      title: '미션 8: 조이스틱으로 베이스 조종',
      desc: '조이스틱의 X축 값(0~1023)을 서보 각도(0~180)로 map 변환하여 PIN 6 베이스를 조종하세요.',
          hint: '⚠ 표준 아두이노 패턴을 지키세요! map 블록은 필수!\n\n📍 setup() 안에:\n   • "조이스틱 시작" 블록 (방향:왼쪽, VRx:A0, VRy:A1, SW:2)\n\n📍 loop() 안에:\n   • "서보 핀 6을 [값] 도로 회전"\n   • 값 슬롯에 "값 변환(map)" 블록 끼우기 (0~1023 → 0~180)\n   • map의 값 슬롯에 "왼쪽 조이스틱의 X축 값" 연결\n\n💡 매 순간 조이스틱을 읽어야 하므로 반드시 loop에!',
     verify: (ws, sim, evt, state) => {
        const setup = getActiveBlocks(ws).setup;
        const loop  = getActiveBlocks(ws).loop;
        // ★ 조이스틱 초기화는 setup에 있어야 함
        const hasJoyInitInSetup = setup.some(b =>
          b.type === 'cubelink_joystick_init' || b.type === 'cubelink_v2_joystick_init');
        if (!hasJoyInitInSetup) return false;
        // ★ PIN 6 서보 + map + 조이스틱 읽기 조합은 loop에 있어야 함 (반복 조작)
        const hasJoyDrivenServoInLoop = loop.some(b => {
          const isServoMove = ['cubelink_servo_move', 'cubelink_servo_smooth', 'cubelink_v2_servo_set_value'].includes(b.type);
          if (!isServoMove) return false;
          if (String(b.getFieldValue('PIN')) !== '6') return false;
          const angle = b.getInputTargetBlock('ANGLE');
          if (!angle) return false;
          const hasMap = containsBlockType(angle, 'cubelink_map')
                      || containsBlockType(angle, 'cubelink_map_simple');
          if (!hasMap) return false;
          const hasJoyRead = containsBlockType(angle, 'cubelink_joystick_read')
                          || containsBlockType(angle, 'cubelink_v2_joystick_x')
                          || containsBlockType(angle, 'cubelink_v2_joystick_y')
                          || containsBlockType(angle, 'cubelink_analogread');
          return hasJoyRead;
        });
        if (!hasJoyDrivenServoInLoop) return false;
        // 동적: PIN 6 서보 각도 3가지 이상 발생
        if (evt.type === 'servo' && parseInt(evt.pin) === 6) {
          state.angles = state.angles || new Set();
          state.angles.add(parseInt(evt.angle));
          if (state.angles.size >= 3) return true;
        }
        return false;
      }

    },
    {
      id: 'm9', level: 'advanced',
      title: '미션 9: 장애물 감지 비상정지',
      desc: '초음파 거리가 15cm 이하로 가까워지면 그리퍼(PIN 11)를 닫는 안전 메커니즘을 만드세요.',
         hint: '⚠ if문은 반드시 loop 안에! (매 순간 거리 감시)\n\n📍 loop() 안에:\n   • "만약 ~ 이라면" 블록\n   • 조건: 초음파 거리 < 15\n   • 만약 참이면: 서보 핀 11을 50도(잡기)로 회전\n\n💡 시뮬에서 초음파 슬라이더를 15 이하로 낮추면 그리퍼가 닫혀야 합니다.',
         verify: (ws, sim, evt, state) => {
        const loop = getActiveBlocks(ws).loop;
        // ★ if + 비교 + 초음파 + PIN 11 서보 — 전부 loop에 있어야 함 (매 순간 감시)
        const hasUSCompareInLoopIf = loop.some(b => {
          if (!['controls_if','controls_ifelse','cubelink_v2_if','cubelink_v2_if_else'].includes(b.type)) return false;
          const cond = b.getInputTargetBlock('IF0') || b.getInputTargetBlock('COND');
          if (!cond) return false;
          return containsBlockType(cond, 'cubelink_ultrasonic')
              && (cond.type === 'logic_compare' || containsBlockType(cond, 'logic_compare'));
        });
        const hasGripCloseInLoopIf = loop.some(b => {
          if (!['controls_if','controls_ifelse','cubelink_v2_if','cubelink_v2_if_else'].includes(b.type)) return false;
          const doBlock = b.getInputTargetBlock('DO0') || b.getInputTargetBlock('DO');
          if (!doBlock) return false;
          let cur = doBlock;
          while (cur) {
            const isServo = ['cubelink_servo_move_simple','cubelink_servo_move',
                             'cubelink_servo_smooth_simple','cubelink_servo_smooth',
                             'cubelink_v2_servo_set','cubelink_v2_servo_set_value'].includes(cur.type);
            if (isServo && String(cur.getFieldValue('PIN')) === '11') return true;
            cur = cur.getNextBlock();
          }
          return false;
        });
        if (!hasUSCompareInLoopIf || !hasGripCloseInLoopIf) return false;
        // 동적: 초음파 ≤ 15cm 상태에서 PIN 11 서보 이벤트 발생
        if (evt.type === 'servo' && parseInt(evt.pin) === 11) {
          const us = window._ultrasonicValue != null ? window._ultrasonicValue : 30;
          if (us <= 15) state.triggered = true;
          if (state.triggered) return true;
        }
        return false;
      }

    }
  ];
  window.MISSIONS = MISSIONS; // 디버그용
  const FREE_WORKSPACE = {
    id: 'free',
    title: '자유 코딩 작업공간',
    desc: '미션 조건 없이 원하는 블록을 조합해 나만의 CubeLink 프로그램을 만드세요.',
    hint: '모든 블록을 자유롭게 사용할 수 있습니다.\n작업 내용은 자동 저장되며 9개 미션 진행률에는 영향을 주지 않습니다.'
  };
  window.FREE_WORKSPACE = FREE_WORKSPACE;

  /* ────────────────────────────────────────────────────────────────
     [2] 검증 헬퍼 3종
         setup/loop에 실제 연결된 블록만 추출 + 필드/중첩 검사
     ──────────────────────────────────────────────────────────────── */
  function getActiveBlocks(ws) {
    if (!ws) return { setup: [], loop: [], all: [] };
    const top = ws.getTopBlocks(true).find(b => b.type === 'arduino_setup_loop');
    if (!top) return { setup: [], loop: [], all: [] };

    const collect = (block, arr) => {
      while (block) {
        arr.push(block);
        block.inputList.forEach(inp => {
          if (inp.connection && inp.connection.targetBlock()) {
            collect(inp.connection.targetBlock(), arr);
          }
        });
        block = block.getNextBlock();
      }
    };

    const setupArr = [];
    const loopArr  = [];
    collect(top.getInputTargetBlock('SETUP'), setupArr);
    collect(top.getInputTargetBlock('LOOP'),  loopArr);

    return {
      setup: setupArr,
      loop:  loopArr,
      all:   [...setupArr, ...loopArr]
    };
  }

  function hasActiveBlock(ws, type, fieldCheck) {
    const { all } = getActiveBlocks(ws);
    return all.some(b => {
      if (b.type !== type) return false;
      if (fieldCheck) return fieldCheck(b);
      return true;
    });
  }

  function containsBlockType(block, type) {
    if (!block) return false;
    if (block.type === type) return true;
    for (const inp of block.inputList) {
      if (inp.connection && inp.connection.targetBlock()) {
        if (containsBlockType(inp.connection.targetBlock(), type)) return true;
      }
    }
    return false;
  }

  window.getActiveBlocks   = getActiveBlocks;
  window.hasActiveBlock    = hasActiveBlock;
  window.containsBlockType = containsBlockType;

  /* ────────────────────────────────────────────────────────────────
     [3] WorkspaceStorage — 미션별 작업물 자동 저장/복원
         localStorage 키: cubelink_ws_<missionId>
     ──────────────────────────────────────────────────────────────── */
  const WorkspaceStorage = {
    KEY_PREFIX: 'cubelink_ws_',
    saveTimer: null,

    scheduleSave(missionId) {
      if (!missionId) return;
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.save(missionId), 500);
    },

    save(missionId) {
      if (!missionId || !window.workspace) return;
      try {
        const xml = Blockly.Xml.workspaceToDom(window.workspace);
        const xmlText = Blockly.Xml.domToText(xml);
        localStorage.setItem(this.KEY_PREFIX + missionId, xmlText);
      } catch (e) {
        console.warn('WorkspaceStorage.save 실패:', e);
      }
    },

    restore(missionId) {
      if (!missionId || !window.workspace) return false;
      try {
        const xmlText = localStorage.getItem(this.KEY_PREFIX + missionId);
        if (!xmlText) return false;
        window.workspace.clear();
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xmlText), window.workspace);
        console.log('📂 작업물 복원:', missionId);
        return true;
      } catch (e) {
        console.warn('WorkspaceStorage.restore 실패:', e);
        return false;
      }
    },

    clear(missionId) {
      if (!missionId) return;
      localStorage.removeItem(this.KEY_PREFIX + missionId);
    },

    clearAll() {
      Object.keys(localStorage)
        .filter(k => k.startsWith(this.KEY_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    }
  };
  window.WorkspaceStorage = WorkspaceStorage;

  /* ────────────────────────────────────────────────────────────────
     [4] MissionProgress — 진행 상태 관리 + 시뮬 이벤트 수신 + 졸업 모드
     ──────────────────────────────────────────────────────────────── */
  const MissionProgress = {
    done: new Set(JSON.parse(localStorage.getItem('cubelink_missions_done') || '[]')),
    current: null,
    state: {},

    select(id) {
      this.current = id;
      this.state = {};
    },

    onSimEvent(evt) {
      if (!this.current) return;
      const m = MISSIONS.find(x => x.id === this.current);
      if (!m || this.done.has(m.id)) return;
      try {
        if (m.verify(window.workspace, window.Sim, evt, this.state, 'sim')) {
          this.markDone(m);
        }
      } catch (e) {
        console.warn('verify err:', m.id, e);
      }
    },

    // (구) 패턴 매칭은 시뮬 이벤트 기반으로 통일 — no-op
    checkPattern() { /* no-op */ },

    markDone(m) {
      if (this.done.has(m.id)) return;
      this.done.add(m.id);
      localStorage.setItem('cubelink_missions_done', JSON.stringify([...this.done]));
      this._justCompleted = true;   // 이번 호출이 '방금 완료'임을 표시
      this.refreshUI();
      this.showToast(m);
    },

    refreshUI() {
      // 미션 아이템 상태 갱신
      document.querySelectorAll('.mission-item').forEach(el => {
        const id = el.dataset.mid;
        if (!id) return;
        if (id === FREE_WORKSPACE.id) {
          el.classList.remove('done');
          const freeNum = el.querySelector('.mission-num');
          if (freeNum) {
            freeNum.textContent = '✎';
            freeNum.classList.toggle('in-progress', id === this.current);
          }
          return;
        }
        el.classList.toggle('done', this.done.has(id));
        const numEl = el.querySelector('.mission-num');
        if (!numEl) return;
        const idx = MISSIONS.findIndex(x => x.id === id);
        if (this.done.has(id)) {
          numEl.textContent = '✓';
          numEl.classList.remove('in-progress');
        } else if (id === this.current) {
          numEl.textContent = idx + 1;
          numEl.classList.add('in-progress');
        } else {
          numEl.textContent = idx + 1;
          numEl.classList.remove('in-progress');
        }
      });

      // 전체 진행 배지
      const pb = document.getElementById('progressBadge');
      if (pb) pb.textContent = `진행률: ${this.done.size} / ${MISSIONS.length}`;

      // 그룹별 진행 배지
      ['basic', 'intermediate', 'advanced'].forEach(level => {
        const items = MISSIONS.filter(m => m.level === level);
        const doneN = items.filter(m => this.done.has(m.id)).length;
        const badge = document.querySelector(`.mission-group[data-level="${level}"] .group-badge`);
        if (badge) badge.textContent = `${doneN} / ${items.length}`;
      });

      this.checkGraduation();
    },

    showToast(m) {
      let t = document.getElementById('missionToast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'missionToast';
        t.className = 'mission-toast';
        document.body.appendChild(t);
      }
      t.innerHTML = `🎉 미션 완료!<br><span style="font-weight:400;font-size:13px;">${m.title}</span>`;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2800);
    },

checkGraduation() {
  const allDone = this.done.size >= MISSIONS.length;
  const justCompleted = this._justCompleted === true;
  this._justCompleted = false;   // 일회성 — 읽는 즉시 소비
  // v2.8.10: 학생이 자유로 복원시 졸업 다시 조업 모드로 강제 전환하지 않음
  const userRestored = window._graduationRestored === true;
  if (allDone && !userRestored) {
    document.body.classList.add('graduated');
    if (justCompleted && window.showAllMissionsComplete) window.showAllMissionsComplete();
    // 마지막 미션 작업물을 먼저 저장한 뒤 독립된 자유 코딩 작업공간으로
    // 자동 전환한다. 저장된 자유 작업물이 있으면 selectMission이 복원한다.
    if (justCompleted && this.current !== FREE_WORKSPACE.id) {
      setTimeout(() => selectMission(FREE_WORKSPACE.id), 0);
    }
  } else if (!allDone) {
    document.body.classList.remove('graduated');
  }



      // 시리얼 모니터 위치 동적 이동
      const monitor = document.getElementById('serialMonitorBar');
      const panelCenter = document.querySelector('.panel-center');
      const panelLeft = document.querySelector('.panel-left');
      if (monitor && panelCenter && panelLeft) {
        if (allDone) {
          // 졸업 모드: panel-center 하단(명령어 블록 아래)으로 이동
          if (monitor.parentElement !== panelCenter) {
            panelCenter.appendChild(monitor);
            console.log('🎓 시리얼 모니터 → 명령어 블록 아래로 이동');
          }
        } else {
          // 일반 모드: panel-left 하단으로 복귀
          if (monitor.parentElement !== panelLeft) {
            panelLeft.appendChild(monitor);
            console.log('📍 시리얼 모니터 → 미션 패널 하단으로 복귀');
          }
        }
      }

      // 졸업 모드 진입 시 Blockly 영역 재계산 + 시뮬 탭으로 자동 전환
      setTimeout(() => {
        if (window.workspace && typeof Blockly.svgResize === 'function') {
          Blockly.svgResize(window.workspace);
        }
      }, 100);
      if (allDone) {
        const hintTab = document.querySelector('.tab[data-tab="hint"]');
        if (hintTab && hintTab.classList.contains('active')) {
          const simTab = document.querySelector('.tab[data-tab="sim"]');
          if (simTab) simTab.click();
        }
      }
    },


    reset() {
      this.done.clear();
      localStorage.removeItem('cubelink_missions_done');
      this.refreshUI();
    }
  };
  window.MissionProgress = MissionProgress;

/* ════════════════════════════════════════════════════════════════════
   ░░░ v2.8.0 1단계 끝 — 다음 2단계에서 렌더링/이벤트 발행 추가 ░░░
   ════════════════════════════════════════════════════════════════════ */



  const CURRICULUM = [
    {
      level: "basic", levelTitle: "🌱 단계별 기초 실습",
      missions: [
        { id: 1, title: "미션 1: 로봇팔 차렷 자세 만들기", desc: "서보 모터 블록들을 활용하여 4개 관절(6, 9, 10, 11)을 모두 안전 각도인 90도로 정렬해 보세요.", hint: "‘서보 모터’ 카테고리에서 ‘서보 핀 X을 90도로 회전’ 블록 4개를 가져와 조립하세요." },
        { id: 2, title: "미션 2: 베이스 좌우 회전하기", desc: "로봇팔의 중심축인 PIN 6번 모터를 45도로 돌렸다가 2초 후 135도로 움직여 보세요.", hint: "회전 블록 사이에 ‘기본 구조’의 ‘X초 기다리기’ 블록을 배치해야 눈으로 움직임을 확인할 수 있습니다." },
        { id: 3, title: "미션 3: 그리퍼 집게 작동하기", desc: "PIN 11번 그리퍼 서보모터를 120도(열기)로 설정한 후, 1초 뒤 50도(꽉 잡기)로 움직여 물건을 집어 보세요.", hint: "그리퍼가 너무 과하게 닫히면 부하가 걸리니 50도~120도 사이 안전 범위를 준수하세요." }
    ]
    },
    {
      level: "intermediate", levelTitle: "🚀 조이스틱 심화 제어",
      missions: [
        { id: 4, title: "미션 4: 조이스틱 센서 준비", desc: "시리얼 통신을 시작하고, 왼쪽 조이스틱을 아날로그 A0, A1 핀과 스위치 2번에 연결해 초기화하세요.", hint: "‘조이스틱’ 카테고리에서 초기화 블록을 가져와 ‘처음 한 번 setup()’ 칸에 넣어야 합니다." },
        { id: 5, title: "미션 5: 조이스틱 값 모니터링", desc: "반복 루프 안에서 왼쪽 조이스틱의 X축 값을 읽어와 시리얼 모니터 창에 실시간으로 출력해 보세요.", hint: "시리얼 통신 시작 블록을 setup에 넣고, loop 안에서 ‘시리얼에 값 출력’ 블록과 조이스틱 읽기 블록을 합치세요." },
        { id: 6, title: "미션 6: 조이스틱으로 베이스 조종", desc: "조이스틱의 X축 아날로그 값(0~1023)을 서보모터 각도 범위(0~180)로 map 변환하여 베이스 6번 모터를 조종하세요.", hint: "‘센서·아날로그’ 카테고리의 ‘값 변환(map)’ 블록을 서보 회전 블록의 각도 자리에 쏙 끼워 넣으세요." }
      ]
    },
    {
      level: "advanced", levelTitle: "🤖 자율주행 및 인공지능 응용",
      missions: [
        { id: 7, title: "미션 7: 초음파 레이더 가동", desc: "초음파 센서(Trig D4 / Echo D5)를 활성화하여 전방의 물체까지의 거리를 cm 단위로 정밀하게 측정해 보세요.", hint: "거리를 읽어와 바로 시리얼 모니터에 출력하도록 루프문을 구성하여 센서 수치 변화를 관찰하세요." },
        { id: 8, title: "미션 8: 장애물 감지 자동 비상정지", desc: "만약 초음파 센서 거리가 15cm 이하로 좁혀지면 그리퍼 집게를 즉시 켜고 베이스를 정지하는 안전 매커니즘을 만드세요.", hint: "‘흐름 제어’의 ‘만약 ~ 이라면’ 블록과 ‘센서·아날로그’의 비교 연산자(<) 블록을 유기적으로 결합하세요." },
        { id: 9, title: "미션 9: CUBELINK 공장 자동화 프로젝트", desc: "조이스틱으로 물건을 집어 올린 후, 초음파 센서에 손을 대면 지정된 위치로 자동으로 물건을 이송하는 복합 매크로 코딩을 완성하세요.", hint: "지금까지 배운 모든 센서와 서보 블록을 총동원하여 융합 논리 회로를 설계하는 마스터 단계입니다." }
      ]
    }
  ];

  let workspace;
  let currentMissionId = 1;
  let activeTab = 'hint';

  // ─── 전역 데이터 저장소 ───
  window.joystickData = window.joystickData || {
    left:  { x: 500, y: 500, sw: 0 },
    right: { x: 500, y: 500, sw: 0 }
  };
  window.servoAngles = window.servoAngles || { 6: 90, 9: 90, 10: 90, 11: 90 };
  window._userVars = window._userVars || {};
  window._ultrasonicValue = window._ultrasonicValue != null ? window._ultrasonicValue : 30;

  /* ============================================================
     초음파 슬라이더 → window._ultrasonicValue 자동 동기화
     ============================================================ */
  function bindUltrasonicSlider() {
    const slider = document.getElementById('usSlider');
    if (!slider) { setTimeout(bindUltrasonicSlider, 200); return; }
    if (slider._bound) return;
    slider._bound = true;
    const sync = () => {
      window._ultrasonicValue = parseFloat(slider.value) || 0;
      const span = document.getElementById('usValue');
      if (span) span.textContent = Math.round(window._ultrasonicValue);
    };
    slider.addEventListener('input', sync);
    sync();
    console.log('✅ 초음파 슬라이더 → _ultrasonicValue 동기화');
  }

  /* ============================================================
     updateJoystickUI 자동 래핑
     → 실제 조이스틱 데이터(시리얼 수신)가 window.joystickData에 자동 저장
     ============================================================ */
  function wrapUpdateJoystickUI() {
    if (typeof window.updateJoystickUI !== 'function') {
      setTimeout(wrapUpdateJoystickUI, 50);
      return;
    }
    if (window.updateJoystickUI._wrapped) return;

    const orig = window.updateJoystickUI;
    window.updateJoystickUI = function(which, x, y, sw) {
      const result = orig.apply(this, arguments);

      // which 정규화: 1/'1'/'left'/'Left'/'L' → 'left',  2/'2'/'right'/'Right'/'R' → 'right'
      const w = String(which || '').toLowerCase();
      let key;
      if (w === '1' || w === 'left'  || w === 'l') key = 'left';
      else if (w === '2' || w === 'right' || w === 'r') key = 'right';
      else if (w.includes('left'))  key = 'left';
      else if (w.includes('right')) key = 'right';
      else key = 'left';

      if (!window.joystickData[key]) window.joystickData[key] = {};
      window.joystickData[key].x  = (typeof x === 'number') ? x : parseInt(x, 10) || 500;
      window.joystickData[key].y  = (typeof y === 'number') ? y : parseInt(y, 10) || 500;
      window.joystickData[key].sw = sw ? 1 : 0;

      return result;
    };
    window.updateJoystickUI._wrapped = true;
    console.log('✅ updateJoystickUI 래핑 완료 — 조이스틱 → joystickData 자동 동기화');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.Sim && typeof window.Sim.init === 'function') {
      window.Sim.init();
    }

    workspace = Blockly.inject('blocklyDiv', {
      toolbox: document.getElementById('toolbox'),
      grid: { spacing: 20, length: 3, colour: '#ccc', gridBySnap: true },
      trashcan: true,
      zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
      resize: true
    });
    window.workspace = workspace;

    // 더미 Arduino 코드 생성기 — 콘솔 에러 제거
    if (window.Arduino) {
      if (!window.Arduino.forBlock) window.Arduino.forBlock = {};
      if (!window.Arduino.forBlock['arduino_setup_loop']) {
        window.Arduino.forBlock['arduino_setup_loop'] = function(block) {
          const setupCode = window.Arduino.statementToCode(block, 'SETUP') || '';
          const loopCode  = window.Arduino.statementToCode(block, 'LOOP')  || '';
          return setupCode + loopCode;
        };
      }
    }

    // 우클릭 메뉴: 스택 전체 복제
    if (Blockly.ContextMenuRegistry && Blockly.ContextMenuRegistry.registry) {
      try {
        Blockly.ContextMenuRegistry.registry.register({
          id: 'duplicate_stack',
          weight: 1.5,
          scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
          displayText: '🔗 스택 전체 복제',
          preconditionFn: (scope) => (scope.block && !scope.block.isInFlyout) ? 'enabled' : 'hidden',
          callback: (scope) => {
            const src = scope.block;
            const ws = src.workspace;
            const xml = Blockly.Xml.blockToDom(src, true);
            const newBlock = Blockly.Xml.domToBlock(xml, ws);
            const pos = src.getRelativeToSurfaceXY();
            newBlock.moveBy(pos.x + 30, pos.y + 30);
          }
        });
        console.log('✅ 스택 전체 복제 메뉴 등록');
      } catch(e) { console.warn('컨텍스트 메뉴 등록 실패:', e.message); }
    }

    // 숫자/문자 필드 편집 중 매 키 입력마다 코드 생성기를 즉시 돌리면
    // Chromium의 Blockly HTML 입력창이 포커스를 잃을 수 있다. UI 이벤트는
    // 제외하고 짧게 모아서 한 번만 갱신한다.
    let codeViewTimer = null;
    workspace.addChangeListener((event) => {
      if (event && event.isUiEvent) return;
      clearTimeout(codeViewTimer);
      codeViewTimer = setTimeout(updateCppCodeView, 120);
    });

    renderMissions();
    setupTabEvents();
    setupButtonEvents();

    // workspace 변경 시: 자동저장 + orphan 경고
    // setWarningText는 블록을 다시 그리므로 숫자/문자 필드 변경 때 호출하지
    // 않는다. 블록 생성·이동·삭제처럼 연결 구조가 바뀔 때만 검사한다.
    workspace.addChangeListener((event) => {
      if (!event || event.isUiEvent) return;
      const structuralEvents = [
        Blockly.Events.BLOCK_CREATE,
        Blockly.Events.BLOCK_MOVE,
        Blockly.Events.BLOCK_DELETE
      ];
      if (structuralEvents.includes(event.type)) {
        setTimeout(() => {
          try { highlightOrphans(); } catch (e) {}
        }, 0);
      }
      if (MissionProgress.current) {
        WorkspaceStorage.scheduleSave(MissionProgress.current);
      }
    });

    installBlocklyFieldFocusRecovery();

    selectMission('m1');


    // 외부 의존 초기화
    wrapUpdateJoystickUI();
    bindUltrasonicSlider();

    setTimeout(triggerResize, 300);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 600);
  });

  /* ============================================================
     연속 필드 편집 포커스 복구
     드롭다운 변경 직후 다른 숫자/문자 필드를 누를 때 이전 Blockly 메뉴가
     키보드 포커스를 계속 잡아 입력칸이 회색으로 굳는 현상을 방지한다.
     ============================================================ */
  function installBlocklyFieldFocusRecovery() {
    if (document._cubelinkFieldFocusRecovery) return;
    document._cubelinkFieldFocusRecovery = true;

    document.addEventListener('pointerdown', (event) => {
      if (window._runtimeRunning) return;
      const target = event.target;
      const editable = target && target.closest
        ? target.closest('.blocklyEditableText')
        : null;
      if (!editable || editable.closest('.blocklyFlyout')) return;

      // 드롭다운 자체를 여는 클릭은 Blockly의 기본 동작에 맡긴다.
      const isDropdown = !!editable.querySelector('.blocklyDropdownText, .blocklyDropdownRect');
      if (isDropdown) return;

      // 이전 드롭다운/필드 편집기의 소유권을 정리한 뒤 새 필드의 기본
      // pointer 처리가 실행되게 한다. 이벤트 자체는 막지 않는다.
      try {
        if (Blockly.DropDownDiv && Blockly.DropDownDiv.hideWithoutAnimation) {
          Blockly.DropDownDiv.hideWithoutAnimation();
        }
      } catch (_) {}
      try {
        const oldInput = document.querySelector('.blocklyWidgetDiv .blocklyHtmlInput');
        if (oldInput) Blockly.WidgetDiv.hide();
      } catch (_) {}

      const focusOpenedInput = () => {
        if (window._runtimeRunning) return;
        const input = document.querySelector('.blocklyWidgetDiv .blocklyHtmlInput');
        if (!input) return;
        input.disabled = false;
        input.readOnly = false;
        try { input.focus({ preventScroll: true }); } catch (_) { input.focus(); }
      };
      requestAnimationFrame(focusOpenedInput);
      setTimeout(focusOpenedInput, 40);
    }, true);
  }

  /* ============================================================
     커리큘럼 메뉴
     ============================================================ */
  /* ============================================================
     미션 메뉴 — 3그룹 아코디언 렌더링 (v2.8.0)
     ============================================================ */
  function renderMissions() {
    const container = document.getElementById('missionList');
    if (!container) return;

    const groups = {
      basic:        { title: '🟢 기초과정', items: [] },
      intermediate: { title: '🟡 중급과정', items: [] },
      advanced:     { title: '🔴 고급과정', items: [] }
    };
    MISSIONS.forEach((m, idx) => {
      if (groups[m.level]) groups[m.level].items.push({ ...m, index: idx + 1 });
    });

    // 저장된 펼침/접힘 상태 (기본: 기초만 펼침)
    const openState = JSON.parse(
      localStorage.getItem('cubelink_group_open')
      || '{"basic":true,"intermediate":false,"advanced":false}'
    );

    const escapeHTML = (s) => String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const html = Object.entries(groups).map(([level, g]) => {
      const doneCount = g.items.filter(m => MissionProgress.done.has(m.id)).length;
      const collapsedClass = openState[level] ? '' : 'collapsed';
      const itemsHtml = g.items.map(m => {
        const shortDesc = m.desc.length > 36 ? m.desc.substring(0, 36) + '...' : m.desc;
        return `
          <div class="mission-item" data-mid="${m.id}" id="mItem-${m.id}">
            <div class="mission-num">${m.index}</div>
            <div style="flex:1;min-width:0;">
              <strong>${escapeHTML(m.title)}</strong>
              <small>${escapeHTML(shortDesc)}</small>
            </div>
          </div>`;
      }).join('');
      return `
        <div class="mission-group ${collapsedClass}" data-level="${level}">
          <div class="mission-group-header" data-level="${level}">
            <span class="group-title">${g.title}</span>
            <span style="display:flex;align-items:center;gap:8px;">
              <span class="group-badge">${doneCount} / ${g.items.length}</span>
              <span class="toggle-arrow">▼</span>
            </span>
          </div>
          <div class="mission-group-body">${itemsHtml}</div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="free-workspace-card mission-item" data-mid="${FREE_WORKSPACE.id}" id="mItem-free">
        <div class="mission-num">✎</div>
        <div style="flex:1;min-width:0;">
          <strong>✨ ${FREE_WORKSPACE.title}</strong>
          <small>미션과 별도로 마음대로 만들고 자동 저장합니다.</small>
        </div>
      </div>
      <div class="mission-divider" aria-hidden="true"></div>
      ${html}`;

    // 그룹 헤더 클릭 → 접기/펼치기
    container.querySelectorAll('.mission-group-header').forEach(h => {
      h.addEventListener('click', () => {
        const level = h.getAttribute('data-level');
        const group = container.querySelector(`.mission-group[data-level="${level}"]`);
        if (!group) return;
        group.classList.toggle('collapsed');
        const state = JSON.parse(localStorage.getItem('cubelink_group_open') || '{}');
        state[level] = !group.classList.contains('collapsed');
        localStorage.setItem('cubelink_group_open', JSON.stringify(state));
      });
    });

    // 미션 아이템 클릭 → 미션 선택
    container.querySelectorAll('.mission-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.mid;
        if (id) selectMission(id);
      });
    });

    MissionProgress.refreshUI();
  }
  window.renderMissions = renderMissions;

   /* ============================================================
     미션 선택 — 작업물 자동 저장/복원 (v2.8.0)
     ============================================================ */
  function selectMission(id) {
    // 같은 미션 재선택은 무시
    if (MissionProgress.current === id) return;

    // 현재 미션 작업물 저장
    if (MissionProgress.current) {
      WorkspaceStorage.save(MissionProgress.current);
    }

    const target = id === FREE_WORKSPACE.id
      ? FREE_WORKSPACE
      : MISSIONS.find(x => x.id === id);
    if (!target) return;
    currentMissionId = id;

    // UI 갱신
    document.querySelectorAll('.mission-item').forEach(el =>
      el.classList.toggle('active', el.dataset.mid === id)
    );

    document.getElementById('missionTitle').innerText = target.title;
    document.getElementById('missionDesc').innerText  = target.desc;
    document.getElementById('hintPanel').innerHTML = `
      <div style="padding:10px; border-left:4px solid var(--gold); background:var(--charcoal-2); border-radius:4px;">
        <h4 style="margin:0 0 8px 0; color:var(--gold);">💡 미션 성공 가이드</h4>
        <div style="white-space:pre-wrap;">${target.hint}</div>
      </div>
    `;

    switchTab('hint');

    // 작업 공간: 저장본 있으면 복원, 없으면 빈 setup/loop
    if (workspace) {
      workspace.clear();
      const restored = WorkspaceStorage.restore(id);
      if (!restored) {
        try {
          const initBlock = workspace.newBlock('arduino_setup_loop');
          initBlock.initSvg();
          initBlock.render();
          initBlock.moveBy(20, 20);
        } catch (e) {}
      }

      setTimeout(() => {
        if (typeof Blockly.svgResize === 'function') Blockly.svgResize(workspace);
        if (typeof workspace.scrollHome === 'function') workspace.scrollHome();
      }, 100);
    }

    // MissionProgress에 등록 (자유 코딩은 검증 대상이 아니며 저장만 한다)
    MissionProgress.select(id);
    MissionProgress.refreshUI();
  }
  window.selectMission = selectMission;

  // 구 API 호환: loadMission으로 호출하는 곳이 있으면 selectMission으로 위임
  function loadMission(id) { selectMission(id); }


  /* ============================================================
     C++ 코드 미리보기 갱신
     ============================================================ */
  function updateCppCodeView() {
    if (!workspace || !window.Arduino) return;
    if (typeof window.resetHeaders === 'function') window.resetHeaders();
    if (typeof window.v2ResetMaps === 'function') window.v2ResetMaps();

    let bodyCode = '';
    try { bodyCode = window.Arduino.workspaceToCode(workspace); } catch(e) { /* 무시 */ }

    let fullCode = `/**\n * CUBELINK Studio v2.7.2 Generated Source\n */\n`;
    if (window.headerExtras) {
      window.headerExtras.includes.forEach(inc => fullCode += `${inc}\n`);
      window.headerExtras.globals.forEach(gl => fullCode += `${gl}\n`);
      window.headerExtras.helpers.forEach(hp => fullCode += `${hp}\n\n`);
    }

    fullCode += `\nvoid setup() {\n  // 제품 초기화 및 설정\n`;
    const setupBlocks = workspace.getBlocksByType('arduino_setup_loop');
    if (setupBlocks.length > 0) {
      try { fullCode += window.Arduino.statementToCode(setupBlocks[0], 'SETUP'); } catch(e) {}
    } else {
      fullCode += `  Serial.begin(9600);\n`;
    }
    fullCode += `}\n\nvoid loop() {\n`;
    if (setupBlocks.length > 0) {
      try { fullCode += window.Arduino.statementToCode(setupBlocks[0], 'LOOP'); } catch(e) {}
    } else {
      fullCode += bodyCode;
    }
    fullCode += `}\n`;

    const outPre = document.getElementById('cppOut');
    if (outPre) outPre.innerText = fullCode;

    syncBlocksTo3D();
  }

  function syncBlocksTo3D() {
    if (!workspace) return;
    const allBlocks = workspace.getAllBlocks(false);
    allBlocks.forEach(b => {
      if (b.type === 'cubelink_servo_move_simple' || b.type === 'cubelink_servo_smooth_simple' || b.type === 'cubelink_v2_servo_set') {
        const pin = b.getFieldValue('PIN');
        const val = parseFloat(b.getFieldValue('ANGLE')) || 90;
        if (window.Sim && typeof window.Sim.setServoAngle === 'function') {
          window.Sim.setServoAngle(pin, val);
        }
      }
    });
  }

  /* ============================================================
     탭 전환
     ============================================================ */
  function setupTabEvents() {
    document.querySelectorAll('.tabs .tab').forEach(t => {
      t.addEventListener('click', () => switchTab(t.getAttribute('data-tab')));
    });
  }
  function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabId));
    document.querySelectorAll('.tab-body').forEach(b => b.classList.toggle('active', b.getAttribute('data-body') === tabId));

    if (tabId === 'sim') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (window.Sim && typeof window.Sim.setServoAngle === 'function') syncBlocksTo3D();
      }, 100);
    }
    if ((tabId === 'hint' || tabId === 'cpp') && workspace) {
      setTimeout(triggerResize, 50);
    }
  }

  /* ============================================================
     공통 헬퍼: 이름 → 키 (왼쪽/오른쪽 등)
     ============================================================ */
  function nameToKey(name) {
    if (!name) return 'left';
    const s = String(name).toLowerCase().trim();
    if (s === '오른쪽' || s === 'right' || s === 'r' || s === '2' || s === 'joyright' || s.includes('right')) return 'right';
    return 'left';
  }

  function runtimeVariableKey(block) {
    const field = block && block.getField ? block.getField('VAR') : null;
    return String(block?.getFieldValue?.('VAR') || field?.getText?.() || 'variable');
  }

  /* ============================================================
     ★ 값 평가 엔진 (evalValue) ★
     blocks.js 실제 필드명 기준으로 전면 보정 (v2.7.2)
     ============================================================ */
  function evalValue(block) {
    if (!block) return 0;
    const t = block.type;

    try {
      // ─── 숫자 / 문자열 리터럴 ───
      if (t === 'math_number') return parseFloat(block.getFieldValue('NUM')) || 0;
      if (t === 'text')        return block.getFieldValue('TEXT') || '';

      // ─── 산술 ───
      if (t === 'math_arithmetic') {
        const op = block.getFieldValue('OP');
        const a = parseFloat(evalValue(block.getInputTargetBlock('A'))) || 0;
        const b = parseFloat(evalValue(block.getInputTargetBlock('B'))) || 0;
        switch (op) {
          case 'ADD':      return a + b;
          case 'MINUS':    return a - b;
          case 'MULTIPLY': return a * b;
          case 'DIVIDE':   return b === 0 ? 0 : a / b;
          case 'POWER':    return Math.pow(a, b);
        }
        return 0;
      }

      // ─── 비교 ───
      if (t === 'logic_compare') {
        const op = block.getFieldValue('OP');
        const a = parseFloat(evalValue(block.getInputTargetBlock('A')));
        const b = parseFloat(evalValue(block.getInputTargetBlock('B')));
        switch (op) {
          case 'EQ':  return a === b;
          case 'NEQ': return a !== b;
          case 'LT':  return a < b;
          case 'LTE': return a <= b;
          case 'GT':  return a > b;
          case 'GTE': return a >= b;
        }
        return false;
      }

      // ─── 논리 ───
      if (t === 'logic_operation') {
        const op = block.getFieldValue('OP');
        const a = evalValue(block.getInputTargetBlock('A'));
        const b = evalValue(block.getInputTargetBlock('B'));
        return op === 'AND' ? (a && b) : (a || b);
      }
      if (t === 'logic_negate')  return !evalValue(block.getInputTargetBlock('BOOL'));
      if (t === 'logic_boolean') return block.getFieldValue('BOOL') === 'TRUE';

      // ═══════════════════════════════════════════════════════
      // 조이스틱 — 통합형 (구버전)  cubelink_joystick_read
      //   필드: NAME ('왼쪽'/'오른쪽'), PROP ('X'/'Y'/'BTN')
      // ═══════════════════════════════════════════════════════
      if (t === 'cubelink_joystick_read') {
        const name = block.getFieldValue('NAME') || '왼쪽';
        const prop = block.getFieldValue('PROP') || 'X';
        const key  = nameToKey(name);
        const data = window.joystickData?.[key] || { x:500, y:500, sw:0 };
        if (prop === 'Y')   return data.y;
        if (prop === 'BTN') return data.sw ? 1 : 0;
        return data.x;
      }

      // ═══════════════════════════════════════════════════════
      // 조이스틱 — v2 분리형  cubelink_v2_joystick_x/y/btn
      //   필드: JNAME ('왼쪽'/'오른쪽')
      // ═══════════════════════════════════════════════════════
      if (t === 'cubelink_v2_joystick_x') {
        const key = nameToKey(block.getFieldValue('JNAME'));
        return window.joystickData?.[key]?.x ?? 500;
      }
      if (t === 'cubelink_v2_joystick_y') {
        const key = nameToKey(block.getFieldValue('JNAME'));
        return window.joystickData?.[key]?.y ?? 500;
      }
      if (t === 'cubelink_v2_joystick_btn') {
        const key = nameToKey(block.getFieldValue('JNAME'));
        return window.joystickData?.[key]?.sw ? 1 : 0;
      }

      // ═══════════════════════════════════════════════════════
      // 서보 현재 각도  cubelink_servo_read / cubelink_v2_servo_read
      //   필드: PIN ('6'/'9'/'10'/'11' 등)
      // ═══════════════════════════════════════════════════════
      if (t === 'cubelink_servo_read' || t === 'cubelink_v2_servo_read') {
        const pin = block.getFieldValue('PIN');
        const span = document.getElementById('servoAngle' + pin);
        if (span) {
          const v = parseFloat(span.innerText);
          if (!isNaN(v)) return v;
        }
        return window.servoAngles[pin] != null ? window.servoAngles[pin] : 90;
      }

      // ═══════════════════════════════════════════════════════
      // map — 값 입력형  cubelink_map
      //   입력: VAL  /  필드: FL, FH, TL, TH
      // ═══════════════════════════════════════════════════════
      if (t === 'cubelink_map') {
        const v  = parseFloat(evalValue(block.getInputTargetBlock('VAL'))) || 0;
        const fL = parseFloat(block.getFieldValue('FL')) || 0;
        const fH = parseFloat(block.getFieldValue('FH')) || 1023;
        const tL = parseFloat(block.getFieldValue('TL')) || 0;
        const tH = parseFloat(block.getFieldValue('TH')) || 180;
        if (fH === fL) return tL;
        return Math.round((v - fL) * (tH - tL) / (fH - fL) + tL);
      }

      // ═══════════════════════════════════════════════════════
      // map — 필드형  cubelink_map_simple
      //   필드: VAL, FL, FH, TL, TH (전부 number 필드)
      // ═══════════════════════════════════════════════════════
      if (t === 'cubelink_map_simple') {
        const v  = parseFloat(block.getFieldValue('VAL')) || 0;
        const fL = parseFloat(block.getFieldValue('FL')) || 0;
        const fH = parseFloat(block.getFieldValue('FH')) || 1023;
        const tL = parseFloat(block.getFieldValue('TL')) || 0;
        const tH = parseFloat(block.getFieldValue('TH')) || 180;
        if (fH === fL) return tL;
        return Math.round((v - fL) * (tH - tL) / (fH - fL) + tL);
      }

      // ═══════════════════════════════════════════════════════
      // 아날로그 핀 읽기  cubelink_analogread
      //   A0=왼쪽X, A1=왼쪽Y, A2=오른쪽X, A3=오른쪽Y
      // ═══════════════════════════════════════════════════════
      if (t === 'cubelink_analogread') {
        const pin = block.getFieldValue('PIN');
        if (pin === 'A0') return window.joystickData?.left?.x  ?? 500;
        if (pin === 'A1') return window.joystickData?.left?.y  ?? 500;
        if (pin === 'A2') return window.joystickData?.right?.x ?? 500;
        if (pin === 'A3') return window.joystickData?.right?.y ?? 500;
        return 0;
      }

      // ═══════════════════════════════════════════════════════
      // 디지털 핀 읽기  cubelink_digitalread
      //   PIN 2 = 왼쪽 SW (INPUT_PULLUP — 눌림=LOW=0)
      //   PIN 7 = 오른쪽 SW
      //   PIN 13 = LED (디지털 출력 상태 반영)
      // ═══════════════════════════════════════════════════════
      if (t === 'cubelink_digitalread') {
        const pin = block.getFieldValue('PIN');
        if (pin === '2') return window.joystickData?.left?.sw  ? 0 : 1;
        if (pin === '7') return window.joystickData?.right?.sw ? 0 : 1;
        return 1;
      }

      // ═══════════════════════════════════════════════════════
      // 초음파  cubelink_ultrasonic
      //   필드: TRIG, ECHO  (시뮬레이션에서는 슬라이더 값 반환)
      // ═══════════════════════════════════════════════════════
      if (t === 'cubelink_ultrasonic') {
        return window._ultrasonicValue != null ? window._ultrasonicValue : 30;
      }

      // ─── 변수 ───
      if (t === 'variables_get') {
        const key = runtimeVariableKey(block);
        return (window._userVars[key] != null) ? window._userVars[key] : 0;
      }

      // ─── 폴백: NUM 필드가 있으면 숫자로 ───
      const numField = block.getFieldValue('NUM');
      if (numField != null) return parseFloat(numField) || 0;

    } catch (e) {
      console.warn('evalValue 오류:', t, e.message);
    }
    return 0;
  }
  window.evalValue = evalValue;

  /* ============================================================
     공통 실행 엔진 (실시간 + 시뮬레이션) — 안전장치 포함
     ============================================================ */
  async function runProgram() {
        // v2.8.9: 이미 실행 중이면 무시 (중복 호출 방지)
    if (window._runtimeRunning) {
      window._runtimeRunning = false;
      appendSerialLog("⏹ 중단 요청");
      return;
    }
    const simOnly = window._simulationOnly === true;
    window._simulationOnly = false;
    let runtimeMode = simOnly
      ? 'sim'
      : (['real', 'sim', 'twin'].includes(window.actionMode) ? window.actionMode : 'real');
    const port = window._serialPort;
    let useSerial = (runtimeMode === 'real' || runtimeMode === 'twin') && !!(port && port.writable);

    // 안전장치
    let loopCount = 0;
    const MAX_TOTAL_LOOPS = 100000;
    let startTime = performance.now();
    let warnedTooFast = false;

    function safeAngle(pin, angle, blockType) {
      const a = parseFloat(angle);
      if (isNaN(a)) {
        appendSerialLog(`⚠️ [${blockType}] PIN ${pin}: 각도값이 숫자가 아님 (${angle}) → 무시`);
        return null;
      }
      if (a < 0 || a > 180) {
        const clamped = Math.max(0, Math.min(180, a));
        appendSerialLog(`⚠️ [${blockType}] PIN ${pin}: 각도 ${Math.round(a)}° → ${Math.round(clamped)}°로 보정`);
        return clamped;
      }
      return a;
    }

    if ((runtimeMode === 'real' || runtimeMode === 'twin') && !useSerial) {
      if (!await window.customConfirm("로봇이 연결되지 않았습니다. 3D 시뮬레이션만 실행할까요?")) return;
      runtimeMode = 'sim';
      useSerial = false;
    }

    if (useSerial && (!window._cubeSafety || !window._cubeSafety.initialized)) {
      await window.customAlert('안전 초기화가 완료되지 않았습니다. 로봇 연결 및 초기화를 먼저 완료하세요.');
      return;
    }


    // 매 실행은 새 Arduino 전원 투입처럼 변수값 0에서 시작한다.
    window._userVars = {};
    window._runtimeRunning = true;

    let wakeForCurrentFault = null;
    const currentFaultSignal = new Promise(resolve => { wakeForCurrentFault = resolve; });
    const servoProtection = {
      fault: null,
      rollbackFault: null,
      recovering: false,
      nextCommandId: 1,
      history: [],
      actions: new Map(),
      receiveFault(fault) {
        if (this.recovering) {
          this.rollbackFault = fault;
          return;
        }
        if (this.fault) return;
        this.fault = fault;
        const action = this.actions.get(fault.commandId);
        const block = action && workspace.getBlockById(action.blockId);
        if (block) {
          try {
            if (typeof workspace.highlightBlock === 'function') workspace.highlightBlock(block.id);
            if (typeof block.select === 'function') block.select();
          } catch (_) {}
        }
        if (wakeForCurrentFault) wakeForCurrentFault(fault);
      }
    };
    window._servoProtectionRuntime = servoProtection;

    class ServoProtectionError extends Error {
      constructor(fault) {
        super(`서보 전류 이상: PIN ${fault.pin || '?'} (${fault.milliAmps || 0}mA)`);
        this.name = 'ServoProtectionError';
        this.fault = fault;
      }
    }

    async function runtimeDelay(ms) {
      if (servoProtection.fault) throw new ServoProtectionError(servoProtection.fault);
      const result = await Promise.race([
        new Promise(resolve => setTimeout(() => resolve(null), Math.max(0, ms))),
        currentFaultSignal
      ]);
      if (result) throw new ServoProtectionError(result);
    }

    // v1.4.2/Studio 3.6 hardware uses the original S protocol. CUR4 firmware
    // alone receives monitored M/B commands and the rollback timing window.
    const hasCurrentProtection = useSerial && !!(window._cubeSafety &&
      window._cubeSafety.currentProtection === 'CUR4');

    const writer = useSerial
      ? await (window.acquireSerialWriter
          ? window.acquireSerialWriter(port)
          : Promise.resolve(port.writable.getWriter()))
      : null;
    const enc = new TextEncoder();
    const btnRT = document.getElementById(simOnly ? 'btnSimStart' : 'btnRunRealtime');
    const originalText = btnRT ? btnRT.textContent : '';
    if (btnRT) btnRT.textContent = '⏹ 실행 중 (클릭하여 중단)';
        const btnOther = document.getElementById(simOnly ? 'btnRunRealtime' : 'btnSimStart');
    if (btnOther) { btnOther.disabled = true; btnOther.style.opacity = '0.4'; btnOther.style.cursor = 'not-allowed'; }

    const simStatusEl = document.getElementById('simStatus');
    if (simStatusEl) { simStatusEl.textContent = '● 실행 중'; simStatusEl.classList.add('running'); }


    const setupRoot = workspace.getBlocksByType('arduino_setup_loop')[0];
    if (!setupRoot) {
      appendSerialLog("⚠️ setup/loop 블록이 없습니다");
      window._runtimeRunning = false;
      if (btnRT) btnRT.textContent = originalText;
      if (writer) writer.releaseLock();
      if (simStatusEl) { simStatusEl.textContent = '● 대기 중'; simStatusEl.classList.remove('running'); }
      return;
    }
    if (!simOnly && window.enterDigitalTwinLayout) {
      window.enterDigitalTwinLayout({ manual: false });
    }
    // v2.9.1: 실행 중 편집 잠금 (시뮬=금색, 실시간=빨강) — setup 확인 후 켬
    showRunLock(runtimeMode !== 'sim');
    const runtimeModeLabel = { real: '실물만', sim: '그래픽만', twin: '디지털 트윈(실물 + 그래픽)' };
    appendSerialLog(`🔀 실행 모드: ${runtimeModeLabel[runtimeMode]}`);
    const setupChain = setupRoot.getInputTargetBlock('SETUP');
    const loopChain  = setupRoot.getInputTargetBlock('LOOP');

    const chainToArray = (head) => {
      const arr = [];
      let cur = head;
      while (cur) { arr.push(cur); cur = cur.getNextBlock(); }
      return arr;
    };

    // ─── 서보 전송 공통 ───
async function sendServo(pin, angle, options) {
  options = options || {};
  // 실행을 시작한 순간의 모드를 고정해 실물/그래픽 경로를 일관되게 유지한다.
  const sendReal = runtimeMode === 'real' || runtimeMode === 'twin';
  const sendSim  = runtimeMode === 'sim'  || runtimeMode === 'twin';

  // 3D는 USB drain 대기 전에 먼저 갱신해 시리얼 지연에 화면이 묶이지 않게 한다.
  if (sendSim && !options.skipSim && window.Sim) Sim.setServoAngle(pin, angle);

  if (sendReal && writer) {
    // ★ 캘리브레이션: 실물 전송 각도 = 명령 각도 + 해당 핀 Offset
    const off = (window.getServoOffset ? window.getServoOffset(pin) : 0);
    let realAngle = Math.round(angle + off);
    if (String(pin) === '11') realAngle = Math.max(50, Math.min(120, realAngle)); // 그리퍼 보호
    else realAngle = Math.max(0, Math.min(180, realAngle));                       // 일반 축 보호

    const commandId = Number(options.commandId) || 0;
    const command = hasCurrentProtection && options.rollback
      ? `B,${commandId},${pin},${realAngle}`
      : (hasCurrentProtection && commandId
        ? `M,${commandId},${pin},${realAngle}`
        : `S,${pin},${realAngle}`);
    try { await writer.write(enc.encode(command + `\n`)); }
    catch(e) {
      appendSerialLog(`🛑 시리얼 끊김 — 실행 중지: ${e.message}`);
      window._runtimeRunning = false;
      return;
    }
  }

  window.servoAngles[pin] = angle;
  if (!options.skipMission && window.MissionProgress) {
    MissionProgress.onSimEvent({ type: 'servo', pin: parseInt(pin), angle: parseFloat(angle) });
  }
}

    const beginServoAction = (block, pin, target) => {
      let commandId = servoProtection.nextCommandId++;
      if (servoProtection.nextCommandId > 30000) servoProtection.nextCommandId = 1;
      const action = {
        commandId,
        stepNumber: servoProtection.actions.size + 1,
        blockId: block.id,
        blockType: block.type,
        pin: String(pin),
        before: window.servoAngles[pin] != null ? Number(window.servoAngles[pin]) : 90,
        target: Number(target)
      };
      servoProtection.actions.set(commandId, action);
      return action;
    };

    const commitServoAction = action => {
      servoProtection.history.push(action);
    };

    async function verifyServoAction(startedAt) {
      const elapsed = performance.now() - startedAt;
      await runtimeDelay(hasCurrentProtection ? Math.max(0, 1100 - elapsed) : Math.max(0, 30 - elapsed));
    }

    async function rollbackAfterCurrentFault() {
      const fault = servoProtection.fault;
      if (!fault || !writer) return;
      if (fault.kind === 'SENSOR_LOST') {
        appendSerialLog('🛑 전류센서 통신이 끊겨 모든 서보를 분리했습니다. 배선을 확인한 뒤 전원을 다시 연결하세요.');
        return;
      }

      const failedAction = servoProtection.actions.get(fault.commandId) || null;
      const failedLabel = failedAction ? `${failedAction.stepNumber}번째 실행 블록` : `명령 ${fault.commandId}`;
      appendSerialLog(`🛑 ${failedLabel} · PIN ${fault.pin}에서 ${fault.milliAmps}mA 감지`);
      if (window.showToast && failedAction) {
        window.showToast(`🛑 ${failedAction.stepNumber}번째 블록(PIN ${fault.pin})에서 장애물이 감지되었습니다.`, 'error', 8000);
      }
      appendSerialLog('↩ 성공한 서보 동작을 실제 실행 순서의 역순으로 복구합니다.');
      servoProtection.recovering = true;
      servoProtection.rollbackFault = null;

      const rollbackSteps = servoProtection.history
        .filter(action => !failedAction || action.commandId !== failedAction.commandId)
        .slice()
        .reverse();
      if (failedAction) rollbackSteps.push(failedAction);

      try {
        for (const action of rollbackSteps) {
          if (servoProtection.rollbackFault) throw new Error('복구 중에도 장애물이 감지되었습니다.');
          let commandId = servoProtection.nextCommandId++;
          if (servoProtection.nextCommandId > 30000) servoProtection.nextCommandId = 1;
          await sendServo(action.pin, action.before, { commandId, rollback: true, skipMission: true });
          appendSerialLog(`  ↩ PIN ${action.pin} → ${Math.round(action.before)}°`);
          await new Promise(resolve => setTimeout(resolve, 1100));
        }
        if (servoProtection.rollbackFault) throw new Error('복구 중에도 장애물이 감지되었습니다.');
        const recovery = window.waitForBoardResponse(['RECOVERY_OK', 'ERR'], 4000);
        await writer.write(enc.encode('C\n'));
        const response = await recovery;
        if (response !== 'RECOVERY_OK') throw new Error(response);
        appendSerialLog('✅ 장애물 해제 및 이전 상태 복구 완료');
        if (window.showToast) window.showToast('✅ 서보 보호 복구가 완료되었습니다.', 'success', 5000);
      } catch (error) {
        appendSerialLog(`🛑 자동 복구 중단: ${error.message}`);
        try { await writer.write(enc.encode('X\n')); } catch (_) {}
        if (window.showToast) {
          window.showToast('🛑 자동 복구 실패 — 로봇 전원을 끄고 장애물을 직접 제거하세요.', 'error', 8000);
        }
      }
    }


    // ─── 단일 블록 실행 ───
    const execBlock = async (b) => {
      if (!window._runtimeRunning) return;
      const t = b.type;

      try {
        // ═══ 서보 — 필드 직접 입력형 ═══
        if (t === 'cubelink_servo_move_simple' || t === 'cubelink_v2_servo_set') {
          const pin   = b.getFieldValue('PIN');
          const angle = safeAngle(pin, b.getFieldValue('ANGLE'), t);
          if (angle === null) return;
          const action = beginServoAction(b, pin, angle);
          const actionStarted = performance.now();
          await sendServo(pin, angle, { commandId: action.commandId });
          appendSerialLog(`  S,${pin},${angle}`);
          await verifyServoAction(actionStarted);
          commitServoAction(action);
          return;
        }

        // ═══ 서보 — 값 입력형 ═══
        if (t === 'cubelink_servo_move' || t === 'cubelink_v2_servo_set_value') {
          const pin   = b.getFieldValue('PIN');
          const inner = b.getInputTargetBlock('ANGLE');
          const raw   = inner ? evalValue(inner) : 90;
          const angle = safeAngle(pin, raw, t);
          if (angle === null) return;
          const action = beginServoAction(b, pin, angle);
          const actionStarted = performance.now();
          await sendServo(pin, angle, { commandId: action.commandId });
          appendSerialLog(`  S,${pin},${angle}`);
          await verifyServoAction(actionStarted);
          commitServoAction(action);
          return;
        }

        // ═══ 서보 — 부드럽게 (필드형) ═══
        if (t === 'cubelink_servo_smooth_simple') {
          const pin    = b.getFieldValue('PIN');
          const target = safeAngle(pin, b.getFieldValue('ANGLE'), t);
          if (target === null) return;
          const sec    = parseFloat(b.getFieldValue('SEC')) || 1;
          const steps  = Math.max(5, Math.floor(sec * 20));
          const start  = window.servoAngles[pin] != null ? window.servoAngles[pin] : 90;
          const action = beginServoAction(b, pin, target);
          const useTimedSim = (runtimeMode === 'sim' || runtimeMode === 'twin') &&
            window.Sim && typeof Sim.moveServoSmooth === 'function';
          if (useTimedSim) Sim.moveServoSmooth(pin, target, sec);
          const moveStarted = performance.now();
          const stepMs = (sec * 1000) / steps;
          for (let i = 1; i <= steps; i++) {
            if (!window._runtimeRunning) return;
            const a = Math.round(start + (target - start) * (i / steps));
            await sendServo(pin, a, { skipSim: useTimedSim, commandId: action.commandId });
            const remain = moveStarted + (i * stepMs) - performance.now();
            if (remain > 0) await runtimeDelay(remain);
          }
          await verifyServoAction(moveStarted);
          commitServoAction(action);
          return;
        }

        // ═══ 서보 — 부드럽게 (값 입력형) ═══
        if (t === 'cubelink_servo_smooth') {
          const pin    = b.getFieldValue('PIN');
          const inner  = b.getInputTargetBlock('ANGLE');
          const raw    = inner ? evalValue(inner) : 90;
          const target = safeAngle(pin, raw, t);
          if (target === null) return;
          const sec    = parseFloat(b.getFieldValue('SEC')) || 1;
          const steps  = Math.max(5, Math.floor(sec * 20));
          const start  = window.servoAngles[pin] != null ? window.servoAngles[pin] : 90;
          const action = beginServoAction(b, pin, target);
          const useTimedSim = (runtimeMode === 'sim' || runtimeMode === 'twin') &&
            window.Sim && typeof Sim.moveServoSmooth === 'function';
          if (useTimedSim) Sim.moveServoSmooth(pin, target, sec);
          const moveStarted = performance.now();
          const stepMs = (sec * 1000) / steps;
          for (let i = 1; i <= steps; i++) {
            if (!window._runtimeRunning) return;
            const a = Math.round(start + (target - start) * (i / steps));
            await sendServo(pin, a, { skipSim: useTimedSim, commandId: action.commandId });
            const remain = moveStarted + (i * stepMs) - performance.now();
            if (remain > 0) await runtimeDelay(remain);
          }
          await verifyServoAction(moveStarted);
          commitServoAction(action);
          return;
        }

        // ═══ 서보 attach (시뮬에선 로그만) ═══
        if (t === 'cubelink_servo_attach') {
          const pin = b.getFieldValue('PIN');
          appendSerialLog(`🔧 서보 핀 ${pin} 연결`);
          return;
        }

        // ═══ 딜레이 ═══
        if (t === 'cubelink_delay' || t === 'cubelink_v2_delay_ms') {
          const ms = parseInt(b.getFieldValue('MS'), 10) || 0;
          await runtimeDelay(ms);
          return;
        }
        if (t === 'cubelink_delay_sec') {
          const sec = parseFloat(b.getFieldValue('SEC')) || 0;
          await runtimeDelay(sec * 1000);
          return;
        }
        if (t === 'cubelink_delay_us') {
          // 마이크로초 단위는 브라우저에서 정확 제어 불가 → 최소 1ms로 변환
          const us = parseInt(b.getFieldValue('US'), 10) || 0;
          const ms = Math.max(1, Math.round(us / 1000));
          await runtimeDelay(ms);
          return;
        }

        // ═══ pinMode (시뮬에선 로그만) ═══
        if (t === 'cubelink_pinmode') {
          const pin  = b.getFieldValue('PIN');
          const mode = b.getFieldValue('MODE');
          appendSerialLog(`🔧 pinMode(${pin}, ${mode})`);
          return;
        }

        // ═══ 디지털 출력 (LED 등) ═══
        if (t === 'cubelink_digitalwrite') {
          const pin = b.getFieldValue('PIN');
          const val = b.getFieldValue('VAL') === 'HIGH' ? 1 : 0;
          if (writer) await writer.write(enc.encode(`L,${pin},${val}\n`));
          // PIN 13 LED UI 반영
          if (pin === '13') {
            const led = document.getElementById('led13');
            if (led) led.style.background = val ? '#ff4444' : '#222';
          }
           if (window.MissionProgress) MissionProgress.onSimEvent({ type: 'led', pin: parseInt(pin), on: val === 1 });
          appendSerialLog(`  L,${pin},${val}`);
          await new Promise(r => setTimeout(r, 20));
          return;
        }

        // ═══ 시리얼 통신 시작 ═══
        if (t === 'cubelink_serial_begin' || t === 'cubelink_v2_serial_begin') {
          const baud = b.getFieldValue('BAUD');
          appendSerialLog(`📡 시리얼 시작 (${baud} bps)`);
          return;
        }

        // ═══ 시리얼 출력 — 텍스트 ═══
        if (t === 'cubelink_serial_println_text') {
          appendSerialLog(`📤 ${b.getFieldValue('TEXT')}`);
            if (window.MissionProgress) MissionProgress.onSimEvent({ type: 'serial' });
          return;
        }

        // ═══ 시리얼 출력 — 숫자 ═══
        if (t === 'cubelink_serial_println_num') {
          appendSerialLog(`📤 ${b.getFieldValue('NUM')}`);
           if (window.MissionProgress) MissionProgress.onSimEvent({ type: 'serial' });
          return;
        }

        // ═══ 시리얼 출력 — 값(입력 슬롯) ═══
        if (t === 'cubelink_serial_println_value') {
          const inner = b.getInputTargetBlock('VAL');
          const v = inner ? evalValue(inner) : 0;
          appendSerialLog(`📤 ${v}`);
           if (window.MissionProgress) MissionProgress.onSimEvent({ type: 'serial' });
          return;
        }

        // ═══ 조이스틱 초기화 (구버전) cubelink_joystick_init ═══
        //   필드: NAME, VRX, VRY, SW
        if (t === 'cubelink_joystick_init') {
          const name = b.getFieldValue('NAME') || '왼쪽';
          const vrx  = b.getFieldValue('VRX');
          const vry  = b.getFieldValue('VRY');
          const sw   = b.getFieldValue('SW');
          appendSerialLog(`🕹 조이스틱(${name}) 초기화 VRx=${vrx} VRy=${vry} SW=${sw}`);
          if (writer) await writer.write(enc.encode(`J,INIT,${name},${vrx},${vry},${sw}\n`));
          return;
        }

        // ═══ 조이스틱 초기화 (v2) cubelink_v2_joystick_init ═══
        //   필드: JNAME, VRX, VRY, SW
        if (t === 'cubelink_v2_joystick_init') {
          const name = b.getFieldValue('JNAME') || '왼쪽';
          const vrx  = b.getFieldValue('VRX');
          const vry  = b.getFieldValue('VRY');
          const sw   = b.getFieldValue('SW');
          appendSerialLog(`🕹 v2 조이스틱(${name}) 초기화 VRx=${vrx} VRy=${vry} SW=${sw}`);
          if (writer) await writer.write(enc.encode(`J,INIT,${name},${vrx},${vry},${sw}\n`));
          return;
        }

        // ═══ 반복문 N회 ═══
        if (t === 'cubelink_repeat_n' || t === 'controls_repeat_ext') {
          let times = 0;
          if (t === 'controls_repeat_ext') {
            const inner = b.getInputTargetBlock('TIMES');
            times = parseInt(evalValue(inner), 10) || 0;
          } else {
            times = parseInt(b.getFieldValue('TIMES'), 10) || 0;
          }
          if (times > 1000) appendSerialLog(`⚠️ 반복 ${times}회 → 1000회로 제한`);
          const safeTimes = Math.min(times, 1000);
          const inner = chainToArray(b.getInputTargetBlock('DO'));
          for (let i = 0; i < safeTimes; i++) {
            if (!window._runtimeRunning) return;
            for (const ib of inner) {
              if (!window._runtimeRunning) return;
              await execBlock(ib);
            }
          }
          return;
        }

        // ═══ 조건문 if / elseif / else (Blockly 표준) ═══
        if (t === 'controls_if') {
          let idx = 0;
          let matched = false;
          while (true) {
            const condBlock = b.getInputTargetBlock('IF' + idx);
            if (!condBlock) break;
            const result = evalValue(condBlock);
            if (result) {
              const doBlock = b.getInputTargetBlock('DO' + idx);
              if (doBlock) {
                const arr = chainToArray(doBlock);
                for (const ib of arr) {
                  if (!window._runtimeRunning) return;
                  await execBlock(ib);
                }
              }
              matched = true;
              break;
            }
            idx++;
          }
          if (!matched) {
            const elseBlock = b.getInputTargetBlock('ELSE');
            if (elseBlock) {
              const arr = chainToArray(elseBlock);
              for (const ib of arr) {
                if (!window._runtimeRunning) return;
                await execBlock(ib);
              }
            }
          }
          return;
        }

        // ═══ 조건문 — controls_ifelse (블록 1개에 if+else 고정) ═══
        if (t === 'controls_ifelse') {
          const cond = evalValue(b.getInputTargetBlock('IF0'));
          const target = cond ? 'DO0' : 'ELSE';
          const arr = chainToArray(b.getInputTargetBlock(target));
          for (const ib of arr) {
            if (!window._runtimeRunning) return;
            await execBlock(ib);
          }
          return;
        }

        // ═══ v2 조건문 — cubelink_v2_if / cubelink_v2_if_else ═══
        //   입력: COND (Boolean), DO, ELSE
        if (t === 'cubelink_v2_if' || t === 'cubelink_v2_if_else') {
          const cond = evalValue(b.getInputTargetBlock('COND'));
          if (cond) {
            const arr = chainToArray(b.getInputTargetBlock('DO'));
            for (const ib of arr) {
              if (!window._runtimeRunning) return;
              await execBlock(ib);
            }
          } else if (t === 'cubelink_v2_if_else') {
            const arr = chainToArray(b.getInputTargetBlock('ELSE'));
            for (const ib of arr) {
              if (!window._runtimeRunning) return;
              await execBlock(ib);
            }
          }
          return;
        }

        // ═══ 변수 설정 ═══
        if (t === 'variables_set') {
          const name  = runtimeVariableKey(b);
          const inner = b.getInputTargetBlock('VALUE');
          window._userVars[name] = inner ? evalValue(inner) : 0;
          return;
        }

        // ═══ 변수 증감 ═══
        if (t === 'math_change') {
          const name  = runtimeVariableKey(b);
          const inner = b.getInputTargetBlock('DELTA');
          const delta = inner ? parseFloat(evalValue(inner)) || 0 : 0;
          const cur   = window._userVars[name] != null ? window._userVars[name] : 0;
          window._userVars[name] = cur + delta;
          return;
        }
        // ═══ 사용자 정의 함수 호출 (반환값 없음) ═══
        if (t === 'procedures_callnoreturn') {
          const funcName = b.getFieldValue('NAME');
          const ws = window.workspace;
          // 워크스페이스에서 같은 이름의 함수 정의 블록 찾기
          const defBlock = ws.getAllBlocks(false).find(x =>
            (x.type === 'procedures_defnoreturn' || x.type === 'procedures_defreturn') &&
            x.getFieldValue('NAME') === funcName);
          if (defBlock) {
            const bodyArr = chainToArray(defBlock.getInputTargetBlock('STACK'));
            for (const ib of bodyArr) {
              if (!window._runtimeRunning) return;
              await execBlock(ib);
            }
          } else {
            appendSerialLog(`⚠ 함수 '${funcName}' 정의를 찾을 수 없음`);
          }
          return;
        }

        // 알 수 없는 블록 → 조용히 무시
      } catch (blockErr) {
        if (blockErr && blockErr.name === 'ServoProtectionError') throw blockErr;
        appendSerialLog(`❌ [${t}] 블록 실행 오류: ${blockErr.message}`);
        console.error('블록 실행 오류:', t, blockErr);
      }
    };

    const execChain = async (arr) => {
      for (const b of arr) {
        if (!window._runtimeRunning) return;
        await execBlock(b);
      }
    };

    try {
      const setupArr = chainToArray(setupChain);
      const loopArr  = chainToArray(loopChain);

      appendSerialLog("▶ setup 실행");
      await execChain(setupArr);

      if (loopArr.length > 0) {
        appendSerialLog("🔁 loop 시작");
        while (window._runtimeRunning) {
          loopCount++;

          // 안전 1: 총 반복 제한
          if (loopCount > MAX_TOTAL_LOOPS) {
            appendSerialLog(`🛑 안전 정지: 반복 ${MAX_TOTAL_LOOPS}회 초과`);
            break;
          }

          // 실제 loop 본문 실행
          const beforeBody = performance.now();
          await execChain(loopArr);
          const bodyDuration = performance.now() - beforeBody;

            // 안전 2 (v2.8.9): 매 루프 무조건 양보 (브라우저 응답성 보장)
          await new Promise(r => setTimeout(r, bodyDuration < 5 ? 10 : 1));
          // 추가: 100회마다 1프레임 양보 (장시간 실행 시 메모리/렌더 안정성)
          if (loopCount % 100 === 0) {
            await new Promise(r => requestAnimationFrame(r));
          }
  

          // 안전 3: 빠른 루프 경고 (한 번만)
          const elapsedSec = (performance.now() - startTime) / 1000;
          if (!warnedTooFast && elapsedSec > 2 && (loopCount / elapsedSec) > 300) {
            appendSerialLog(`⚠️ loop가 너무 빠릅니다 (${Math.round(loopCount/elapsedSec)}회/초) — 'ms 기다리기' 블록 추가 권장`);
            warnedTooFast = true;
          }
        }
      }
      appendSerialLog("⏹ 실행 종료");
    } catch (e) {
      if (e && e.name === 'ServoProtectionError') {
        appendSerialLog(`🛑 전류 보호로 프로그램 실행을 중지했습니다: ${e.message}`);
      } else {
        appendSerialLog(`❌ 실행 오류: ${e.message}`);
      }
      console.error('runProgram 상세 오류:', e);
    } finally {
      window._runtimeRunning = false;
      if (servoProtection.fault) await rollbackAfterCurrentFault();
      if (btnRT) btnRT.textContent = originalText;
            if (btnOther) { btnOther.disabled = false; btnOther.style.opacity = ''; btnOther.style.cursor = ''; }
      try { if (writer) writer.releaseLock(); } catch(_) {}
      if (simStatusEl) { simStatusEl.textContent = '● 대기 중'; simStatusEl.classList.remove('running'); }
            hideRunLock(); // v2.9.1: 실행 종료 시 잠금 해제
      if (!simOnly && window.exitDigitalTwinLayout) {
        window.exitDigitalTwinLayout();
      }

      const totalSec = ((performance.now() - startTime) / 1000).toFixed(1);
      appendSerialLog(`📊 총 ${loopCount}회 반복, ${totalSec}초 소요`);
      if (window._servoProtectionRuntime === servoProtection) window._servoProtectionRuntime = null;
    }
  }
  window.runProgram = runProgram;

  /* ============================================================
     버튼 이벤트
     ============================================================ */
  function setupButtonEvents() {
      document.getElementById('btnClear')?.addEventListener('click', async () => {
      if (await window.customConfirm('작성 중인 블록 코드를 모두 지우시겠습니까?\n(현재 미션의 저장본도 함께 삭제됩니다.)')) {
        workspace.clear();
        if (MissionProgress.current) {
          WorkspaceStorage.clear(MissionProgress.current);
        }
        try {
          const initBlock = workspace.newBlock('arduino_setup_loop');
          initBlock.initSvg();
          initBlock.render();
          initBlock.moveBy(20, 20);
        } catch (e) {}
        setTimeout(triggerResize, 50);
      }
    });
    document.getElementById('btnResetProgress')?.addEventListener('click', async () => {
      const hasProgress = MissionProgress.done.size > 0;
      const hasSavedWork = Object.keys(localStorage).some(k => k.startsWith('cubelink_ws_'));
      if (!hasProgress && !hasSavedWork) {
        await window.customAlert('초기화할 내용이 없습니다.');
        return;
      }
      if (await window.customConfirm(`미션 완료 기록(${MissionProgress.done.size}개)과\n저장된 작업물을 모두 삭제합니다.\n계속하시겠습니까?`)) {
        MissionProgress.reset();
        WorkspaceStorage.clearAll();
        if (workspace) {
          workspace.clear();
          try {
            const xml = Blockly.utils.xml.textToDom(
              '<xml><block type="arduino_setup_loop" x="20" y="20"></block></xml>'
            );
            Blockly.Xml.domToWorkspace(xml, workspace);
          } catch (e) { console.error('초기화 재구성 오류:', e); }
        }
        setTimeout(() => {
          try {
            window.focus();
            if (window.cubelink && window.cubelink.focusWindow) window.cubelink.focusWindow();
            if (workspace) { workspace.getParentSvg().focus(); triggerResize(); }
          } catch (_) {}
        }, 60);
      }
    });


    document.getElementById('btnReload')?.addEventListener('click', async () => {
      if (!currentMissionId) return;
      if (!await window.customConfirm('현재 작업을 버리고 미션을 다시 처음부터 시작하시겠습니까?\n(저장된 작업물도 삭제됩니다.)')) return;
      // 1. 저장본 삭제
      WorkspaceStorage.clear(currentMissionId);
      // 2. workspace 초기화 (빈 setup/loop)
        if (workspace) {
        workspace.clear();
        try {
          const xml = Blockly.utils.xml.textToDom(
            '<xml><block type="arduino_setup_loop" x="20" y="20"></block></xml>'
          );
          Blockly.Xml.domToWorkspace(xml, workspace);
        } catch (e) { console.error('미션 재시작 오류:', e); }
      }

      // 3. MissionProgress state 초기화 (검증 상태 리셋)
      if (window.MissionProgress) {
        MissionProgress.state = {};
      }
      setTimeout(triggerResize, 50);
      console.log('🔄 미션 다시 시작:', currentMissionId);
    });

    document.getElementById('btnClearSerial')?.addEventListener('click', () => {
      const sm = document.getElementById('serialMonitor');
      if (sm) sm.innerText = '';
    });

    document.getElementById('btnToggleSerial')?.addEventListener('click', (e) => {
      const bar = document.querySelector('.serial-monitor-bar');
      bar.classList.toggle('collapsed');
      e.target.innerText = bar.classList.contains('collapsed') ? '▲ 펼치기' : '▼ 접기';
      setTimeout(triggerResize, 150);
    });

    document.getElementById('btnRunRealtime')?.addEventListener('click', async () => {
      if (!window._serialPort || !window._serialPort.writable) {
        await window.customAlert('로봇이 연결되지 않았습니다.\n시뮬레이션 시작 단추를 누르세요');
        return;
      }
      if (window.stopJoystickManual && window.isJoystickManualActive && window.isJoystickManualActive()) {
        await window.stopJoystickManual();
      }
      // 실시간 실행은 항상 실물과 기존 3D 모델을 함께 보여주는 디지털 트윈이다.
      window.twinUnlocked = true;
      if (window.setActionMode) window.setActionMode('twin', { silent: true });
      runProgram();
    });

    document.getElementById('btnSimStart')?.addEventListener('click', () => {
      window._simulationOnly = true;
      runProgram();
    });

    document.getElementById('btnSimStop')?.addEventListener('click', () => {
      window._runtimeRunning = false;
      const status = document.getElementById('simStatus');
      if (status) { status.textContent = '● 정지됨'; status.classList.remove('running'); }
    });
  }
  /* ============================================================
     orphan 블록 자동 경고 (v2.8.0)
     setup/loop에 연결되지 않은 블록에 ⚠ 경고 표시
     ============================================================ */
  function highlightOrphans() {
    if (!workspace) return;
    workspace.getAllBlocks(false).forEach(b => {
      try {
        if (b.type === 'arduino_setup_loop') { b.setWarningText(null); return; }
        const root = b.getRootBlock();
        if (!root || root.type !== 'arduino_setup_loop') {
          b.setWarningText('⚠ setup/loop에 연결되지 않은 블록입니다.\n실행 시 무시됩니다.');
        } else {
          b.setWarningText(null);
        }
      } catch (e) {}
    });
  }
  window.highlightOrphans = highlightOrphans;
  /* ============================================================
     v2.9.1 — 실행 중 잠금 오버레이
     실행 중 왼쪽 미션 패널 + 가운데 워크스페이스 클릭 차단
     ============================================================ */
  function showRunLock(isRealtime) {
    hideRunLock(); // 중복 방지
    const colorClass = isRealtime ? 'real' : 'sim';
    // 실행 중에는 시리얼 모니터를 제외한 미션/블록 작업공간을 모두 잠근다.
    const targets = [
      { el: document.querySelector('.panel-left'), compact: true, msg: '🔒 실행 중' },
      { el: document.querySelector('.panel-center'), compact: false, msg: isRealtime ? '🔴 실물 실행 중' : '🎮 시뮬레이션 실행 중' }
    ];
    targets.forEach(t => {
      if (!t.el) return;
      if (getComputedStyle(t.el).position === 'static') {
        t.el.dataset.runlockPos = '1';
        t.el.style.position = 'relative';
      }
      const ov = document.createElement('div');
      ov.className = 'run-lock-overlay ' + colorClass + (t.compact ? ' compact' : '');
      ov.innerHTML = `<div class="run-lock-msg">${t.msg}</div>`;
           // ▼▼▼ v2.9.4 교체: 시리얼 모니터를 오버레이 위로 끌어올려 항상 보이게 ▼▼▼
      const monitor = document.getElementById('serialMonitorBar');
      // 일반/자유 코딩 화면 어디에 있든 시리얼 모니터만 잠금 영역에서 제외한다.
      if (monitor && monitor.parentElement === t.el) {
        // 1) 오버레이 하단을 시리얼 모니터 높이만큼 비움 (클릭 차단 영역에서 제외)
        ov.style.bottom = monitor.offsetHeight + 'px';
        // 2) 시리얼 모니터를 오버레이(z-index:5000)보다 위로 올려 확실히 노출
        monitor.dataset.runlockZ = monitor.style.zIndex || '';
        monitor.style.position = 'relative';
        monitor.style.zIndex = '5001';
      }
      // ▲▲▲ 교체 끝 ▲▲▲
   ov.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.showToast) {
          window.showToast(isRealtime
            ? '▶ 실물 실행 중 — 정지 후 편집하세요'
            : '🎮 시뮬 실행 중 — 정지 후 편집하세요', 'warn', 2000);
        }
      });
      t.el.appendChild(ov);
    });
  }

  function hideRunLock() {
    document.querySelectorAll('.run-lock-overlay').forEach(ov => ov.remove());
    document.querySelectorAll('[data-runlock-pos="1"]').forEach(el => {
      el.style.position = '';
      delete el.dataset.runlockPos;
    });
    // v2.9.4: 시리얼 모니터 z-index 원상복구
    const monitor = document.getElementById('serialMonitorBar');
    if (monitor && monitor.dataset.runlockZ !== undefined) {
      monitor.style.zIndex = monitor.dataset.runlockZ;
      monitor.style.position = '';
      if (!monitor.style.zIndex) monitor.style.removeProperty('z-index');
      delete monitor.dataset.runlockZ;
    }
  }
  window.showRunLock = showRunLock;
  window.hideRunLock = hideRunLock;

  // USB 분리/재연결이 실행 중 발생하면 runProgram의 비동기 finally를
  // 기다리지 않고 화면 잠금을 즉시 해제한다. 그렇지 않으면 재연결 뒤에도
  // Blockly 필드가 회색으로 남아 창을 전환해야 다시 입력되는 현상이 생긴다.
  function stopRuntimeForSerialTransition() {
    window._runtimeRunning = false;
    if (window.stopJoystickManual && window.isJoystickManualActive && window.isJoystickManualActive()) {
      window.stopJoystickManual({ localOnly: true, force: true });
    } else if (window.exitDigitalTwinLayout) {
      window.exitDigitalTwinLayout({ force: true });
    }
    hideRunLock();
    const simStatusEl = document.getElementById('simStatus');
    if (simStatusEl) {
      simStatusEl.textContent = '● 대기 중';
      simStatusEl.classList.remove('running');
    }
  }
  window.stopRuntimeForSerialTransition = stopRuntimeForSerialTransition;

  // Web Serial 권한창/Windows COM 재연결 뒤 Chromium과 Blockly가 서로 다른
  // 포커스 상태를 기억할 수 있다. 열려 있던 필드 편집기를 닫고 제스처를
  // 취소한 다음 작업공간과 Electron 창 포커스를 한 번에 복구한다.
  function restoreBlocklyInteractionAfterSerial() {
    if (window._runtimeRunning) return;
    hideRunLock();
    try { Blockly.hideChaff(); } catch (_) {}
    try { Blockly.WidgetDiv && Blockly.WidgetDiv.hide(); } catch (_) {}
    try {
      if (Blockly.DropDownDiv && Blockly.DropDownDiv.hideWithoutAnimation) {
        Blockly.DropDownDiv.hideWithoutAnimation();
      }
    } catch (_) {}
    try {
      if (workspace && typeof workspace.cancelCurrentGesture === 'function') {
        workspace.cancelCurrentGesture();
      }
    } catch (_) {}

    setTimeout(() => {
      if (window._runtimeRunning || !workspace) return;
      try { window.focus(); } catch (_) {}
      try {
        if (window.cubelink && window.cubelink.focusWindow) {
          window.cubelink.focusWindow();
        }
      } catch (_) {}
      try {
        const svg = workspace.getParentSvg();
        if (svg) {
          if (!svg.hasAttribute('tabindex')) svg.setAttribute('tabindex', '-1');
          svg.focus({ preventScroll: true });
        }
        triggerResize();
      } catch (_) {}
    }, 80);
  }
  window.restoreBlocklyInteractionAfterSerial = restoreBlocklyInteractionAfterSerial;


  function appendSerialLog(msg) {
    const sm = document.getElementById('serialMonitor');
    if (!sm) return;
    sm.innerText += msg + "\n";
    // v2.9.1: 로그 폭주 방지 — 500줄 초과 시 오래된 줄 제거 (먹통 방지)
    const lines = sm.innerText.split('\n');
    if (lines.length > 500) {
      sm.innerText = lines.slice(-400).join('\n') + "\n";
    }
    sm.scrollTop = sm.scrollHeight;
  }

  window.appendSerialLog = appendSerialLog;

  function triggerResize() {
    if (workspace && typeof Blockly !== 'undefined') {
      Blockly.svgResize(workspace);
      if (workspace.toolbox_ && typeof workspace.toolbox_.position === 'function') workspace.toolbox_.position();
    }
  }

  window.addEventListener('resize', triggerResize);
})();
/* ============================================================
   CUBELINK Studio 대문(스플래시) 페이지 동작 제어
   ============================================================ */
// Windows Electron의 alert/confirm 종료 후 입력 포커스 손실을 피하기 위해
// 모든 안내·확인창을 HTML 모달 하나로 직렬 처리한다.
let cubelinkDialogQueue = Promise.resolve();
function queueCubelinkDialog(message, mode) {
  const showDialog = () => new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmModalMsg');
    const okBtn = document.getElementById('confirmModalOk');
    const cancelBtn = document.getElementById('confirmModalCancel');
    if (!modal || !msg || !okBtn || !cancelBtn) {
      console.error('CubeLink HTML 대화상자를 찾을 수 없습니다:', message);
      resolve(mode === 'alert');
      return;
    }
    msg.textContent = message;
    cancelBtn.style.display = mode === 'confirm' ? '' : 'none';
    modal.style.display = 'flex';
    let settled = false;
    const onKey = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        cleanup(true);
      } else if (event.key === 'Escape' && mode === 'confirm') {
        event.preventDefault();
        cleanup(false);
      }
    };
    const cleanup = (result) => {
      if (settled) return;
      settled = true;
      modal.style.display = 'none';
      cancelBtn.style.display = '';
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      document.removeEventListener('keydown', onKey, true);
      setTimeout(() => {
        if (window.restoreBlocklyInteractionAfterSerial) {
          window.restoreBlocklyInteractionAfterSerial();
        }
      }, 0);
      resolve(mode === 'alert' ? true : result);
    };
    okBtn.onclick = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => okBtn.focus({ preventScroll: true }), 0);
  });
  const queued = cubelinkDialogQueue.then(showDialog, showDialog);
  cubelinkDialogQueue = queued.catch(() => {});
  return queued;
}
window.customConfirm = function(message) {
  return queueCubelinkDialog(message, 'confirm');
};
window.customAlert = function(message) {
  return queueCubelinkDialog(message, 'alert');
};

function setupIntroPage() {
  const btnStart = document.getElementById('btn-intro-start');
  const introPage = document.getElementById('intro-page');
  
  if (btnStart && introPage) {
    btnStart.addEventListener('click', () => {
      // 대문 페이지에 투명도 애니메이션 클래스 추가
      introPage.classList.add('fade-out');
      
      // 애니메이션(0.4초)이 끝난 후 완전히 화면에서 제외 (뒤쪽 메인화면 조작 방해 금지)
      setTimeout(() => {
        introPage.style.display = 'none';
      }, 400);
    });
  }
    // ===== 로고 클릭 → 대문(인트로)으로 (웹에서만) =====
  const brandLogo = document.getElementById('brandLogo');
  if (brandLogo) {
    brandLogo.addEventListener('click', () => {
      if (window.cubelink) return;              // exe에서는 무시
      const introPage = document.getElementById('intro-page');
      if (!introPage) return;
      introPage.style.display = '';
      introPage.classList.remove('fade-out');
    });
  }

  // ===== 안전 종료 버튼: 서보 안전 위치 정렬 후 연결 종료 =====
  const btnSafe = document.getElementById('btnSafeShutdown');
  if (btnSafe) {
    btnSafe.addEventListener('click', async () => {
      const port = window._serialPort;
      if (!port || !port.writable) {
        await window.customAlert('로봇이 연결되어 있지 않습니다.');
        return;
      }
      if (!await window.customConfirm('서보를 안전 위치로 정렬한 뒤 연결을 종료합니다.\n계속할까요?')) return;
      btnSafe.disabled = true;
      let parkedConfirmed = false;

      if (window.stopJoystickManual && window.isJoystickManualActive && window.isJoystickManualActive()) {
        await window.stopJoystickManual();
      }

      // 실시간 실행이 writer를 사용 중이면 먼저 중지하고 락 해제를 기다린다.
      window._runtimeRunning = false;
      for (let i = 0; i < 20 && port.writable.locked; i++) {
        await new Promise(r => setTimeout(r, 100));
      }
      if (port.writable.locked) {
        await window.customAlert('실시간 실행을 완전히 중지하지 못했습니다. 잠시 후 다시 시도하세요.');
        btnSafe.disabled = false;
        return;
      }

      let writer = null;
      try {
        writer = await (window.acquireSerialWriter
          ? window.acquireSerialWriter(port)
          : Promise.resolve(port.writable.getWriter()));
        const enc = new TextEncoder();
        // 브라우저가 기억한 각도는 수동조작·재연결 후 실제 각도와 다를 수 있다.
        // 사전 S 명령을 보내지 않고, 실제 마지막 명령 각도를 가진 펌웨어가
        // 현재 위치에서 보관 자세까지 한 번만 순차 이동하도록 맡긴다.
        const parked = window.waitForBoardResponse(['PARKED', 'ERR'], 30000);
        await writer.write(enc.encode('K\n'));
        writer.releaseLock();
        writer = null;
        const parkedResponse = await parked;
        if (parkedResponse !== 'PARKED') throw new Error(parkedResponse);
        parkedConfirmed = true;

      } catch (e) {
        console.warn('안전 종료 중 오류:', e);
        await window.customAlert('안전 종료 중 오류: ' + e.message);
      } finally {
        try { writer && writer.releaseLock(); } catch (_) {}  // ★ 반드시 락 해제
      }

      if (parkedConfirmed && window.fullCleanup) await window.fullCleanup();
      btnSafe.disabled = false;
    });
  }

  // ===== 연결 상태에 따라 안전 종료 버튼 표시 =====
  setInterval(() => {
    const b = document.getElementById('btnSafeShutdown');
    const connected = !!(window._serialPort && window._serialPort.writable);
    if (b) b.style.display = connected ? '' : 'none';
  }, 500);

}

// 브라우저가 HTML을 모두 읽은 후 안전하게 setupIntroPage를 실행하도록 연결
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupIntroPage);
} else {
  setupIntroPage();
}
