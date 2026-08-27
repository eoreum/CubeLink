# CubeLink Current Status

Last updated: 2026-08-26

## Laptop continuation handoff (2026-08-27)

- Added `LAPTOP_CONTINUATION.md` with the repository, handoff branch, per-topic
  paths, safety boundaries, and the exact Codex resume prompt for a notebook.
- The intended cross-device source of truth is the Git branch plus
  `PROJECT_CONTEXT.md`, this file, and `CONTINUE_HERE.md`; chat history alone is
  not relied on for code or verification state.

## Eoreum official-blog governance (2026-08-27)

- Reviewed the public Eoreum blog, the current `아두이노 강좌 ⑤ 거리 경보 장치
  만들기` post, and the historical `robospace` and `tjind13` blogs.
- Added `docs/EOREUM_BLOG_EDITORIAL_GUIDE.md` to preserve the Eoreum visual
  rhythm, calm instructional voice, image treatment, legacy-source attribution,
  fact checking, privacy checks, approval workflow, and CubeLink public/private
  boundary.
- Added the first public-safe draft, `CubeLink 개발일지 ① 블록이 로봇의 움직임이
  되기까지`. It describes only educational goals and user-facing concepts and
  is explicitly marked as requiring user approval before publication.
- Added `docs/EOREUM_BLOG_ARCHIVE_AUDIT.md`, which sorts historical material
  into rewrite, verify, preserve-only, and exclude groups. Old contact details,
  unverified downloads, student-identifying images, and unsafe projects are not
  migration candidates.
- Added `docs/EOREUM_BLOG_12_POST_PLAN.md` and two more review-ready drafts:
  `RoboSpace에서 이오름으로, 기술과 배움이 이어진 시간` and `보고, 조종하고,
  코딩하며 만나는 로봇공학`. The initial package now contains three drafts.
- Added `docs/EOREUM_EXTERNAL_LECTURE_INTAKE.md` so recent school and
  institution classes can be turned into posts from a small set of facts,
  original photos, lesson materials, and explicit privacy/publicity choices.
- The public-copy scan found no protocol commands, authentication internals,
  private paths, account details, phone numbers, or firmware/board parameters in
  the three drafts. The archive audit mentions the already-public v3.6.2 download
  only to mark it as prohibited from migration pending a separate release audit.
- No Naver post was created, edited, hidden, or published. Existing blog content
  and the historical blogs remain unchanged.

## CubeLink Studio Tablet project start (2026-08-26)

### Blockly and local-project MVP

- Added a shared Tablet robot-arm safety profile matching firmware v1.4.2's
  current development limits: PIN 6=10..170, PIN 9=30..170, and
  PIN 10=10..160 degrees. Manual simulation sliders now use those ranges.
- Blockly plans with an out-of-range servo command are rejected before the 3D
  route and identify the joint, pin, requested angle, and allowed range. Live
  review confirmed that a PIN 6 / 0-degree command stayed on the coding page
  with the correct 10..170-degree warning; the saved mission was then restored.
- Corrected the simulated storage command to the shared physical pose
  `P6=90, P9=30, P10=160, P11=90` instead of the former all-90 visual pose.

- Replaced the sample student name with a neutral `학` student-mode badge and
  generic greeting, so the home screen no longer presents a fictional learner
  as real profile data.
- Quick-insert cards now append blocks to the tail of the one `cubelink_start`
  execution chain. Live mission-2 verification kept one top-level chain while
  growing from two to four blocks and produced a three-command 3D plan without
  a disconnected-block warning.
- Added a persistent mission guide above the coding workspace with the active
  mission's title, goal, ordered success steps, and the `3D로 실행` cue. Both
  1280x800 and 800x1280 layouts passed browser review.

- Fixed mission/free-project workspace contamination observed in live review.
  Each mission now owns a separate `missionId` project and first opens with a
  small mission-specific starter template instead of whichever project was
  previously active. Mission 1 starts with one PIN 6 / 60 degree / 1 second
  movement block and exposes only movement, wait, and gripper quick cards.
