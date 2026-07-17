const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cubelink', {
  listPorts: () => ipcRenderer.invoke('list-ports'),
  connect:   (p) => ipcRenderer.invoke('connect', p),
  write:     (d) => ipcRenderer.invoke('write', d),
  disconnect: () => ipcRenderer.invoke('disconnect'),
 
  onData:    (cb) => ipcRenderer.on('serial-data',   (_e, d) => cb(d)),
  onStatus:  (cb) => ipcRenderer.on('serial-status', (_e, s) => cb(s))
});
