# Sentra Installation Requirements

## Prerequisites

To run Sentra on another PC, you need the following installed:

### 1. MongoDB (Required)
The Sentra application uses MongoDB as its database.

**Installation Options:**

#### Option A: MongoDB Community Server (Recommended for Desktop)
1. Download from: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. During installation, select "Install MongoDB as a Service"
4. Default connection: `mongodb://localhost:27017`

#### Option B: MongoDB Atlas (Cloud Database)
1. Create free account at: https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update the `.env` file with your MongoDB Atlas connection string

### 2. Environment Variables
Create a `.env` file in the application directory with:

```env
MONGO_URI=mongodb://localhost:27017/sentra_encryption
MONGO_DB_NAME=sentra_encryption
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
```

## Quick Start

1. Install MongoDB (see above)
2. Ensure MongoDB service is running
3. Run the Sentra installer
4. Launch Sentra application

## Troubleshooting

### Network Error on Startup
**Cause:** MongoDB is not running or not accessible

**Solution:**
- Windows: Open Services and start "MongoDB Server"
- Verify MongoDB is running: Open browser to http://localhost:27017
  - You should see: "It looks like you are trying to access MongoDB over HTTP..."

### Connection Timeout
**Cause:** MongoDB URI is incorrect in `.env` file

**Solution:**
- Check `.env` file exists in app directory
- Verify MONGO_URI points to running MongoDB instance

## For Developers

To create a portable version that doesn't require MongoDB:
1. Replace MongoDB with SQLite
2. Update all database queries in `backend/app/services/database.py`
3. Modify routes to use SQLite instead of pymongo