- Added a guarded `미션 처음부터` action: the first tap arms the reset for 3.5
  seconds and the second restores and saves the mission template. Browser
  verification passed for the starter workspace, guarded reset, reload
  persistence, and the 800x1280 layout. Opening/creating a free
  project now clears mission context, while mission projects restore it.
- Added the `cubelink_start` hat block. All new starter workspaces begin at
  `▶ 시작하기`; mission 1 now opens as `start → PIN 6 / 60° / 1s`. Existing
  saved XML without a start block is migrated by wrapping its first execution
  chain rather than deleting student work. Mission start blocks are protected
  from deletion. Live verification passed for the 2-block starter, growth to 4
  blocks during practice, and guarded reset back to the 2-block starter chain.
- Added end-to-end Blockly-to-3D mission execution. `◇ 3D로 실행` extracts only
  the chain under the single start block, expands supported repeats, warns about
  disconnected/unsupported blocks, stores a transient plan, and routes to the
  real-model simulator. Servo, gripper, millisecond/second wait, distance gate,
  condition body, and storage-pose commands animate sequentially.
- Added Tablet mission validators for all three missions. Mission 1 checks the
  ordered 60-degree base move, one-second wait, gripper open, then close and
  accepts both Tablet gripper actions and Desktop-compatible PIN 11 angles.
  Failure UI lists missing steps; success UI records completion, adds a check to
  the mission card, and updates the home progress to 1/3. Live browser checks
  passed for both failure and success flows, the execution list, 3D final pose,
  preview/plan separation, completion persistence, and the 800x1280 controls.

- Added a student practice flow with three missions (`로봇팔과 인사하기`,
  `물건 옮기기`, `거리 센서 경비원`). Each mission presents its goal,
  required blocks, ordered practice steps, level, and estimated time, then
  enters either simulation or Blockly practice while retaining the selection.
- Replaced the initial 2D trainer with a real 3D robot-arm simulator using exact
  copies of Desktop Studio's five GLB parts (`base`, `lower`, `upper`, `grip01`,
  `grip02`) and the same assembly coordinates and PIN 6/9/10/11 rotation rules.
  Source and Tablet model SHA-256 hashes match. Three.js is lazy-loaded only on
  the simulation route.
- The 3D simulator provides base/lower/upper joint sliders, gripper open/close,
  reset, a five-pose object-moving demo, touch orbit/zoom, and camera reset.
  Browser checks passed for mission switching, mission-to-simulation routing,
  direct joint/gripper control, automatic pose progression, and both 1280x800
  and 800x1280 responsive layouts.
- The simulator teaches motion sequencing with the real visual model, animates
  Blockly execution plans, and enforces the confirmed software angle limits.
  Geometry collision detection and physics remain future work.

- Fixed the Blockly visibility defect found during live user review: the app's
  global 24 px SVG icon rule had also collapsed Blockly workspace/flyout SVGs.
  The rule is now limited to app icons. The workspace renders at 773x590 in the
  1280x800 review and the movement flyout renders at full height with five
  visible blocks.
- Expanded the classroom block set with named joints (`회전판`, `아래팔`,
  `위팔`, `집게`), direct and smooth joint movement, gripper open/close, safe
  storage pose, millisecond/second waits, repeat, ultrasonic distance wait, and
  a distance condition. Six large quick-insert cards are visible.
- New projects now start with a connected four-block robot-arm example rather
  than an empty or two-block test workspace.
- Added Blockly 10.4.3 to match the existing Desktop runtime while keeping all
  Tablet implementation inside `studio/tablet`.
- Implemented a real Zelos Blockly workspace with large quick-insert touch
  cards, drag/connect/zoom/trash behavior, and a starter program.
- Added core Desktop-compatible block type names for smooth servo movement,
  servo angle, delay, repeat, and ultrasonic distance. The full Desktop block
  catalog is not yet shared or exposed.
