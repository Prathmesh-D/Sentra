import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Load a simple HTML string for testing
  mainWindow.loadURL(`data:text/html,
    <html>
      <head><title>Electron Test</title></head>
      <body>
        <h1>Electron is working!</h1>
        <p>Platform: ${process.platform}</p>
        <p>Node version: ${process.versions.node}</p>
        <p>Electron version: ${process.versions.electron}</p>
      </body>
    </html>
  `);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});