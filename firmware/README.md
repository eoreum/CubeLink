# CubeLink Firmware

The current Arduino Nano firmware is located at:

```text
arduino-nano/CubeLinkBridge.ino
```

Serial speed: `115200` baud.

Core commands:

- `S,pin,angle` — move a servo
- `L,pin,value` — set a supported digital output
- `P` — ping; the firmware responds with its version
