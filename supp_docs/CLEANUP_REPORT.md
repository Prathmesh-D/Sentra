# Codebase Cleanup Report (Jan 27, 2026)

## Scope
Electron (frontend) + Java backend (GridFS). Python backend is fully removed.

## Inventory by Category

### Runtime‑Critical
- frontend/src/** — React app logic and UI.
- frontend/electron/main.cjs — Electron main process.
- frontend/electron/preload.cjs — Secure IPC bridge.
- frontend/public/** — Static assets.
- frontend/build/** — App icons used by Electron.
- backend/src/main/java/** — Java backend runtime.
- backend/.env — Runtime config (required in deployed environments).
- backend/.env.example — Runtime config template.
- backend/data/crypto/keys/** — RSA key storage (runtime‑generated).
- backend/logs/app.log — Runtime log output.

### Build‑Critical
- frontend/package.json, frontend/package-lock.json — Frontend deps and scripts.
- frontend/tsconfig*.json — TypeScript build configuration.
- frontend/vite.config.ts — Vite + Electron bundling.
- frontend/eslint.config.js — Lint/build quality.
- backend/build.gradle, backend/settings.gradle — Java build config.
- package.json, package-lock.json — Root scripts.
- .github/workflows/release.yml — CI build/release pipeline.

### Dev‑Only (safe to keep)
- backend/run-backend-dev.ps1, backend/run-backend-dev.sh — Local dev startup.
- README.md, LOGIN_TROUBLESHOOTING.md, INSTALLATION_REQUIREMENTS.md, etc. — Documentation.
- backend/TEST_RESULTS.md, backend/DATABASE_SCHEMA.md — Documentation.
- frontend/ANIMATIONS_GUIDE.md, FINAL_UI_AUDIT.md, UI_FINALIZATION_REPORT.md — Documentation.

### Legacy / Archived
- _archive/** — Legacy Python artifacts, crypto harness, old docs, old Electron JS files, old logs.

## Archived Items
- _archive/legacy-python/.venv
- _archive/legacy-python/crypto
- _archive/legacy-python/backend-requirements.txt
- _archive/legacy-python/backend.spec
- _archive/legacy-python/generate_spec.ps1
- _archive/legacy-python/register_demo.py
- _archive/crypto-harness/crypto-harness
- _archive/legacy-electron/main.js
- _archive/legacy-electron/preload.js
- _archive/legacy-electron/test.cjs
- _archive/legacy-java/CoreHarnessRunner.java
- _archive/docs/crypto_service_gridfs.txt
- _archive/docs/crypto_service_original.txt
- _archive/docs/encryption_routes_original.txt
- _archive/docs/doc.txt
- _archive/docs/REVERT_TO_LOCAL_STORAGE.md
- _archive/docs/PHASE2_COMPLETE.md
- _archive/docs/PHASE3_COMPLETE.md
- _archive/docs/SETUP_COMPLETE.md
- _archive/logs/backend-app.log.1
- _archive/logs/backend-app.log.lck

## Removed Generated Artifacts
- root node_modules
- frontend/node_modules
- frontend/dist
- frontend/dist-electron
- backend/build
- backend/src/main/java/com/sentra/crypto/harness (empty legacy package)
- stray CoreHarnessRunner .class files

## Notes
- TypeScript error for `vite/client` resolved by reinstalling frontend dependencies.
- Release pipeline updated to build Java jar instead of Python/PyInstaller.

## Verification (most recent)
- npm install (root): OK
- npm install (frontend): OK
- npm run electron-dev: OK
- npm run electron: OK (backend port conflict if 5000 already in use)
- Java build via Gradle: requires gradle or wrapper (not present)
