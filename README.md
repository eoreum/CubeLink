# CubeLink

USB-powered educational robotics platform by Eoreum.

## Start here

This repository is the single canonical CubeLink working project.

- Current firmware: `firmware/arduino-nano/CubeLinkBridge/CubeLinkBridge.ino`
- Current shared Studio UI: `studio/web/`
- Official web Studio: `https://eoreum.github.io/CubeLink/`
- Current Windows host: `studio/electron/`
- Current work status: `PROJECT_STATUS.md`
- Next work instructions: `CONTINUE_HERE.md`
- File audit and legacy-source map: `PROJECT_FILE_AUDIT.md`

Do not edit firmware copies under `archive/` or the historical folders under
`C:\Projects`. They are preserved only for comparison and recovery.

## Features

- Arduino Nano controller
- Four-axis educational robot arm
- CubeLink Studio for web and Windows
- Blockly programming, 3D simulation, and serial control
- Joystick and ultrasonic sensor support

## Repository Structure

- `firmware/` — Arduino Nano firmware
- `studio/web/` — shared web interface and application logic
- `studio/electron/` — Windows Electron host and build configuration
- `hardware/` — circuit, mechanical, and component documentation
- `docs/` — project and protocol documentation
- `test/` — test plans and results

## Windows build

```text
cd studio/electron
npm install
npm start
npm run dist
```

The portable executable is generated as `Cubelink_Studio.exe`.

## Firmware

Open this source file in Arduino IDE when a controlled development upload is
required:

```text
C:\Users\dscom\Documents\Codex\CubeLink\firmware\arduino-nano\CubeLinkBridge\CubeLinkBridge.ino
```

The file is the editable source. A `.hex` file or a file under Arduino's
temporary build directory is a compiled output, not the firmware source.

Copyright © Eoreum
