# CubeLink Product and Studio Roadmap

Last updated: 2026-07-23 (Asia/Seoul)

## Guiding outcome

CubeLink will evolve from one Arduino-based robot arm into a modular education
platform with dependable connections, minimal visible wiring, automatic module
identification, and one coherent CubeLink Studio experience.

## Phase 1 - Robot-arm stabilization

- Resolve power sag, servo jitter, reset, heat, and USB-disconnect behavior.
- Physically validate firmware v1.4.1 safety and standalone joystick behavior.
- Complete Windows COM selection, verification, initialization, reconnect, and
  write-queue stability.
- Keep simulation and physical execution visibly separate.
- Complete a tested Windows installer only after hardware validation.

## Phase 2 - Education and blocks

- Simplify and organize robot-arm blocks.
- Add and validate ultrasonic and color-sensor blocks.
- Add student missions, tutorials, and child-readable error messages.
- Provide calibration and safe-angle tools without exposing pins unnecessarily.

## Phase 3 - CubeLink Core hardware

- Integrate MCU, USB data, protected logic and servo supplies, connectors,
  diagnostics, and ISP production pads on one board.
- Target one robot-side USB-C connection through a compliant powered dock for PC
  sessions, with power-only standalone use where electrically valid.
- Reserve I2C, UART, spare PWM/ADC, module identity, and motor-driver expansion.
- Add servo-voltage monitoring and provision for total-current sensing.

## Phase 4 - Car

- Use a separate DC motor/power driver module instead of adding unused motor
  circuitry to every arm board.
- Start with a two-wheel differential car, then assess a four-wheel version.
- Reuse CubeLink Core, Studio protocol, joysticks, sensors, and missions.
- Make a mobile manipulator the flagship combined product.

## Phase 5 - Omni-wheel and smart factory

- Select three versus four wheels after load, cost, and curriculum testing.
- Add forward, sideways, diagonal, and rotation blocks and simulation.
- Combine arm, transport robot, conveyor, sorter, and storage-zone missions.
- Support cooperative missions involving multiple CubeLink devices.

## Phase 6 - AI

- Add camera/vision only after power, USB, and module architecture is stable.
- Candidate functions include recognition, marker navigation, sorting,
  inspection, and mission generation.
- Keep AI optional so the base product stays affordable and dependable.

## Architecture principle

```text
CubeLink Core
  |-- ARM servo/power module
  |-- CAR DC-motor driver module
  |-- OMNI motor-driver module
  |-- sensor/factory modules
  `-- optional camera/AI module
```

Connector, electrical limits, module ID, and motor driver are not selected yet.
They require a requirements review and prototypes before schematic design.
