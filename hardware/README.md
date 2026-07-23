# CubeLink Hardware

Known development configuration:

- Arduino Nano with CubeLink Nano shield
- Four micro servos on pins 6, 9, 10, and 11
- Two joystick modules
- Ultrasonic sensor
- Intended single-USB user experience

Current physical issue: multi-servo movement can cause severe jitter and USB
disconnects, especially under load on pins 9 and 10. One-servo testing passed.
Treat USB-only power stability as unresolved; do not publish electrical limits
until current and voltage measurements are recorded.

Mechanical CAD and experimental STL files remain in the Google Drive technical
assets folder and are not duplicated into the software repository.
