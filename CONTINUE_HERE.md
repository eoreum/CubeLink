# Continue CubeLink Work Here

CubeLink Studio 4.1.8 laptop DPI continuation (2026-10-28): the unified app
minimum is now 800 x 480 DIP instead of 1120 x 720, and the launcher, Robot
Arm, and Conveyor have compact laptop layouts. Actual Electron smoke passes at
1093 x 614 (representing 1366 x 768 at 125%) and 911 x 512 (150%), including
the critical connect/run buttons and all primary panel bounds. Repository tests
pass 53/53, unified tests 7/7, and Conveyor tests 17/17. The unsigned Portable
candidate is `CubeLink_Studio_v4.1.8_Unified_Portable.exe`, 102,128,935 bytes,
SHA-256 `4CE732F7232031E8FE02E1E3E3B34C8FD9BD873BF8B3C12D8D8F8BA8432AB496`.
Do not replace the public blog download or Stable/latest release until the user
approves the exact artifact and the existing physical release gates are
resolved. Details: `docs/STUDIO_4_1_8_LAPTOP_DPI_2026-10-28.md`.

Firmware download package update (2026-10-25): the canonical current v1.5.5
`CubeLinkBridge.ino`, Nano standard-ATmega328P HEX, with-bootloader HEX, Korean
upload/safety guide, and checksums were packaged as
`CubeLink_Firmware_v1.5.5.zip` (55,951 bytes, SHA-256
`1588F17EFE62426CC71CC1C46E74BE9C09A4081A6A15108CBCB895A5B1AFFD52`).
Eight firmware regressions pass and archive extraction/hash verification passed.
This remains a compiled latest-source candidate; the last explicitly recorded
image actually uploaded to the development Nano is v1.4.2, so v1.5.5 still
requires supported-arm physical validation before release or production use.

Studio 4 servo diagnostic update (2026-10-25): `studio/desktop-v4` now has a
separate one-axis diagnostic panel for D6/D9/D10/D11 with conservative ranges,
single-angle movement, two round trips, asynchronous stop, and a three-second
command timeout. A failed or stalled axis does not disconnect the whole session
and does not send `K`; explicit safe shutdown remains separate. All 46 tests,
an unpacked Windows build, packaged-resource comparison, native serial check,
and startup smoke test passed. Physical one-axis motion, especially D11
stop/fault behavior and connection continuity, is still required. Read
`docs/STUDIO_4_SERVO_DIAGNOSTICS_2026-10-25.md`.

Studio 4 Legacy fallback update (2026-10-22): the exact uploaded installed
Studio 4.0.0 folder matched `studio/desktop-v4` before modification. Legacy
firmware with missing or mismatched safety metadata now stays connected, shows
a warning, uses the default `PARK_90_30_160_90` profile, and permits physical
execution. A matching safety contract still uses the existing initialization
flow, while explicit unsupported Protocol versions remain blocked. Pins
6/9/10/11 all retain normal command direction; D10 is not inverted. All 40
tests pass. The portable ZIP is unsigned and still needs supported-arm COM,
reconnect, and one-axis-at-a-time motion validation before public release. Read
`docs/STUDIO_4_LEGACY_PROFILE_FALLBACK_2026-10-22.md`.

Conveyor Studio update (2026-10-22): the new isolated Windows candidate is in
`studio/conveyor-desktop-v0.12`; do not merge it into or overwrite the existing
CubeLink Studio trees. It includes installer/portable packaging, native COM
listing, HELLO/STATUS identity probing, manual legacy fallback, reconnect,
control/ultrasonic/digital-twin integration, and the nine Blockly missions.
Seven regressions pass. Complete the physical installation, Nano firmware,
motor-direction, telemetry, USB unplug/replug, and multiple-port test plan in
`docs/CONVEYOR_STUDIO_V0_12_WINDOWS_2026-10-22.md` before release.

Studio 4.0 reconstruction update (2026-10-10): continue from the isolated
`studio/desktop-v4` candidate. The 3.6/event baseline remains intact. The
candidate now includes a separate multicast smart-factory layer with role,
class session, and group selection; opposite-role automatic pairing; heartbeat;
event deduplication; debounced ultrasonic detection; and the
`OBJECT_DETECTED` → `OBJECT_ARRIVED` → `ROBOT_WORKING` → `ROBOT_DONE` flow.
The conveyor serial contract is `CONVEYOR,STOP` / `CONVEYOR,START`. A photographed
COM3 test showed the old firmware's expected `ERR,UNKNOWN_COMMAND` response to
the Protocol 2 probe; during active discovery that exact response is now quiet
and the badge reads `구형 펌웨어 호환 확인 중`, while every other firmware error
remains visible. A second COM3 screenshot exposed the inherited version gate:
`EVENT-v1.0` had `SAFE` plus the exact `PARK_90_30_160_90` profile but real
execution was limited because the label was not semantic version text. Studio 4
now validates that Legacy safety contract without using the firmware label as
an allowlist. All 39 tests pass and the new unsigned installer hash is
`70D27631A50C1D2D66708593D975C8C1F3DA7E9B8A28F85F4FEB0D0FB3E4E3B0`.
Read `docs/STUDIO_4_RECONSTRUCTION_AND_REGRESSION_2026-10-10.md` and complete
its physical hardware/two-PC release gate before publishing Stable/latest.

