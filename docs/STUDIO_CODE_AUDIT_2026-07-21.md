# CubeLink Studio Code Audit

Date: 2026-07-21 (Asia/Seoul)

## Purpose

This document maps the current CubeLink Studio implementation so that future
hardware, firmware, block, simulator, and UI changes can be made together. It
records verified behavior separately from risks and unverified behavior.

## Canonical sources

- Web UI and inline serial/safety flow: `studio/web/index.html`
- Real-time block interpreter and mission UI: `studio/web/js/app.js`
- Blockly definitions and Arduino-code generator: `studio/web/js/blocks.js`
- 3D arm: `studio/web/js/simulator3D.js` and `studio/web/models/*.glb`
- Electron Web Serial bridge: `studio/web/js/webserial-polyfill.js`
- Electron process and native serial port: `studio/electron/main.js`
- Electron API boundary: `studio/electron/preload.js`
- Web cache/update behavior: `studio/web/sw.js`
- Matching firmware: `firmware/arduino-nano/CubeLinkBridge/CubeLinkBridge.ino`

The current unpacked Electron `resources/web/index.html` has the same SHA-256
hash as the canonical `studio/web/index.html`. A new public executable has not
been released.

## Current architecture

1. Blockly blocks are defined in `blocks.js`.
2. `app.js` interprets those blocks directly in the browser for simulation and
   real-time operation. It does not upload the generated Arduino sketch during
   normal CubeLink operation.
3. Real-time servo commands are sent as `S,pin,angle` lines.
4. Firmware sends `READY`, `U`, `J1`, `J2`, and `A` lines back to Studio.
5. `index.html` owns the connection lifecycle and the staged `R/I/K` safety
   handshake.
6. Browser builds use Web Serial. Electron uses the preload/polyfill/native
   serial bridge but presents the same `navigator.serial` interface to the UI.
7. The 3D simulator is updated from interpreted commands and firmware angle
   acknowledgements.

## Verified static checks

- JavaScript syntax checks pass for all current web and Electron JavaScript.
- Electron package version, visible Studio version, and service-worker cache
  version are all `3.4.3`.
- The source and unpacked Electron copy of `index.html` currently match.
- Firmware safety versions `v1.4.0` and `v1.4.1` are accepted by Studio.

These checks do not replace physical robot testing.

## Priority review findings

### P0: electrical protection is not yet part of the Studio protocol

Studio has no current, supply-voltage, brownout-warning, or servo-stall message
to consume. The proposed ACS712 protection requires a firmware message and a
defined Studio response before the UI can report which operation was stopped.

Required design decision: choose protocol messages such as `FAULT,OVERCURRENT`
and decide whether firmware alone performs the immediate stop/back-off. The
immediate electrical response must remain in firmware because a PC message is
too slow and may be unavailable during a brownout.

### P0: Studio and firmware joint limits are not one shared definition

The real-time interpreter currently accepts `0..180` for most joints and
`50..120` for the gripper is applied only in selected paths. Firmware currently
uses `0..180` for pins 6/9/10 and `50..120` for pin 11. Calibration offsets are
applied in Studio. Mechanical limits and storage positions therefore exist in
multiple places and can drift apart.

Before changing limits, update together:

- firmware clamp constants;
- Studio real-time clamp;
- calibration movement clamp;
- safe shutdown/storage pose;
- simulator display expectations;
- user-facing recovery instructions.

### P0: stop, safe shutdown, and power-off are different actions

Clicking the running button or simulation stop changes `_runtimeRunning` but
does not detach a physical servo or command a storage pose. The separate safe
shutdown button first performs a Studio-side interpolated storage move, then
sends `K`; firmware also owns parking behavior. This duplicates responsibility
and must be tested carefully whenever storage angles or fault behavior change.

Recommended ownership: firmware performs the authoritative physical parking
sequence; Studio requests it, waits for `PARKED`, and visualizes acknowledgements.

### P1: some visible block options are not supported by bridge firmware

The v2 servo blocks offer pins 3 and 5 in addition to CubeLink pins 6, 9, 10,
and 11. Bridge firmware ignores unsupported servo pins. General digital blocks
offer pins 2 through 13, while bridge firmware currently accepts `L` output only
for LED pin 13. Joystick initialization sends `J,INIT,...`, but current bridge
firmware has no matching command handler.

This can make a block appear valid while the physical robot silently does
nothing. The product must decide whether CubeLink Studio is a fixed-hardware
teaching environment or a general Arduino environment; the present bridge
protocol implements the fixed-hardware model.

### P1: connection display precedes CubeLink identity/safety confirmation

The UI enters a connected state after the serial port opens. Actual CubeLink
protocol validation occurs later when `READY,CUBELINK,...` is parsed. There is
no complete production authentication yet, and a generic serial board can be
opened even though real-time execution remains blocked by incomplete safety
initialization.

Future UI states should distinguish `port open`, `CubeLink verified`,
`initializing`, `active`, `fault`, and `parked`.

### P1: serial writes have several independent owners

Heartbeat, safety startup, calibration, manual serial input, real-time runtime,
and safe shutdown each acquire the writable stream independently. Some
contention is caught and retried later, while some errors are deliberately
swallowed. A single command queue would make ordering and fault reporting more
predictable.

### P1: browser and Electron reconnect policies need a joint test

The renderer intentionally disables its automatic reconnect after brownout,
while Electron `main.js` retains `lastPath` and attempts to reopen a closed
port. This may produce different behavior between Chrome and the Windows app.
It must be tested during physical unplug, Nano reset, and servo-induced voltage
drop.

### P2: real-time execution and Arduino code generation are separate engines

`blocks.js` generates Arduino-style code, while `app.js` separately interprets
blocks for CubeLink real-time execution. Adding or changing a block can update
one behavior without updating the other. Every block change therefore requires
a two-engine compatibility check plus simulator and firmware checks.

### P2: automated tests are absent

`package.json` currently has no real test script. Static syntax passes, but
there are no automated tests for block execution, serial parsing, safety-state
transitions, command ordering, joint clamps, or reconnect behavior.

## Change routing guide

- Block wording, fields, selectable pins: `blocks.js`, toolbox in `index.html`
- What a block does during real-time execution: `app.js`
- Generated Arduino preview: `blocks.js`
- Hardware command acceptance and immediate safety: firmware
- Connection, handshake, serial parsing, recovery dialog: `index.html`
- Windows serial behavior: `main.js`, `preload.js`, `webserial-polyfill.js`
- Physical/3D direction and displayed angle: `simulator3D.js`, models, `app.js`
- Web update/cache: `sw.js` plus visible/package version

## Required validation after changes

1. JavaScript syntax checks.
2. Firmware compile in Arduino IDE.
3. Browser simulation without hardware.
4. Electron unpacked build test.
5. One-servo-at-a-time supported-pin test.
6. Joint-limit and gripper-stall test with the arm supported.
7. Run/stop/safe-shutdown sequence.
8. USB unplug, board reset, and reconnect behavior.
9. Confirm physical and 3D directions and angles.
10. Only after physical validation: package and release.

## Current release rule

Do not replace public release v3.4.2 or publish v3.4.3 until the staged firmware,
power design, servo stability, and Studio safety flow pass physical testing.
