# CubeLink Current Status

Last updated: 2026-10-28

## CubeLink Studio 4.1.8 laptop DPI correction (2026-10-28)

- Corrected the unified app's 1120 x 720 minimum-window conflict with 1366 x
  768 laptops at Windows 125% and 150% scaling.
- Launcher, Robot Arm, and Conveyor now use compact low-height layouts; Robot
  and Conveyor header controls and primary panels remain within the viewport.
- Actual Electron checks pass at 1093 x 614 and 911 x 512. Repository tests
  pass 53/53, unified tests 7/7, and Conveyor tests 17/17.
- Built the unsigned v4.1.8 Portable candidate. Packaged resources match source
  with zero differences. See `docs/STUDIO_4_1_8_LAPTOP_DPI_2026-10-28.md`.

## Conveyor firmware v1.2.0 standalone auto-run (2026-10-27)

- Added a power-only standalone mode: after a two-second startup grace period,
  an ultrasonic reading below 5 cm runs the conveyor forward at 60% for three
  seconds, then stops.
- Added 8 cm rearm hysteresis so one stationary object cannot continuously
  retrigger the motor. Timing is non-blocking.
- The first recognized Studio handshake or control command immediately stops
  standalone motion and latches Studio-only control until reboot.
- Conveyor tests pass 17/17. Arduino Nano Old Bootloader compilation passes at
  6,390 bytes flash and 394 bytes SRAM. Physical unloaded hardware testing is
  still required. See
  `docs/CONVEYOR_FIRMWARE_V1_2_STANDALONE_2026-10-27.md`.

## CubeLink Studio 4.1.7 Robot factory blocks (2026-10-27)

- Added a Robot Arm `연동·안전` Blockly category with complementary product
  arrival wait, robot working, and robot done blocks.
- Simulation produces learning logs; real/twin execution uses the existing
  `OBJECT_ARRIVED`, `ROBOT_WORKING`, and `ROBOT_DONE` same-group network flow.
  Existing automatic completion remains as a fallback.
- Repository tests pass 52/52, unified tests 6/6, and Conveyor tests 16/16.
  Actual Electron smoke and packaged Robot resource comparison pass.
- Built unsigned v4.1.7 Setup and Portable candidates. Physical two-PC hardware
  validation remains required. See
  `docs/STUDIO_4_1_7_ROBOT_FACTORY_BLOCKS_2026-10-27.md`.

## CubeLink Studio 4.1.6 Conveyor mission hints (2026-10-27)

- Added a collapsible `💡 힌트` button beside the Conveyor mission title. Each
  of the nine missions has a specific block-order hint, hidden until requested.
- Changing missions collapses the hint, and Free Create hides it. Actual
  Electron smoke confirmed adjacency, click/expand state, and hint content.
- Repository tests pass 52/52, unified tests 6/6, and Conveyor tests 16/16.
  Packaged Conveyor resources have zero mismatches.
- Built unsigned v4.1.6 Setup and Portable candidates. See
  `docs/STUDIO_4_1_6_CONVEYOR_MISSION_HINTS_2026-10-27.md`.

## CubeLink Studio 4.1.5 common block language (2026-10-27)

- Aligned Conveyor's first two categories with Robot Arm: `기본 구조` first
  with the same setup/loop main block and wait, then `흐름 제어` with repeat,
  forever, and condition blocks. Device categories follow afterward.
- Existing saved Conveyor start programs upgrade into the new setup container;
  clear/free workspaces retain an empty setup/loop root. Both old and current
  Blockly XML parser APIs are supported.
- Actual Electron smoke passed, including menu order, block definition, and a
  legacy-to-setup conversion. Repository tests pass 52/52, unified 6/6, and
  Conveyor 15/15; packaged Conveyor resources have zero mismatches.
- Built unsigned v4.1.5 Setup and Portable candidates. See
  `docs/STUDIO_4_1_5_COMMON_BLOCK_LANGUAGE_2026-10-27.md`.

## CubeLink Studio 4.1.4 Conveyor block-menu correction (2026-10-27)

