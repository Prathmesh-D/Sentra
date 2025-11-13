# 🔐 Sentra Encryption Backend API

Modern REST API backend for the Sentra hybrid cryptography file encryption system. Built with Flask, integrates with your existing Python encryption engine.

## 📁 Project Structure

```
backend/
├── server.py              # Main application entry point
├── config.py              # Configuration management
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── app/
│   ├── __init__.py       # Flask app factory
│   └── routes/           # API endpoints
│       ├── __init__.py
│       ├── auth.py       # Authentication routes
│       ├── encryption.py # File encryption/decryption
│       ├── files.py      # Inbox/outbox management
│       ├── recipients.py # Recipient contacts
│       └── users.py      # User profile & settings
└── data/                 # File storage (created automatically)
    ├── uploads/
    ├── encrypted/
    ├── decrypted/
    ├── keys/
    ├── metadata/
    └── temp/
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example environment file
copy .env.example .env

# Edit .env and add your MongoDB URI
notepad .env
```

### 3. Run Server

```bash
python server.py
```

Server will start at: **http://localhost:5000**

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/register` | POST | Register new user | ❌ |
| `/login` | POST | User login | ❌ |
| `/logout` | POST | User logout | ✅ |
| `/refresh` | POST | Refresh access token | ✅ |
| `/me` | GET | Get current user | ✅ |
| `/change-password` | POST | Change password | ✅ |

### Encryption (`/api/encrypt`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/encrypt` | POST | Encrypt file | ✅ |
| `/decrypt/<file_id>` | POST | Decrypt file | ✅ |
| `/analyze` | POST | AI sensitivity analysis | ✅ |

### Files (`/api/files`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/inbox` | GET | Get received files | ✅ |
| `/outbox` | GET | Get sent files | ✅ |
| `/<file_id>` | GET | Get file details | ✅ |
| `/<file_id>` | DELETE | Delete file | ✅ |
| `/<file_id>/extend` | POST | Extend file expiry | ✅ |

### Recipients (`/api/recipients`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | Get all recipients | ✅ |
| `/` | POST | Add new recipient | ✅ |
| `/<id>` | DELETE | Delete recipient | ✅ |
| `/search` | GET | Search users | ✅ |

### Users (`/api/users`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/profile` | GET | Get user profile | ✅ |
| `/profile` | PUT | Update profile | ✅ |
| `/keys` | GET | Get public key | ✅ |
| `/keys/regenerate` | POST | Regenerate RSA keys | ✅ |
| `/statistics` | GET | Get user statistics | ✅ |

## 🔧 Integration Phases

### ✅ Phase 1: API Structure (COMPLETED)
- [x] Flask app factory pattern
- [x] JWT authentication setup
- [x] All endpoint skeletons
- [x] Configuration management
- [x] CORS enabled for React
- [x] Logging configured

### 🔄 Phase 2: Database Integration (NEXT)
- [ ] Connect to MongoDB Atlas
- [ ] User management with bcrypt
- [ ] File metadata storage
- [ ] Recipient contacts
- [ ] GridFS for large files

### 🔄 Phase 3: Cryptography Integration
- [ ] Import existing `HybridCryptoSystem`
- [ ] AES-256-GCM encryption
- [ ] RSA-2048-OAEP key wrapping
- [ ] Digital signatures
- [ ] Key management

### 🔄 Phase 4: Advanced Features
- [ ] AI sensitivity analysis integration
- [ ] File compression
- [ ] Self-destruct functionality
- [ ] Access logging & audit trail
- [ ] Email notifications

## 🧪 Testing the API

### Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "full_name": "John Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123"
  }'
```

### Encrypt File (with token)

```bash
curl -X POST http://localhost:5000/api/encrypt/encrypt \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@document.pdf" \
  -F "recipients=[\"alice\", \"bob\"]" \
  -F "encryption_type=AES-256" \
  -F "expiry_days=7"
```

## 🔗 Connect to React Frontend

Update React API client (`MinorUI/src/api/client.ts`):

```typescript
const API_BASE = 'http://localhost:5000/api'

export const api = {
  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    return response.json()
  },
  
  async encryptFile(file: File, recipients: string[]) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('recipients', JSON.stringify(recipients))
    
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE}/encrypt/encrypt`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    return response.json()
  }
}
```

## 📦 Production Deployment

### Using Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

### Using Docker

```bash
docker build -t sentra-backend .
docker run -p 5000:5000 sentra-backend
```

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ Token expiry and refresh
- ✅ CORS protection
- ✅ File size limits
- ✅ Secure file handling

## 📝 Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `MONGO_URI`: MongoDB connection string
- `SECRET_KEY`: Flask secret key
- `JWT_SECRET_KEY`: JWT signing key
- `MAX_FILE_SIZE`: Maximum upload size (bytes)
- `CORS_ORIGINS`: Allowed frontend origins

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check connection string format
mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### CORS Errors
```bash
# Add your React dev server to CORS_ORIGINS in .env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

## 📚 Next Steps

1. **Complete Phase 2**: Integrate MongoDB database
2. **Complete Phase 3**: Import crypto system from `../hybrid-crypto-file-encryption`
3. **Test with React**: Connect MinorUI frontend
4. **Add Electron wrapper**: Package as desktop app

## 👥 Authors

- Prathmesh Deshkar
- Sneha Agrawal

## 📄 License

MIT License
