import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object and backend process
let mainWindow;
let backendProcess = null;

function sendProgressUpdate(phase, progress, message) {
  console.log(`[PROGRESS] ${phase}: ${progress}% - ${message}`);
  if (mainWindow && mainWindow.webContents && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('backend-progress', { phase, progress, message });
      console.log(`[IPC] Sent progress update to renderer: ${phase}`);
    } catch (error) {
      console.error('[IPC] Failed to send progress update:', error);
    }
  } else {
    console.warn('[IPC] Main window not ready, cannot send progress update');
  }
}

function startBackendServer() {
  const isDev = process.env.NODE_ENV === 'development';
  const isPackaged = app.isPackaged;
  
  if (isDev || !isPackaged) {
    // Development: Use Python with venv
    const backendPath = path.join(__dirname, '../../backend');
    const venvPath = path.join(backendPath, 'venv', 'Scripts', 'python.exe');
    const runScript = path.join(backendPath, 'run.py');

    console.log('Starting backend server in DEV mode...');
    console.log('Backend path:', backendPath);
    console.log('Python executable:', venvPath);
    console.log('Run script:', runScript);

    backendProcess = spawn(venvPath, [runScript], {
      cwd: backendPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
  } else {
    // Production: Use bundled executable (only when packaged)
    const backendExePath = path.join(process.resourcesPath, 'resources', 'sentra-backend.exe');
    
    console.log('Starting backend server in PRODUCTION mode...');
    console.log('Backend executable:', backendExePath);

    backendProcess = spawn(backendExePath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false
    });
  }

  // Progress phases with faster, broader timing
  const progressPhases = [
    { phase: 'initializing', progress: 25, message: 'Initializing system...', delay: 0 },
    { phase: 'server', progress: 50, message: 'Starting backend services...', delay: 2000 },
    { phase: 'database', progress: 75, message: 'Setting up database...', delay: 4000 },
    { phase: 'ready', progress: 100, message: 'Backend ready!', delay: 6000 }
  ];

  // Send progress updates at fixed intervals
  progressPhases.forEach(({ phase, progress, message, delay }) => {
    setTimeout(() => {
      sendProgressUpdate(phase, progress, message);
    }, delay);
  });

  // Handle backend process output for logging only (not for progress tracking)
  backendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('Backend stdout:', output);
  });

  backendProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.error('Backend stderr:', output);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    if (code !== 0) {
      sendProgressUpdate('error', 0, `Backend failed to start (exit code: ${code})`);
    }
  });

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend process:', error);
    sendProgressUpdate('error', 0, 'Failed to start backend process');
  });

  // Wait for server to be fully ready
  setTimeout(() => {
    console.log('Backend server should be running on http://127.0.0.1:5000');
  }, 5000);
}

function stopBackendServer() {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill('SIGTERM');

    // Force kill after 5 seconds if it doesn't exit gracefully
    setTimeout(() => {
      if (!backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }, 5000);

    backendProcess = null;
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: process.platform === 'win32' ? path.join(__dirname, '../build/icon.ico') : undefined,
    show: false, // Don't show until ready
    titleBarStyle: 'default',
    autoHideMenuBar: true,
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Create the window and start backend after a short delay to allow React app to load
  createWindow();

  // Give React app time to load before starting backend
  setTimeout(() => {
    startBackendServer();
  }, 2000);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications to stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Ensure backend server is stopped when app is quitting
app.on('before-quit', () => {
  stopBackendServer();
});

// Security: Prevent navigation to external websites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});

// IPC handlers for file operations
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result;
});

// Handle app updates and notifications
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPlatform', () => {
  return process.platform;
});

// Handle window controls
ipcMain.on('window:minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow.close();
});