- Corrected the Conveyor Blockly toolbox's low-contrast white-on-light menu.
  It now uses a 168 px dark category panel, stronger labels, a gold selected
  state, and recognizable Event/Conveyor/Sensor/Flow icons.
- Actual Electron computed styles confirm the width, dark background, bright
  label color, and all four category names. Existing blocks and execution paths
  are unchanged.
- Repository tests pass 52/52, unified tests 6/6, and Conveyor tests 14/14.
  Packaged Conveyor resources have zero mismatches.
- Built unsigned v4.1.4 Setup and Portable candidates. See
  `docs/STUDIO_4_1_4_CONVEYOR_BLOCK_MENU_2026-10-27.md`.

## CubeLink Studio 4.1.3 portable CH340 recovery (2026-10-27)

- Added startup CH340/CH341 diagnosis to the unified launcher. A healthy board
  shows its COM port; a connected device with a driver problem shows an
  administrator-approved driver-install button.
- Portable runtime installation uses the bundled CH341SER INF through Windows
  `pnputil`, then diagnoses ports again. Cancellation or missing school admin
  rights remains a non-blocking explanation, and open COM ports prevent driver
  replacement.
- Repository tests pass 52/52, unified tests 6/6, and Conveyor tests 13/13.
  Source smoke and packaged-resource checks pass.
- Built unsigned v4.1.3 Setup and Portable candidates. Physical validation on
  a Windows PC without a working CH340 driver remains required. See
  `docs/STUDIO_4_1_3_PORTABLE_CH340_RECOVERY_2026-10-27.md`.

## CubeLink Studio 4.1.2 logo home navigation (2026-10-27)

- Removed the separate text home buttons and made the upper-left CubeLink
  branding the unified-launcher control in both robot-arm and conveyor screens.
- The robot-arm intro also shows a small upper-left logo so the user can return
  before entering its internal workspace. Mouse and keyboard activation work;
  standalone/web behavior and the open-COM safety gate are preserved.
- Repository tests pass 51/51, unified tests 5/5, and Conveyor tests 13/13.
  Source and packaged smoke tests clicked both logos and confirmed launcher
  return; packaged resource comparison found zero mismatches.
- Built unsigned v4.1.2 Setup and Portable candidates. See
  `docs/STUDIO_4_1_2_LOGO_HOME_NAVIGATION_2026-10-27.md`.

## CubeLink Studio 4.1.1 visible home-button correction (2026-10-27)

- Replaced the v4.1.0 preload-injected floating button with explicit
  `⌂ 통합 대문` controls in the robot-arm intro/header and conveyor header.
- Buttons stay hidden in standalone/web builds and appear only in the unified
  app. The open-COM navigation safety gate remains unchanged.
- Repository tests pass 51/51, unified tests 5/5, and Conveyor tests 13/13.
  Both source and packaged renderer traversal confirm visible home buttons and
  successful return to the launcher; packaged resources have zero mismatches.
- Built unsigned v4.1.1 Setup and Portable candidates. See
  `docs/STUDIO_4_1_1_HOME_BUTTON_FIX_2026-10-27.md`.

## CubeLink Studio 4.1 unified launcher candidate (2026-10-27)

- Added a new isolated unified Windows application with one entry page for
  `큐브링크 로봇팔` and `큐브링크 컨베이어`.
- The current Studio 4 and Conveyor v0.13.2 renderers remain intact and retain
  their saved work. Both screens add `⌂ 대문`; switching is blocked until an
  open serial connection is safely disconnected.
- Robot and conveyor serial APIs are namespaced, while the existing smart-
  factory network contract is preserved. The package includes both renderers,
  Conveyor firmware, CH340 assets, and native serial modules.
- Repository tests pass 51/51, unified tests 5/5, and Conveyor tests 13/13.
  Automated renderer traversal passed `대문 → 로봇팔 → 컨베이어 → 대문`;
  packaged resource comparison and production dependency audit also pass.
