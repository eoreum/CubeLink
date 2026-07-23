# CubeLink Laptop Handoff

Last updated: 2026-07-23 (Asia/Seoul)

## Canonical sources

- Git repository: `https://github.com/eoreum/CubeLink.git`
- Official web Studio: `https://eoreum.github.io/CubeLink/`
- Active firmware:
  `firmware/arduino-nano/CubeLinkBridge/CubeLinkBridge.ino`
- Current software version: CubeLink Studio v3.4.3
- Current firmware candidate: CubeLink Bridge v1.4.1

Do not use `C:\Projects` folders or files under `archive/` as current sources.
Do not use the former `tjind.github.io` page for v1.4.1 testing.

## Start on the laptop

Install Git, Arduino IDE, Node.js, and the Codex desktop app as needed. Then:

```powershell
git clone https://github.com/eoreum/CubeLink.git
cd CubeLink
git status
```

If the repository already exists:

```powershell
cd CubeLink
git status
git pull --ff-only
```

Do not pull over uncommitted laptop changes. Commit or preserve them first.

## Start a Codex task

Open the cloned `CubeLink` folder and send:

> 이 대화는 Eoreum의 CubeLink 공식 프로젝트 대화입니다. 작업을 시작하기
> 전에 저장소의 AGENTS.md, PROJECT_CONTEXT.md, PROJECT_STATUS.md,
> CONTINUE_HERE.md, LAPTOP_HANDOFF.md를 모두 읽고 Git 상태를 확인하십시오.
> 기존 변경을 보존하고 기록된 상태에서 이어서 작업하십시오. 항상 존댓말을
> 사용하고 회사명은 Eoreum(이오름), 제품명은 CubeLink, 소프트웨어명은
> CubeLink Studio로 표기하십시오.

The ChatGPT/Codex conversation may synchronize through the same account, but
local source files do not. GitHub is the source of truth between computers.

## Immediate physical test

1. Open `https://eoreum.github.io/CubeLink/` in Chrome.
2. Connect the Nano containing firmware v1.4.1.
3. Confirm CubeLink Studio reports `실시간 준비 완료`, not only `연결됨`.
4. Run one servo axis at a time with the arm supported.
5. Diagnose the severe pin 9 lower-arm MG90S jitter before release.
6. Power off USB and servo power before changing servo plugs.

Do not replace public release v3.4.2 with v3.4.3 until physical hardware
validation passes.