- Added versioned XML project records backed by IndexedDB, 650 ms debounced
  autosave, manual save status, reload recovery, multi-project creation/listing,
  and current-project switching.
- Browser verification passed for quick insertion (2 to 3 blocks), IndexedDB
  reload persistence (3 blocks restored), new-project creation (1 to 2
  projects), and the 800x1280 touch layout. No browser errors or warnings were
  reported. The production build now lazy-loads the 673 kB Blockly chunk so the
  initial app bundle remains about 16 kB before compression.
- Physical execution remains disabled. Next is full block/project interchange
  compatibility, followed by Android USB Host/CH340 transport and safety-state
  integration.

- Started `studio/tablet` as a separate Android tablet package without changing
  the existing Desktop source under `studio/web` or `studio/electron`, and
  without changing `firmware/`.
- Added `CubeLink Studio Tablet 설계서 V1.0`, covering product scope, touch-first
  UX, student/teacher modes, responsive layouts, Android USB-C OTG/CH340
  strategy, discovery/reconnection, Blockly touch UX, project storage, shared
  protocol/firmware boundaries, V1 scope, and implementation priorities.
- Selected Vite + TypeScript inside a Capacitor Android shell so platform-neutral
  Blockly, protocol, and storage code can be shared while Android USB Host access
  remains behind a native transport boundary.
- Implemented a responsive home screen, coding placeholder, honest robot-
  connection state, all seven route shells, desktop-width side navigation,
  tablet/narrow-width bottom navigation, and a more-menu sheet.
- Verified production web build and Capacitor Android sync. A native Gradle
  `assembleDebug` build completed successfully using Android Studio's bundled
  Java runtime. Browser checks passed at 1280x800 and 800x1280, including
  home/coding/connection transitions and responsive navigation; no browser
  warnings or errors were reported.
- Actual Blockly editing, local persistence, Android USB permissions/CH340 I/O,
  firmware verification, safety initialization, and reconnection are not yet
  implemented. P1 is Blockly editing/storage; P2 is physical Android USB.

## Current-protection prototype (2026-08-02)

- Added candidate firmware v1.5.0 support for two R100 INA3221 boards and four
  independent servo-current channels (`0x40`: pins 6/9/10, `0x41`: pin 11).
- Added sustained-current fault detection, affected-servo detach, monitored
  execution ids, guarded rollback commands, recovery qualification, sensor-loss
  shutdown, and full detach emergency fallback. No board was flashed.
- Added Studio v3.7.0 source handling for the `CUR4` capability gate, async
  current faults, failing Blockly block selection, actual-runtime reverse
  rollback, and student-facing fault/recovery messages.
- Completing mission 9 now saves that mission and automatically opens the
  independent free-coding workspace, restoring its prior saved work if present.
- Added `docs/CURRENT_PROTECTION_2026-08-02.md` with wiring, protocol, provisional
  thresholds, and the mandatory physical calibration plan.
- The first firmware compile for
  `MiniCore:avr:328:bootloader=no_bootloader` used 15,990 bytes flash (48%) and
  685 bytes SRAM (33%).
- Built an unshipped Studio v3.7.0 candidate installer at
  `studio/electron/dist-v3.7.0-current-protection/Cubelink_Studio.exe` (104,060,737
  bytes, SHA-256 `728D7463D9AC011FE415364DB537F758F1F3C6FADC630F92F72CF9488B71D871`).
  Packaged resources contain the v1.5.0/`CUR4` gate. It is not released or
  approved for classroom installation before physical sensor tests.
- The compiled firmware HEX remains a local build artifact at
  `.build-cache/current-protection/CubeLinkBridge.ino.hex` (44,993 bytes,
  SHA-256 `66BB8BEAD1C50688B6D41DCAC6AF20479431A3AE8DD11C7B362D674801499346`).
- Physical INA3221 and obstruction testing is pending. The provisional 900mA
  MG90S and 650mA SG90 thresholds are not approved classroom values.

## Installer driver-detection fix (2026-07-30)

