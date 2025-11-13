"""
Sentra Encryption Backend API Server
Main entry point for the Flask application

To run:
    python server.py
    
Or for production:
    gunicorn -w 4 -b 0.0.0.0:5000 server:app
"""
import os
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app
from config import get_config

# Create Flask application
app = create_app()
config_class = get_config()

def print_banner():
    """Print server startup banner"""
    print("=" * 80)
    print("[SENTRA] ENCRYPTION BACKEND API")
    print("   Hybrid Cryptography File Encryption System")
    print("=" * 80)
    print(f"[SERVER] Server: http://{config_class.HOST}:{config_class.PORT}")
    print(f"[CONFIG] Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"[DATABASE] Database: {config_class.MONGO_DB_NAME}")
    print("=" * 80)
    print("\n[ENDPOINTS] Available Endpoints:")
    print("   [AUTH] Auth:       /api/auth")
    print("   [ENCRYPT] Encryption: /api/encrypt")
    print("   [FILES] Files:      /api/files")
    print("   [RECIPIENTS] Recipients: /api/recipients")
    print("   [USERS] Users:      /api/users")
    print("   [HEALTH] Health:     /api/health")
    print("\n[READY] Server is ready! Press CTRL+C to stop.\n")


if __name__ == '__main__':
    print_banner()
    
    # Run development server
    app.run(
        host=config_class.HOST,
        port=config_class.PORT,
        debug=config_class.DEBUG
    )