- Built unsigned Setup and Portable candidates. Physical two-module and two-PC
  validation remains required. See
  `docs/STUDIO_4_1_UNIFIED_LAUNCHER_2026-10-27.md`.

## Conveyor Studio v0.13.2 execution-mode separation (2026-10-27)

- Split Blockly operation into explicit `시뮬레이션 실행` and connected-only
  `실시간 실행`, matching CubeLink Studio's visible mode choice.
- Simulation never writes motor commands and uses mock ultrasonic distance;
  real-time execution uses physical motor commands and hardware telemetry.
- Manual physical controls remain separate, and physical stop cancels an active
  real-time Blockly program. Tests pass 13/13; packaged resources and an
  eight-second startup smoke test pass.
- Built unsigned Setup and Portable candidates. See
  `docs/CONVEYOR_STUDIO_V0_13_2_EXECUTION_MODES_2026-10-27.md`.

## Conveyor Studio v0.13.1 mission/flow correction (2026-10-27)

- Fixed the stale yellow mission highlight after selecting another mission.
- Added executable ultrasonic `if distance <=/>= cm` and interruptible forever
  loop blocks. Mission 3's revised starter demonstrates the condition block.
- Existing saved student code remains intact; `기본 블록` restores the new
  starter. All 12 Conveyor tests, packaged-resource comparison, and an
  eight-second startup smoke test pass.
- Built unsigned Setup and Portable candidates. See
  `docs/CONVEYOR_STUDIO_V0_13_1_FLOW_BLOCKS_2026-10-27.md`.

## Conveyor firmware v1.1.0 download package (2026-10-26)

- Packaged the current `CubeLink_Conveyor_Firmware_v1_1.ino` source with a
  Korean Arduino Nano upload and wiring guide.
- Standalone, packaged, and extracted source hashes match SHA-256
  `2E76C70DF70ABB1B1493CE26996D355A6F348A299875E7F91630DD1CF7593352`.
- ZIP size is 2,697 bytes with SHA-256
  `6E2CEBB9227D9BBC6EEC214B0A3F3339BF121FCF6FFD76178536CAE312081136`.
- This remains a physical-test candidate; first motor testing must be unloaded
  and limited to 20% speed.

## Studio 4 ↔ Conveyor Studio v0.13 integration candidate (2026-10-26)

- Added the shared same-Wi-Fi session/group network layer to the separate
  Conveyor Studio application; it now pairs directly with CubeLink Studio 4.
- Completed the event chain: three ultrasonic detections, `CONVEYOR,STOP`,
  `OBJECT_DETECTED`, `OBJECT_ARRIVED`, `ROBOT_WORKING`, `ROBOT_DONE`, then
  `CONVEYOR,START`.
- Factory events retry at 0/120/350 ms with one deduplicated event ID. Peer loss
  during a handoff keeps the conveyor stopped rather than resuming unsafely.
- Conveyor Studio adds a class/group/distance pairing panel, event log, and
  arrival-test button. Both applications remember the last class and group.
- All 46 repository tests and all 10 Conveyor tests pass. Both unpacked Windows
  apps passed eight-second startup smoke tests, and packaged renderer/native
  resources were verified.
- Built unsigned local candidates for Studio 4 and Conveyor Studio v0.13.0.
  Physical two-PC and hardware testing remains mandatory before publication.
  See `docs/STUDIO_CONVEYOR_INTEGRATION_2026-10-26.md`.

## Studio 4 hardware/firmware compatibility candidate (2026-10-26)

- Added a visible `외부전원 / 자동` versus `USB 전원 초기형` selector.
  USB Legacy mode accepts the connection but skips automatic multi-axis
  initialization; the existing D6/D9/D10/D11 diagnostic is the intended first
  motion path.
- USB Legacy shutdown closes the connection without sending the global `K`
  park command. External-power mode retains the existing sequential firmware
  initialization and safe-shutdown flow.
- Firmware labels remain non-blocking display metadata, including v1.0, 1.35,
  v1.4.x, unknown Legacy labels, and D10-reversed R10 builds. Safety-profile
  mismatch remains a warning fallback rather than a whole-app execution gate.
