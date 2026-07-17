# CubeLink Studio

- `web/` contains the shared HTML, CSS, JavaScript, models, and web assets.
- `electron/` contains the Windows desktop host and packaging configuration.

The serial adapter in `web/js/webserial-polyfill.js` selects the appropriate
implementation for Electron, Capacitor Android, or a browser with native Web
Serial support.
