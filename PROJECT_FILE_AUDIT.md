# CubeLink Project File Audit

Audit date: 2026-07-19 (Asia/Seoul)

## Result

`C:\Users\dscom\Documents\Codex\CubeLink` is the single canonical working
repository. Current work must be performed here. The folders under `C:\Projects`
and the Google Drive technical-assets folder are historical/reference locations.

The current firmware is not empty. It is a UTF-8 Arduino source file with 22,627
bytes at:

```text
C:\Users\dscom\Documents\Codex\CubeLink\firmware\arduino-nano\CubeLinkBridge\CubeLinkBridge.ino
```

The Google Drive folder below was confirmed to be empty and is not a firmware
source:

```text
C:\Users\dscom\내 드라이브\[03_기술자산_설계_코드]\큐브링크\CUBELINK Bridge Firmware v1
```

This empty folder or an incorrect file link is the most likely explanation for
opening a blank firmware location yesterday.

## Canonical current files

| Area | Current location | Status |
| --- | --- | --- |
| Arduino Nano firmware | `firmware/arduino-nano/CubeLinkBridge/CubeLinkBridge.ino` | v1.4.1 staged; physical validation pending |
| Shared Studio UI | `studio/web/` | v3.4.3 staged |
| Windows Electron host | `studio/electron/` | v3.4.3 packaging previously succeeded |
| Project decisions | `PROJECT_CONTEXT.md` | current |
| Work status | `PROJECT_STATUS.md` | current |
| Next steps | `CONTINUE_HERE.md` | current |

## Historical locations inspected

| Location | Classification |
| --- | --- |
| `C:\Projects\CubelinkApp` | Original web/Android source and generated files |
| `C:\Projects\CubelinkElectron` | Original Electron source and generated files |
| `C:\Projects\Cubelink-studio-NEW` | Older compact Studio copy (`1.0.0` metadata; files dated 2026-07-11) |
| `C:\Projects\cubelink_bridge_copy_20260630211636` | Pre-safety firmware reference |
| `C:\Projects\FULL_BACKUP_20260711` | Full historical backup |
| `C:\Projects\_restore_tmp\Cubelink-studio-main` | May 2026 recovery snapshot and compile-server dependencies |
| Google Drive `cubelink_bridge` folder | Early 8,590-byte firmware source dated 2026-05-30 |
| Google Drive CubeLink technical-assets folder | Mechanical assets, documents, experiments, and an empty firmware folder |

No zero-byte current source file was found in the canonical repository. The five
zero-byte files found there are normal placeholders inside `node_modules` and
are ignored by Git. Historical projects contain additional generated `.gitkeep`,
Cordova placeholder, Gradle, and build-output files; these are not current source.

## Cleanup performed

- Preserved three historical firmware sources under `archive/firmware/`.
- Preserved the additional early Google Drive firmware under `archive/firmware/`.
- Moved duplicate/unreferenced web images to `archive/unused-web-assets/`.
- Moved the duplicate exported v1.4.0 files and temporary analysis files from
  the Codex task `outputs/` and `work/` folders into
  `archive/task-artifacts-2026-07-18/`.
- Kept all active HTML asset references intact; every directly referenced local
  HTML, CSS, JavaScript, icon, manifest, and cover asset exists.
- Confirmed all active JavaScript files pass Node syntax checking.
- Confirmed active `package.json` and `manifest.json` parse successfully.
- Confirmed all project Markdown and the current firmware are valid UTF-8.
- Compared the additional `Cubelink-studio-NEW` copy: its source is older and
  its Electron metadata is version `1.0.0`; the canonical repository remains
  the newer v3.4.3 integration.

## Current verification boundary

The Arduino CLI executable exists, but this Codex environment cannot access the
installed Arduino data directory under `AppData\Local\Arduino15`. Therefore the
v1.4.0 firmware still requires compilation in Arduino IDE and controlled physical
testing. Do not publish v3.4.3 or treat v1.4.0 as production-ready until that test
passes.

## Working rule

When moving between desktop and laptop, synchronize the entire canonical
repository and read `PROJECT_STATUS.md` plus `CONTINUE_HERE.md` before editing.
Do not continue work from a compiled `.hex`, Arduino temporary folder, Google
Drive's empty firmware folder, or any file under `archive/`.
