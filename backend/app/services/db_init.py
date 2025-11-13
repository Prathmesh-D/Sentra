"""
Database Initialization Script
Creates all collections with validation rules and indexes
"""
from app.services.database import db_manager
from app.services.db_schema import COLLECTIONS
from pymongo.errors import CollectionInvalid
import logging

logger = logging.getLogger(__name__)


def initialize_collections():
    """
    Initialize all database collections with schemas and indexes
    """
    try:
        db = db_manager.db
        
        logger.info("=" * 80)
        logger.info("[*] Initializing Database Collections")
        logger.info("=" * 80)
        
        created_count = 0
        updated_count = 0
        
        for collection_key, collection_info in COLLECTIONS.items():
            collection_name = collection_info['name']
            schema = collection_info['schema']
            indexes = collection_info['indexes']
            
            try:
                # Check if collection exists
                if collection_name in db.list_collection_names():
                    logger.info(f"[EXISTS] Collection '{collection_name}' already exists")
                    
                    # Update validation rules
                    try:
                        db.command({
                            'collMod': collection_name,
                            'validator': schema['validator']
                        })
                        logger.info(f"[UPDATED] Validation rules for '{collection_name}'")
                        updated_count += 1
                    except Exception as e:
                        logger.warning(f"[WARN] Could not update validation for '{collection_name}': {e}")
                else:
                    # Create collection with validation
                    db.create_collection(
                        collection_name,
                        validator=schema['validator'],
                        validationLevel='moderate',  # moderate = existing docs not validated
                        validationAction='warn'  # warn = log warning but allow insert
                    )
                    logger.info(f"[CREATED] Collection '{collection_name}'")
                    created_count += 1
                
                # Create/update indexes
                collection = db[collection_name]
                existing_indexes = [idx['name'] for idx in collection.list_indexes()]
                
                for index_spec in indexes:
                    index_keys = index_spec['keys']
                    index_options = {k: v for k, v in index_spec.items() if k != 'keys'}
                    
                    # Generate index name
                    index_name = '_'.join([f"{k}_{v}" for k, v in index_keys])
                    
                    # Create index if it doesn't exist
                    if index_name not in existing_indexes:
                        collection.create_index(index_keys, **index_options)
                        logger.info(f"[INDEX] Created index '{index_name}' on '{collection_name}'")
                    else:
                        logger.debug(f"[INDEX] Index '{index_name}' already exists on '{collection_name}'")
                
            except CollectionInvalid as e:
                logger.error(f"[ERROR] Invalid collection config for '{collection_name}': {e}")
            except Exception as e:
                logger.error(f"[ERROR] Failed to initialize '{collection_name}': {e}")
        
        logger.info("=" * 80)
        logger.info(f"[OK] Database initialization complete")
        logger.info(f"     Collections created: {created_count}")
        logger.info(f"     Collections updated: {updated_count}")
        logger.info(f"     Total collections: {len(COLLECTIONS)}")
        logger.info("=" * 80)
        
        return True
        
    except Exception as e:
        logger.error(f"[ERROR] Database initialization failed: {e}")
        return False


def create_default_settings():
    """
    Create default system settings
    """
    try:
        db = db_manager.db
        settings_collection = db['system_settings']
        
        default_settings = [
            {
                'setting_key': 'max_file_size_mb',
                'setting_value': 100,
                'description': 'Maximum file size in MB',
                'updated_at': None
            },
            {
                'setting_key': 'default_storage_limit_mb',
                'setting_value': 102400,  # 100 GB
                'description': 'Default storage limit per user in MB',
                'updated_at': None
            },
            {
                'setting_key': 'default_file_expiry_days',
                'setting_value': 30,
                'description': 'Default file expiration in days',
                'updated_at': None
            },
            {
                'setting_key': 'enable_file_sharing',
                'setting_value': True,
                'description': 'Enable file sharing feature',
                'updated_at': None
            },
            {
                'setting_key': 'enable_shared_links',
                'setting_value': True,
                'description': 'Enable public shareable links',
                'updated_at': None
            },
            {
                'setting_key': 'enable_notifications',
                'setting_value': True,
                'description': 'Enable in-app notifications',
                'updated_at': None
            },
            {
                'setting_key': 'max_recipients_per_file',
                'setting_value': 50,
                'description': 'Maximum recipients per file',
                'updated_at': None
            },
            {
                'setting_key': 'activity_log_retention_days',
                'setting_value': 90,
                'description': 'How long to keep activity logs',
                'updated_at': None
            }
        ]
        
        for setting in default_settings:
            # Only insert if not exists
            existing = settings_collection.find_one({'setting_key': setting['setting_key']})
            if not existing:
                settings_collection.insert_one(setting)
                logger.info(f"[SETTING] Created: {setting['setting_key']}")
        
        logger.info("[OK] Default settings initialized")
        return True
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to create default settings: {e}")
        return False


def get_database_info():
    """
    Get information about the database and collections
    """
    try:
        db = db_manager.db
        
        info = {
            'database_name': db.name,
            'collections': []
        }
        
        for collection_name in db.list_collection_names():
            collection = db[collection_name]
            doc_count = collection.count_documents({})
            indexes = list(collection.list_indexes())
            
            info['collections'].append({
                'name': collection_name,
                'document_count': doc_count,
                'index_count': len(indexes)
            })
        
        return info
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to get database info: {e}")
        return None


if __name__ == '__main__':
    # Test initialization
    logging.basicConfig(level=logging.INFO)
    
    if initialize_collections():
        create_default_settings()
        
        # Print database info
        info = get_database_info()
        if info:
            print("\n" + "=" * 80)
            print(f"Database: {info['database_name']}")
            print("=" * 80)
            for coll in info['collections']:
                print(f"  {coll['name']:<25} | Documents: {coll['document_count']:<8} | Indexes: {coll['index_count']}")
            print("=" * 80)