- CubeLink Studio v3.6.1 no longer attempts CH340/CH341 registration on every
  installation. The NSIS installer queries connected Windows PnP problem
  devices and runs the bundled driver installer only when one of the supported
  WCH VID/PID values is present.
- Healthy CH340/CH341 COM ports and computers with no connected WCH serial
  device skip driver installation. Detection failure also fails closed instead
  of modifying the driver store blindly.
- The installer now resolves native `pnputil.exe` through `Sysnative` with a
  `SysDir` fallback, fixing the former 32-bit NSIS/SysWOW64 path failure.
- The v3.6.1 installer built successfully at
  `studio/electron/dist-v3.6.1/Cubelink_Studio.exe`, size 104,058,718 bytes,
  SHA-256
  `5C68E850987608BA9F1B2DE454D4B73E12194A9FD28579D99F97F34264D07284`.
  Packaged web resources match source and the required INF, CAT, SYS, and DLL
  driver files are present. The new installer has not been run or physically
  tested.
- This installer-only change does not modify or upload firmware.

## Desktop handoff verification (2026-07-30)

- Imported the v3.6.0 Studio, Windows installer, driver, and regression-test
  changes from the desktop handoff archive on branch
  `agent/v360-desktop-handoff`.
- Preserved `firmware/` without modification. The active firmware source
  SHA-256 remained
  `1DF7E74372B7E3471A4633AD9E1931125A29376E47249BCDF6C8EF7C72322E19`.
- Restored Electron dependencies from `package-lock.json`, rebuilt the
  v3.6.0 assisted NSIS installer, verified packaged web resources and the
  bundled CH340/CH341 driver, and passed a packaged-app launch smoke test.
- The local desktop validation installer is
  `studio/electron/dist/Cubelink_Studio.exe`, SHA-256
  `7953BBD42673730A046FBF6380B75B7665C6B8486F5B186E664D443CD3A7B576`.
  It is unsigned and is not the exact student-final binary recorded in the
  handoff.
- The handoff's exact `CubeLink_Studio_v3.6.0_Student_Final.exe` binary was
  not present in the downloaded ZIP, elsewhere on this PC, or in the
  accessible Drive handoff folder. Its recorded SHA-256 therefore remains
  unverified on this desktop.
- No serial port was connected during the desktop check. CH341SER driver
  version `4.0.2026.2` is already registered in Windows, but COM connection,
  initialization, live block execution, and safe shutdown still require the
  physical teacher-PC/robot test before release.
- Detailed evidence is recorded in `DESKTOP_RESUME_LOG_2026-07-30.md`.

## Durable planning records (2026-07-23)

- Added `docs/DECISION_LOG.md` so power, connectivity, platform, security, and
  product decisions survive new Codex tasks.
- Added `docs/PRODUCT_ROADMAP.md` covering robot-arm stabilization, the CubeLink
  Core board, car, omni-wheel, smart-factory, and optional AI phases.
- Confirmed the user's primary product goals: minimal visible power/data
  connections, dependable Windows port behavior, and expansion to cars and
  omni-wheel robots.
- Added workspace routing guidance at `C:\Users\dscom\Documents\Codex\AGENTS.md`
  so CubeLink tasks started in generated date folders are directed to the
  canonical repository instead of being reported as missing.

## Completed

- Rewrote `LAPTOP_HANDOFF.md` on 2026-07-28 as the complete laptop continuation
  checklist, including environment versions, clone/build commands, Uno-as-ISP
  firmware setup, safety geometry, the next physical test, and a clean Korean
  prompt for starting a new Codex task.
- Recompiled the current v1.4.2 firmware with
  `MiniCore:avr:328:bootloader=no_bootloader` on 2026-07-28: 11,164 bytes of
  flash (34%) and 410 bytes of RAM (20%).