Nano case update (2026-10-10): the installed-unit photos confirmed that the
current robot uses an open wiring cradle, not a closed enclosure. Use
`hardware/nano-io-case/generated-open-v2/`. It preserves the original STEP
envelope, open-top Nano insertion, selective side wire exits, USB height, and
bottom-left chassis placement. The floor is reinforced upward from 1.0 to 1.65
mm and the two broad exits have rounded cable beds. Its STEP is one valid solid
and its STL is closed/manifold; print it in the exported orientation with
supports disabled. The earlier Base/Lid concept is superseded and must not be
used for the current robot. Before adoption, verify the actual prewired female
contacts, wire diameters, USB-wall alignment, and repeated Nano insertion.
Servo +5 V remains external; Nano and servo-supply ground must be common. Do
not claim production validation until the physical print passes.

Studio 4.0 connection update (2026-10-10): the isolated candidate is under
`studio/desktop-v4`; do not merge it over `studio/web` or `studio/electron`.
It sends repeated `HELLO?` requests, prefers a complete Protocol 2 response,
and falls back to Legacy only after the discovery window when validated
CubeLink telemetry/status data was observed. Firmware version is display-only,
and `JOYSTICK` is an optional capability. All 35 repository tests pass. An
unsigned 4.0.0 installer candidate was built and its packaged resources and
renderer/preload startup were verified; its SHA-256 is
`8F98D06DB2AE551AF9D4D1DFF50756379BA95B9622CC1013D3FD232D1043BB30`.
COM3 later passed actual native opening and Legacy auto-detection from old
firmware `J1`, `J2`, and `U` telemetry even though that firmware rejected
`HELLO?`; the real-time button became enabled. No motion or STOP command was
sent. Software close succeeded, but the automated second-open harness was
inconclusive. Protocol 2, no-joystick, USB unplug/replug, motion, STOP, and
repeat reconnect still need hardware validation. Continue from
`docs/STUDIO_4_PROTOCOL2_LEGACY_2026-10-10.md`; do not publish it yet.

Event validation/release correction (2026-09-13): the user explicitly confirmed
that the enlarged real-time digital-twin screen was used successfully at the
event. Do not describe that presentation layout as physically unvalidated. A
fresh unsigned v3.6.6 installer containing the event layout and semver module is
at `studio/electron/dist-v3.6.6-release/Cubelink_Studio.exe` (104,067,087 bytes,
SHA-256 `BB72CC8B86FD8E20B243249E13D54E0BC475ACDE24BAB3F398D5F76317C763C3`).
Packaged Desktop resources match source and the clean Desktop release snapshot
passes all 14 regressions. GitHub release v3.6.6 is public and marked `latest`.
The enlarged layout is allowed only after the serial monitor command `twin`;
ordinary real-time execution remains a separate physical-robot-only path.
The v3.6.6 CSS explicitly overrides graduation-mode layout rules so completed
mission state cannot hide the left telemetry panel or shrink the 3D view.

Official-blog download widget update (2026-09-13): the left sidebar widget now
shows `CubeLink Studio PC 최신 정식 버전 DOWNLOAD` and links directly to
`https://github.com/eoreum/CubeLink/releases/latest/download/Cubelink_Studio.exe`.
The public page was checked after applying the layout. Future verified releases
will update this download automatically only if the GitHub asset name remains
exactly `Cubelink_Studio.exe`; never mark an unverified candidate as `latest`.
The redirect was rechecked after publishing and resolves to the v3.6.6 asset.
On 2026-10-10 the live widget was found to have drifted to a direct
`v4.0.0-unified` pre-release download even though that release explicitly says
physical hardware verification is incomplete. Do not treat that banner as a
Stable verification signal. After Studio 4 passes the physical release gate,
publish the verified Stable asset as `Cubelink_Studio.exe` and restore the
widget to the `/releases/latest/download/` URL.
The banner URL was repaired on 2026-10-10 by adding the previously missing
`Cubelink_Studio.exe` asset to the existing `v4.0.0-unified` pre-release. The
URL now returns HTTP 200 with the 104,076,308-byte candidate (SHA-256
`70D27631A50C1D2D66708593D975C8C1F3DA7E9B8A28F85F4FEB0D0FB3E4E3B0`). This
did not change GitHub `latest`: v3.6.6 remains the Stable download until the
physical hardware release gate passes.

