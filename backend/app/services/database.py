"""
Database Connection Manager
Handles MongoDB connection and provides database access
"""
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from flask import current_app
import logging

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Singleton class for MongoDB connection management"""
    
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize database connection - lazy loading"""
        # Don't connect in __init__, wait for first use
        pass
    
    def _connect(self):
        """Establish MongoDB connection"""
        try:
            # Get config from current app context
            from flask import current_app
            mongo_uri = current_app.config.get('MONGO_URI')
            
            if not mongo_uri:
                raise ValueError("MONGO_URI not configured in environment")
            
            # Connect to MongoDB
            self._client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000
            )
            
            # Test connection
            self._client.admin.command('ping')
            
            # Get database
            db_name = current_app.config.get('MONGO_DB_NAME', 'sentra_encryption')
            self._db = self._client[db_name]
            
            logger.info(f"[OK] Connected to MongoDB database: {db_name}")
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"[ERROR] Failed to connect to MongoDB: {e}")
            raise
        except Exception as e:
            logger.error(f"[ERROR] Database initialization error: {e}")
            raise
    
    @property
    def db(self):
        """Get database instance - connects lazily"""
        if self._db is None:
            self._connect()
        return self._db
    
    @property
    def client(self):
        """Get MongoDB client instance - connects lazily"""
        if self._client is None:
            self._connect()
        return self._client
    
    def get_collection(self, collection_name):
        """
        Get a collection from the database
        
        Args:
            collection_name (str): Name of the collection
            
        Returns:
            Collection object
        """
        return self.db[collection_name]
    
    def close(self):
        """Close database connection"""
        if self._client:
            self._client.close()
            logger.info("[OK] Database connection closed")
            self._client = None
            self._db = None
    
    def ping(self):
        """Test database connection"""
        try:
            self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"Database ping failed: {e}")
            return False
    
    def create_indexes(self):
        """Create database indexes for optimal performance"""
        try:
            # Use the new schema-based initialization
            from app.services.db_init import initialize_collections, create_default_settings
            
            success = initialize_collections()
            if success:
                create_default_settings()
                logger.info("[OK] Database collections and indexes initialized")
                return True
            else:
                logger.error("[ERROR] Failed to initialize collections")
                return False
            
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            # Fallback to basic indexes
            try:
                from flask import current_app
                users = self.get_collection(current_app.config['MONGO_COLLECTION_USERS'])
                files = self.get_collection(current_app.config['MONGO_COLLECTION_FILES'])
                
                users.create_index('username', unique=True)
                users.create_index('email', unique=True)
                files.create_index('sender')
                files.create_index('recipients')
                files.create_index([('created_at', -1)])
                
                logger.info("[OK] Basic indexes created")
                return True
            except Exception as e2:
                logger.error(f"Failed to create basic indexes: {e2}")
                return False


# Singleton instance
db_manager = DatabaseManager()


def get_db():
    """Helper function to get database instance"""
    return db_manager.db


def get_collection(collection_name):
    """Helper function to get collection"""
    return db_manager.get_collection(collection_name)
