"""
Configuration Management for Flask Backend
Loads environment variables and provides configuration classes
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Determine if running as a bundled executable
if getattr(sys, 'frozen', False):
    # Running as compiled executable
    application_path = Path(sys._MEIPASS)
    env_path = application_path / '.env'
else:
    # Running as a script
    application_path = Path(__file__).parent
    env_path = application_path / '.env'

# Load environment variables
if env_path.exists():
    load_dotenv(env_path)
else:
    print(f"Warning: .env file not found at {env_path}")
    load_dotenv()  # Try to load from current directory anyway

class Config:
    """Base configuration"""
    
    # Server
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    HOST = os.getenv('HOST', '127.0.0.1')
    PORT = int(os.getenv('PORT', 5000))
    
    # MongoDB
    MONGO_URI = os.getenv('MONGO_URI')
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'sentra_encryption')
    MONGO_COLLECTION_USERS = os.getenv('MONGO_COLLECTION_USERS', 'users')
    MONGO_COLLECTION_FILES = os.getenv('MONGO_COLLECTION_FILES', 'encrypted_files')
    MONGO_COLLECTION_RECIPIENTS = os.getenv('MONGO_COLLECTION_RECIPIENTS', 'recipients')
    
    # File Storage Paths
    BASE_DIR = Path(__file__).parent
    DATA_DIR = BASE_DIR / 'data'
    UPLOAD_FOLDER = DATA_DIR / 'uploads'
    ENCRYPTED_FOLDER = DATA_DIR / 'encrypted'
    DECRYPTED_FOLDER = DATA_DIR / 'decrypted'
    KEYS_FOLDER = DATA_DIR / 'keys'
    METADATA_FOLDER = DATA_DIR / 'metadata'
    TEMP_FOLDER = DATA_DIR / 'temp'
    
    # File Upload Settings
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 104857600))  # 100MB
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
                          'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar', '7z'}
    
    # Security
    BCRYPT_ROUNDS = int(os.getenv('BCRYPT_ROUNDS', 12))
    TOKEN_EXPIRY_HOURS = int(os.getenv('TOKEN_EXPIRY_HOURS', 24))
    REFRESH_TOKEN_EXPIRY_DAYS = int(os.getenv('REFRESH_TOKEN_EXPIRY_DAYS', 30))
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://localhost:3000').split(',')
    
    # AI Settings
    AI_ANALYSIS_ENABLED = os.getenv('AI_ANALYSIS_ENABLED', 'true').lower() == 'true'
    AI_API_KEY = os.getenv('AI_API_KEY')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', './logs/app.log')
    
    @classmethod
    def create_directories(cls):
        """Create required directories if they don't exist"""
        directories = [
            cls.DATA_DIR,
            cls.UPLOAD_FOLDER,
            cls.ENCRYPTED_FOLDER,
            cls.DECRYPTED_FOLDER,
            cls.KEYS_FOLDER,
            cls.METADATA_FOLDER,
            cls.TEMP_FOLDER,
            cls.BASE_DIR / 'logs'
        ]
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
        print(f"[OK] Created data directories at {cls.DATA_DIR}")


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    MONGO_DB_NAME = 'sentra_encryption_test'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
