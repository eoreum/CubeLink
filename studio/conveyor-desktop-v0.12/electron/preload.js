'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('conveyorDesktop', {
  getVersion: () => ipcRenderer.sendSync('get-app-version'),
  listPorts: () => ipcRenderer.invoke('list-ports'),
  probePort: path => ipcRenderer.invoke('probe-port', path),
  autoDiscover: () => ipcRenderer.invoke('auto-discover'),
  connect: path => ipcRenderer.invoke('connect', path),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  setAutoReconnect: enabled => ipcRenderer.invoke('set-auto-reconnect', enabled),
  write: data => ipcRenderer.invoke('write', data),
  factoryStart: config => ipcRenderer.invoke('factory-start', config),
  factoryStop: () => ipcRenderer.invoke('factory-stop'),
  factorySendEvent: eventName => ipcRenderer.invoke('factory-send-event', eventName),
  onFactoryStatus: callback => ipcRenderer.on('factory-status', (_event, status) => callback(status)),
  onFactoryEvent: callback => ipcRenderer.on('factory-event', (_event, message) => callback(message)),
  onData: callback => ipcRenderer.on('serial-data', (_event, data) => callback(data)),
  onStatus: callback => ipcRenderer.on('serial-status', (_event, status) => callback(status))
});
