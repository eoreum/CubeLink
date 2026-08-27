# CubeLink Studio Tablet

Android 태블릿을 위한 터치 우선 CubeLink Studio 신규 프로젝트입니다. 기존
`studio/web` 및 `studio/electron`과 독립된 패키지이며 Desktop 소스와 펌웨어를
복사하거나 덮어쓰지 않습니다.

## 기술 선택

- **Vite + TypeScript:** UI를 작고 빠른 웹 모듈로 구성하고 기존 Blockly/웹
  자산을 단계적으로 가져오기 쉽습니다.
- **Capacitor Android:** 웹 UI를 Android 앱으로 감싸되 USB-C OTG/CH340 처리는
  Android 네이티브 플러그인으로 분리할 수 있습니다.
- **Three.js + Desktop GLB:** Desktop Studio의 실물 부품 GLB 5개와 조립 좌표를
  그대로 사용해 웹과 Android에서 같은 로봇팔을 렌더링합니다.
- **Transport 경계:** `src/core/device`의 인터페이스 위쪽에서는 공통 CubeLink
  프로토콜과 안전 상태를 처리하고, 아래쪽만 플랫폼별 USB 구현으로 교체합니다.

현재 프로토타입은 홈, 3단계 연습 미션, 관절 동작 시뮬레이션, 실제 Blockly 코딩,
로봇 연결, 프로젝트 화면과 전체 화면 내비게이션을 제공합니다. Blockly 작업은
IndexedDB에 XML로 자동 저장되며 새로고침 후 복원됩니다. Android USB 연결과 실제
로봇 실행은 아직 포함하지 않습니다.

## 실행

```powershell
cd C:\Users\dscom\Documents\Codex\CubeLink\studio\tablet
npm install
npm run dev
```

터미널에 표시되는 주소를 브라우저에서 엽니다. 프로덕션 웹 빌드는
`npm run build`, 미리보기는 `npm run preview`입니다.

## Android 앱 열기

Capacitor Android 프로젝트는 이미 `android/`에 생성되어 있습니다. Android
Studio와 Android SDK가 준비된 PC에서 웹 빌드 결과를 동기화한 뒤 엽니다.

```powershell
npm run android:sync
npm run android:open
```

다른 플랫폼 체크아웃에서 `android/`를 의도적으로 제외한 경우에만
`npm run android:add`를 사용합니다. 다음 구현에서는 Android 프로젝트에 USB Host
권한, CH340 USB-serial 구현, attach/detach 브로드캐스트 처리를 추가해야 합니다.
해당 기능이 구현되기 전에는 실제 로봇이 연결되는 것으로 표시하지 않습니다.

