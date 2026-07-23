# CubeLink 저장소 구조

```text
CubeLink/
├── AI/          AI 작업 맥락과 프로젝트 상태
├── assets/      공용 이미지와 자산
├── docs/        프로젝트 문서
├── firmware/    CubeLink 하드웨어 펌웨어
├── hardware/    회로, 기구 및 하드웨어 자료
├── release/     배포 관련 자료
├── studio/      CubeLink Studio 소스
│   ├── electron/ Electron 메인 프로세스와 패키지 설정
│   └── web/      웹 UI, 인트로 화면, 스크립트와 3D 자산
└── test/        테스트 자료
```

## CubeLink Studio

- `studio/electron/main.js`: Electron 메인 프로세스
- `studio/electron/preload.js`: Electron과 웹 화면 사이의 안전한 연결 계층
- `studio/electron/package.json`: Electron 패키지 및 실행·빌드 설정
- `studio/web/index.html`: 웹 앱과 인트로 화면의 기본 문서
- `studio/web/js/`: 앱 동작, 블록, 모바일 UI 및 3D 시뮬레이터 코드
- `studio/web/css/`: 화면 스타일
- `studio/web/models/`: 3D 모델 파일

## 배포 방향

웹 인트로 화면의 기존 다운로드 사용자 흐름은 유지한다. Windows 실행 파일은 GitHub Releases에 게시하고, 인트로 화면의 다운로드 기능은 최신 릴리스 또는 최신 실행 파일을 가리키도록 이전한다.