- Built and Drive-uploaded the local CubeLink Studio v3.4.4 test installer on
  2026-07-28. It fixes the missing Electron variable-name prompt, uses stable
  variable IDs at runtime, generates safe C++ variable names, restores
  Electron/Blockly keyboard focus after serial transitions, and performs a
  one-time removal of legacy mission workspace data so experimental Mission 1
  blocks do not appear in the new distribution. An isolated packaged-app smoke
  test confirmed a clean Mission 1 and the new variable prompt. SHA-256:
  `AE5298243C352140332D8ECF760DB8F254B5335A391D608D8CA244B99F9E3F1D`.
  Drive file ID: `1MDFHVSWecuWrD5Cm5KdK7w3-jmBPftvg`.
  This remains an unsigned test build, not the public latest release.
- Rebuilt the local CubeLink Studio v3.4.3 assisted installer on 2026-07-28
  with firmware pose profile `PARK_90_30_160_90`, pin 9 limits 30..170,
  pin 10 limits 10..160, and corrected mismatch guidance. The installer passed
  packaged-resource inspection and launch verification. SHA-256:
  `3F122CAFD88BEDA37FA0D24480A53B452EDACA9215112ABB3C2ECC2A8C9E3E5D`.
  It remains an unsigned, physically unverified test build and is not the
  public latest release.
- Official repository created under `eoreum/CubeLink`.
- Published CubeLink Studio v3.4.3 from the `gh-pages` branch at
  `https://eoreum.github.io/CubeLink/`.
- Confirmed the published page contains the v1.4.0/v1.4.1 safety handshake and
  loads without browser errors. The former `tjind.github.io` deployment is now
  legacy and must not be used for v1.4.1 hardware tests.
- Latest known web, Electron, and Arduino firmware sources integrated.
- Company/product metadata updated to Eoreum and CubeLink Studio.
- Web download target updated to `https://github.com/eoreum/CubeLink/releases/latest/download/Cubelink_Studio.exe`.
- Browser Web Serial, Electron, and Capacitor Android behavior kept separate.
- Electron packaged-resource paths corrected.
- Electron serial open, close, reconnect, and write-error handling improved.
- Active source tree cleaned of tracked backup/broken files.
- Application version updated to `3.4.4`.
- Static JavaScript syntax checks passed.
- Electron directory packaging succeeded with web resources and native serial bindings.
- A fresh assisted Windows installer was built locally at
  `studio/electron/dist/Cubelink_Studio.exe`; the packaged web files match the
  source and the Windows x64 native serial binding is present.
- The unpacked v3.4.4 application reached COM3 real-time ready with the
  v1.4.2 pose-profile handshake. Repeated reconnect plus field-entry testing of
  the final v3.4.4 package still needs a deliberate physical test.
- Audited the canonical repository, historical `C:\Projects` sources, full
  backup, and Google Drive CubeLink technical-assets folder.
- Confirmed the current firmware source is populated (22,627 bytes) and valid
  UTF-8; the similarly named Google Drive firmware folder is empty.
- Preserved historical firmware sources under `archive/firmware/` and moved two
  unreferenced web images to `archive/unused-web-assets/`.
- Replaced placeholder-only folder README files with explicit purpose and status.
- Added `PROJECT_FILE_AUDIT.md` as the canonical source inventory.

## Git and build state

- Laptop handoff target: push the complete 2026-07-23 integration state to
  `origin/main`, then clone or pull `https://github.com/eoreum/CubeLink.git`.
- Web deployment branch: `gh-pages` commit `0504c8e`.
- Latest integration commit: `92db64a Integrate current CubeLink Studio and firmware`
- Existing public release before the integration: `v3.4.2`
- Verified unpacked executable: `studio/electron/dist/win-unpacked/CubeLink Studio.exe`
- Verified assisted installer: `studio/electron/dist/Cubelink_Studio.exe`
  (local validation candidate only; it is not code-signed, published, or
  physically tested with the current firmware).
- Automatic launch inside Codex caused GPU/cache permission failures; manual user launch worked.

## Not yet verified

