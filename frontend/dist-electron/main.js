import { app as a, BrowserWindow as w, ipcMain as l, dialog as u, shell as v } from "electron";
import i from "path";
import { fileURLToPath as b } from "url";
import { spawn as m } from "child_process";
const y = b(import.meta.url), p = i.dirname(y), h = process.env.NODE_ENV === "development";
let o, s = null;
function g(n, r, c) {
  if (console.log(`[PROGRESS] ${n}: ${r}% - ${c}`), o && o.webContents && !o.isDestroyed())
    try {
      o.webContents.send("backend-progress", { phase: n, progress: r, message: c }), console.log(`[IPC] Sent progress update to renderer: ${n}`);
    } catch (e) {
      console.error("[IPC] Failed to send progress update:", e);
    }
  else
    console.warn("[IPC] Main window not ready, cannot send progress update");
}
function P() {
  const n = process.env.NODE_ENV === "development", r = a.isPackaged;
  if (n || !r) {
    const e = i.join(p, "../../backend"), t = i.join(e, "venv", "Scripts", "python.exe"), d = i.join(e, "run.py");
    console.log("Starting backend server in DEV mode..."), console.log("Backend path:", e), console.log("Python executable:", t), console.log("Run script:", d), s = m(t, [d], {
      cwd: e,
      stdio: ["pipe", "pipe", "pipe"],
      shell: !0
    });
  } else {
    const e = i.join(process.resourcesPath, "resources", "sentra-backend.exe");
    console.log("Starting backend server in PRODUCTION mode..."), console.log("Backend executable:", e), s = m(e, [], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: !1
    });
  }
  [
    { phase: "initializing", progress: 25, message: "Initializing system...", delay: 0 },
    { phase: "server", progress: 50, message: "Starting backend services...", delay: 2e3 },
    { phase: "database", progress: 75, message: "Setting up database...", delay: 4e3 },
    { phase: "ready", progress: 100, message: "Backend ready!", delay: 6e3 }
  ].forEach(({ phase: e, progress: t, message: d, delay: k }) => {
    setTimeout(() => {
      g(e, t, d);
    }, k);
  }), s.stdout.on("data", (e) => {
    const t = e.toString();
    console.log("Backend stdout:", t);
  }), s.stderr.on("data", (e) => {
    const t = e.toString();
    console.error("Backend stderr:", t);
  }), s.on("close", (e) => {
    console.log(`Backend process exited with code ${e}`), e !== 0 && g("error", 0, `Backend failed to start (exit code: ${e})`);
  }), s.on("error", (e) => {
    console.error("Failed to start backend process:", e), g("error", 0, "Failed to start backend process");
  }), setTimeout(() => {
    console.log("Backend server should be running on http://127.0.0.1:5000");
  }, 5e3);
}
function S() {
  s && (console.log("Stopping backend server..."), s.kill("SIGTERM"), setTimeout(() => {
    s.killed || s.kill("SIGKILL");
  }, 5e3), s = null);
}
function f() {
  o = new w({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      enableRemoteModule: !1,
      preload: i.join(p, "preload.js")
    },
    icon: process.platform === "win32" ? i.join(p, "../build/icon.ico") : void 0,
    show: !1,
    // Don't show until ready
    titleBarStyle: "default",
    autoHideMenuBar: !0
  });
  const n = h ? "http://localhost:5173" : `file://${i.join(p, "../dist/index.html")}`;
  o.loadURL(n), o.once("ready-to-show", () => {
    o.show(), o.maximize(), h && o.webContents.openDevTools();
  }), o.webContents.setWindowOpenHandler(({ url: r }) => (v.openExternal(r), { action: "deny" })), o.on("closed", () => {
    o = null;
  });
}
a.whenReady().then(() => {
  f(), setTimeout(() => {
    P();
  }, 2e3);
});
a.on("window-all-closed", () => {
  process.platform !== "darwin" && a.quit();
});
a.on("activate", () => {
  w.getAllWindows().length === 0 && f();
});
a.on("before-quit", () => {
  S();
});
a.on("web-contents-created", (n, r) => {
  r.on("will-navigate", (c, e) => {
    const t = new URL(e);
    t.origin !== "http://localhost:5173" && t.origin !== "file://" && c.preventDefault();
  });
});
l.handle("dialog:openFile", async () => await u.showOpenDialog(o, {
  properties: ["openFile"],
  filters: [
    { name: "All Files", extensions: ["*"] }
  ]
}));
l.handle("dialog:saveFile", async (n, r) => await u.showSaveDialog(o, r));
l.handle("dialog:openDirectory", async () => await u.showOpenDialog(o, {
  properties: ["openDirectory"]
}));
l.handle("app:getVersion", () => a.getVersion());
l.handle("app:getPlatform", () => process.platform);
l.on("window:minimize", () => {
  o.minimize();
});
l.on("window:maximize", () => {
  o.isMaximized() ? o.unmaximize() : o.maximize();
});
l.on("window:close", () => {
  o.close();
});
