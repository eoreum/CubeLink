# CubeLink Desktop Resume Log — 2026-07-30

## Scope and safeguards

- Canonical repository:
  `C:\Users\dscom\Documents\Codex\CubeLink`
- Handoff archive:
  `C:\Users\dscom\Downloads\CubeLink_Source_Handoff_2026-07-30.zip`
- Extracted handoff source:
  `C:\Users\dscom\Downloads\CubeLink_Source_Handoff_2026-07-30\CubeLink-main`
- Read `AGENTS.md`, `DESKTOP_HANDOFF_2026-07-30.md`,
  `PROJECT_CONTEXT.md`, `PROJECT_STATUS.md`, `CONTINUE_HERE.md`,
  `docs/DECISION_LOG.md`, and `docs/PRODUCT_ROADMAP.md` before changing
  project files.
- Firmware was treated as read-only. No firmware file was copied, edited,
  compiled, uploaded, or flashed.

## Git state

- Initial checked-out branch:
  `agent/v344-laptop-handoff`
- Initial working tree: clean
- Initial HEAD:
  `446315c Prepare CubeLink v3.4.4 laptop handoff`
- After a successful remote fetch:
  - `origin/main`: `00ac421 Add support for safety version v1.4.2`
  - `origin/agent/v344-laptop-handoff`: `446315c`
  - `origin/gh-pages`: `dc52586`
- The original local branch had eight commits not in `origin/main`;
  `origin/main` had one commit not in the local branch.
- Desktop integration branch created:
  `agent/v360-desktop-handoff`
- No push, release publication, or public download-link update was performed.

## Source comparison and integration

The archive contains CubeLink Studio v3.6.0 while the canonical branch started
at v3.4.4. The meaningful Studio changes include:

- Electron package version 3.6.0
- In-app Blockly variable creation and safe variable identifiers
- USB reconnection recovery changes
- Safe shutdown using only firmware command `K`
- Digital-twin direction/rendering changes
- Removal of Studio joystick manual-mode UI and periodic transmission
- First-run workspace reset and free-coding workspace
- CH340/CH341 driver packaging and NSIS installer integration
- Two regression tests for recovery/manual-mode removal and safe shutdown

The archive's older, shortened copies of durable status/audit documents were
not allowed to replace the more complete canonical records. The v3.6.0 handoff
and this log were added instead.

## Firmware read-only evidence

Active firmware source:
`firmware/arduino-nano/CubeLinkBridge/CubeLinkBridge.ino`

- SHA-256 before integration:
  `1DF7E74372B7E3471A4633AD9E1931125A29376E47249BCDF6C8EF7C72322E19`
- SHA-256 after integration:
  `1DF7E74372B7E3471A4633AD9E1931125A29376E47249BCDF6C8EF7C72322E19`
- Git status under `firmware/`: clean

## Installation and executable inventory

No CubeLink entry was found in the Windows uninstall registry and no installed
CubeLink executable was found under the standard per-user or system program
locations.

Existing local artifacts before rebuilding:

- v3.4.4 assisted installer:
  `studio/electron/dist/Cubelink_Studio.exe`
  - SHA-256:
    `AE5298243C352140332D8ECF760DB8F254B5335A391D608D8CA244B99F9E3F1D`
- v3.4.4 unpacked app:
  `studio/electron/dist/win-unpacked/CubeLink Studio.exe`
- Older downloads:
  - `C:\Users\dscom\Downloads\CubeLink Studio.exe` — v3.4.3
  - `C:\Users\dscom\Downloads\Cubelink_Studio.exe` — v1.0.0
  - `C:\Users\dscom\Downloads\Cubelink_Studio (1).exe` — v1.0.0

The exact handoff binary
`CubeLink_Studio_v3.6.0_Student_Final.exe` was absent from:

- the extracted source folder,
- the original ZIP contents,
- the local user profile search, and
- the accessible Google Drive handoff folder.

The recorded final-binary facts from the handoff remain:

- expected size: 103,742,224 bytes
- expected SHA-256:
  `F71E17615F8BA276026CF4E9CEE61EF373BB0D9072A76AF5FA2EC587941183BD`

