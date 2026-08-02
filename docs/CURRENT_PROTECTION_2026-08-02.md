# CubeLink Servo Current Protection

Status: source-complete prototype; hardware calibration and obstruction testing
are required before classroom release.

## Hardware profile

Two INA3221 modules with R100 (0.1 ohm) shunts are required so every servo has
its own measured supply branch.

| INA3221 | I2C address | Channel | Servo |
| --- | --- | --- | --- |
| arm board | `0x40` | CH1 | pin 6 base (MG90S) |
| arm board | `0x40` | CH2 | pin 9 lower (MG90S) |
| arm board | `0x40` | CH3 | pin 10 upper (SG90) |
| gripper board | `0x41` | CH1 | pin 11 gripper (SG90) |

Both boards share Nano A4/SDA and A5/SCL. Their logic VCC connects to 5V and
all grounds must be common. Each servo positive wire must be separated from the
common positive rail and routed in series through its assigned shunt channel:
servo power positive -> channel positive input -> channel negative input ->
servo positive. Do not connect a shunt channel directly between positive and
ground. Servo signal wiring does not pass through the INA3221.

The second module must be set to address `0x41` using the exact address jumper
method documented by that module vendor. Confirm the address before applying
servo power.

## Protection behavior

Firmware v1.5.0 probes both addresses at boot and advertises either `CUR4` or
`CUR0`. Studio v3.7.0 permits real initialization only with v1.5.0 and `CUR4`;
simulation remains available without sensors.

Studio servo commands use `M,<id>,<pin>,<angle>`. The firmware associates the
current sample with that execution id. A sustained trip detaches the affected
servo and emits `FAULT,STALL,<id>,<pin>,<mA>`. Studio stops normal execution,
selects the associated Blockly block, and sends successful servo actions back
in reverse runtime order using guarded `B` rollback commands. The failed
servo's previous command is restored after the earlier arm motions have been
reversed. `C` clears the fault only after the recovered servo has remained
below threshold for 600 ms.

Rollback is monitored too. A second obstruction produces `FAULT,ROLLBACK`;
Studio then sends `X`, which detaches all servos and marks the physical pose as
unsafe. A lost sensor bus also detaches all servos. If Studio does not complete
recovery within 30 seconds, the firmware detaches all servos.

## Provisional values — not classroom release values

| Servo pins | Trip current | Start grace | Sustained duration |
| --- | ---: | ---: | ---: |
| 6, 9 (MG90S) | 900 mA | 250 ms | 450 ms |
| 10, 11 (SG90) | 650 mA | 250 ms | 450 ms |

These values are intentionally marked provisional. Servo model labels do not
guarantee identical stall current, and linkage load changes normal current.
Measure every axis with representative CubeLink mechanisms before release.
The teacher serial command `Q` reports all four live readings as
`CURRENT,6,mA,9,mA,10,mA,11,mA`; Studio renders this as a readable current line.

## Required physical validation

1. Verify both I2C addresses with servo power disconnected.
2. Verify channel-to-pin mapping one servo at a time.
3. Record idle, unloaded move, normal loaded move, start spike, hold, and
   deliberately blocked current for each axis on at least three robots.
4. Choose each trip threshold above the highest repeatable normal value and
   below the lowest repeatable blocked value. If those ranges overlap, current
   alone cannot reliably distinguish a jam; change the mechanism, servo, or
   add position/force feedback.
5. Test a pin-11 obstruction after pins 9 and 10 have moved downward. Confirm
   the failing block is selected, pin 11 detaches, pins 10/9/6 reverse safely,
   and pin 11 returns only after the obstruction clears.
6. Obstruct a rollback path and confirm all servos detach.
7. Disconnect either INA3221 SDA/SCL wire during an active test and confirm all
   servos detach.
8. Repeat initialization, parking, standalone joystick, USB disconnect, and
   power-cycle recovery tests. Do not publish or distribute until they pass.

The protection reduces heating time but is not a certified safety circuit.
Software current monitoring cannot replace correct external servo power,
mechanical stops, supervision, and a reachable physical power switch.
