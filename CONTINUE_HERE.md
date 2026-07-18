# Continue CubeLink Work Here

The next task is physical hardware validation of CubeLink Studio v3.4.3.

Test in this order:

1. Connect the Arduino Nano by USB.
2. Open CubeLink Studio and connect to the detected serial port.
3. Confirm the initial connection state and firmware response.
4. Move one servo at a time; record channel, requested angle, actual direction, reset, and jitter.
5. Test USB disconnect and reconnect.
6. Test both joysticks and the ultrasonic sensor.
7. Compare physical servo angles with the 3D model.
8. After successful testing, create `Cubelink_Studio.exe`, push the integration work, and publish `v3.4.3`.

When a problem occurs, record:

- Exact operation performed
- Expected result
- Actual result
- Screenshot or error text
- COM port
- Whether Nano reset or Windows disconnected USB
- Which servo(s) were moving

Do not replace the public v3.4.2 release until v3.4.3 hardware testing passes. Publishing a latest release immediately changes the web download target.