Desktop firmware compatibility update (2026-09-13): the event digital-twin
layout remains the run-only Desktop Studio layout, and the former enumerated
firmware allowlist has been replaced with semantic-version parsing. Stable
v1.3.5+ firmware has no minor/patch ceiling. A separate fail-closed protocol
gate still requires major 1, `SAFE`/`RECOVERY_REQUIRED`, and
`PARK_90_30_160_90`; v2.x, prereleases, malformed strings, unknown safety
states, and changed pose profiles are rejected. All 16 Node regressions pass.
Only `studio/web`, Desktop-focused tests, and this Desktop documentation were
changed for this update; firmware and `studio/tablet` were not edited.

Standalone curling update (2026-09-12): firmware v1.5.5 adds a Studio-disabled,
power-only tabletop mission. After the user manually reaches approximately
P9=30..65, P10=15..55, P11=50..80 and centers both sticks, holding the right joystick
button for one second and releasing starts a bounded P9-to-130 movement; P11
opens toward 90 from P9=105. Stick or button input cancels it, while the existing
two-button park behavior remains unchanged. The default build is `CUR0` and
requires no INA3221 boards. Compilation and 12 regressions passed; it has not
been flashed or physically tested. Read
`docs/STANDALONE_CURLING_MISSION_2026-09-11.md` before changing timing.

Digital-twin/manual update (2026-09-11): Desktop Studio now enters a dedicated
run-only layout with the existing 3D arm maximized on the right and servo,
joystick, and serial telemetry on the left. `Ctrl+Alt+J` toggles joystick manual
control together with this layout. Firmware v1.5.1 adds `JM,1`/`JM,0`, advertises
`JM1`, preserves the measured two-stick entry gesture while Studio is linked,
and reports live joystick/angle telemetry. Studio v3.6.3 also accepts the
currently installed v1.4.2 and uses a bounded `S`-command fallback, with no
INA3221/current-protection requirement; `CUR4` remains optional and only gates
the monitored `M`/`B` path. Static tests and firmware/installer builds passed,
but neither binary was installed or flashed and physical validation remains
mandatory. Continue from `docs/DIGITAL_TWIN_MANUAL_2026-09-11.md`; do not
publish this candidate.

Laptop handoff (2026-08-27): read `LAPTOP_CONTINUATION.md` when resuming this
repository on another computer. The canonical handoff branch is
`agent/v360-desktop-handoff`. Pull that branch before editing, preserve any
pre-existing local changes, and update this file plus `PROJECT_STATUS.md` before
switching computers again.

Eoreum blog-management update (2026-08-27): the public Eoreum blog and the
historical `robospace`/`tjind13` archives were reviewed. Use
`docs/EOREUM_BLOG_EDITORIAL_GUIDE.md` for every future post. It records the
current typography/spacing/photo/voice pattern, legacy rewrite rules, approval
workflow, and a strict CubeLink public/private boundary. The first draft is at
`docs/blog-drafts/001_CUBELINK_BLOCKS_TO_MOTION.md`; it is not published and
must receive user approval first. Never publish internal protocol/security
details, unverified hardware claims, private paths/IDs, unreleased binaries, or
test download links. No blog state was changed during the review.

The initial Eoreum publishing package is now ready. Historical candidates and
their privacy/fact-check requirements are recorded in
`docs/EOREUM_BLOG_ARCHIVE_AUDIT.md`; the first 12-post sequence is in
`docs/EOREUM_BLOG_12_POST_PLAN.md`. Drafts 002 and 003 are in `docs/blog-drafts`
beside draft 001. The recommended opening order is brand history, CubeLink
blocks-to-motion, then the robot-engineer career class. Select or reshoot the
recommended photos, confirm legacy photo permissions and current contact
details, then obtain explicit user approval for the exact post preview before
changing Naver. Do not copy old posts verbatim and do not migrate the historical
v3.6.2 download post.

For a new external-lecture post, use `docs/EOREUM_EXTERNAL_LECTURE_INTAKE.md`.
It accepts rough notes and original phone photos; institution names, student
faces, names, testimonials, and teaching-material screens remain non-public
unless their permission is explicitly confirmed.