- Arduino Nano was detected on COM3 and connected with the local v3.4.4 Studio.
- Serial reconnection after USB unplug/replug passed.
- All servo directions and real-time control passed, but severe jitter was observed, especially on pin 9 (lower-arm MG90S). Release remains blocked pending diagnosis.
- Both joystick inputs passed.
- Ultrasonic sensor input passed.
- Physical arm and 3D simulator directions matched; precise angle agreement remains unverified because of servo jitter.
- GitHub Pages web intro/download flow
- Android behavior
- USB-only power stability under realistic servo loads

## Studio serial connection work in progress (2026-07-21)

- The 2026-07-24 offline reliability pass serializes native connect/disconnect
  transitions, verifies the selected COM path immediately before opening it,
  and adds bounded open, close, write, and drain handling. A failed native
  write now closes the broken connection instead of leaving a false-open port.
- Studio now treats periodic `P/PONG` as a two-way health check after
  initialization. If the COM handle remains open but valid firmware replies
  stop for 4.5 seconds while idle, Studio closes the stale connection and
  reports `펌웨어 응답 중단`. The watchdog is deliberately paused while block
  runtime or safety motion owns the serial writer.
- Electron Web Serial wrappers now remove their native status listener when
  closed or disconnected, preventing stale wrappers from accumulating across
  repeated reconnects.

- Web UI now separates port-open, firmware-verification, safety-initialization,
  ready, lost, and failed states instead of calling an open port "connected".
- A visible USB/port status badge was added beside the connection button.
  Browser Web Serial shows VID/PID; the Electron bridge can expose the COM path.
- The physical real-time button is enabled only after CubeLink verification and
  `INIT_OK`, not merely when a writable serial stream exists.
- `PONG,CUBELINK,...` can recover the handshake if the one-time boot `READY`
  line was missed. An eight-second firmware-response timeout now reports the
  difference between an open port and an unresponsive CubeLink.
- Clicking physical real-time execution now selects physical mode explicitly;
  it no longer silently changes to digital-twin output after twin unlock.
- Electron serial write results now reject failed IPC writes instead of letting
  the browser stream treat `{ok:false}` as a successful write.
- The Windows app now lists actual COM ports. When more than one port exists,
  it shows an explicit COM/manufacturer/VID/PID chooser instead of silently
  opening the first or first CH340 device. The selected COM path is retained in
  the visible connection badge.
- Native serial opening now attaches handlers before explicitly opening the
  COM port, and writes wait for the OS transmit buffer to drain before reporting
  success. Electron main-process auto-reopen was removed so it cannot compete
  with the renderer connection state machine.
- Electron packaging is now configured for an assisted NSIS installer rather
  than a portable executable. Installer creation still requires a successful
  clean package build and physical connection test.
- Static syntax checks pass. Browser visual testing and physical USB/servo
  testing remain required; the unpacked executable and public release were not
  rebuilt or published.

## Firmware safety work in progress

- Firmware v1.4.2 candidate fixes four pre-test findings: Studio handshake
  commands lock out standalone arming until reboot; 30-second standalone
  inactivity now parks and detaches all servos; Studio initialization attaches
  and moves one axis before energizing the next; and software limits are
  conservatively restricted to base 10..170, lower 30..170, and upper
  10..160 degrees pending physical end-stop measurement.
- The current confirmed joint limits are pin 9=30..170 degrees and
  pin 10=10..160 degrees. The matching storage pose is pin 6=90, pin 9=30,
  pin 10=160, pin 11=90.
- During Studio safety initialization, pin 10 must reach 90 degrees first.
  Firmware then waits 500 ms before moving pin 9 to 90 degrees; this order is
  mechanically significant. Power-on alone still leaves every servo disabled.
- During full parking, the mechanically significant sequence is pin 6 to
  90 degrees, pin 11 to 90 degrees, pin 9 to 30 degrees, and finally pin 10
  to 160 degrees. Each axis reaches its target before the next axis moves.
