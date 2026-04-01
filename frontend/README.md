# Sentra Frontend

React + TypeScript + Vite frontend for Sentra. Supports both web deployment and Electron desktop packaging.

## Tech

- React 19
- TypeScript 5
- Vite 7
- Axios client for backend API integration
- Electron builder for desktop releases

## Setup

```powershell
cd frontend
npm install
```

## Development

```powershell
npm run dev
```

Dev server default: `http://localhost:5173`

## Build Targets

- `npm run build`: production frontend bundle
- `npm run build:web`: web-only build with `VITE_WEB=true`
- `npm run preview`: preview built web output

## Desktop Targets

- `npm run electron`: build and run Electron app
- `npm run build-electron`: create packaged desktop artifact
- `npm run build-electron-win`: Windows package
- `npm run build-electron-mac`: macOS package
- `npm run build-electron-linux`: Linux package

## Lint and Quality

- `npm run lint`

Release CI also enforces lint, typecheck, and build gates before publish.

## Environment Variables

- `VITE_API_URL`: backend base API URL (example: `http://localhost:5000/api`)
- `VITE_WEB=true`: toggles web build behavior where required

## Auth and Session Notes

- Frontend is cookie-first for browser sessions.
- For Electron/file-origin behavior, in-memory auth fallback is retained to avoid persistence in web storage.
- Session validation uses `/api/auth/me`.

## Output Directories

- Web build: `frontend/dist`
- Desktop artifacts: `frontend/dist-electron`