Tablet project start (2026-08-26): `studio/tablet` is now the independent
CubeLink Studio Tablet Android project. Do not replace or reshape the existing
Desktop code in `studio/web` or `studio/electron`. The touch-first responsive
prototype, Capacitor Android shell, transport/storage interfaces, and
`docs/CUBELINK_STUDIO_TABLET_DESIGN_V1.0.md` are present. Web build, Android
sync, native debug APK compilation, and 1280x800/800x1280 browser navigation
checks passed. The P1 core now includes actual Blockly 10.4.3 editing, large
touch quick-insert cards, XML/IndexedDB autosave and reload recovery, and
multi-project creation/switching. Quick insert, 3-block reload restoration,
project creation, and the 800x1280 coding layout passed browser checks without
errors. Desktop's complete block catalog and project file interchange still
need a compatibility pass. Android USB Host/CH340 I/O, firmware verification,
initialization, heartbeat, and reconnection are P2. The connection and physical
run UI intentionally remain disabled until those functions are real.

Live Blockly review update (2026-08-26): a global icon `svg` rule was collapsing
Blockly's workspace and flyout SVGs to 24x24, which made saved blocks appear
missing. The selector is now limited to app icons; blocks, grid, zoom, trash,
and full-height category flyouts are visible. The classroom library now shows
named robot joints, smooth/direct motion, gripper, safe storage pose, timing,
repeat, and distance blocks. New projects receive a connected four-block
example. Preserve this visual fix when editing the icon system.

Current-protection update (2026-08-02): firmware v1.5.0 and Studio v3.7.0
candidate sources now implement a two-INA3221/four-servo protection path,
faulting Blockly-block identification, and monitored reverse rollback. Read
`docs/CURRENT_PROTECTION_2026-08-02.md` before wiring or testing. The sensor
thresholds are provisional and require measurements on physical CubeLink arms.
Mission 9 completion also automatically enters the independently saved free
workspace. A v3.7.0 candidate installer was built in
`studio/electron/dist-v3.7.0-current-protection`, but it was not installed or
released. No firmware was uploaded.

Installer correction (2026-07-30): Studio v3.6.1 conditionally installs the
bundled CH340/CH341 driver only when a connected supported WCH device appears
in Windows' PnP problem-device list. Healthy COM ports and disconnected devices
skip driver registration. The NSIS script now reaches native `pnputil.exe`
through `Sysnative` instead of the failing SysWOW64 route. The corrected
installer was built successfully at
`studio\electron\dist-v3.6.1\Cubelink_Studio.exe`; its SHA-256 is
`5C68E850987608BA9F1B2DE454D4B73E12194A9FD28579D99F97F34264D07284`.
Static tests and packaged-resource comparison passed. It has not been run or
physically tested.

Tablet mission/simulation update (2026-08-26): the Tablet app now includes
three student missions with goals, required blocks, and ordered practice steps.
Mission selection routes into Blockly practice or a Three.js 3D robot-arm
simulator. It uses byte-identical copies of Desktop Studio's five GLB parts and
the same assembly coordinates and PIN 6/9/10/11 axes. Three joint sliders,
gripper open/close, reset, five-step demonstration, touch orbit/zoom, and camera
reset work. Route re-entry and 1280x800/800x1280 layouts were verified. Next
connect Blockly execution to simulated poses and add mission success and safety
range feedback. The model is genuine 3D, but collision and physics simulation
are not yet implemented.

Tablet mission workspace correction (2026-08-26): missions no longer reuse the
last active free-coding project. Each mission has its own `missionId` project,
starter XML, and filtered quick-card set. Mission 1 starts with a start hat
connected to the PIN 6, 60 degree, 1 second movement block; students add wait
and gripper blocks. A
two-tap `미션 처음부터` action restores the starter without accidental data
loss. Live checks passed for reload persistence and the 800x1280 responsive UI.
Preserve free-project/mission-context separation.
The `cubelink_start` hat block is now mandatory in starter templates. Mission 1
starts as `start → PIN 6 / 60° / 1s`; older saved chains are wrapped under a
start block without erasing work, and mission start blocks cannot be deleted.
The current starter/reset check passes at 2→4→2 blocks including the start hat.

Tablet Blockly-to-simulation update (2026-08-26): the coding page now has an
independent `◇ 3D로 실행` action. It extracts only blocks connected below the
single start hat and sends a transient command plan to the real-model simulator.
Supported commands include servo/gripper motion, ms/sec waits, bounded repeats,
distance gates/condition bodies, and storage pose. All three Tablet missions
have ordered validators; failure lists missing steps, while success records a
checkmark and updates the home total. Mission 1 supports both gripper action
blocks and Desktop-compatible PIN 11 angle blocks. Live incomplete and complete
flows, preview/plan separation, 1/3 progress, and portrait controls passed.
The home no longer uses the sample name `민준`; it shows a neutral student
greeting and `학` badge. The coding page keeps the current mission goal and
ordered success steps visible above Blockly. Quick-insert cards append to the
end of the single start chain, preventing the disconnected pile of blocks that
was seen during early mission practice. Mission-2 checks passed at 2→4 blocks
with one top-level chain and a clean three-command 3D plan.
Tablet simulation safety update (2026-08-26): a shared safety profile now keeps
manual controls and Blockly preflight aligned with firmware v1.4.2 development
limits (P6 10..170, P9 30..170, P10 10..160). Out-of-range commands stay on
the coding page and identify the joint, pin, requested angle, and allowed
range. The storage-pose animation now uses P6=90, P9=30, P10=160, P11=90.
Live browser review passed for exact slider limits and PIN 6 / 0-degree
rejection; the mission program was restored afterward. Geometry collision and
physics checks are still not implemented and must not be claimed.

