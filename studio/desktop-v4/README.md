# CubeLink Studio 4.0 candidate

This directory is an isolated Studio 4.0 candidate. The public Studio 3.6.x
source remains under `studio/web` and `studio/electron` and is not overwritten.

The compatibility baseline includes:

- repeated `HELLO?` discovery for Protocol 2;
- a multiline `DEVICE` / `FW` / `PROTOCOL` / `CAP` / `END` response parser;
- deferred Legacy detection from validated `J1`, `J2`, `A`, `U`, `READY`, or
  `PONG` data when Protocol 2 does not answer;
- firmware-version display without firmware-version connection blocking; and
- optional `JOYSTICK` capability handling.

The smart-factory collaboration layer is deliberately separate from the USB
serial core. In the Windows app, two students select only a role, class session,
and group. UDP multicast discovery pairs opposite roles with the same session
and group without exposing an IP address or port. The event flow is:

`OBJECT_DETECTED` → `OBJECT_ARRIVED` → `ROBOT_WORKING` → `ROBOT_DONE`

The conveyor side debounces three ultrasonic samples before issuing
`CONVEYOR,STOP`, and resumes with `CONVEYOR,START` after the matching robot
reports completion. These two serial commands are the Studio 4 conveyor
controller contract; robot-arm firmware does not receive them.

An unsigned Windows installer candidate has been packaged at
`electron/dist/Cubelink_Studio.exe`. Automated tests, packaged-resource hash
comparison, native serial binding inspection, and an unpacked-app renderer
smoke test pass. The installer has not been installed, hardware-tested, or
released. Do not promote it to Stable or `latest` until the required physical
Protocol 2, Legacy, no-joystick, motion, STOP, and reconnect checks pass.
