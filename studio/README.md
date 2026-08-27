# CubeLink Studio

- `web/` contains the shared HTML, CSS, JavaScript, models, and web assets.
- `electron/` contains the Windows desktop host and packaging configuration.
- `tablet/` is the separate touch-first Android tablet app. It has its own
  Vite/TypeScript UI, Capacitor Android project, design record, and build flow.

The existing `web/` and `electron/` directories remain the CubeLink Studio
Desktop codebase. Tablet work must not overwrite or silently reshape them.

The serial adapter in `web/js/webserial-polyfill.js` selects the appropriate
implementation for Electron, Capacitor Android, or a browser with native Web
Serial support.