Desktop continuation update (2026-07-30): the v3.6.0 Studio handoff source has
been integrated on `agent/v360-desktop-handoff` without changing `firmware/`.
Static checks, two handoff regression tests, packaging, resource inspection,
and a packaged-app launch smoke test passed. The exact student-final installer
named in the handoff is missing from the downloaded ZIP and accessible Drive
handoff folder; the newly rebuilt desktop validation installer has a different
hash and must not be substituted for that recorded final binary without an
explicit release decision. No COM device was connected, so the next required
step remains the teacher-PC/physical-robot validation described in
`DESKTOP_HANDOFF_2026-07-30.md`. See
`DESKTOP_RESUME_LOG_2026-07-30.md` for evidence.

Durable product decisions and the future modular roadmap are recorded in
`docs/DECISION_LOG.md` and `docs/PRODUCT_ROADMAP.md`. Read them before making
power, connection, integrated-board, car, omni-wheel, or product-scope choices.

Laptop continuation is documented in `LAPTOP_HANDOFF.md`. The intended handoff
branch is `agent/v344-laptop-handoff`; use the Drive source archive as the
fallback if GitHub authentication is unavailable while traveling.

Repository audit update (2026-07-19): work only from
`C:\Users\dscom\Documents\Codex\CubeLink`. The active firmware is
`firmware\arduino-nano\CubeLinkBridge\CubeLinkBridge.ino`; it is populated and is not the empty
Google Drive folder named `CUBELINK Bridge Firmware v1`. Historical firmware is
under `archive/` and must not be uploaded as the current build. Read
`PROJECT_FILE_AUDIT.md` when locating files from another computer.

Official browser Studio for firmware v1.4.1 testing:
`https://eoreum.github.io/CubeLink/`. The older
`https://tjind.github.io/Cubelink-studio/` page does not contain the current
safety initialization flow and must not be used for v1.4.1 tests. After
connecting, wait for the button text `실시간 준비 완료` before running a
physical program.

Physical hardware validation of CubeLink Studio is in progress. Earlier v3.4.3
tests passed COM3 connection, USB unplug/replug recovery, real-time servo
direction, both joysticks, and the ultrasonic sensor. Severe servo jitter
remains, especially on pin 9 (lower-arm MG90S), so no new public release should
be published yet.

New confirmed product requirement: production CubeLink hardware must work only with CubeLink Studio real-time execution; CubeLink Studio must reject ordinary Uno/Nano boards; and ordinary Arduino tools must not be an end-user upload path for CubeLink production units. Do not treat the current `READY,CUBELINK` string as secure authentication. Define a production authentication/provisioning architecture before claiming this restriction is enforced.

User decision (2026-07-18): defer genuine-device authentication, passwords, and per-device key management until after the safety firmware and Studio safety flow are stable. Do not block current safety development on authentication work, and do not claim authentication is implemented.

Next, isolate whether the pin 9 jitter follows the servo/load or the control channel. Power off before changing servo plugs. Compare the pin 9 servo on a known-stable channel and a known-stable servo on pin 9, then inspect USB-only power stability, grounds, connectors, and mechanical binding.

Firmware v1.4.1 has been uploaded to the development Nano by the user. The
matching Studio safety flow is deployed on the official Eoreum web page, but the
combined firmware/Studio physical flow is not yet validated. The same firmware
is intended for both the computer-linked product and the event joystick product.
Boot leaves servos disabled; after joystick neutral calibration, a cleanly parked
arm can enter standalone mode with the restored, physically measured v1.3.1
two-stick gesture for two seconds (left raw X high/Y low, right raw X high/Y
high), then returning both sticks to neutral.
Interrupted standalone sessions require the arm to be physically placed in the
storage pose and both joystick buttons held for two seconds. Holding both buttons
in standalone mode parks one axis at a time and detaches all servos. Studio still
uses R/I/K and takes priority when it sends servo commands. Compile verification
now passes with the Arduino CLI for the Nano old-bootloader target, but every
firmware build must still be tested with the arm supported. Do not set
production lock bits during development testing.

