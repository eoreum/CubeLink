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

Current staged firmware version: `v1.4.1`.

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

The v1.4.1 firmware combines the Studio safety flow with a power-only
standalone joystick path. It has not yet been compiled, uploaded, or physically
validated. Do not treat it as a released production firmware.
