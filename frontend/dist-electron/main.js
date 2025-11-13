import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === "development";
let mainWindow;
let backendProcess = null;
function sendProgressUpdate(phase, progress, message) {
  console.log(`[PROGRESS] ${phase}: ${progress}% - ${message}`);
  if (mainWindow && mainWindow.webContents && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send("backend-progress", { phase, progress, message });
      console.log(`[IPC] Sent progress update to renderer: ${phase}`);
    } catch (error) {
      console.error("[IPC] Failed to send progress update:", error);
    }
  } else {
    console.warn("[IPC] Main window not ready, cannot send progress update");
  }
}
function startBackendServer() {
  const isDev2 = process.env.NODE_ENV === "development";
  const isPackaged = app.isPackaged;
  if (isDev2 || !isPackaged) {
    const backendPath = path.join(__dirname, "../../backend");
    const venvPath = path.join(backendPath, "venv", "Scripts", "python.exe");
    const runScript = path.join(backendPath, "run.py");
    console.log("Starting backend server in DEV mode...");
    console.log("Backend path:", backendPath);
    console.log("Python executable:", venvPath);
    console.log("Run script:", runScript);
    backendProcess = spawn(venvPath, [runScript], {
      cwd: backendPath,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true
    });
  } else {
    const backendExePath = path.join(process.resourcesPath, "resources", "sentra-backend.exe");
    console.log("Starting backend server in PRODUCTION mode...");
    console.log("Backend executable:", backendExePath);
    backendProcess = spawn(backendExePath, [], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: false
    });
  }
  const progressPhases = [
    { phase: "initializing", progress: 25, message: "Initializing system...", delay: 0 },
    { phase: "server", progress: 50, message: "Starting backend services...", delay: 2e3 },
    { phase: "database", progress: 75, message: "Setting up database...", delay: 4e3 },
    { phase: "ready", progress: 100, message: "Backend ready!", delay: 6e3 }
  ];
  progressPhases.forEach(({ phase, progress, message, delay }) => {
    setTimeout(() => {
      sendProgressUpdate(phase, progress, message);
    }, delay);
  });
  backendProcess.stdout.on("data", (data) => {
    const output = data.toString();
    console.log("Backend stdout:", output);
  });
  backendProcess.stderr.on("data", (data) => {
    const output = data.toString();
    console.error("Backend stderr:", output);
  });
  backendProcess.on("close", (code) => {
    console.log(`Backend process exited with code ${code}`);
    if (code !== 0) {
      sendProgressUpdate("error", 0, `Backend failed to start (exit code: ${code})`);
    }
  });
  backendProcess.on("error", (error) => {
    console.error("Failed to start backend process:", error);
    sendProgressUpdate("error", 0, "Failed to start backend process");
  });
  setTimeout(() => {
    console.log("Backend server should be running on http://127.0.0.1:5000");
  }, 5e3);
}
function stopBackendServer() {
  if (backendProcess) {
    console.log("Stopping backend server...");
    backendProcess.kill("SIGTERM");
    setTimeout(() => {
      if (!backendProcess.killed) {
        backendProcess.kill("SIGKILL");
      }
    }, 5e3);
    backendProcess = null;
  }
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js")
    },
    icon: process.platform === "win32" ? path.join(__dirname, "../build/icon.ico") : void 0,
    show: false,
    // Don't show until ready
    titleBarStyle: "default",
    autoHideMenuBar: true
  });
  const startUrl = isDev ? "http://localhost:5173" : `file://${path.join(__dirname, "../dist/index.html")}`;
  mainWindow.loadURL(startUrl);
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.whenReady().then(() => {
  createWindow();
  setTimeout(() => {
    startBackendServer();
  }, 2e3);
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.on("before-quit", () => {
  stopBackendServer();
});
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (event2, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== "http://localhost:5173" && parsedUrl.origin !== "file://") {
      event2.preventDefault();
    }
  });
});
ipcMain.handle("dialog:openFile", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "All Files", extensions: ["*"] }
    ]
  });
  return result;
});
ipcMain.handle("dialog:saveFile", async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});
ipcMain.handle("dialog:openDirectory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"]
  });
  return result;
});
ipcMain.handle("app:getVersion", () => {
  return app.getVersion();
});
ipcMain.handle("app:getPlatform", () => {
  return process.platform;
});
ipcMain.on("window:minimize", () => {
  mainWindow.minimize();
});
ipcMain.on("window:maximize", () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.on("window:close", () => {
  mainWindow.close();
});
