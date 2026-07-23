# CubeLink Project Context

Last updated: 2026-07-23 (Asia/Seoul)

## Official names

- Company: **Eoreum** (Korean: 이오름)
- GitHub account: `eoreum`
- Product: **CubeLink**
- Software: **CubeLink Studio**
- Other Eoreum brands: **RoboSpace**, **IF (Idea Factory)**

Do not change spelling or capitalization without explicit confirmation.

## Product scope

CubeLink is currently an educational robot-arm platform and is planned to grow
into a modular education platform. Known development hardware:

- Arduino Nano and Nano Shield
- Four micro servos (originally two MG90S and two SG90)
- Two joystick modules
- Ultrasonic sensor
- USB-only servo power was the original target but is not stable under the
  present four-servo load. Development now includes a separated external servo
  supply while preserving a minimal-connection product goal.

The work covers hardware power stability, Arduino firmware, serial communication, web app, Electron Windows app, 3D simulation, documentation, testing, and releases.

Confirmed future directions include a dedicated CubeLink controller, DC geared
motor/car support, omni-wheel support, smart-factory modules, and later optional
AI functions. See `docs/DECISION_LOG.md` and `docs/PRODUCT_ROADMAP.md`.

## Product integration and access requirements

- The CubeLink product must be operated and programmed through CubeLink Studio's real-time execution flow.
- CubeLink Studio must reject ordinary Arduino Nano and Uno boards; only authenticated CubeLink hardware may connect.
- CubeLink production hardware must not expose ordinary end-user sketch upload through Arduino IDE or other Arduino applications.
- A serial greeting or USB VID/PID check alone is not sufficient authentication because it can be copied or spoofed.
- The current classic ATmega328P Nano platform cannot provide strong Studio-only enforcement by firmware alone: ISP can bypass the bootloader, and secrets stored in ordinary flash can be extracted or replaced unless production lock bits and a suitable hardware trust design are used.
- Final production enforcement therefore requires an explicit hardware/firmware security design, while development and recovery access must remain documented and controlled separately.

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
- `firmware/arduino-nano/CubeLinkBridge/CubeLinkBridge.ino`: current Arduino Nano firmware
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
