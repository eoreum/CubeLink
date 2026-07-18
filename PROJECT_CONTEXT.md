# CubeLink Project Context

Last updated: 2026-07-18 (Asia/Seoul)

## Official names

- Company: **Eoreum** (Korean: 이오름)
- GitHub account: `eoreum`
- Product: **CubeLink**
- Software: **CubeLink Studio**
- Other Eoreum brands: **RoboSpace**, **IF (Idea Factory)**

Do not change spelling or capitalization without explicit confirmation.

## Product scope

CubeLink is a USB-powered educational robot-arm platform. Known hardware:

- Arduino Nano and Nano Shield
- Four micro servos (originally two MG90S and two SG90)
- Two joystick modules
- Ultrasonic sensor
- USB power only; external power is not part of the intended user experience

The work covers hardware power stability, Arduino firmware, serial communication, web app, Electron Windows app, 3D simulation, documentation, testing, and releases.

## Canonical locations

- Current integrated Git repository: `C:\Users\dscom\Documents\Codex\CubeLink`
- GitHub remote: `https://github.com/eoreum/CubeLink.git`
- Original web source: `C:\Projects\CubelinkApp\www`
- Original Electron source: `C:\Projects\CubelinkElectron`
- Original firmware source: `C:\Projects\cubelink_bridge_copy_20260630211636\cubelink_bridge_copy_20260630211636.ino`
- Historical backup: `C:\Projects\FULL_BACKUP_20260711`

The original folders are reference material. New work should use this integrated Git repository unless comparison is explicitly required.

## Repository structure

- `studio/web`: shared web UI and application code
- `studio/electron`: Electron main/preload/build files
- `firmware/arduino-nano/CubeLinkBridge.ino`: current Arduino Nano firmware
- `hardware`: hardware documents and assets
- `docs`: project documentation
- `test`: test material
- `release`: release material

## Working rules

1. Preserve existing working behavior before refactoring.
2. Treat web, Electron, and Android serial adapters as distinct environments.
3. The web intro may show the Windows download button; the Windows executable must not show it.
4. Confirm facts from actual files and label assumptions.
5. Keep temporary, backup, broken, build, and `node_modules` files out of Git.
6. Test before pushing or publishing a release.
7. Keep the release asset name `Cubelink_Studio.exe`; the web download URL depends on it.

