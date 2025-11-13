import { app as l, BrowserWindow as h, ipcMain as i, dialog as g, shell as b } from "electron";
import a from "path";
import { fileURLToPath as y } from "url";
import { spawn as k } from "child_process";
const S = y(import.meta.url), p = a.dirname(S), m = process.env.NODE_ENV === "development";
let e, s = null;
function u(o, t, r) {
  if (console.log(`[PROGRESS] ${o}: ${t}% - ${r}`), e && e.webContents && !e.isDestroyed())
    try {
      e.webContents.send("backend-progress", { phase: o, progress: t, message: r }), console.log(`[IPC] Sent progress update to renderer: ${o}`);
    } catch (c) {
      console.error("[IPC] Failed to send progress update:", c);
    }
  else
    console.warn("[IPC] Main window not ready, cannot send progress update");
}
function P() {
  const o = a.join(p, "../../backend"), t = a.join(o, "venv", "Scripts", "python.exe"), r = a.join(o, "run.py");
  console.log("Starting backend server..."), console.log("Backend path:", o), console.log("Python executable:", t), console.log("Run script:", r), s = k(t, [r], {
    cwd: o,
    stdio: ["pipe", "pipe", "pipe"],
    shell: !0
  }), [
    { phase: "initializing", progress: 25, message: "Initializing system...", delay: 0 },
    { phase: "server", progress: 50, message: "Starting backend services...", delay: 2e3 },
    { phase: "database", progress: 75, message: "Setting up database...", delay: 4e3 },
    { phase: "ready", progress: 100, message: "Backend ready!", delay: 6e3 }
  ].forEach(({ phase: n, progress: d, message: f, delay: v }) => {
    setTimeout(() => {
      u(n, d, f);
    }, v);
  }), s.stdout.on("data", (n) => {
    const d = n.toString();
    console.log("Backend stdout:", d);
  }), s.stderr.on("data", (n) => {
    const d = n.toString();
    console.error("Backend stderr:", d);
  }), s.on("close", (n) => {
    console.log(`Backend process exited with code ${n}`), n !== 0 && u("error", 0, `Backend failed to start (exit code: ${n})`);
  }), s.on("error", (n) => {
    console.error("Failed to start backend process:", n), u("error", 0, "Failed to start backend process");
  }), setTimeout(() => {
    console.log("Backend server should be running on http://127.0.0.1:5000");
  }, 5e3);
}
function x() {
  s && (console.log("Stopping backend server..."), s.kill("SIGTERM"), setTimeout(() => {
    s.killed || s.kill("SIGKILL");
  }, 5e3), s = null);
}
function w() {
  e = new h({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      enableRemoteModule: !1,
      preload: a.join(p, "preload.js")
    },
    icon: process.platform === "win32" ? a.join(p, "../build/icon.ico") : void 0,
    show: !1,
    // Don't show until ready
    titleBarStyle: "default",
    autoHideMenuBar: !0
  });
  const o = m ? "http://localhost:5173" : `file://${a.join(p, "../dist/index.html")}`;
  e.loadURL(o), e.once("ready-to-show", () => {
    e.show(), e.maximize(), m && e.webContents.openDevTools();
  }), e.webContents.setWindowOpenHandler(({ url: t }) => (b.openExternal(t), { action: "deny" })), e.on("closed", () => {
    e = null;
  });
}
l.whenReady().then(() => {
  w(), setTimeout(() => {
    P();
  }, 2e3);
});
l.on("window-all-closed", () => {
  process.platform !== "darwin" && l.quit();
});
l.on("activate", () => {
  h.getAllWindows().length === 0 && w();
});
l.on("before-quit", () => {
  x();
});
l.on("web-contents-created", (o, t) => {
  t.on("will-navigate", (r, c) => {
    const n = new URL(c);
    n.origin !== "http://localhost:5173" && n.origin !== "file://" && r.preventDefault();
  });
});
i.handle("dialog:openFile", async () => await g.showOpenDialog(e, {
  properties: ["openFile"],
  filters: [
    { name: "All Files", extensions: ["*"] }
  ]
}));
i.handle("dialog:saveFile", async (o, t) => await g.showSaveDialog(e, t));
i.handle("dialog:openDirectory", async () => await g.showOpenDialog(e, {
  properties: ["openDirectory"]
}));
i.handle("app:getVersion", () => l.getVersion());
i.handle("app:getPlatform", () => process.platform);
i.on("window:minimize", () => {
  e.minimize();
});
i.on("window:maximize", () => {
  e.isMaximized() ? e.unmaximize() : e.maximize();
});
i.on("window:close", () => {
  e.close();
});