- Student-facing ready states are simplified to `정상 연결` and
  `호환 모드 연결`. Existing digital twin, Blockly, missions, serial,
  joystick, ultrasonic, collaboration, calibration, and servo diagnostic
  paths remain in place.
- All 46 tests pass. Packaged renderer hashes and native serial resources were
  verified, and the unpacked app passed an eight-second startup smoke test.
- Built unsigned installer candidate: 104,082,321 bytes, SHA-256
  `318360C64DD5139B91D20410111A44E06BAE86C2283AE760BFFA442D8AC8C557`.
  Physical hardware validation remains required before Stable/latest release.
  See `docs/STUDIO_4_HARDWARE_COMPATIBILITY_2026-10-26.md`.

## Firmware v1.5.5 local download package (2026-10-25)

- Prepared the canonical current `CubeLinkBridge.ino` v1.5.5 source together
  with the recorded Arduino Nano standard-ATmega328P HEX and with-bootloader
  HEX, Korean upload/safety guidance, and checksums.
- Firmware regression tests pass (8/8). The source timestamp precedes the
  recorded compile outputs by 21 seconds, and the packaged source and HEX
  hashes match the repository artifacts.
- Download ZIP: `CubeLink_Firmware_v1.5.5.zip`, 55,951 bytes, SHA-256
  `1588F17EFE62426CC71CC1C46E74BE9C09A4081A6A15108CBCB895A5B1AFFD52`.
  The archive was extracted and its three firmware payload hashes reverified.
- This is the latest repository candidate, not a physically validated final
  production image. The last explicitly recorded firmware uploaded to the
  development Nano remains v1.4.2; v1.5.5 must be tested with the arm supported.

## Studio 4 one-axis servo diagnostics candidate (2026-10-25)

- Added a separate diagnostic panel for D6 base, D9 lower joint, D10 upper
  joint, and D11 gripper without changing the other Studio trees or firmware.
- One selected servo can move to a bounded angle or complete two round trips.
  The diagnostic has an immediate asynchronous stop path and a three-second
  command timeout.
- A diagnostic timeout, write failure, or firmware `FAULT` ends only that test;
  it does not call full connection cleanup or send the global `K` shutdown
  command. Explicit safe shutdown and port cleanup cancel a running diagnostic.
- Existing `S,pin,angle`, calibration, Protocol 2, Legacy, and safety-profile
  compatibility behavior is retained. All 46 tests pass; a separate unpacked
  Windows build, packaged-resource hash comparison, native serial check, and
  six-second startup smoke test passed. Physical one-axis and D11 fault/stop
  validation remain required. See
  `docs/STUDIO_4_SERVO_DIAGNOSTICS_2026-10-25.md`.
- Built the unsigned local hardware-test portable
  `CubeLink_Studio_Servo_Test_Portable.exe` (93,735,693 bytes, SHA-256
  `DF828AC3C9A49F6E3D4F6CDACDBA77F8B8C267EB124E4C20F9A6A6D684B29628`).
  Its packaged resources and native serial bindings were verified, and the
  final copied executable passed a ten-second startup smoke test. It must not be
  promoted to Stable/latest before physical validation.
- Corrected the completed-test Stop button so it no longer inherits the global
  disabled-button wait cursor; completion also blurs the button. The reported
  persistent blue busy indicator was a UI cursor state, not a running servo
  operation. All 46 tests continue to pass.

## Studio 4.0 Legacy safety-profile fallback portable candidate (2026-10-22)

- Patched the exact Studio 4.0.0 installed-folder upload whose renderer files
  matched `studio/desktop-v4` byte-for-byte before the change.
- Validated Legacy CubeLink telemetry still establishes the COM session. Missing
  or mismatched safety-state/profile metadata now produces a warning, keeps the
  connection ready, marks physical execution initialized, and selects the
  default `PARK_90_30_160_90` profile instead of failing the session.
