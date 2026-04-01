# Login Issue - Troubleshooting Guide

## 🔍 Investigation Results

I tested your login system and **it works correctly**. The backend authentication with bcrypt password hashing is functioning properly.

---

## ✅ Test Results

### Database Users Found:
```
Username: test1
Email: m@ex.com
Password: 123456789 ✓ (verified working)

Username: test2
Email: m@exe.com
```

### Backend Authentication Test:
```bash
Testing login for user: test1
Password: 123456789
✓ LOGIN SUCCESSFUL
[OK] User authenticated: test1
```

**Conclusion**: The backend correctly validates credentials using bcrypt.

---

## ❌ Why You're Seeing "Invalid Credentials"

### Most Common Causes:

1. **Wrong Password**
   - You're entering a different password than what's stored
   - Password is case-sensitive: `Password123` ≠ `password123`

2. **Wrong Username**
   - Check for typos: `test1` vs `Test1` vs `test 1`
   - Usernames are case-sensitive

3. **Cached Data**
   - Browser may have old cached login data
   - Clear browser storage and try again

4. **Backend Not Running**
   - If backend is not running, you'll see "Network error" not "Invalid credentials"
   - Start backend: `cd backend && .\run-backend-dev.ps1`

---

## 🧪 How to Test Yourself

### Method 1: Health Check
- Open http://127.0.0.1:5000/api/health in a browser
- Status 200 confirms the backend is running

### Method 2: Check Users in Database
- Use MongoDB Atlas UI or a MongoDB client to verify the `users` collection

### Method 3: Test via Electron App
1. Start backend: `cd backend && .\run-backend-dev.ps1`
2. Start frontend: `cd frontend && npm run electron-dev`
3. Try logging in with: `test1` / `123456789`

---

## 🔐 Password Reset (If Needed)

If you forgot the password, here's how to reset it:

### Reset Password
- Use MongoDB Atlas UI or a MongoDB client to update the user's `password_hash`
- The backend uses bcrypt-compatible hashes

---

## 📋 Authentication Flow

1. **User enters credentials** in login form
2. **Frontend sends POST request** to `/api/auth/login`:
   ```json
   {
     "username": "test1",
     "password": "123456789"
   }
   ```

3. **Backend verifies credentials**:
   - Finds user by username
   - Uses `bcrypt.checkpw()` to verify password
   - Returns JWT tokens if valid

4. **Frontend receives response**:
   ```json
   {
     "access_token": "eyJ...",
     "refresh_token": "eyJ...",
     "user": {
       "username": "test1",
       "email": "m@ex.com"
     }
   }
   ```

5. **Frontend stores tokens** in localStorage

6. **AuthContext updates state** and redirects to dashboard

---

## 🐛 Debug Checklist

### On Frontend (Browser Console):
- [ ] Check for network errors (F12 → Network tab)
- [ ] Look for 401 Unauthorized response
- [ ] Check request payload is correct
- [ ] Verify backend URL is `http://127.0.0.1:5000`

### On Backend (Terminal):
- [ ] Backend is running on port 5000
- [ ] MongoDB is connected (`[OK] Connected to MongoDB`)
- [ ] Check for login attempts in logs
- [ ] Look for `[OK] User authenticated: username` or `Invalid password for user:`

### In Code:
- [ ] Username is correct (no typos, correct case)
- [ ] Password is correct (check with backend test script)
- [ ] CORS is enabled (already configured in backend)
- [ ] JWT_SECRET_KEY is set in .env

---

## 🔧 Common Fixes

### Fix 1: Clear Browser Data
```javascript
// In browser console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Fix 2: Restart Backend
```bash
# Kill any existing backend processes
taskkill /F /IM java.exe

# Start backend fresh
cd backend
.\run-backend-dev.ps1
```

### Fix 3: Check Environment Variables
```bash
# backend/.env should have:
MONGO_URI=mongodb+srv://...
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
```

---

## ✅ Verification Steps

Try these in order:

1. **Test with known credentials**:
   - Username: `test1`
   - Password: `123456789`

2. **Check backend logs**:
   - Look for `[OK] User authenticated: test1` (success)
   - Or `Invalid password for user: test1` (wrong password)
   - Or `User not found: test1` (wrong username)

3. **Check health endpoint**:
   - Open http://127.0.0.1:5000/api/health

4. **Check browser console**:
   - F12 → Console tab
   - Look for error messages
   - Check Network tab for API response

---

## 📞 Still Having Issues?

If you're still seeing "Invalid credentials" after:
- ✓ Verifying backend health and credentials
- ✓ Checking backend logs
- ✓ Clearing browser cache
- ✓ Restarting backend

Then provide me with:
1. **Backend log output** when login attempt happens
2. **Browser console errors** (F12 → Console)
3. **Network tab response** (F12 → Network → click /login request)

---

## 🎯 Summary

- ✅ Backend authentication **works correctly**
- ✅ Test users exist in database
- ✅ bcrypt password hashing **verified working**
- ❌ "Invalid credentials" = **wrong username or password**

**Solution**: Use correct credentials or reset password using the script above.
