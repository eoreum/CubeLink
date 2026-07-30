# CubeLink Test Status

Passed with the earlier connected hardware:

- Nano connection on COM3
- USB unplug/replug reconnection
- Physical and simulated servo directions
- Both joystick inputs
- Ultrasonic sensor input

Blocked or pending:

- Physical validation and upload of the firmware build with the new standalone
  down-and-inward two-stick arming gesture
- v1.4.1 Studio recovery, initialization, parking, and safe-stop flow
- v1.4.1 power-only joystick calibration, recovery confirmation, arming, and parking
- Multi-servo USB-only power stability
- Pin 9 and pin 10 jitter isolation
- Precise physical/simulation angle agreement
- Web download flow and Android behavior

Record the command, expected result, actual result, COM port, reset/disconnect
state, and moving servo channel for every physical test.

Static regression coverage:

- `node --test test/firmware-standalone-inward-arming.test.cjs` verifies that
  both physical sticks must be held diagonally down and inward for two seconds,
  while preserving neutral calibration, parked-state, and Studio-session locks.