- A fully matching Legacy safety contract retains the existing recovery and
  initialization flow; explicit unsupported Protocol versions still fail closed.
- Physical commands keep the requested angle plus calibration offset for pins
  6, 9, 10, and 11. No D10 inversion is present; the simulator's D10 mapping is
  also normal-direction.
- All 40 repository tests pass. The rebuilt portable ZIP is unsigned and has
  SHA-256 `08E37B6C120D0E038F1711A497575613701DA7CAD1D7D4DAE3CDC3AB4C99DA07`.
  Physical COM/reconnect and supported-arm motion tests remain required before
  any public Stable/latest release. See
  `docs/STUDIO_4_LEGACY_PROFILE_FALLBACK_2026-10-22.md`.

## Conveyor Studio v0.12 Windows candidate (2026-10-22)

- Added the isolated `studio/conveyor-desktop-v0.12` application without
  replacing existing CubeLink Studio sources.
- Built separate unsigned Windows x64 installer and portable candidates with
  native serial access, Nano/CH340 port listing, identity probing, manual legacy
  fallback, automatic reconnect, real-time control/telemetry/digital twin, and
  the retained nine-mission Blockly learning flow.
- Seven regressions pass and packaged Blockly, firmware, driver, and native
  serial resources were confirmed. Physical hardware and installed-GUI testing
  remain release gates. See
  `docs/CONVEYOR_STUDIO_V0_12_WINDOWS_2026-10-22.md`.

## Studio 4.0 reconstruction and smart-factory collaboration candidate (2026-10-10)

- Preserved the established 3.6.x/event feature set in the isolated
  `studio/desktop-v4` tree and added a separate Electron factory-network layer.
- Smart-factory student flow is role, class session, group, connect. Same-Wi-Fi
  discovery uses session plus group internally and does not expose IP/port.
- Added the complete collaboration event path: ultrasonic debounced detection,
  conveyor stop, matching robot arrival/working/completion, and conveyor resume.
  The conveyor controller contract is `CONVEYOR,STOP` / `CONVEYOR,START`.
- Fetched and compared `tjind/CubeLink-studio` main and v2.6.5-v3.4.2 tags.
  The 4.0 renderer remains derived from the working event/3.6 baseline; it was
  not replaced with an unrelated UI.
- The photographed COM3 test exposed `ERR,UNKNOWN_COMMAND` while the old
  firmware rejected the Protocol 2 `HELLO?` probe. Studio 4 now suppresses only
  that expected reply during active discovery, shows `구형 펌웨어 호환 확인 중`,
  and continues collecting validated Legacy telemetry. Other firmware `ERR`
  responses remain visible safety errors.
- A follow-up COM3 screenshot showed `EVENT-v1.0` correctly identified as
  Legacy but blocked by the inherited 3.x semantic-version gate even though it
  reported `SAFE` and the exact `PARK_90_30_160_90` profile. Studio 4 now treats
  the firmware label as display-only and validates the Legacy safety state and
  pose profile independently.
- All 39 repository tests pass. The packaged source hashes match, native serial
  bindings are included, and the unpacked application passed a startup smoke
  test.
- Built unsigned candidate: `studio/desktop-v4/electron/dist/Cubelink_Studio.exe`,
  104,076,308 bytes, SHA-256
  `70D27631A50C1D2D66708593D975C8C1F3DA7E9B8A28F85F4FEB0D0FB3E4E3B0`.
- Physical Protocol 2/no-joystick/motion/STOP/reconnect and two-PC/multi-group
  conveyor validation remain release gates. Do not publish as Stable/latest.
  See `docs/STUDIO_4_RECONSTRUCTION_AND_REGRESSION_2026-10-10.md`.

## Nano open wiring cradle V2 (photo-matched, 2026-10-10)

- The first two-part Base/Lid concept was superseded after the installed-unit
  photos clarified the real assembly. Do not use that closed-enclosure concept
  for the current robot.
