"""
Diagnostic Script for Packaged Sentra Backend
Checks MongoDB connection and environment variables
"""
import sys
import os
from pathlib import Path

print("="*80)
print("SENTRA BACKEND DIAGNOSTICS")
print("="*80)

# Check if running as frozen executable
is_frozen = getattr(sys, 'frozen', False)
print(f"\n1. Execution Mode: {'PACKAGED EXE' if is_frozen else 'SCRIPT MODE'}")

# Check paths
if is_frozen:
    app_path = Path(sys._MEIPASS)
    print(f"   Temporary extraction path: {app_path}")
else:
    app_path = Path(__file__).parent
    print(f"   Script path: {app_path}")

# Check for .env file
env_path = app_path / '.env'
print(f"\n2. Environment File:")
print(f"   Looking for: {env_path}")
print(f"   Exists: {env_path.exists()}")

if env_path.exists():
    print(f"   File size: {env_path.stat().st_size} bytes")
    try:
        with open(env_path, 'r') as f:
            lines = f.readlines()
        print(f"   Lines in file: {len(lines)}")
        print(f"   Has MONGO_URI: {any('MONGO_URI' in line for line in lines)}")
        print(f"   Has SECRET_KEY: {any('SECRET_KEY' in line for line in lines)}")
    except Exception as e:
        print(f"   Error reading file: {e}")
else:
    print(f"   WARNING: .env file not found!")

# Load environment
from dotenv import load_dotenv
if env_path.exists():
    load_dotenv(env_path)
    print(f"\n3. Environment Variables Loaded:")
else:
    load_dotenv()
    print(f"\n3. Environment Variables (from system):")

mongo_uri = os.getenv('MONGO_URI')
secret_key = os.getenv('SECRET_KEY')
jwt_key = os.getenv('JWT_SECRET_KEY')

print(f"   MONGO_URI present: {bool(mongo_uri)}")
if mongo_uri:
    # Hide password for security
    if '@' in mongo_uri:
        parts = mongo_uri.split('@')
        print(f"   MONGO_URI format: mongodb+srv://***:***@{parts[1][:50]}...")
    else:
        print(f"   MONGO_URI format: {mongo_uri[:50]}...")
else:
    print(f"   WARNING: MONGO_URI not found!")

print(f"   SECRET_KEY present: {bool(secret_key)}")
print(f"   JWT_SECRET_KEY present: {bool(jwt_key)}")

# Test MongoDB connection
print(f"\n4. MongoDB Connection Test:")
if not mongo_uri:
    print(f"   SKIPPED: No MONGO_URI configured")
else:
    try:
        from pymongo import MongoClient
        from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
        
        print(f"   Connecting to MongoDB Atlas...")
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=15000
        )
        
        # Test connection
        client.admin.command('ping')
        print(f"   ✓ Successfully connected to MongoDB Atlas")
        
        # Test database access
        db = client['sentra_encryption']
        users_collection = db['users']
        user_count = users_collection.count_documents({})
        
        print(f"   ✓ Database: sentra_encryption")
        print(f"   ✓ Users collection: {user_count} users found")
        
        if user_count > 0:
            # Get first user (without showing sensitive data)
            first_user = users_collection.find_one({}, {'username': 1, 'email': 1})
            print(f"   ✓ Sample user: {first_user['username']} ({first_user['email']})")
        
        client.close()
        print(f"\n   STATUS: MongoDB connection WORKING ✓")
        
    except ServerSelectionTimeoutError as e:
        print(f"   ✗ Connection timeout: {str(e)[:100]}")
        print(f"   This usually means:")
        print(f"   - No internet connection")
        print(f"   - Firewall blocking MongoDB")
        print(f"   - MongoDB Atlas IP whitelist restriction")
        print(f"\n   STATUS: MongoDB connection FAILED ✗")
    except ConnectionFailure as e:
        print(f"   ✗ Connection failed: {str(e)[:100]}")
        print(f"\n   STATUS: MongoDB connection FAILED ✗")
    except Exception as e:
        print(f"   ✗ Unexpected error: {str(e)[:100]}")
        print(f"\n   STATUS: MongoDB connection FAILED ✗")

print("\n" + "="*80)
print("DIAGNOSIS COMPLETE")
print("="*80)

# Keep window open
input("\nPress Enter to close...")
