# CubeLink 노트북 이어가기

최종 갱신: 2026-08-27  
원격 저장소: `https://github.com/eoreum/CubeLink.git`  
인계 브랜치: `agent/v360-desktop-handoff`

## 노트북에서 처음 받을 때

GitHub의 `eoreum/CubeLink` 저장소를 노트북에 복제한 다음
`agent/v360-desktop-handoff` 브랜치를 선택한다. 이미 저장소가 있다면 원격 변경을
가져온 뒤 같은 브랜치로 전환한다.

Codex에서 저장소 폴더를 열고 다음 문장으로 시작한다.

> CubeLink 작업을 노트북에서 이어서 진행해줘. AGENTS.md를 먼저 읽고,
> PROJECT_CONTEXT.md, PROJECT_STATUS.md, CONTINUE_HERE.md,
> LAPTOP_CONTINUATION.md를 확인한 뒤 현재 상태를 보고해줘. 기존 Desktop,
> Tablet, firmware, 이오름 블로그의 범위를 서로 침범하지 말고 이번에 지정하는
> 주제만 진행해줘.

## 작업 주제별 위치

| 주제 | 주요 위치 | 먼저 읽을 기록 |
|---|---|---|
| 기존 CubeLink·Desktop | `studio/web`, `studio/electron` | `PROJECT_STATUS.md`, `CONTINUE_HERE.md` |
| 펌웨어·하드웨어 | `firmware`, `docs`의 하드웨어 기록 | `docs/DECISION_LOG.md`, `docs/PRODUCT_ROADMAP.md` |
| Tablet Studio | `studio/tablet` | `studio/tablet/README.md`, `studio/tablet/docs/CUBELINK_STUDIO_TABLET_DESIGN_V1.0.md` |
| 이오름 블로그 | `docs/blog-drafts`, `docs/EOREUM_*` | `docs/EOREUM_BLOG_EDITORIAL_GUIDE.md` |

## 현재 중요한 원칙

- 기존 CubeLink Studio Desktop과 펌웨어를 Tablet 코드로 덮어쓰지 않는다.
- 실제 하드웨어 검증이 끝나지 않은 버전과 설치 파일을 공개하지 않는다.
- Tablet의 물리 USB 실행 기능은 구현·검증 전까지 활성화하지 않는다.
- 블로그 글은 개인정보와 내부 기술을 제거하고, 최종 승인 전에는 게시하지 않는다.
- 작업을 마칠 때 `PROJECT_STATUS.md`와 `CONTINUE_HERE.md`를 갱신한다.

## 노트북에서 점검할 것

1. 현재 브랜치가 `agent/v360-desktop-handoff`인지 확인한다.
2. 작업 폴더에 미완성 변경이 있다면 덮어쓰지 말고 먼저 상태를 확인한다.
3. Tablet은 `studio/tablet`에서 의존성을 설치한 뒤 빌드한다.
4. Android SDK와 Java 경로는 PC마다 다르므로 노트북 환경에서 다시 확인한다.
5. Arduino·USB·서보 실물 시험은 장치가 연결된 컴퓨터에서만 수행한다.

대화 내용보다 이 저장소의 기록을 최신 기준으로 사용한다. 서로 다른 컴퓨터에서
작업을 번갈아 할 때는 시작 전에 원격 변경을 받고, 종료할 때 검증된 변경과 진행
기록을 함께 올린다.