- The current design is `hardware/nano-io-case/generated-open-v2/` and preserves
  the uploaded cradle's open-top Nano insertion, selective side wire exits,
  underside datum, USB height, and 23.549 × 40.480 × 14.400 mm envelope.
- Nano remains exposed on top and plugs into the prewired individual female
  contacts. The four-pin header faces inward; Micro-USB faces the chassis wall
  opening. The assembled cradle sits at the bottom-left of the robot body.
- The original 1.0 mm central floor is reinforced upward to 1.65 mm without
  changing the chassis-contacting underside. Rounded cable beds were added
  inside the two broad harness exits to reduce wire bending at a sharp edge.
- The V2 STEP round-trip is one valid solid. The STL is closed/manifold with
  zero boundary or non-manifold edges, and the Nano reference has zero solid
  interference. It prints in the exported orientation without supports, lid,
  or assembly screws.
- Physical fit remains mandatory: verify the actual prewired contact fit, wire
  diameters, USB-wall alignment, cable insertion force, and repeated Nano
  replacement before production use.

## Superseded Nano selective-I/O enclosure concept (2026-10-10)

- Inspected the uploaded `센서.step` as 21 valid AP214 solids with a 23.549 ×
  40.480 × 14.400 mm overall envelope. It is a segmented pin guard rather than
  a complete replaceable Nano enclosure.
- Added `hardware/nano-io-case` with the preserved original STEP, a parametric
  CadQuery source, a two-part screwless Base/Lid design, selective pin mask,
  USB opening, board hold-downs, snap releases, and strap slots.
- The generated Base and Lid are each one valid solid. STEP round-trip checks
  passed; both STL meshes are closed/manifold. The Nano reference has zero
  volume interference with the case. The 0.645 mm³ Base/Lid overlap is the
  intentional two-latch snap engagement.
- The case exposes only the current firmware's joystick, ultrasonic, servo
  signal, 5 V logic, and ground pins. Servo +5 V remains external and common
  ground is mandatory. A4/A5 remain covered because the current physical arm
  does not use the INA3221 prototype.
- This closed Base/Lid concept is retained only as design history and is not the
  current photo-matched solution. It is a dimensional prototype, not a
  production-validated enclosure.
  Actual Nano clone dimensions, header style/height, USB shell, snap fatigue,
  and 100-cycle classroom handling still require a physical fit print.

## Studio 4.0 Protocol 2 / Legacy connection candidate (2026-10-10)

- Added an isolated Studio 4.0 source tree at `studio/desktop-v4`; existing
  Studio 3.6.x, firmware 1.x, and EVENT sources were not overwritten.
- Protocol discovery now sends `HELLO?` five times during a bounded 6.5-second
  window. Protocol 2 remains preferred even if `J1`/`J2` arrives first.
- A complete `DEVICE=CUBELINK`, `PROTOCOL=2`, `END` response connects without
  gating on the firmware version. `CAP` is parsed separately and `JOYSTICK` is
  optional.
- When Protocol 2 never completes, validated `J1`, `J2`, `A`, `U`, `READY`,
  `PONG`, or known CubeLink status data permits a Legacy connection with an
  explicit limited-function warning. Random serial text does not qualify, and
  an explicit unsupported protocol fails closed.
- All 35 repository tests pass. An unsigned Windows x64 installer candidate was
  built at `studio/desktop-v4/electron/dist/Cubelink_Studio.exe` (104,069,533
  bytes, SHA-256
  `8F98D06DB2AE551AF9D4D1DFF50756379BA95B9622CC1013D3FD232D1043BB30`).
  Packaged connection resources match source, the native serial binding is
  present, and the unpacked app passed a renderer/preload smoke test.
- A later COM3 test passed actual port opening and Legacy auto-detection from
  the connected old firmware's `J1`, `J2`, and `U` telemetry. Its unsupported
  `HELLO?` replies did not block connection, and the real-time button became
  enabled after the UI state refresh.
