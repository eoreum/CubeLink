# CubeLink Decision Log

Last updated: 2026-07-23 (Asia/Seoul)

This file records durable product decisions that must survive new Codex tasks
and different computers. Historical conversation text is supporting context;
verified source files and the decisions below are the project source of truth.

## Product priorities

1. Minimize the number of power and data connections visible to the user.
2. Make Windows serial-port detection, connection, and reconnection dependable.
3. Preserve expansion from the robot arm to car, omni-wheel, and later modules.

## Robot-arm power

- USB-only operation with four hobby servos is not validated and has produced
  jitter, resets, heat, and USB disconnections under load.
- Servo power and logic/data power are separate rails, with common ground and
  protection against reverse current into the PC USB port.
- A target one-connector experience requires a properly designed powered
  data/power dock or integrated board. A modified USB Y-cable is not a production
  solution.
- The Nano and shield remain a development platform. Production should integrate
  the controller, USB, protected servo power, connectors, and programming pads.

## Connectivity

- An opened COM port is not a verified and initialized CubeLink.
- Studio must visibly show the selected COM port and connection state.
- Physical execution and simulation must not be silently substituted.
- Windows needs one serialized write queue, heartbeat, firmware verification,
  safety initialization, loss detection, and automatic reconnection.
- Production hardware should expose a stable unique identity where practical.

## Platform

- Do not make the final product merely a Nano-shaped clone.
- Build a CubeLink-specific controller while retaining current pin functions and
  serial protocol where that reduces migration risk.
- Focus the first controller on a dependable arm, with documented expansion.
- Candidate module identities are `ARM`, `CAR`, `OMNI`, and `FACTORY`.
- Studio should eventually show blocks and simulation for the detected module.

## Future products

The previously discussed roadmap explicitly included a dedicated CubeLink board,
DC geared motors, omni-wheel support, and AI functions. Promising products are:

1. Two-wheel or four-wheel educational car.
2. Mobile manipulator combining the car and existing arm.
3. Three-wheel or four-wheel omni-directional platform.
4. Smart factory combining arm, conveyor, sorter, and transport robot.
5. Exploration, forklift, crane, drawing, and cooperative-robot missions.

These are roadmap directions, not completed electrical or mechanical designs.

## Motor boundary

- The current arm uses 4.8-6 V three-wire hobby PWM servos.
- Industrial 24/48 V brushless servos with separate drivers and encoders are not
  drop-in replacements. They may be reconsidered for a future precision product.

## Security

- Production hardware should ultimately be distinguishable from ordinary Nano
  and Uno boards and should not expose ordinary end-user sketch upload.
- A greeting string or VID/PID alone is not strong authentication.
- Per-device authentication and provisioning remain deferred until safety,
  power, and connection architecture are stable.
