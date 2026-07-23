# CubeLink Archive

This directory contains historical or unused files kept only for comparison
and recovery. Nothing under this directory is a current upload or build source.

## Firmware history

- `firmware/CubeLinkBridge_2026-05-30_drive-legacy.ino`
  - Early source copied from the separate Google Drive `cubelink_bridge` folder
- `firmware/CubeLinkBridge_2026-06-29_legacy.ino`
  - Historical source copied from `C:\Projects\CubelinkApp\www\cubelink_bridge\cubelink_bridge.ino`
- `firmware/CubeLinkBridge_2026-07-14_pre-safety.ino`
  - Pre-safety source copied from `C:\Projects\cubelink_bridge_copy_20260630211636\cubelink_bridge_copy_20260630211636.ino`
- `firmware/sketch_may18a_2026-05-19_legacy.ino`
  - Early experimental sketch copied from `C:\Projects\CubelinkApp\sketch_may18a\sketch_may18a.ino`
- The committed v1.3.1 integration remains recoverable from Git commit `92db64a`.

## Unused web assets

`unused-web-assets/` contains assets that were tracked in the active web root
but had no references from the current HTML, CSS, JavaScript, or manifest.
`로고.png` is byte-for-byte identical to the active `studio/web/logo.png`.

Do not move files back into the active project without checking references and
testing the Studio build.

## Generated task artifacts

`task-artifacts-2026-07-18/` contains the exported ZIP, duplicate `.ino` and
`.txt` copies, temporary Arduino CLI configuration, and extracted inline-script
files produced during the earlier firmware task. They were moved out of the
temporary Codex task folder so that there is only one active source location.
These files are evidence/history only; use the current source under `firmware/`.