Those values were not independently verified because the binary was missing.

## Build and verification

Environment:

- Node.js: v24.15.0
- Electron: 43.1.0
- electron-builder: 26.15.3
- Python: Codex bundled runtime, used only for native dependency rebuild

Checks completed:

- JavaScript syntax checks passed for:
  - `studio/web/js/app.js`
  - `studio/web/js/blocks.js`
  - `studio/web/js/simulator3D.js`
  - `studio/electron/main.js`
  - `studio/electron/preload.js`
- Handoff regression tests: 2 passed, 0 failed
- Electron dependencies restored from `package-lock.json`
- v3.6.0 Windows x64 packaging completed
- Packaged `index.html`, `app.js`, `blocks.js`, and `simulator3D.js` hashes
  match the source files
- Required CH340/CH341 INF, CAT, and SYS files are present in the package
- Driver INF reports `02/11/2026, 4.0.2026.02` and includes
  `VID_1A86 / PID_7523`
- Packaged driver CAT and SYS signatures are valid Microsoft Windows Hardware
  Compatibility Publisher signatures
- CubeLink application and installer are not code-signed
- The unpacked v3.6.0 app started, remained responsive for the smoke-test
  interval, and was then closed

New local desktop validation artifacts:

- Installer:
  `studio/electron/dist/Cubelink_Studio.exe`
  - size: 104,058,243 bytes
  - file/product version: 3.6.0
  - SHA-256:
    `7953BBD42673730A046FBF6380B75B7665C6B8486F5B186E664D443CD3A7B576`
- Unpacked app:
  `studio/electron/dist/win-unpacked/CubeLink Studio.exe`
  - file version: 3.6.0
  - SHA-256:
    `A36B0C228435A2531040B70BDF586985260C984192959AA59C9F05066DDA2E2C`

The rebuilt installer differs from the recorded student-final size and hash.
It is a desktop validation candidate, not a replacement for the recorded final
binary or an approved public release.

Dependency restoration reported 18 npm audit findings: 1 moderate and 17 high.
No automatic audit fix was applied because a forced dependency rewrite could
change Electron/packaging behavior and was outside this handoff verification.

## Installer v3.6.1 driver-detection correction

The v3.6.0 installer attempted bundled CH340/CH341 registration unconditionally.
On the existing development PC this was unnecessary and the 32-bit NSIS process
also resolved `$SYSDIR\pnputil.exe` through SysWOW64, where `pnputil.exe` was
absent.

Version 3.6.1 now queries native Windows `pnputil.exe` for connected PnP problem
devices and installs the bundled driver only if the output contains a supported
WCH hardware ID from the packaged INF. Healthy CH340/CH341 COM ports, computers
with no connected WCH device, and failed detection all skip automatic driver
registration.

Validation completed:

- Conditional-driver regression test passed.
- Existing firmware and Studio safety regression tests passed.
- NSIS x64 packaging completed.
- Packaged web resource hashes match source.
- Bundled INF, CAT, SYS, and DLL files are present.
- Installer file/product version: 3.6.1.
- Installer size: 104,058,718 bytes.
- Installer SHA-256:
  `5C68E850987608BA9F1B2DE454D4B73E12194A9FD28579D99F97F34264D07284`.
- New installer path:
  `studio/electron/dist-v3.6.1/Cubelink_Studio.exe`.

The v3.6.1 installer was not launched, installed, or physically tested during
this correction. Firmware was not uploaded or flashed.

## Hardware and remaining work

- Windows already has `CH341SER.INF` registered as `oem2.inf`, version
  `4.0.2026.2`.
- No COM port or present Ports-class device was detected during this check.
- Consequently, these items remain unverified on this desktop:
  - installer-driven CH340 registration on a clean teacher PC,
  - CubeLink COM selection and connection,
  - safety initialization,
  - block field editing on the installed build,
  - variable creation and live execution against the robot,
  - USB unplug/replug recovery against the robot,
  - single-`K` safe shutdown behavior with physical motion,
  - servo power/jitter and physical/digital-twin direction agreement.
- Do not publish a new latest GitHub release or change the public download link
  until the physical teacher-PC/robot test passes.
