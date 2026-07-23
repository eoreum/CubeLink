# CubeLink Current Status

Last updated: 2026-07-23

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
- Application version updated to `3.4.3`.
- Static JavaScript syntax checks passed.
- Electron directory packaging succeeded with web resources and native serial bindings.
- User manually launched the unpacked v3.4.3 application successfully.
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
- Portable packaging reached the NSIS stage but Codex could not download the helper because its network environment was restricted.
- Automatic launch inside Codex caused GPU/cache permission failures; manual user launch worked.

## Not yet verified

- Arduino Nano was detected on COM3 and connected with v3.4.3.
- Serial reconnection after USB unplug/replug passed.
- All servo directions and real-time control passed, but severe jitter was observed, especially on pin 9 (lower-arm MG90S). Release remains blocked pending diagnosis.
- Both joystick inputs passed.
- Ultrasonic sensor input passed.
- Physical arm and 3D simulator directions matched; precise angle agreement remains unverified because of servo jitter.
- GitHub Pages web intro/download flow
- Android behavior
- USB-only power stability under realistic servo loads

## Studio serial connection work in progress (2026-07-21)

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