Firmware v1.4.2 is the current development image and was uploaded to the Nano
with the Uno used as an ISP programmer. It locks
out standalone joystick arming after any valid Studio protocol command, performs
a full park-and-detach after 30 seconds of standalone inactivity, initializes
Studio axes sequentially, and limits base to 10..170, lower to 30..170, and
upper to 10..160 degrees. Nano old-bootloader compilation passed on 2026-07-26,
and the local v3.4.4 Studio reached COM3 real-time ready with the required
`PARK_90_30_160_90` handshake. Full physical motion and repeated reconnect
testing are still required before updating the public Studio.

The local offline Studio v3.4.4 now has hardened native COM transitions, explicit
open/write timeouts, strict selected-port revalidation, stale listener cleanup,
and a two-way `P/PONG` health check. A fresh local assisted installer exists at
`studio\electron\dist\Cubelink_Studio.exe`, includes the Windows x64 native
serial binding, and contains web files matching the current source. It was
rebuilt and packaged-app checked on 2026-07-28 with SHA-256
`AE5298243C352140332D8ECF760DB8F254B5335A391D608D8CA244B99F9E3F1D`.
It adds a working in-app Blockly variable prompt, stable variable execution and
C++ naming, serial-transition keyboard-focus recovery, and a one-time cleanup of
legacy mission workspace data. It is uploaded to Drive as
`Cubelink_Studio_v3.4.4_TEST.exe` under file ID
`1MDFHVSWecuWrD5Cm5KdK7w3-jmBPftvg`. It is unsigned and has not yet passed the
final repeated-reconnect plus physical USB/servo test, so it is a validation
candidate rather than a public release.

The current joint limits are pin 9=30..170 degrees and pin 10=10..160 degrees.
Firmware initialization/parking and Studio recovery/safe shutdown must use the
shared pose: pin 6=90, pin 9=30, pin 10=160, pin 11=90. During Studio safety
initialization, pin 10 must reach 90 degrees first; firmware then waits 500 ms
before moving pin 9 to 90 degrees. During full parking, the required sequence is
pin 6 to 90 degrees, pin 11 to 90 degrees, pin 9 to 30 degrees, and pin 10 to
160 degrees. Each axis reaches its target before the next one moves. Power-on
alone still leaves servos disabled.

After a mixed-version test made pin 10 move to 170 and then back to 10, the
protocol now includes pose profile `PARK_90_30_160_90`. The local Studio must
reject every firmware response without that exact profile. Studio safe shutdown
must send only `K`; firmware alone owns physical parking. Real-time execution
must also lock the center Blockly workspace until execution stops. The firmware
EEPROM safety magic changed with this geometry, so its first boot must report
`RECOVERY_REQUIRED`; physically place the unpowered arm in the new storage pose
before confirming recovery.

The matching Studio source includes a hidden, Studio-mediated joystick manual
mode. After `실시간 준비 완료`, keep both sticks neutral and enter
`조이스틱수동` (or `joystickmanual`) in the serial command field. Exit with
`조이스틱종료` (or `joystickoff`). There is no visible button. This mode sends
normal Studio `S` commands, uses one dominant axis per stick, and automatically
stops before block execution or safe shutdown. It is not deployed or physically
validated yet.

The hidden `twin` command now remains in twin mode when the digital-twin run
button is clicked. Re-entering `twin` also restores twin mode if another action
changed it. This fix is local and has not been deployed to the public Studio.

Test in this order:

1. Connect the Arduino Nano by USB.
2. Open CubeLink Studio and connect to the detected serial port.
3. Confirm the initial connection state and firmware response.
4. Move one servo at a time; record channel, requested angle, actual direction, reset, and jitter.
5. Test USB disconnect and reconnect.
6. Test both joysticks and the ultrasonic sensor.
7. With both sticks neutral, enter `조이스틱수동`; verify one axis and one
   servo at a time, then enter `조이스틱종료`.
8. Compare physical servo angles with the 3D model.
9. After successful testing, push the integration work and publish a versioned
   release; do not publish v3.4.4 before the reconnect and servo tests pass.

When a problem occurs, record:

- Exact operation performed
- Expected result
- Actual result
- Screenshot or error text
- COM port
- Whether Nano reset or Windows disconnected USB
- Which servo(s) were moving

Do not replace the public v3.4.2 release until v3.4.4 hardware testing passes.
Publishing a latest release immediately changes the web download target.
# Studio 4 hardware compatibility continuation (2026-10-26)

- Current candidate adds a power-mode selector to `studio/desktop-v4`.
- `USB 전원 초기형` connects in compatibility mode, skips automatic
  multi-axis initialization, and disconnects without the global park command.
- Version labels and Legacy safety-profile mismatches do not block basic
  connection, missions, serial, or one-axis servo testing.
