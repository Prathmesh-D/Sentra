const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')

let mainWindow = null
let backendProcess = null

function broadcastAuthClear() {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    try {
      win.webContents.send('auth-clear')
    } catch (error) {
      console.error('[AUTH] Failed to send auth-clear:', error)
    }
  }
}

function getBackendExecutablePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'sentra-backend.exe')
  }
  return path.join(__dirname, 'frontend', 'resources', 'sentra-backend.exe')
}

function waitForBackendHealth(timeoutMs = 30000, intervalMs = 700) {
  const start = Date.now()

  return new Promise((resolve) => {
    const tick = () => {
      const req = http.get(
        {
          host: '127.0.0.1',
          port: 5000,
          path: '/api/health',
          timeout: 4000,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            res.resume()
            resolve(true)
            return
          }
          res.resume()
          if (Date.now() - start >= timeoutMs) {
            resolve(false)
            return
          }
          setTimeout(tick, intervalMs)
        }
      )

      req.on('error', () => {
        if (Date.now() - start >= timeoutMs) {
          resolve(false)
          return
        }
        setTimeout(tick, intervalMs)
      })

      req.on('timeout', () => {
        req.destroy()
      })
    }

    tick()
  })
}

function startBackendServer() {
  if (process.platform !== 'win32') {
    console.warn('[BACKEND] Local bundled backend is currently supported only on Windows.')
    return
  }

  if (backendProcess) {
    return
  }

  const backendExe = getBackendExecutablePath()
  const backendEnv = {
    ...process.env,
    HOST: process.env.HOST || '127.0.0.1',
    PORT: process.env.PORT || '5000',
    APP_ENV: process.env.APP_ENV || 'development',
  }

  console.log('[BACKEND] Starting bundled backend:', backendExe)
  backendProcess = spawn(backendExe, {
    cwd: app.isPackaged ? process.resourcesPath : path.join(__dirname, 'frontend', 'resources'),
    env: backendEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    detached: false,
    shell: false,
  })

  backendProcess.stdout.on('data', (data) => {
    console.log('[BACKEND][stdout]', data.toString())
  })

  backendProcess.stderr.on('data', (data) => {
    console.error('[BACKEND][stderr]', data.toString())
  })

  backendProcess.on('close', (code) => {
    console.log(`[BACKEND] Process exited with code ${code}`)
    backendProcess = null
  })

  backendProcess.on('error', (error) => {
    console.error('[BACKEND] Failed to start:', error)
  })

  waitForBackendHealth().then((ready) => {
    if (ready) {
      console.log('[BACKEND] Healthy at http://127.0.0.1:5000/api/health')
      return
    }
    console.warn('[BACKEND] Health check timed out. UI will still open; requests may fail until backend is ready.')
  })
}

function stopBackendServer() {
  if (!backendProcess) {
    return
  }
  console.log('[BACKEND] Stopping bundled backend...')
  backendProcess.kill('SIGTERM')
  setTimeout(() => {
    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill('SIGKILL')
    }
    backendProcess = null
  }, 5000)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'frontend', 'build', 'SentraApp.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  })

  Menu.setApplicationMenu(null)

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'))
  } else {
    mainWindow.loadURL('http://localhost:5173')
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.sentra.crypto')
  }
  startBackendServer()
  createWindow()
})

app.on('before-quit', () => {
  broadcastAuthClear()
  stopBackendServer()
})

app.on('window-all-closed', () => {
  broadcastAuthClear()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})