# CubeLink Current Status

Last updated: 2026-07-28

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
  physical up. Standalone arming is left stick upper-right (raw X low/Y low)
  plus right stick lower-right (raw X high/Y high), held for two seconds.

- Firmware v1.4.0 never energizes servos automatically during boot.
- EEPROM stores only whether the defined storage pose was completed safely; it does not assume the last commanded angle equals the physical angle.
- After an interrupted session, firmware reports `RECOVERY_REQUIRED` and rejects servo commands until the user confirms the physical storage pose.
- Safe initialization and parking move one axis at a time; loaded pin 9 and pin 10 axes use slower steps.
- CubeLink Studio now handles `SAFE`, `RECOVERY_REQUIRED`, `R`, `I`, `K`, `INIT_OK`, and `PARKED`, blocks real-time execution before initialization, and closes the connection only after parking confirmation.
- Firmware v1.4.0 and the updated Studio have not been flashed/physically validated yet. Keep the robot powered off until a controlled upload/test procedure is ready.
- Genuine-device authentication, password management, per-device keys, and production lock provisioning are explicitly deferred to a later phase.
