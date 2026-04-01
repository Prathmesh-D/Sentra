# Sentra Backend

Java backend for Sentra's encrypted file workflow and account services.

## Runtime

- Java 21+
- Gradle build (shadow JAR)
- MongoDB sync driver + GridFS
- BCrypt password hashing
- JWT session token handling

## Start in Development

Windows PowerShell:

```powershell
cd backend
./run-backend-dev.ps1
```

Linux/macOS shell:

```bash
cd backend
./run-backend-dev.sh
```

Default server URL: `http://localhost:5000`

## Build Artifacts

```powershell
cd backend
./gradlew clean shadowJar
```

Output JAR:

- `build/libs/sentra-backend-dev.jar`

## Core API Areas

- `api/auth`: register, login, refresh, logout, me, password/profile updates
- `api/encrypt`: upload+encrypt, decrypt, lifecycle operations
- `api/files`: inbox/outbox listing, details, deletion, extension
- `api/recipients`: add/remove/list recipients
- `api/users`: profile and key management

## Security and Hardening

- Cookie-first auth transport with strict server validation
- Request-level rate limiting for auth endpoints
- Structured JSON error responses with request IDs
- Upload and avatar content validation (MIME/signature checks)
- Environment fail-fast for production (`APP_ENV=production` checks)

## Required Environment Variables

Set these in runtime environment (see `.env.example` for names):

- `MONGO_URI`
- `MONGO_DB_NAME`
- `JWT_SECRET_KEY`
- `SECRET_KEY`
- `CORS_ORIGINS`
- `HOST`, `PORT`

Avoid committing real credentials or secret keys.

## Mongo Indexes

The app auto-ensures indexes on startup. Reference index set is documented in `DATABASE_SCHEMA.md`.

## Docker and Render

- Container config: `backend/Dockerfile`
- Render service blueprint: `render.yaml` (repo root)

Health endpoint used by deployment: `GET /api/health`

## Troubleshooting

- Port in use: set a different `PORT`
- CORS blocked: verify frontend origin is present in `CORS_ORIGINS`
- Mongo connection issues: validate URI and network access/IP allowlist
