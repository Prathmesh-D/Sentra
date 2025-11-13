# Sentra Installation Guide

## Easy Setup (No MongoDB Installation Required!)

Sentra uses **MongoDB Atlas** (cloud database), which is already configured and included in the application. You don't need to install MongoDB on your computer.

### Installation Steps

1. **Download the Installer**
   - Go to the [Sentra Releases page](https://github.com/Prathmesh-D/Sentra/releases)
   - Download the latest `Sentra Setup *.exe` file

2. **Run the Installer**
   - Double-click the downloaded installer
   - Follow the installation wizard
   - Choose your installation directory (or use the default)

3. **Launch Sentra**
   - The application will start and connect to the cloud database automatically
   - No additional configuration needed!

## What's Included

✅ MongoDB Atlas connection (cloud database - no local installation needed)  
✅ Backend server (bundled as executable)  
✅ All encryption and security features  
✅ Automatic updates  

## Troubleshooting

### Network Error on Startup

**Possible Causes:**
1. **No internet connection** - Sentra needs internet to connect to MongoDB Atlas
2. **Firewall blocking** - Your firewall might be blocking the connection

**Solutions:**
- Check your internet connection
- Temporarily disable firewall to test
- Add Sentra to your firewall's allowed applications

### Application Won't Start

**Solution:**
- Make sure you have Windows 10/11 (64-bit)
- Install [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) if missing

## System Requirements

- **OS:** Windows 10/11 (64-bit)
- **RAM:** 4 GB minimum, 8 GB recommended
- **Disk Space:** 500 MB free space
- **Internet:** Required for database connection

## For Developers

If you're running the development version:
- MongoDB Atlas credentials are in `backend/.env`
- The connection string is already configured
- No local MongoDB installation needed
