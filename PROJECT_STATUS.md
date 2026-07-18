# CubeLink Current Status

Last updated: 2026-07-18

## Completed

- Official repository created under `eoreum/CubeLink`.
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

## Git and build state

- Latest integration commit: `92db64a Integrate current CubeLink Studio and firmware`
- Existing public release before the integration: `v3.4.2`
- Verified unpacked executable: `studio/electron/dist/win-unpacked/CubeLink Studio.exe`
- Portable packaging reached the NSIS stage but Codex could not download the helper because its network environment was restricted.
- Automatic launch inside Codex caused GPU/cache permission failures; manual user launch worked.

## Not yet verified

- Arduino Nano connection with v3.4.3
- Serial reconnection after USB unplug/replug
- Servo channel, direction, angle, jitter, and reset behavior
- Both joystick inputs
- Ultrasonic sensor input
- Physical arm and 3D simulator angle agreement
- GitHub Pages web intro/download flow
- Android behavior
- USB-only power stability under realistic servo loads

