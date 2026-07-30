# CubeLink Firmware

## Current source

There is exactly one current editable Arduino Nano firmware source:

```text
arduino-nano/CubeLinkBridge/CubeLinkBridge.ino
```

Absolute path on this computer:

```text
C:\Users\dscom\Documents\Codex\CubeLink\firmware\arduino-nano\CubeLinkBridge\CubeLinkBridge.ino
```

Current source candidate: `v1.4.2`.

Older firmware copies are stored under `archive/firmware/`. They must not be
edited or uploaded as the current firmware. Arduino temporary build folders and
`.hex` files are compiled results, not editable source.

Serial speed: `115200` baud.

Core commands:

- `S,pin,angle` — move a servo
- `L,pin,value` — set a supported digital output
- `P` — ping; the firmware responds with its version
- `I` — initialize from the confirmed storage pose
- `K` — park one axis at a time and confirm safe shutdown
- `R` — confirm that the unpowered arm was manually placed in the storage pose

Commands are newline-terminated and parsed strictly. Servo output is accepted
only on pins 6, 9, 10, and 11; digital output is accepted only on LED pin 13.
Malformed, unsupported, or oversized lines return an `ERR,...` response and
cannot be reinterpreted as a partial motion command.

The current candidate appends `PARK_90_30_160_90` to `READY` and `PONG`.
Matching Studio builds require this pose profile and reject older v1.4.2
binaries whose pin 10 storage target may still be 10 degrees.

The development Nano has responded to the local Studio as v1.4.2 with the
`PARK_90_30_160_90` profile after being programmed through an Uno used as an ISP
programmer. The v1.4.2 source adds Studio/standalone ownership locking, inactivity
park-and-detach, sequential Studio initialization, and conservative limits of
base 10..170, lower 30..170, and upper 10..160 degrees. v1.4.2 compiles
successfully for the classic Arduino Nano
ATmega328P target. A later MiniCore `bootloader=no_bootloader` compile used
11,164 bytes of flash (34%) and 410 bytes of RAM (20%). Repeated reconnect and
full physical motion testing are still required. Do not treat this image as
released production firmware.

For power-only outdoor or event use, standalone manual control is armed only
after neutral calibration by holding both physical joysticks diagonally down
and inward for two seconds: left stick down-right and right stick down-left.
The user must then return both sticks to neutral before motion begins. A
verified Studio protocol command continues to lock out standalone arming until
reboot. This gesture change remains source-only until the user explicitly
authorizes a firmware upload. The exact updated source compiled successfully
on 2026-07-30 with MiniCore 3.1.2 (`bootloader=no_bootloader`), using 11,164
bytes of flash and 410 bytes of RAM.
