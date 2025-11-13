import { app as c, BrowserWindow as h, ipcMain as a, dialog as u, shell as v } from "electron";
import i from "path";
import { fileURLToPath as b } from "url";
import { spawn as g } from "child_process";
const k = b(import.meta.url), d = i.dirname(k), m = process.env.NODE_ENV === "development";
let o, t = null;
function p(s, r, e) {
  if (console.log(`[PROGRESS] ${s}: ${r}% - ${e}`), o && o.webContents && !o.isDestroyed())
    try {
      o.webContents.send("backend-progress", { phase: s, progress: r, message: e }), console.log(`[IPC] Sent progress update to renderer: ${s}`);
    } catch (n) {
      console.error("[IPC] Failed to send progress update:", n);
    }
  else
    console.warn("[IPC] Main window not ready, cannot send progress update");
}
function y() {
  if (process.env.NODE_ENV === "development") {
    const e = i.join(d, "../../backend"), n = i.join(e, "venv", "Scripts", "python.exe"), l = i.join(e, "run.py");
    console.log("Starting backend server in DEV mode..."), console.log("Backend path:", e), console.log("Python executable:", n), console.log("Run script:", l), t = g(n, [l], {
      cwd: e,
      stdio: ["pipe", "pipe", "pipe"],
      shell: !0
    });
  } else {
    const e = i.join(process.resourcesPath, "resources", "sentra-backend.exe");
    console.log("Starting backend server in PRODUCTION mode..."), console.log("Backend executable:", e), t = g(e, [], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: !1
    });
  }
  [
    { phase: "initializing", progress: 25, message: "Initializing system...", delay: 0 },
    { phase: "server", progress: 50, message: "Starting backend services...", delay: 2e3 },
    { phase: "database", progress: 75, message: "Setting up database...", delay: 4e3 },
    { phase: "ready", progress: 100, message: "Backend ready!", delay: 6e3 }
  ].forEach(({ phase: e, progress: n, message: l, delay: f }) => {
    setTimeout(() => {
      p(e, n, l);
    }, f);
  }), t.stdout.on("data", (e) => {
    const n = e.toString();
    console.log("Backend stdout:", n);
  }), t.stderr.on("data", (e) => {
    const n = e.toString();
    console.error("Backend stderr:", n);
  }), t.on("close", (e) => {
    console.log(`Backend process exited with code ${e}`), e !== 0 && p("error", 0, `Backend failed to start (exit code: ${e})`);
  }), t.on("error", (e) => {
    console.error("Failed to start backend process:", e), p("error", 0, "Failed to start backend process");
  }), setTimeout(() => {
    console.log("Backend server should be running on http://127.0.0.1:5000");
  }, 5e3);
}
function S() {
  t && (console.log("Stopping backend server..."), t.kill("SIGTERM"), setTimeout(() => {
    t.killed || t.kill("SIGKILL");
  }, 5e3), t = null);
}
function w() {
  o = new h({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      enableRemoteModule: !1,
      preload: i.join(d, "preload.js")
    },
    icon: process.platform === "win32" ? i.join(d, "../build/icon.ico") : void 0,
    show: !1,
    // Don't show until ready
    titleBarStyle: "default",
    autoHideMenuBar: !0
  });
  const s = m ? "http://localhost:5173" : `file://${i.join(d, "../dist/index.html")}`;
  o.loadURL(s), o.once("ready-to-show", () => {
    o.show(), o.maximize(), m && o.webContents.openDevTools();
  }), o.webContents.setWindowOpenHandler(({ url: r }) => (v.openExternal(r), { action: "deny" })), o.on("closed", () => {
    o = null;
  });
}
c.whenReady().then(() => {
  w(), setTimeout(() => {
    y();
  }, 2e3);
});
c.on("window-all-closed", () => {
  process.platform !== "darwin" && c.quit();
});
c.on("activate", () => {
  h.getAllWindows().length === 0 && w();
});
c.on("before-quit", () => {
  S();
});
c.on("web-contents-created", (s, r) => {
  r.on("will-navigate", (e, n) => {
    const l = new URL(n);
    l.origin !== "http://localhost:5173" && l.origin !== "file://" && e.preventDefault();
  });
});
a.handle("dialog:openFile", async () => await u.showOpenDialog(o, {
  properties: ["openFile"],
  filters: [
    { name: "All Files", extensions: ["*"] }
  ]
}));
a.handle("dialog:saveFile", async (s, r) => await u.showSaveDialog(o, r));
a.handle("dialog:openDirectory", async () => await u.showOpenDialog(o, {
  properties: ["openDirectory"]
}));
a.handle("app:getVersion", () => c.getVersion());
a.handle("app:getPlatform", () => process.platform);
a.on("window:minimize", () => {
  o.minimize();
});
a.on("window:maximize", () => {
  o.isMaximized() ? o.unmaximize() : o.maximize();
});
a.on("window:close", () => {
  o.close();
});
