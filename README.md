# Sentra Monorepo

Sentra is a full-stack secure file-sharing platform with a Java backend, React frontend, and Electron desktop app in one repository.

## Repository Layout

- [frontend](frontend) - React + Vite UI and Electron renderer
- [backend](backend) - Java API service (auth, files, encryption, recipients, users)
- [render.yaml](render.yaml) - Render deployment blueprint
- [supp_docs](supp_docs) - operational and deployment documentation
- [frontend/README.md](frontend/README.md) - frontend-specific setup
- [backend/README.md](backend/README.md) - backend-specific setup

## Quick Start (Local)

Requirements:

- Node.js 18+
- Java 21+
- MongoDB Atlas or local MongoDB

From repository root:

```powershell
copy .env.example .env
cd backend
./run-backend-dev.ps1
```

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend default dev URL: http://localhost:5173

## Desktop Build

From repository root:

```powershell
npm install
npm run electron:build
```

Installer output:

- `release/Sentra-Setup-<version>.exe`

## Deployment

- Backend and web deployment are defined in [render.yaml](render.yaml).
- CI/CD release workflow is in [.github/workflows/release.yml](.github/workflows/release.yml).

## Backup and Restore Workflow

To ensure you can recover even if local files are deleted:

1. Keep all work committed to git.
2. Push all branches and tags to a private GitHub repository.
3. Restore anytime by cloning the private repository and checking out your working branch.

Example restore commands:

```powershell
git clone <private-repo-url>
cd <repo-folder>
git checkout cloud-migration
```

## Core Environment Variables

See [.env.example](.env.example) for the full list. Important keys:

- `VITE_API_URL`
- `APP_ENV`
- `HOST`
- `PORT`
- `MONGO_URI`
- `MONGO_DB_NAME`
- `JWT_SECRET_KEY`
- `SECRET_KEY`
- `CORS_ORIGINS`