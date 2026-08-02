# CubeLink Test Status

Passed with the earlier connected hardware:

- Nano connection on COM3
- USB unplug/replug reconnection
- Physical and simulated servo directions
- Both joystick inputs
- Ultrasonic sensor input

Blocked or pending:

- Physical validation and upload of the firmware build with the restored v1.3.1
  measured two-stick arming gesture
- v1.4.1 Studio recovery, initialization, parking, and safe-stop flow
- v1.4.1 power-only joystick calibration, recovery confirmation, arming, and parking
- Multi-servo USB-only power stability
- Pin 9 and pin 10 jitter isolation
- Precise physical/simulation angle agreement
- Web download flow and Android behavior

Record the command, expected result, actual result, COM port, reset/disconnect
state, and moving servo channel for every physical test.

Static regression coverage:

- `node --test test/current-protection.test.cjs` verifies the two-board/four-
  channel INA3221 requirement, v1.5.0 capability gate, monitored command ids,
  faulted-servo detach, Blockly fault mapping, reverse rollback, and emergency
  stop fallback. Physical stall thresholds still require hardware calibration.

- `node --test test/firmware-standalone-legacy-arming.test.cjs` verifies the
  measured v1.3.1 raw corner conditions and two-second hold while preserving
  neutral calibration, parked-state, and Studio-session locks.
- `node --test test/installer-driver-detection.test.cjs` verifies that the
  Windows installer checks connected PnP problem devices before installing the
  bundled CH340/CH341 driver and uses the native `pnputil.exe` path.
