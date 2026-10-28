const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cubelink', {
  getVersion: () => ipcRenderer.sendSync('get-app-version'),
  listPorts: () => ipcRenderer.invoke('list-ports'),
  connect:   (p) => ipcRenderer.invoke('connect', p),
  write:     (d) => ipcRenderer.invoke('write', d),
  disconnect: () => ipcRenderer.invoke('disconnect'),
   focusWindow: () => ipcRenderer.invoke('focus-window'),
  onData:    (cb) => ipcRenderer.on('serial-data',   (_e, d) => cb(d)),
  onStatus:  (cb) => ipcRenderer.on('serial-status', (_e, s) => cb(s)),
  factoryStart: (config) => ipcRenderer.invoke('factory-start', config),
  factoryStop: () => ipcRenderer.invoke('factory-stop'),
  factorySendEvent: (eventName) => ipcRenderer.invoke('factory-send-event', eventName),
  onFactoryStatus: (cb) => ipcRenderer.on('factory-status', (_e, s) => cb(s)),
  onFactoryEvent: (cb) => ipcRenderer.on('factory-event', (_e, event) => cb(event))
});