- CubeLink Studio now requires v1.4.2 plus the exact
  `PARK_90_30_160_90` pose profile. This rejects v1.4.0/v1.4.1 and older
  v1.4.2 binaries that still park pin 10 at 10 degrees.
  After strict serial parsing was added, v1.4.2 compiles for the classic Nano
  old-bootloader target using 11,256 bytes of flash (36%) and 394 bytes of RAM
  (19%). Oversized lines are discarded through the delimiter, command formats
  are exact, and unsupported motion/output targets return errors. It is not
  uploaded, physically tested, or deployed to the public web page.
- Added a hidden Studio-mediated joystick manual mode with no visible button.
  Enter `조이스틱수동` or `joystickmanual` in the serial command field to
  activate it after `실시간 준비 완료`; enter `조이스틱종료` or `joystickoff`
  to stop it. Studio captures neutral centers, selects one dominant axis per
  stick, moves at 1 degree per 50 ms, applies calibration offsets and v1.4.2
  limits, and automatically exits for block execution, safe shutdown, or lost
  safety/serial state. This path is not physically validated or publicly
  deployed.
- Fixed the hidden `twin` command flow: clicking the resulting digital-twin run
  button no longer forces the mode back to real-only, and entering `twin` again
  reactivates twin mode if it was changed elsewhere. The fix is local only and
  is not yet publicly deployed or physically validated.
- Fixed two physical-test findings: real-time execution now locks the center
  Blockly workspace, and Studio safe shutdown sends only firmware command `K`
  instead of first duplicating the physical parking movement with `S` commands.
  Firmware is now the single owner of the physical parking sequence.
- Changed the EEPROM safety magic after the pin 10 storage geometry change.
  Old `safelyParked` records are invalidated on first boot, so the updated
  firmware requires physical storage-pose confirmation instead of trusting a
  former pin 10=10-degree record.
- Firmware v1.4.1 now stages one shared image for both products: CubeLink Studio
  control remains available, while a power-only boot can enter standalone
  joystick control after neutral calibration and the deliberate two-stick
  arming gesture.
- After an interrupted standalone session, both joystick buttons held for two
  seconds confirm that the unpowered arm was physically returned to its storage
  pose. In standalone mode, the same two-button hold parks one axis at a time
  and detaches all servos for a clean power-off.
- CubeLink Studio accepts both staged safety protocol versions v1.4.0 and
  v1.4.1. The new v1.4.1 path is not physically validated yet.
- Standalone joystick control now selects only the dominant X or Y axis for
  each stick. A 35-count switching margin retains the previous axis near the
  45-degree boundary so one diagonal stick movement cannot command two servos
  and does not rapidly alternate axes.
- The installed joystick orientation is recorded as raw X=0 pointing toward
  physical up. Standalone arming now restores the measured v1.3.1 conditions
  from commit `92db64a`: left raw X high/Y low plus right raw X high/Y high,
  held for two seconds. This is the earlier implementation reported to have
  worked on the physical controller. Neutral calibration, parked-state
  confirmation, return-to-neutral, and Studio-session lockout remain required.
  The restored source compiled successfully on 2026-07-30 with MiniCore 3.1.2
  (`bootloader=no_bootloader`), using 11,164 bytes of flash and 410 bytes of
  RAM. It is not uploaded or physically revalidated yet.

- Firmware v1.4.0 never energizes servos automatically during boot.
- EEPROM stores only whether the defined storage pose was completed safely; it does not assume the last commanded angle equals the physical angle.
- After an interrupted session, firmware reports `RECOVERY_REQUIRED` and rejects servo commands until the user confirms the physical storage pose.
- Safe initialization and parking move one axis at a time; loaded pin 9 and pin 10 axes use slower steps.
- CubeLink Studio now handles `SAFE`, `RECOVERY_REQUIRED`, `R`, `I`, `K`, `INIT_OK`, and `PARKED`, blocks real-time execution before initialization, and closes the connection only after parking confirmation.
- Firmware v1.4.0 and the updated Studio have not been flashed/physically validated yet. Keep the robot powered off until a controlled upload/test procedure is ready.
- Genuine-device authentication, password management, per-device keys, and production lock provisioning are explicitly deferred to a later phase.
