import { contextBridge as n, ipcRenderer as e } from "electron";
n.exposeInMainWorld("electronAPI", {
  // File dialog operations
  openFile: () => e.invoke("dialog:openFile"),
  saveFile: (o) => e.invoke("dialog:saveFile", o),
  openDirectory: () => e.invoke("dialog:openDirectory"),
  // App information
  getVersion: () => e.invoke("app:getVersion"),
  getPlatform: () => e.invoke("app:getPlatform"),
  // Window controls
  minimizeWindow: () => e.send("window:minimize"),
  maximizeWindow: () => e.send("window:maximize"),
  closeWindow: () => e.send("window:close"),
  // Listen for app events
  onUpdateAvailable: (o) => e.on("update-available", o),
  onUpdateDownloaded: (o) => e.on("update-downloaded", o),
  // Remove listeners
  removeAllListeners: (o) => e.removeAllListeners(o)
});
n.exposeInMainWorld("nodeAPI", {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
