# Setup Guide for Development

## Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** installed (20+ recommended)
- **Git** installed
- Internet connection for MongoDB Atlas

---

## Quick Setup (5 minutes)

### 1. Clone Repository
```powershell
git clone https://github.com/Prathmesh-D/Sentra.git
cd Sentra
```

### 2. Backend Setup
```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
```

**Note**: MongoDB URI is already configured! No need to edit `.env` - it works out of the box with the shared MongoDB Atlas database.

### 3. Frontend Setup
```powershell
cd ..\frontend

# Install dependencies
npm install
```

### 4. Run Application
```powershell
# Make sure you're in frontend directory
npm run electron-dev
```

App will start with:
- Backend on `http://127.0.0.1:5000`
- Frontend on `http://localhost:5173`
- Electron window opens automatically

---

## Verification Checklist

After setup, verify everything works:

### Backend Check
```powershell
cd backend
.\venv\Scripts\python.exe -c "import flask; import pymongo; import bcrypt; print('✓ All backend dependencies installed')"
```

### Frontend Check
```powershell
cd frontend
npm list electron electron-builder electron-updater vite react
```

### Database Check
```powershell
cd backend
.\venv\Scripts\python.exe -c "from pymongo import MongoClient; import os; from dotenv import load_dotenv; load_dotenv(); client = MongoClient(os.getenv('MONGO_URI')); client.admin.command('ping'); print('✓ MongoDB connection working')"
```

---

## Common Issues

### Issue: "Python not found"
**Fix**: Install Python 3.11+ from https://python.org

### Issue: "npm not found"
**Fix**: Install Node.js 20+ from https://nodejs.org

### Issue: "Cannot create virtual environment"
**Fix**: 
```powershell
python -m pip install --upgrade pip
python -m pip install virtualenv
```

### Issue: "MongoDB connection failed"
**Fix**:
1. Check internet connection
2. Verify MONGO_URI in .env is correct
3. Check if IP is whitelisted in MongoDB Atlas

### Issue: "electron-builder fails"
**Fix**:
```powershell
npm install --global windows-build-tools
npm install
```

---

## File Structure

```
Sentra/
├── backend/
│   ├── venv/              # Python virtual environment (create this)
│   ├── .env               # Environment variables (create from .env.example)
│   ├── .env.example       # Template for .env
│   ├── requirements.txt   # Python dependencies
│   ├── run.py            # Backend entry point
│   └── app/              # Backend application code
│
├── frontend/
│   ├── node_modules/      # Node dependencies (npm install creates this)
│   ├── package.json       # Node dependencies list
│   ├── electron/          # Electron main process
│   └── src/              # React application
│
└── README.md
```

---

## Development Workflow

### Running Backend Only
```powershell
cd backend
.\venv\Scripts\python.exe run.py
```

### Running Frontend Only
```powershell
cd frontend
npm run dev  # React only (without Electron)
```

### Running Full App
```powershell
cd frontend
npm run electron-dev  # React + Electron + Backend
```

### Building Installer
```powershell
cd frontend
npm run build-electron-win  # Creates installer in dist-electron/
```

---

## Next Steps

1. **Test Login**: Use `test1` / `123456789`
2. **Create New User**: Use signup page
3. **Encrypt File**: Test file encryption
4. **Check Logs**: Backend logs show in terminal

---

## Support

If setup fails:
1. Check this guide again
2. Verify all prerequisites are installed
3. Check firewall/antivirus settings
4. See `FRESH_INSTALL_TROUBLESHOOTING.md`

Happy coding! 🚀
