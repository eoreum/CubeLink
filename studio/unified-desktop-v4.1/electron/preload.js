'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const currentModule = ipcRenderer.sendSync('shell-current-module');
const listen = channel => callback => {
  const handler = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

contextBridge.exposeInMainWorld('studioShell', {
  getVersion: () => ipcRenderer.sendSync('get-app-version'),
  currentModule: () => currentModule,
  diagnoseCh340: () => ipcRenderer.invoke('shell-diagnose-ch340'),
  installCh340: () => ipcRenderer.invoke('shell-install-ch340'),
  openHome: () => ipcRenderer.invoke('shell-open-module', 'home'),
  openArm: () => ipcRenderer.invoke('shell-open-module', 'arm'),
  openConveyor: () => ipcRenderer.invoke('shell-open-module', 'conveyor')
});

contextBridge.exposeInMainWorld('cubelink', {
  getVersion: () => ipcRenderer.sendSync('get-app-version'),
  listPorts: () => ipcRenderer.invoke('arm-list-ports'),
  connect: portPath => ipcRenderer.invoke('arm-connect', portPath),
  write: data => ipcRenderer.invoke('arm-write', data),
  disconnect: () => ipcRenderer.invoke('arm-disconnect'),
  focusWindow: () => ipcRenderer.invoke('arm-focus-window'),
  onData: listen('arm-serial-data'),
  onStatus: listen('arm-serial-status'),
  factoryStart: config => ipcRenderer.invoke('factory-start', config),
  factoryStop: () => ipcRenderer.invoke('factory-stop'),
  factorySendEvent: eventName => ipcRenderer.invoke('factory-send-event', eventName),
  onFactoryStatus: listen('arm-factory-status'),
  onFactoryEvent: listen('arm-factory-event')
});

contextBridge.exposeInMainWorld('conveyorDesktop', {
  getVersion: () => ipcRenderer.sendSync('get-app-version'),
  listPorts: () => ipcRenderer.invoke('conveyor-list-ports'),
  probePort: portPath => ipcRenderer.invoke('conveyor-probe-port', portPath),
  autoDiscover: () => ipcRenderer.invoke('conveyor-auto-discover'),
  connect: portPath => ipcRenderer.invoke('conveyor-connect', portPath),
  disconnect: () => ipcRenderer.invoke('conveyor-disconnect'),
  setAutoReconnect: enabled => ipcRenderer.invoke('conveyor-set-auto-reconnect', enabled),
  write: data => ipcRenderer.invoke('conveyor-write', data),
  factoryStart: config => ipcRenderer.invoke('factory-start', config),
  factoryStop: () => ipcRenderer.invoke('factory-stop'),
  factorySendEvent: eventName => ipcRenderer.invoke('factory-send-event', eventName),
  onFactoryStatus: listen('conveyor-factory-status'),
  onFactoryEvent: listen('conveyor-factory-event'),
  onData: listen('conveyor-serial-data'),
  onStatus: listen('conveyor-serial-status')
});

