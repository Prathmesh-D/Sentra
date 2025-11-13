# Troubleshooting "Invalid Credentials" on Fresh Installations

## 🔴 Problem
Login works on development machine but shows **"Invalid credentials"** error when app is installed on a new PC, even with correct username/password.

## 🎯 Root Cause
The issue is **NOT with your credentials**. The real problem is the backend can't connect to MongoDB Atlas on the new system.

---

## ✅ Solution

### Quick Fix
The new system needs **internet connection** and the MongoDB Atlas connection string must be properly bundled in the .env file.

### Detailed Steps

#### Step 1: Verify Internet Connection
1. Open browser on the new PC
2. Visit https://google.com to confirm internet works
3. Try https://cloud.mongodb.com to check if MongoDB Atlas is reachable

#### Step 2: Check Firewall Settings
Windows Defender or corporate firewall might block MongoDB connections:
1. Open **Windows Defender Firewall**
2. Click **"Allow an app through firewall"**
3. Find **"Sentra"** in the list
4. Check both **Private** and **Public** networks
5. Click OK and try logging in again

#### Step 3: Run Diagnostic Tool
I've included a diagnostic script in the packaged app:

1. Navigate to the app installation folder:
   ```
   C:\Users\[Username]\AppData\Local\Programs\Sentra\resources\
   ```

2. Look for `sentra-backend.exe`

3. Open PowerShell in that folder and run:
   ```powershell
   .\sentra-backend.exe diagnose.py
   ```

4. The diagnostic will show:
   - ✓ If .env file exists
   - ✓ If MONGO_URI is configured
   - ✓ If MongoDB connection works
   - ✗ Exact error if connection fails

---

## 🐛 Common Issues & Fixes

### Issue 1: "MongoDB connection timeout"
**Cause**: Firewall or no internet
**Fix**:
- Check internet connection
- Disable firewall temporarily to test
- Add MongoDB Atlas IPs to firewall whitelist

### Issue 2: ".env file not found"
**Cause**: .env wasn't bundled in the installer
**Fix**:
- Rebuild the installer with updated generate_spec.ps1 script
- Ensure .env is included in PyInstaller datas

### Issue 3: "MONGO_URI not found"
**Cause**: Environment variable not set
**Fix**:
- Check GitHub secrets are configured
- Rebuild release with proper secrets

---

## 🔧 For Developers: Rebuild with Diagnostics

### 1. Test Diagnostic Locally
```powershell
cd backend
.\venv\Scripts\python.exe diagnose.py
```

Should output:
```
✓ PACKAGED EXE / SCRIPT MODE
✓ .env file exists
✓ MONGO_URI present
✓ Successfully connected to MongoDB Atlas
✓ 2 users found
```

### 2. Bundle Diagnostic in Installer
The diagnostic script is automatically included when you build with generate_spec.ps1.

### 3. Test on Fresh PC
1. Install Sentra on clean Windows PC
2. Run diagnostic before trying to login
3. Fix any issues shown in diagnostic
4. Try login again

---

## 📋 Error Message Improvements

With the latest update (v1.0.15+), you'll see better error messages:

### Before:
```
Error: Invalid credentials
```

### After:
```
Error: Database connection error. Please check your internet connection.
```

This makes it clear that the problem is connectivity, not your password.

---

## 🔍 Manual Verification

If you want to manually verify the issue, check backend logs:

### On New PC:
1. Install Sentra
2. Run the app
3. Try to login
4. Check backend logs in:
   ```
   %TEMP%\sentra-backend-logs\
   ```

Look for:
```
[ERROR] Failed to connect to MongoDB: ServerSelectionTimeoutError
```

This confirms it's a database connection issue, not invalid credentials.

---

## ✅ Final Checklist for Fresh PC Installation

Before reporting "invalid credentials":
- [ ] Internet connection is working
- [ ] Can access https://cloud.mongodb.com in browser
- [ ] Windows Firewall allows Sentra
- [ ] Antivirus isn't blocking the app
- [ ] Ran diagnostic tool and it passed all checks
- [ ] Tried credentials: `test1` / `123456789`

If all checks pass and login still fails, then it's genuinely a credentials issue.

---

## 🚀 For Production Deployments

### Best Practices:
1. **Include diagnostic tool** in installer
2. **Show connection status** in UI before login
3. **Test installer on VM** before releasing
4. **Add retry logic** for MongoDB connections
5. **Log errors** to accessible location

### Recommended: Add Health Check Endpoint
```python
@app.route('/api/health', methods=['GET'])
def health():
    try:
        db_manager.ping()
        return jsonify({'status': 'ok', 'database': 'connected'}), 200
    except:
        return jsonify({'status': 'error', 'database': 'disconnected'}), 500
```

Then check this before showing login screen.

---

## 📞 Support

If issues persist after following this guide:
1. Run diagnostic tool and capture output
2. Check Windows Event Viewer for errors
3. Provide diagnostic output when reporting issue
4. Include Windows version and network configuration

The diagnostic tool will show exactly where the problem is!
