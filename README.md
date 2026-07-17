# CubeLink

USB-powered educational robotics platform by Eoreum.

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

Copyright © Eoreum
