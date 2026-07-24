# Continue CubeLink Work Here

Durable product decisions and the future modular roadmap are recorded in
`docs/DECISION_LOG.md` and `docs/PRODUCT_ROADMAP.md`. Read them before making
power, connection, integrated-board, car, omni-wheel, or product-scope choices.

Repository audit update (2026-07-19): work only from
`C:\Users\dscom\Documents\Codex\CubeLink`. The active firmware is
`firmware\arduino-nano\CubeLinkBridge\CubeLinkBridge.ino`; it is populated and is not the empty
Google Drive folder named `CUBELINK Bridge Firmware v1`. Historical firmware is
under `archive/` and must not be uploaded as the current build. Read
`PROJECT_FILE_AUDIT.md` when locating files from another computer.

Official browser Studio for firmware v1.4.1 testing:
`https://eoreum.github.io/CubeLink/`. The older
`https://tjind.github.io/Cubelink-studio/` page does not contain the current
safety initialization flow and must not be used for v1.4.1 tests. After
connecting, wait for the button text `실시간 준비 완료` before running a
physical program.

Physical hardware validation of CubeLink Studio v3.4.3 is in progress. COM3 connection, USB unplug/replug recovery, real-time servo direction, both joysticks, and the ultrasonic sensor passed. Severe servo jitter remains, especially on pin 9 (lower-arm MG90S), so v3.4.3 must not be released yet.

New confirmed product requirement: production CubeLink hardware must work only with CubeLink Studio real-time execution; CubeLink Studio must reject ordinary Uno/Nano boards; and ordinary Arduino tools must not be an end-user upload path for CubeLink production units. Do not treat the current `READY,CUBELINK` string as secure authentication. Define a production authentication/provisioning architecture before claiming this restriction is enforced.

User decision (2026-07-18): defer genuine-device authentication, passwords, and per-device key management until after the safety firmware and Studio safety flow are stable. Do not block current safety development on authentication work, and do not claim authentication is implemented.

Next, isolate whether the pin 9 jitter follows the servo/load or the control channel. Power off before changing servo plugs. Compare the pin 9 servo on a known-stable channel and a known-stable servo on pin 9, then inspect USB-only power stability, grounds, connectors, and mechanical binding.

Firmware v1.4.1 has been uploaded to the development Nano by the user. The
matching Studio safety flow is deployed on the official Eoreum web page, but the
combined firmware/Studio physical flow is not yet validated. The same firmware
is intended for both the computer-linked product and the event joystick product.
Boot leaves servos disabled; after joystick neutral calibration, a cleanly parked
arm can enter standalone mode using the existing two-stick corner gesture.
Interrupted standalone sessions require the arm to be physically placed in the
storage pose and both joystick buttons held for two seconds. Holding both buttons
in standalone mode parks one axis at a time and detaches all servos. Studio still
uses R/I/K and takes priority when it sends servo commands. Compile verification
inside Codex remains unavailable; future firmware builds must be compiled in
Arduino IDE and tested with the arm supported. Do not set production lock bits
during development testing.

Firmware v1.4.2 is the next source candidate and has not been uploaded. It locks
out standalone joystick arming after any valid Studio protocol command, performs
a full park-and-detach after 30 seconds of standalone inactivity, initializes
Studio axes sequentially, and limits base/lower/upper commands to 10..170
degrees. Nano old-bootloader compilation passed on 2026-07-24. Controlled upload
and physical testing are required before replacing the v1.4.1 image or updating
the public Studio.

The pin 10 upper-arm servo mounting orientation has changed. Its storage target
is now 170 degrees, not 10 degrees. Firmware initialization/parking and Studio
recovery/safe shutdown must use the shared pose: pin 6=90, pin 9=10,
pin 10=170, pin 11=90.

After a mixed-version test made pin 10 move to 170 and then back to 10, the
protocol now includes pose profile `PARK_90_10_170_90`. The local Studio must
reject every firmware response without that exact profile. Studio safe shutdown
must send only `K`; firmware alone owns physical parking. Real-time execution
must also lock the center Blockly workspace until execution stops. The firmware
EEPROM safety magic changed with this geometry, so its first boot must report
`RECOVERY_REQUIRED`; physically place the unpowered arm in the new storage pose
before confirming recovery.

The matching Studio source includes a hidden, Studio-mediated joystick manual
mode. After `실시간 준비 완료`, keep both sticks neutral and enter
`조이스틱수동` (or `joystickmanual`) in the serial command field. Exit with
`조이스틱종료` (or `joystickoff`). There is no visible button. This mode sends
normal Studio `S` commands, uses one dominant axis per stick, and automatically
stops before block execution or safe shutdown. It is not deployed or physically
validated yet.

The hidden `twin` command now remains in twin mode when the digital-twin run
button is clicked. Re-entering `twin` also restores twin mode if another action
changed it. This fix is local and has not been deployed to the public Studio.

Test in this order:

1. Connect the Arduino Nano by USB.
2. Open CubeLink Studio and connect to the detected serial port.
3. Confirm the initial connection state and firmware response.
4. Move one servo at a time; record channel, requested angle, actual direction, reset, and jitter.
5. Test USB disconnect and reconnect.
6. Test both joysticks and the ultrasonic sensor.
7. With both sticks neutral, enter `조이스틱수동`; verify one axis and one
   servo at a time, then enter `조이스틱종료`.
8. Compare physical servo angles with the 3D model.
9. After successful testing, create `Cubelink_Studio.exe`, push the integration work, and publish `v3.4.3`.

When a problem occurs, record:

- Exact operation performed
- Expected result
- Actual result
- Screenshot or error text
- COM port
- Whether Nano reset or Windows disconnected USB
- Which servo(s) were moving

Do not replace the public v3.4.2 release until v3.4.3 hardware testing passes. Publishing a latest release immediately changes the web download target.
