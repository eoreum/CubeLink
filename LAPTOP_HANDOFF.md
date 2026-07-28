# CubeLink 노트북 작업 인수인계

마지막 갱신: 2026-07-28 (Asia/Seoul)

이 문서는 지방에서 노트북으로 CubeLink 작업을 즉시 이어가기 위한
체크리스트다. 대화 내용보다 이 저장소의 문서를 우선한다.

## 1. 현재 기준점

- 공식 저장소: `https://github.com/eoreum/CubeLink.git`
- 인수인계 브랜치: `agent/v344-laptop-handoff`
- 현재 Studio: CubeLink Studio `v3.4.4` 시험판
- 현재 펌웨어: CubeLink Bridge `v1.4.2` 개발 이미지
- 펌웨어 프로필: `PARK_90_30_160_90`
- 실제 펌웨어 소스:
  `firmware/arduino-nano/CubeLinkBridge/CubeLinkBridge.ino`
- Windows 시험 설치 파일:
  `Cubelink_Studio_v3.4.4_TEST.exe`
- 설치 파일 Drive 주소:
  `https://drive.google.com/file/d/1MDFHVSWecuWrD5Cm5KdK7w3-jmBPftvg/view?usp=drivesdk`
- 설치 파일 SHA-256:
  `AE5298243C352140332D8ECF760DB8F254B5335A391D608D8CA244B99F9E3F1D`

`C:\Projects`, `archive`, Arduino 임시 빌드 폴더, HEX 파일, Google Drive의
빈 펌웨어 폴더는 현재 소스가 아니다.

## 2. 노트북에서 가장 먼저 할 일

권장 위치는 `C:\Users\<노트북계정>\Documents\Codex\CubeLink`다.

새로 받는 경우:

```powershell
cd "$HOME\Documents\Codex"
git clone https://github.com/eoreum/CubeLink.git
cd CubeLink
git switch agent/v344-laptop-handoff
git status
```

이미 저장소가 있는 경우:

```powershell
cd "$HOME\Documents\Codex\CubeLink"
git status
git fetch origin
git switch agent/v344-laptop-handoff
git pull --ff-only
```

`git status`에 노트북에서 만든 변경이 표시되면 바로 pull하지 말고 먼저
커밋하거나 별도 폴더에 보관한다. GitHub를 사용할 수 없으면 Drive의
소스 복구 ZIP을 새 폴더에 풀어 사용한다.

## 3. 새 Codex 작업에 보낼 첫 메시지

다음 문장을 그대로 붙여 넣는다.

> 이 폴더는 Eoreum의 공식 CubeLink 프로젝트입니다. 작업을 시작하기
> 전에 AGENTS.md, PROJECT_CONTEXT.md, PROJECT_STATUS.md, CONTINUE_HERE.md,
> LAPTOP_HANDOFF.md, docs/DECISION_LOG.md를 모두 읽고 Git 상태를
> 확인하세요. 기존 변경을 보존하고 기록된 상태에서 이어서 작업하세요.
> 회사명은 Eoreum, 제품명은 CubeLink, 소프트웨어명은 CubeLink Studio로
> 표기하세요. 공개 최신 릴리스는 물리 시험이 끝나기 전 만들지 마세요.

## 4. 노트북 개발 환경

현재 데스크탑에서 확인된 환경:

- Windows
- Git `2.54.0.windows.1`
- Node.js `v24.15.0`
- npm `11.12.1`
- Arduino IDE `2.3.10`
- MiniCore `3.1.2`
- Servo library `1.3.0`

완전히 같은 버전이 아니어도 되지만, 먼저 Git, Node.js, Arduino IDE,
Chrome 또는 Edge, Codex 데스크탑 앱을 설치한다.

Studio 의존성 설치와 실행:

```powershell
cd "$HOME\Documents\Codex\CubeLink\studio\electron"
npm.cmd ci
npm.cmd start
```

Windows 설치 파일 빌드:

```powershell
cd "$HOME\Documents\Codex\CubeLink\studio\electron"
npm.cmd run dist
```

생성 위치:

```text
studio\electron\dist\Cubelink_Studio.exe
```

PowerShell에서 `npm` 실행 정책 오류가 나면 `npm.cmd`를 사용한다.
`node_modules`와 `dist`는 Git에 올리지 않는다.

## 5. 펌웨어 환경과 업로드 기준

Arduino IDE에서 MiniCore `3.1.2`와 Servo `1.3.0`을 준비한다.
현재 컴파일 기준 FQBN은 다음과 같다.