- All 46 tests pass and the Windows installer builds successfully.
- Candidate SHA-256:
  `318360C64DD5139B91D20410111A44E06BAE86C2283AE760BFFA442D8AC8C557`.
- Next required work is physical validation on USB-only, external-power,
  normal-D10, and reversed-D10 hardware. Do not publish Stable/latest first.
- Detailed record: `docs/STUDIO_4_HARDWARE_COMPATIBILITY_2026-10-26.md`.

# Studio ↔ Conveyor integration continuation (2026-10-26)

- CubeLink Studio 4 and Conveyor Studio v0.13 now share the
  `CUBELINK_FACTORY_1` same-Wi-Fi session/group protocol.
- Complete flow is implemented: detect → stop → robot arrival/working/done →
  resume. Repeated event packets use one ID and are deduplicated.
- Tests: CubeLink 46/46, Conveyor 10/10. Both unpacked apps pass startup smoke.
- Next required step is a two-PC physical test on the classroom Wi-Fi and real
  conveyor/robot hardware, including firewall prompt, peer loss, and reconnect.
- Do not publish Stable/latest before that validation.
- Details: `docs/STUDIO_CONVEYOR_INTEGRATION_2026-10-26.md`.

# Conveyor firmware download continuation (2026-10-26)

- Prepared the current Conveyor firmware v1.1.0 as a standalone INO and a ZIP
  containing Korean upload/wiring guidance.
- Source SHA-256:
  `2E76C70DF70ABB1B1493CE26996D355A6F348A299875E7F91630DD1CF7593352`.
- ZIP SHA-256:
  `6E2CEBB9227D9BBC6EEC214B0A3F3339BF121FCF6FFD76178536CAE312081136`.

# Conveyor Studio v0.13.1 continuation (2026-10-27)

- Mission selection highlighting, ultrasonic if, and forever-loop blocks are
  corrected in the current Conveyor candidate.
- Existing saved work is preserved; use `기본 블록` in Mission 3 to load the
  new conditional example.
- Tests pass 12/12 and Setup/Portable builds passed packaging and startup
  checks. Physical sensor/motor validation remains required.

# Conveyor Studio v0.13.2 execution-mode continuation (2026-10-27)

- Blockly now has separate `시뮬레이션 실행` and `실시간 실행` buttons.
- Simulation is serial-silent and uses mock ultrasonic distance. Real-time mode
  requires a physical connection and uses hardware distance telemetry.
- Physical forward/reverse/stop remain separate; physical stop cancels an
  active real-time program. Tests pass 13/13, packaged resources match, and the
  unpacked app passed an eight-second startup smoke test.
- Physical stop/direction/ultrasonic/reconnect validation is still required
  before any Stable/latest publication.
- Details: `docs/CONVEYOR_STUDIO_V0_13_2_EXECUTION_MODES_2026-10-27.md`.

# CubeLink Studio 4.1 unified launcher continuation (2026-10-27)

- Continue unified application work from `studio/unified-desktop-v4.1`; it
  packages the current Studio 4 robot-arm and Conveyor v0.13.2 renderers behind
  one device-selection entry page.
- Both modules include `⌂ 대문`. The shell refuses a module change while a COM
  port is open, requiring the existing disconnect/safe-shutdown action first.
- Tests pass: repository 51/51, unified 5/5, Conveyor 13/13. Automated renderer
  traversal passed `대문 → 로봇팔 → 컨베이어 → 대문`; packaged resources and
  production-only dependency audit pass.
- Complete classroom-PC installation, physical arm/conveyor, reconnect,
  ultrasonic, stop, and two-PC factory tests before Stable/latest publication.
- Details: `docs/STUDIO_4_1_UNIFIED_LAUNCHER_2026-10-27.md`.

# CubeLink Studio 4.1.1 visible home-button continuation (2026-10-27)

- v4.1.0's injected floating home button was not visible in the user's actual
  screens. v4.1.1 now places explicit `⌂ 통합 대문` controls in the robot-arm
  intro/header and conveyor header.
- Buttons are unified-app-only; standalone/web builds keep them hidden. The
  open-COM safety gate still requires disconnection before returning home.
- Repository 51/51, unified 5/5, and Conveyor 13/13 tests pass. Source and
  packaged smoke traversal confirms both visible controls and launcher return.
- Details: `docs/STUDIO_4_1_1_HOME_BUTTON_FIX_2026-10-27.md`.

# CubeLink Studio 4.1.2 logo-navigation continuation (2026-10-27)

- Separate text home buttons are removed. In the unified app, click the
  upper-left robot-arm logo or Conveyor `CL` logo to return to the launcher.
- The robot-arm intro includes a small upper-left logo for return before
  entering the workspace. Standalone/web behavior and the open-COM safety gate
  remain unchanged.