- No motion or STOP command was sent. Software port close succeeded, but the
  automated second-open harness was inconclusive. Protocol 2 hardware,
  no-joystick hardware, USB unplug/replug, motion, STOP, and repeat reconnect
  validation remain pending. No firmware was flashed and no release was
  uploaded or published. See
  `docs/STUDIO_4_PROTOCOL2_LEGACY_2026-10-10.md`.

## Event layout validation and v3.6.6 public correction (2026-09-13)

- The user confirmed the enlarged real-time digital-twin screen was used
  successfully at the event. This directly validates the presentation layout;
  it does not claim every reconnect/manual/firmware-version path was exercised.
- Rebuilt the unsigned v3.6.6 installer after correcting the graduation-mode
  style conflict: `studio/electron/dist-v3.6.6-release/Cubelink_Studio.exe`,
  104,067,087 bytes, SHA-256
  `BB72CC8B86FD8E20B243249E13D54E0BC475ACDE24BAB3F398D5F76317C763C3`.
- Ordinary `실시간 실행` remains physical-robot-only. The enlarged event
  digital-twin layout is entered only after the serial monitor command `twin`.
  Manual control cannot implicitly unlock or select digital-twin mode.
- Graduation mode previously hid the left panel and restored a fixed 420 px
  right column after digital-twin rules. Combined-state overrides now keep the
  event layout large, and re-entering `twin` restores twin mode reliably.
- `index.html`, `style.css`, `app.js`, `digitalTwin.js`,
  `firmwareCompatibility.js`, and `sw.js` match the packaged resources exactly.
  The clean Desktop-only snapshot passes all 14 regressions. The installer is
  not Authenticode-signed. Release v3.6.6 is public and marked GitHub `latest`.

## Official-blog automatic download widget (2026-09-13)

- Updated and applied the left sidebar download widget on the public Eoreum
  Naver blog. It now reads `CubeLink Studio PC 최신 정식 버전 DOWNLOAD`.
- The widget points directly to
  `https://github.com/eoreum/CubeLink/releases/latest/download/Cubelink_Studio.exe`.
  The public page was reloaded and the rendered widget link was verified. After
  v3.6.6 publication, the same URL was confirmed to redirect to its installer.
- Future verified releases update the target automatically when the release is
  marked `latest` and its asset remains named exactly `Cubelink_Studio.exe`.
  Unverified candidates must never be promoted to `latest` merely to update the
  blog download.
- Recheck on 2026-10-10 found that the live left widget had later been changed
  to `CubeLink Studio PC 통합판 4.0.0 DOWNLOAD` and now links directly to the
  physically unverified `v4.0.0-unified` pre-release asset. This is not the
  desired Stable/latest configuration. Restore the widget to the verified
  Stable asset only after the Studio 4 hardware release gate passes; until then
  v3.6.6 remains GitHub `latest`.
- On 2026-10-10 the banner's direct URL was repaired without promoting Studio 4
  to Stable: the missing `Cubelink_Studio.exe` asset was added to the existing
  `v4.0.0-unified` pre-release. The public URL now returns HTTP 200 and the
  uploaded 104,076,308-byte candidate has SHA-256
  `70D27631A50C1D2D66708593D975C8C1F3DA7E9B8A28F85F4FEB0D0FB3E4E3B0`.
  The release remains explicitly marked as a pre-release; v3.6.6 remains
  GitHub `latest` until physical hardware verification passes.

## Desktop Studio production-integration candidate (2026-09-13)

- Preserved the event-tested, explicit-`twin`-mode run layout: the right
  side expands the existing GLB arm while the left side carries four servo
  angles, two joystick indicators, and the serial monitor. Stop, disconnect,
  and completion restore the editor layout.
- Replaced the fixed v1.4.2/v1.5.x allowlist with a testable semantic-version
  compatibility module. Stable v1.3.5+ has no minor/patch ceiling.
- Kept protocol safety independent from version eligibility. The current Studio
  accepts only protocol major 1 with `SAFE` or `RECOVERY_REQUIRED` and the exact
  `PARK_90_30_160_90` profile. Future v2.x command changes, unknown states,
  changed pose profiles, prereleases, and malformed versions fail closed.
