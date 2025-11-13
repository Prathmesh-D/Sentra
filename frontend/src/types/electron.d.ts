// Electron API type definitions
export interface ElectronAPI {
  openFile: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  saveFile: (options: any) => Promise<{ canceled: boolean; filePath?: string }>;
  openDirectory: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  onBackendProgress: (callback: (event: any, data: any) => void) => void;
  onUpdateAvailable: (callback: (event: any, info: any) => void) => void;
  onUpdateDownloaded: (callback: (event: any, info: any) => void) => void;
  removeAllListeners: (event: string) => void;
}

export interface NodeAPI {
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    nodeAPI?: NodeAPI;
  }
}