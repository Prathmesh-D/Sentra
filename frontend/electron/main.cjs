import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Keep a global reference of the window object and backend process
let mainWindow;
let backendProcess = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.sentra.crypto');
}

function broadcastAuthClear() {
  for (const win of BrowserWindow.getAllWindows()) {
    try {
      win.webContents.send('auth-clear');
    } catch (error) {
      console.error('[AUTH] Failed to send auth-clear:', error);
    }
  }
}

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

function buildBackendEnv() {
  const backendBaseDir = app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '../../backend');
  const dataDir = path.join(backendBaseDir, 'data');
  const logFile = path.join(backendBaseDir, 'logs', 'app.log');

  const envFromFile = loadEnvFile(path.join(backendBaseDir, '.env'));

  return {
    ...process.env,
    ...envFromFile,
    BACKEND_BASE_DIR: process.env.BACKEND_BASE_DIR || backendBaseDir,
    DATA_DIR: process.env.DATA_DIR || dataDir,
    LOG_FILE: process.env.LOG_FILE || logFile,
    HOST: process.env.HOST || '127.0.0.1',
    PORT: process.env.PORT || '5000',
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    SECRET_KEY: process.env.SECRET_KEY,
    MONGO_URI: process.env.MONGO_URI,
    MONGO_DB_NAME: process.env.MONGO_DB_NAME,
    MONGO_COLLECTION_USERS: process.env.MONGO_COLLECTION_USERS,
    MONGO_COLLECTION_FILES: process.env.MONGO_COLLECTION_FILES,
    MONGO_COLLECTION_RECIPIENTS: process.env.MONGO_COLLECTION_RECIPIENTS,
    BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS,
    TOKEN_EXPIRY_HOURS: process.env.TOKEN_EXPIRY_HOURS,
    REFRESH_TOKEN_EXPIRY_DAYS: process.env.REFRESH_TOKEN_EXPIRY_DAYS,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    LOG_LEVEL: process.env.LOG_LEVEL,
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
  };
}

function loadEnvFile(envPath) {
  try {
    if (!fs.existsSync(envPath)) {
      return {};
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
        continue;
      }
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (key && !(key in env)) {
        env[key] = value;
      }
    }
    return env;
  } catch (error) {
    console.error('[ENV] Failed to load .env:', error);
    return {};
  }
}

function waitForBackendHealth(timeoutMs = 15000, intervalMs = 500) {
  const host = process.env.HOST || '127.0.0.1';
  const port = process.env.PORT || '5000';
  const start = Date.now();

  return new Promise((resolve) => {
    const tick = () => {
      const req = http.get({
        host,
        port,
        path: '/api/ready',
        timeout: 2000,
      }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          res.resume();
          resolve(true);
          return;
        }
        res.resume();
        if (Date.now() - start >= timeoutMs) {
          resolve(false);
          return;
        }
        setTimeout(tick, intervalMs);
      });

      req.on('error', () => {
        if (Date.now() - start >= timeoutMs) {
          resolve(false);
          return;
        }
        setTimeout(tick, intervalMs);
      });
    };

    tick();
  });
}

function startBackendServer() {
  const isDev = process.env.NODE_ENV === 'development';
  const isPackaged = app.isPackaged;
  const env = buildBackendEnv();

  if (isDev || !isPackaged) {
    // Development: Run Java backend from source
    const backendPath = path.join(__dirname, '../../backend');
    const devScriptWin = path.join(backendPath, 'run-backend-dev.ps1');
    const devScriptUnix = path.join(backendPath, 'run-backend-dev.sh');

    console.log('Starting backend server in DEV mode (Java)...');
    console.log('Backend path:', backendPath);

    if (process.platform === 'win32') {
      // Use full path — spawn with shell:false can't always resolve powershell.exe from PATH
      const psPath = path.join(process.env.SystemRoot || 'C:\\WINDOWS', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
      backendProcess = spawn(psPath, ['-ExecutionPolicy', 'Bypass', '-File', devScriptWin], {
        cwd: backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        env
      });
    } else {
      backendProcess = spawn('bash', [devScriptUnix], {
        cwd: backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        env
      });
    }
  } else {
    // Production: Use bundled Java backend jar
    const backendJarPath = path.join(process.resourcesPath, 'resources', 'sentra-backend.jar');

    console.log('Starting backend server in PRODUCTION mode (Java)...');
    console.log('Backend jar:', backendJarPath);

    backendProcess = spawn('java', ['-jar', backendJarPath], {
      cwd: process.resourcesPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      env
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
  waitForBackendHealth().then((healthy) => {
    if (healthy) {
      console.log('Backend server is healthy at http://127.0.0.1:5000');
    } else {
      console.warn('Backend health check timed out');
    }
  });
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

app.on('before-quit', () => {
  broadcastAuthClear();
});

app.on('window-all-closed', () => {
  broadcastAuthClear();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }
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
    icon: process.platform === 'win32' ? path.join(__dirname, '../build/SentraApp.ico') : path.join(__dirname, '../build/favicon-256.png'),
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

// Auto-updater event handlers
function checkForUpdates() {
  console.log('[UPDATE] Checking for updates...');
  autoUpdater.checkForUpdates();
}

autoUpdater.on('checking-for-update', () => {
  console.log('[UPDATE] Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[UPDATE] Update available:', info.version);
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `A new version ${info.version} is available. Would you like to download it now?`,
    buttons: ['Download', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('[UPDATE] No updates available. Current version:', info.version);
});

autoUpdater.on('error', (err) => {
  console.error('[UPDATE] Error checking for updates:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Downloaded ${progressObj.percent.toFixed(2)}%`;
  log_message = log_message + ` (${progressObj.transferred}/${progressObj.total})`;
  console.log('[UPDATE]', log_message);
  
  // Send progress to renderer if window exists
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[UPDATE] Update downloaded:', info.version);
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: `Version ${info.version} has been downloaded. The application will restart to install the update.`,
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Start backend first, then create the window
  startBackendServer();
  await waitForBackendHealth();
  createWindow();

  // Check for updates (only in production)
  if (!isDev && app.isPackaged) {
    setTimeout(() => {
      checkForUpdates();
    }, 5000); // Check for updates 5 seconds after app starts
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications to stay active until explicitly quit
  if (process.platform !== 'darwin') {
    stopBackendServer();
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.on('before-quit', () => {
  stopBackendServer();
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

ipcMain.on('window:focus', () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }
    win.show();
    win.focus();
    win.webContents.focus();
  }
});