- Repository 51/51, unified 5/5, and Conveyor 13/13 tests pass. Source and
  packaged smoke tests clicked both logos and confirmed launcher return.
- Details: `docs/STUDIO_4_1_2_LOGO_HOME_NAVIGATION_2026-10-27.md`.

# CubeLink Studio 4.1.3 portable CH340 continuation (2026-10-27)

- The unified launcher now diagnoses CH340/CH341 state at startup and exposes
  a bundled-driver install button only when Windows reports a connected device
  with a driver problem.
- Driver installation requests UAC administrator approval, uses `pnputil`, and
  rechecks ports. Cancellation or missing administrator rights is non-blocking.
- Tests pass: repository 52/52, unified 6/6, Conveyor 13/13. Packaged launcher
  and driver-support files match source.
- Validate on a classroom Windows PC with the CH340 driver absent before any
  Stable/latest release. Include approval, denial, USB replug, and COM discovery.
- Details: `docs/STUDIO_4_1_3_PORTABLE_CH340_RECOVERY_2026-10-27.md`.

# CubeLink Studio 4.1.4 Conveyor block-menu continuation (2026-10-27)

- The Conveyor Blockly category menu now has a 168 px dark toolbox, visible
  high-contrast labels, a clear selected state, and icons for Event, Conveyor,
  Sensor, and Flow.
- Actual Electron computed-style smoke validation passed. Tests pass:
  repository 52/52, unified 6/6, Conveyor 14/14. Packaged Conveyor resources
  match source with zero mismatches.
- Complete physical classroom and conveyor validation before Stable/latest.
- Details: `docs/STUDIO_4_1_4_CONVEYOR_BLOCK_MENU_2026-10-27.md`.

# CubeLink Studio 4.1.5 common-block continuation (2026-10-27)

- Conveyor now uses Robot Arm's common learning order: `기본 구조` with the
  same setup/loop main block and wait, followed by `흐름 제어`. Conveyor,
  Sensor, and Factory/Safety commands remain device-specific categories.
- Existing saved start-event work upgrades into the setup input. Clear and Free
  Create retain an empty setup/loop root, and both Blockly XML API generations
  are supported.
- Tests pass: repository 52/52, unified 6/6, Conveyor 15/15. Actual Electron
  smoke and packaged-resource comparison pass.
- Complete physical conveyor/classroom validation before Stable/latest.
- Details: `docs/STUDIO_4_1_5_COMMON_BLOCK_LANGUAGE_2026-10-27.md`.

# CubeLink Studio 4.1.6 Conveyor mission-hint continuation (2026-10-27)

- Every Conveyor mission now has a collapsed `💡 힌트` button beside its
  title. It reveals a mission-specific block-order suggestion and collapses
  when the student changes missions.
- Actual Electron click/visibility/content smoke passed. Tests pass: repository
  52/52, unified 6/6, Conveyor 16/16. Packaged resources match source.
- Complete physical classroom and conveyor validation before Stable/latest.
- Details: `docs/STUDIO_4_1_6_CONVEYOR_MISSION_HINTS_2026-10-27.md`.

# CubeLink Studio 4.1.7 Robot factory-block continuation (2026-10-27)

- Robot Arm now exposes `연동·안전` blocks for Conveyor arrival wait, Robot
  Working, and Robot Done. Simulation logs the flow; real/twin execution uses
  the established same-session/group factory events.
- Existing automatic collaboration remains intact as a fallback. Tests pass:
  repository 52/52, unified 6/6, Conveyor 16/16. Actual Electron smoke and
  packaged Robot resource comparison pass.
- Complete physical two-PC, robot/conveyor, firewall, disconnect, and reconnect
  validation before Stable/latest.
- Details: `docs/STUDIO_4_1_7_ROBOT_FACTORY_BLOCKS_2026-10-27.md`.

# Conveyor firmware v1.2.0 standalone continuation (2026-10-27)

- The new recommended Conveyor sketch is
  `studio/conveyor-desktop-v0.12/firmware/CubeLink_Conveyor_Firmware_v1_2/`.
- With power only, it waits two seconds, detects a valid distance below 5 cm,
  runs forward at 60% for three seconds, stops, and requires 8 cm clearance
  before rearming.
- Any recognized Studio handshake or control command stops standalone motion
  and locks the board into Studio control until restart. Unknown serial noise
  does not switch modes.
- Conveyor tests pass 17/17. Arduino Nano Old Bootloader compilation passes at
  6,390 bytes flash and 394 bytes SRAM.
- Next: perform unloaded forward-direction, trigger/rearm, invalid-echo,
  mid-motion Studio takeover, disconnect, and power-cycle tests on hardware.
- Details: `docs/CONVEYOR_FIRMWARE_V1_2_STANDALONE_2026-10-27.md`.
