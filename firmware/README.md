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

The current candidate appends `PARK_90_10_170_90` to `READY` and `PONG`.
Matching Studio builds require this pose profile and reject older v1.4.2
binaries whose pin 10 storage target may still be 10 degrees.

The v1.4.1 firmware currently uploaded to the development Nano combines the
Studio safety flow with a power-only standalone joystick path. The v1.4.2
source candidate adds Studio/standalone ownership locking, inactivity
park-and-detach, sequential Studio initialization, and conservative 10..170
degree arm limits. v1.4.2 compiles successfully for the classic Arduino Nano
ATmega328P old bootloader target. The 2026-07-24 serial-hardening build uses
11,256 bytes of flash (36%) and 394 bytes of RAM (19%), but it must still be
uploaded and physically validated before it can replace v1.4.1. Do not treat
either version as released production firmware.
