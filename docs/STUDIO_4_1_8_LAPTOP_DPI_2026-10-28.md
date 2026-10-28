# CubeLink Studio 4.1.8 laptop DPI correction

Date: 2026-10-28 (Asia/Seoul)

## Problem

The unified Electron window used a 1120 x 720 DIP minimum. A 1366 x 768
Windows laptop provides only about 1093 x 614 DIP at 125% scaling and about
911 x 512 DIP at 150% scaling after Windows scaling and the taskbar are taken
into account. The minimum window therefore extended outside the work area and
made the rightmost controls and lower content appear cut off.

The Robot Arm header also switched to its compact layout only below 1024 px,
which excluded the common 1093 px viewport at 125% scaling. Conveyor used a
fixed `calc(100vh - 207px)` workspace height even when its wrapping header rows
became taller.

## Correction

- Reduced the Electron minimum to 800 x 480 DIP while retaining a 1440 x 900
  preferred size and maximized startup.
- Added low-height launcher rules so both device-selection buttons remain in
  the initial viewport.
- Extended the Robot Arm compact header and three-panel layout through 1150 px,
  with a second 920 px layout for 150% scaling.
- Made Conveyor use a flex-height workspace and compact 1100/930 px layouts.
- Added 620/560 px low-height rules for the Robot Arm intro and Conveyor.
- Added an Electron smoke test that renders 1093 x 614 and 911 x 512 viewports
  and checks critical controls and panel bounds.

## Verification

- Repository tests: 53/53 passed.
- Unified tests: 7/7 passed.
- Conveyor tests: 17/17 passed.
- Actual Electron source smoke: passed.
- Actual packaged and final Portable smoke launches: exit code 0.
- 1093 x 614: launcher choices, Robot connect/run, Conveyor connect/run, and
  all primary panels fit without horizontal clipping.
- 911 x 512: the same checks passed.
- Packaged resource comparison:
  - launcher: 5 files, zero missing/extra/different
  - Robot Arm web: 38 files, zero missing/extra/different
  - Conveyor web: 11 files, zero missing/extra/different

## Candidate artifact

- `CubeLink_Studio_v4.1.8_Unified_Portable.exe`
- Size: 102,128,935 bytes
- SHA-256: `4CE732F7232031E8FE02E1E3E3B34C8FD9BD873BF8B3C12D8D8F8BA8432AB496`

This is an unsigned validation candidate. The software layout regression is
verified, but the existing physical robot/conveyor, two-PC, firewall,
disconnect, and reconnect release gates still apply before Stable/latest or a
public blog download is replaced.
