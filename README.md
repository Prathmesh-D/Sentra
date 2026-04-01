# Sentra

Hybrid-crypto file sharing with a Java backend, a React web app, and a Windows desktop build.

[![Release](https://img.shields.io/github/v/release/Prathmesh-D/Sentra)](https://github.com/Prathmesh-D/Sentra/releases/latest)
[![CI](https://img.shields.io/github/actions/workflow/status/Prathmesh-D/Sentra/ci.yml)](https://github.com/Prathmesh-D/Sentra/actions)

---

## Try It

**Web:** https://sentra.onrender.com

**Desktop (Windows):** https://github.com/Prathmesh-D/Sentra/releases/latest
Download the .exe, run it, and the app installs. No setup needed.

---

## Features

- File encryption and secure downloads
- User authentication and profile settings
- Inbox, outbox, and recipient management
- Electron desktop packaging for Windows
- Render deployment for the web app and API

---

## Run Locally

Requirements: Node.js 18+, Java 21+, MongoDB

git clone https://github.com/Prathmesh-D/Sentra.git
cd Sentra

Copy .env.example to .env and fill in your values.

Install and run:
cd backend && ./run-backend-dev.ps1
cd frontend && npm install && npm run dev

---

## Environment Variables

See .env.example for the full list with descriptions.

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Public API URL used by the frontend and packaged Electron app |
| VITE_WEB | Enables the Vite web build path for Render static hosting |
| APP_ENV | Backend environment mode |
| HOST | Backend bind address |
| PORT | Backend port |
| CLIENT_URL | Public frontend URL allowed to call the backend |
| MONGO_URI | MongoDB connection string |
| MONGO_DB_NAME | MongoDB database name |
| MONGO_COLLECTION_USERS | MongoDB users collection |
| MONGO_COLLECTION_FILES | MongoDB files collection |
| MONGO_COLLECTION_RECIPIENTS | MongoDB recipients collection |
| JWT_SECRET_KEY | JWT signing secret |
| SECRET_KEY | App secret used by backend auth routines |
| BCRYPT_ROUNDS | Password hashing rounds |
| TOKEN_EXPIRY_HOURS | Access token lifetime in hours |
| REFRESH_TOKEN_EXPIRY_DAYS | Refresh token lifetime in days |
| MAX_FILE_SIZE | Maximum upload size in bytes |
| LOG_LEVEL | Backend log level |
| LOG_FILE | Backend log file path |
| BACKEND_BASE_DIR | Backend base directory used by the desktop shell |
| DATA_DIR | Backend data directory used by the desktop shell |
| CORS_ORIGINS | Optional CORS allow-list fallback for local development |

---

## Deploy Your Own

1. Fork this repo
2. Create a Web Service on render.com and connect the repo
3. Add your environment variables in the Render dashboard
4. Push to main - Render deploys automatically

---

## Release a New Version

git tag v1.0.1
git push origin main --tags

GitHub Actions builds the .exe and publishes a release automatically.

---

## Built By

Prathmesh D - https://github.com/Prathmesh-D