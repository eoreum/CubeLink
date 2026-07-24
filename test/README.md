# CubeLink Test Status

Passed with the earlier connected hardware:

- Nano connection on COM3
- USB unplug/replug reconnection
- Physical and simulated servo directions
- Both joystick inputs
- Ultrasonic sensor input

Blocked or pending:

- Firmware v1.4.2 upload and physical validation
- v1.4.2 Studio recovery, sequential initialization, parking, and safe-stop flow
- v1.4.2 power-only joystick calibration, recovery confirmation, arming, inactivity shutdown, and parking
- Current offline installer COM open, duplicate-click, wrong-port, unplug,
  board-reset, firmware-response-loss, reconnect, and repeated reconnect-cycle tests
- Multi-servo USB-only power stability
- Pin 9 and pin 10 jitter isolation
- Precise physical/simulation angle agreement
- Web download flow and Android behavior

For the offline USB reliability test, use the current local installer and one
supported Nano at a time. Confirm that the badge names the selected COM port,
reaches `실시간 준비 완료` only after the v1.4.2 pose-profile handshake, and
returns to an explicit lost/failed state instead of remaining falsely connected
after every fault. Repeat unplug/replug and reconnect at least 20 times before
release. Perform servo motion only with the arm supported and external servo
power/ground wired as documented.

Record the command, expected result, actual result, COM port, reset/disconnect
state, and moving servo channel for every physical test.
