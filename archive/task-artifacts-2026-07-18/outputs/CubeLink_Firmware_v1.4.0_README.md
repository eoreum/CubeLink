# CubeLink Bridge Firmware v1.4.0

This is the hardware-test candidate for the CubeLink safe-start and safe-shutdown protocol.

## Safety behavior

- Servos are never energized automatically during boot.
- `READY,CUBELINK,v1.4.0,SAFE` means the previous session completed safe parking.
- `READY,CUBELINK,v1.4.0,RECOVERY_REQUIRED` means power was interrupted before safe parking, or this is the first installation.
- `I` initializes only from a confirmed parked pose and aligns one axis at a time to 90 degrees.
- `K` moves one axis at a time to the storage pose `(6=90, 9=10, 10=10, 11=90)` and records `SAFE` only after movement completes.
- `R` records the user's confirmation that the unpowered arm has been manually placed in the defined storage pose. It does not energize a servo.
- Servo commands are rejected until initialization succeeds.

## Required Studio flow

1. Wait for the complete `READY` response.
2. If state is `SAFE`, send `I` and wait for `INIT_OK`.
3. If state is `RECOVERY_REQUIRED`, keep servos disabled. Ask the user to place and support the arm in the defined storage pose. After confirmation, send `R`, wait for `RECOVERY_ACCEPTED`, then send `I`.
4. For safe shutdown, send `K` and wait for `PARKED` before closing the serial port or asking the user to unplug USB.

## Important

- Do not upload this firmware until it compiles successfully in Arduino IDE and the arm is physically supported for the first recovery test.
- The existing CubeLink Studio does not yet implement the `I`, `K`, and `R` handshake, so it must be updated before this firmware replaces v1.3.1.
- This safety firmware does not yet implement production device authentication or lock-bit provisioning.
- Strong Studio-only product enforcement remains a separate production-security task.