이 PC의 기본 Java 25는 현재 생성된 Gradle 8.11.1과 호환되지 않습니다. 명령줄에서
디버그 APK를 만들 때는 Android Studio에 포함된 Java를 이번 터미널에 지정합니다.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
cd android
.\gradlew.bat assembleDebug
```

성공한 APK는 `android/app/build/outputs/apk/debug/app-debug.apk`에 생성됩니다.

## 폴더 구조

```text
studio/tablet/
├─ docs/                         설계와 결정 기록
├─ android/                      Capacitor Android Studio 프로젝트
├─ src/
│  ├─ core/device/               Android와 무관한 장치 전송 경계
│  ├─ core/blocks/               Desktop 호환 블록 타입과 빠른 추가 목록
│  ├─ core/storage/              버전이 있는 IndexedDB 프로젝트 저장
│  ├─ features/coding/           Blockly 생성·저장·터치 삽입 생명주기
│  ├─ features/missions/         학생용 미션 콘텐츠와 연습 단계
│  ├─ main.ts                    화면 렌더링과 해시 라우팅
│  ├─ routes.ts                  전체 화면 구조
│  └─ styles.css                 터치/반응형 디자인 시스템
├─ capacitor.config.ts           Android 앱 셸 설정
├─ vite.config.ts                웹 빌드 설정
└─ package.json                  독립 실행·빌드 명령
```

상세 제품·기술 설계는
[`docs/CUBELINK_STUDIO_TABLET_DESIGN_V1.0.md`](docs/CUBELINK_STUDIO_TABLET_DESIGN_V1.0.md)에
기록되어 있습니다.

## 현재 코딩 MVP

- Desktop과 동일한 Blockly 10.4.3 사용
- Desktop 호환 블록 타입: 서보 부드럽게 이동, 서보 각도, 밀리초/초 기다리기,
  반복, 초음파 거리
- 학생용 로봇팔 블록: 관절 즉시 이동, 집게 열기/닫기, 안전 보관 자세,
  거리 대기와 거리 조건
- 핀 번호와 함께 `회전판·아래팔·위팔·집게` 관절 이름 표시
- 큰 빠른 블록 카드 6종을 누르면 `시작하기` 아래의 마지막 블록에 자동 연결
- Blockly의 드래그, 연결, 확대/축소, 휴지통 사용 가능
- 650ms debounce 자동 저장과 수동 `지금 저장`
- XML 형식 IndexedDB 저장 및 앱 재시작/새로고침 복원
- 여러 프로젝트 생성, 목록, 현재 프로젝트 전환

## 현재 미션·시뮬레이션 MVP

- 난이도와 예상 시간이 다른 3개 미션: 로봇팔과 인사하기, 물건 옮기기,
  거리 센서 경비원
- 미션별 목표, 사용할 블록, 단계별 연습 순서 안내
- 선택한 미션을 유지하고 시뮬레이션 또는 Blockly 연습으로 연결
- 미션마다 일반 프로젝트와 분리된 전용 저장 공간과 시작 블록 제공
- 미션에 필요한 빠른 블록만 표시하고, 2회 확인 방식의 `미션 처음부터`로 복원
- 코딩 작업공간 바로 위에서 현재 미션 목표와 성공 순서를 계속 확인
- `◇ 3D로 실행`으로 시작 블록에 연결된 명령만 추출해 실물 3D 모델에서 순차 재생
- 실행 결과를 미션별 조건과 비교해 완료 또는 빠진 단계를 안내하고 진행률 저장
- 펌웨어 v1.4.2 개발기와 같은 관절 안전 범위로 수동 슬라이더 제한
- 범위를 벗어난 관절 블록은 3D 실행 전에 관절명·핀·허용 범위를 표시하고 차단
- 회전판·아래팔·위팔 각도 슬라이더와 집게 열기/닫기
- 5단계 물건 옮기기 자동 시연과 초기 자세 복귀
- 1280×800 가로 화면과 800×1280 세로 화면 반응형 구성

현재 시뮬레이션은 Desktop Studio의 `base/lower/upper/grip01/grip02` GLB와 동일한
조립 좌표·회전축을 사용하는 3D 연습기입니다. 한 손가락으로 시점을 돌리고 두
손가락으로 확대·축소할 수 있습니다. 블록 실행 계획의 순차 애니메이션과 미션
판정은 동작하며, 충돌/가동 범위 및 물리 판정은 후속 구현 범위입니다.

미션 1은 `▶ 시작하기 → 회전판 60°·1초`가 연결된 상태로 시작합니다. 학생이
`기다리기`와 `집게` 블록을 직접 추가해 완성하며, 기존 자유 코딩이나 다른 미션의
블록은 섞이지 않습니다. 미션의 시작 블록은 실수로 삭제되지 않습니다.

현재 3D 실행은 관절 즉시/부드러운 이동, 집게, ms/초 기다리기, 반복, 거리 대기·조건,
보관 자세를 지원합니다. 시작 블록에 연결되지 않은 블록은 실행하지 않고 경고합니다.
미션 1은 회전판 60° → 1초 기다리기 → 집게 열기 → 집게 닫기 순서를 확인하며,
전용 집게 블록과 Desktop 호환 PIN 11 각도 표현을 모두 판정합니다.

시뮬레이션 안전 프로필은 현재 개발 펌웨어와 동일하게 회전판(PIN 6) 10~170°,
아래팔(PIN 9) 30~170°, 위팔(PIN 10) 10~160°를 사용합니다. 보관 블록은
`PIN 6=90, PIN 9=30, PIN 10=160, PIN 11=90` 자세를 표시합니다. 이 값은 실제
기구 끝점 측정이 완료되기 전까지 넓히지 않습니다.

실제 하드웨어 실행은 의도적으로 비활성 상태입니다. 기존 Desktop의 전체 블록 세트,
프로젝트 내보내기/가져오기, 스키마 마이그레이션 시험은 다음 호환성 단계입니다.