```text
MiniCore:avr:328:bootloader=no_bootloader
```

현재 개발 Nano는 Uno를 ISP 프로그래머로 사용한 이력이 있다.

- 대상 MCU: ATmega328P
- 프로그래머: Arduino as ISP (`stk500v1`, 19200 baud)
- 업로드 방식: 일반 업로드가 아니라 **Upload Using Programmer**
- `-F`로 잘못된 장치 서명을 강제 통과시키지 않는다.
- `FF FF FF` 서명이 나오면 전원, 공통 GND, RESET, MOSI, MISO, SCK,
  Uno의 ArduinoISP 스케치와 10 µF 자동리셋 방지 커패시터를 확인한다.
- 서보 전원과 USB 전원을 끄고 팔을 지지한 상태에서 배선을 바꾼다.

편집할 파일은 하나뿐이다.

```text
firmware\arduino-nano\CubeLinkBridge\CubeLinkBridge.ino
```

## 6. 반드시 보존할 기구·안전 조건

- 9번 허용 각도: `30..170°`
- 10번 허용 각도: `10..160°`
- 11번 그리퍼 보호 범위: 현재 Studio 기준 `50..120°`
- 초기화 순서: 10번을 90°로 이동 → 0.5초 대기 → 9번을 90°로 이동
- 전체 보관 순서: 6번 90° → 11번 90° → 9번 30° → 10번 160°
- 보관 중에는 각 축이 목표에 도달한 뒤 다음 축을 움직인다.
- 단순 전원 연결만으로 서보를 움직이지 않는다.
- Studio 안전 종료는 `K`만 보내고 실제 보관 동작은 펌웨어가 담당한다.
- Studio는 `v1.4.2`와 `PARK_90_30_160_90`이 모두 일치해야 연결을
  허용한다.

## 7. v3.4.4에서 끝낸 수정

- 반복 포트 전환 뒤 Electron/Blockly 입력 포커스 복구
- Electron에서 표시되지 않던 변수 이름 입력창을 앱 내부 창으로 교체
- 변수 실행 시 이름 대신 안정적인 Blockly 변수 ID 사용
- 한글·공백 변수도 유효한 C++ 변수명으로 생성
- 이전 시험 배포본의 미션 작업공간을 한 번 정리해 미션 1이 빈
  `setup/loop`로 시작하도록 수정
- v1.4.2 보관 프로필과 9번·10번 범위를 Studio와 펌웨어에 일치시킴

확인된 내용:

- JavaScript 및 HTML 내장 스크립트 문법 검사 통과
- Windows NSIS 설치 파일 빌드 통과
- 패키지 안에 Windows x64 시리얼 네이티브 모듈 포함
- 격리된 배포 앱에서 미션 1이 빈 상태로 시작
- 앱 내부 변수 이름 입력창 표시 확인
- 개발 앱에서 COM3 및 v1.4.2 프로필 확인 후 실시간 준비 완료 확인

아직 해야 할 내용:

- 최종 v3.4.4 설치본에서 USB 분리·재연결을 여러 번 반복한 뒤 숫자와
  변수 이름 입력이 계속 되는지 물리 시험
- 핀 9의 심한 서보 떨림 원인 분리
- 정확한 실물 각도와 3D 시뮬레이터 각도 비교

## 8. 다음 물리 시험 순서

1. 팔을 손으로 지지하고 서보 전원을 안전하게 연결한다.
2. v3.4.4 시험 설치본을 실행한다.
3. COM 포트를 연결하고 `실시간 준비 완료`를 확인한다.
4. 숫자 필드와 새 변수 이름을 입력한다.
5. USB를 분리하고 다시 꽂아 재연결한다.
6. 4~5번을 최소 5회 반복하며 입력이 막히지 않는지 확인한다.
7. 한 축씩만 움직여 방향, 각도, 리셋, 떨림을 기록한다.
8. 이상이 생기면 안전 종료 후 서보 전원과 USB를 끈다.

## 9. 현재 금지 사항

- 물리 시험 전 GitHub `latest` 릴리스 교체 금지
- 공개 v3.4.4 릴리스 금지
- 잘못된 펌웨어 프로필로 연결 강행 금지
- avrdude `-F` 사용 금지
- 전원이 켜진 상태에서 서보 배선 교체 금지
- `archive` 또는 컴파일된 HEX를 현재 편집 소스로 사용 금지
