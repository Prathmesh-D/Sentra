"""
Quick Start Script
Initializes database and starts the Flask server
"""
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app
from app.services.database import db_manager
from config import get_config

def initialize_database():
    """Initialize database with indexes"""
    print("[*] Initializing database...")
    try:
        # Check if MongoDB URI is configured
        from config import get_config
        config_class = get_config()
        mongo_uri = config_class.MONGO_URI
        
        if not mongo_uri:
            print("[WARN] MongoDB URI not configured - database features disabled")
            return False
        
        # Test connection
        if db_manager.ping():
            print("[OK] Database connection successful")
            
            # Create indexes
            db_manager.create_indexes()
            print("[OK] Database indexes created")
            return True
        else:
            print("[ERROR] Database connection failed")
            return False
    except Exception as e:
        print(f"[ERROR] Database initialization error: {e}")
        return False

def main():
    """Main startup function"""
    print("=" * 80)
    print("[*] SENTRA BACKEND QUICK START")
    print("=" * 80)
    
    # Create Flask app
    app = create_app()
    
    with app.app_context():
        # Initialize database
        db_ok = initialize_database()
        if not db_ok:
            print("\n[WARN] Database initialization failed!")
            print("   Check your MONGO_URI in .env file")
            print("   Server will run without database features")
            print("   To add MongoDB: Get URI from MongoDB Atlas")
            print("   Then add to .env: MONGO_URI=mongodb+srv://...")
    
    # Get config
    config_class = get_config()
    
    print("\n" + "=" * 80)
    print("[*] Starting Flask Server...")
    print("=" * 80)
    print(f"[*] URL: http://{config_class.HOST}:{config_class.PORT}")
    print(f"[*] Environment: {app.config.get('ENV', 'development')}")
    print("=" * 80)
    print("\n[OK] Server is ready! Press CTRL+C to stop.\n")
    
    # Run server
    app.run(
        host=config_class.HOST,
        port=config_class.PORT,
        debug=config_class.DEBUG
    )

if __name__ == '__main__':
    main()
