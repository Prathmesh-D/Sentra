import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File dialog operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),

  // App information
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Listen for app events
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),

  // Remove listeners
  removeAllListeners: (event) => ipcRenderer.removeAllListeners(event)
});

// Also expose some Node.js APIs that are safe to use
contextBridge.exposeInMainWorld('nodeAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});