- Added the compatibility module to the service-worker precache and advanced
  the cache key so an installed web app does not retain the former allowlist.
- All 16 Node regression tests passed. No firmware or Tablet source was changed,
  and no installer was installed, hardware-tested, or published.

## Standalone tabletop curling firmware candidate (2026-09-12)

- Firmware v1.5.5 adds a power-only tabletop curling mission and does not expose
  the action through Studio. The guarded trigger is a one-second right joystick
  button hold followed by release while both sticks are centered and the arm is
  the relaxed ranges pin 9=30..65, pin 10=15..55, and pin 11=50..80.
- Pin 9 advances toward 130 using five-degree command steps every 8 ms, a 5x
  command-rate increase over v1.5.4 (nominally 625 degrees/second, physically
  limited by the servo). Pin 11 begins opening
  toward 90 when pin 9 reaches 105. Any stick displacement or button press
  cancels the automatic action. The existing two-button park/recovery behavior
  is unchanged.
- INA3221 protection is disabled by default and the firmware reports `CUR0`, so
  the current hardware needs no current-sensor boards.
- All 12 Node regression tests passed. MiniCore no-bootloader compilation used
  17,260 bytes flash (52%) and 714 bytes SRAM (34%). No firmware was flashed;
  unloaded and then very-light-object physical tests remain mandatory. See
  `docs/STANDALONE_CURLING_MISSION_2026-09-11.md`.
- The v1.5.5 source compiles for the user's Arduino AVR Nano standard
  `ATmega328P` (`arduino:avr:nano:cpu=atmega328`) 115200 setting, using
  18,156/30,720 bytes flash (59%) and 728/2,048 bytes SRAM (35%).

## Desktop digital-twin/manual-control candidate (2026-09-11)

- Real-time execution now switches only for the duration of a run to a dedicated
  digital-twin layout: the existing GLB arm fills the right side, while the left
  side shows four servo angles, both joystick positions, and the serial monitor.
  The previous editor layout is restored when execution stops.
- Added the visible `Ctrl+Alt+J` shortcut and manual-control action. New firmware
  uses `JM,1` / `JM,0`; the currently installed v1.4.2 and v1.5.0 without `JM1`
  use a Studio-mediated, rate-limited `S`-command fallback. Both paths apply a
  deadzone, low-pass filtering, and a maximum angle step instead of mapping raw
  input directly to absolute angles.
- Studio v3.6.3 accepts the existing v1.4.2 safety handshake and does not require
  INA3221 sensors or the optional `CUR4` capability. It sends the original `S`
  command on v1.4.2; monitored `M`/`B` commands remain limited to firmware that
  explicitly advertises `CUR4`.
- Firmware v1.5.1 advertises `JM1`, accepts the measured two-stick gesture even
  after a Studio session is verified, and continues `J1`/`J2` plus `A` telemetry
  during manual motion. The safety initialization, current protection, joint
  limits, parking sequence, and single-`K` shutdown contract remain in place.
- All 10 Node regression tests passed. MiniCore no-bootloader compilation used
  16,712 bytes flash (51%) and 703 bytes SRAM (34%). The local HEX SHA-256 is
  `0FDFBD6284D0683DDA210B465A5631A0635470E058C0E0C8DE222FF38112AFD1`.
- An unsigned Studio v3.6.3 hardware-test installer was built at
  `studio/electron/dist-v3.6.3-digital-twin-manual/Cubelink_Studio.exe`
  (104,065,483 bytes; SHA-256
  `A1148D09418C90933821BB3481F816E7BF62384BAC925BCCD4355F2FE7A1858C`).
  Packaged `digitalTwin.js` matches source. No firmware was flashed and no
  installer was installed or published.
- The local `file://` browser visual check was blocked by the browser safety
  policy. Hardware motion, connected gesture entry, layout inspection in the
  packaged app, shortcut toggling, and repeated stop/restore still require the
  physical development PC test described in
  `docs/DIGITAL_TWIN_MANUAL_2026-09-11.md`.

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
