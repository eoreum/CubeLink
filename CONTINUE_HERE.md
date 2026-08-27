# Continue CubeLink Work Here

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
