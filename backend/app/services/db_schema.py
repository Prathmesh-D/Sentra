"""
Database Schema Definition
Defines all MongoDB collections and their structure with validation
"""
from datetime import datetime
from pymongo import ASCENDING, DESCENDING, TEXT


class DatabaseSchema:
    """
    Complete database schema for Sentra Encryption Platform
    Defines all collections, fields, indexes, and validation rules
    """
    
    # ========================================================================
    # USERS COLLECTION
    # Stores user accounts, authentication, and RSA keys
    # ========================================================================
    USERS_SCHEMA = {
        'validator': {
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['username', 'email', 'password_hash', 'created_at'],
                'properties': {
                    'username': {
                        'bsonType': 'string',
                        'description': 'Unique username for login'
                    },
                    'email': {
                        'bsonType': 'string',
                        'pattern': '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                        'description': 'User email address'
                    },
                    'password_hash': {
                        'bsonType': 'string',
                        'description': 'Bcrypt hashed password'
                    },
                    'full_name': {
                        'bsonType': 'string',
                        'description': 'User full name'
                    },
                    'public_key': {
                        'bsonType': 'string',
                        'description': 'RSA public key (PEM format)'
                    },
                    'private_key_encrypted': {
                        'bsonType': 'string',
                        'description': 'Encrypted RSA private key (optional server-side storage)'
                    },
                    'phone': {
                        'bsonType': 'string',
                        'description': 'User phone number'
                    },
                    'organization': {
                        'bsonType': 'string',
                        'description': 'User organization/company'
                    },
                    'role': {
                        'bsonType': 'string',
                        'enum': ['user', 'admin', 'premium'],
                        'description': 'User role/tier'
                    },
                    'storage_limit_mb': {
                        'bsonType': 'number',
                        'description': 'Storage limit in MB'
                    },
                    'created_at': {
                        'bsonType': 'date',
                        'description': 'Account creation timestamp'
                    },
                    'updated_at': {
                        'bsonType': 'date',
                        'description': 'Last profile update timestamp'
                    },
                    'last_login': {
                        'bsonType': 'date',
                        'description': 'Last login timestamp'
                    },
                    'is_active': {
                        'bsonType': 'bool',
                        'description': 'Account active status'
                    },
                    'email_verified': {
                        'bsonType': 'bool',
                        'description': 'Email verification status'
                    },
                    'two_factor_enabled': {
                        'bsonType': 'bool',
                        'description': '2FA enabled status'
                    },
                    'preferences': {
                        'bsonType': 'object',
                        'description': 'User preferences and settings'
                    }
                }
            }
        }
    }
    
    USERS_INDEXES = [
        {'keys': [('username', ASCENDING)], 'unique': True},
        {'keys': [('email', ASCENDING)], 'unique': True},
        {'keys': [('created_at', DESCENDING)]},
        {'keys': [('is_active', ASCENDING)]},
        {'keys': [('role', ASCENDING)]},
    ]
    
    # ========================================================================
    # ENCRYPTED_FILES COLLECTION
    # Stores metadata for all encrypted files
    # ========================================================================
    ENCRYPTED_FILES_SCHEMA = {
        'validator': {
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['original_filename', 'encrypted_filename', 'sender', 'created_at', 'status'],
                'properties': {
                    'original_filename': {
                        'bsonType': 'string',
                        'description': 'Original file name before encryption'
                    },
                    'encrypted_filename': {
                        'bsonType': 'string',
                        'description': 'Encrypted file name on disk'
                    },
                    'encrypted_file_path': {
                        'bsonType': 'string',
                        'description': 'Full path to encrypted file'
                    },
                    'wrapped_key_path': {
                        'bsonType': 'string',
                        'description': 'Path to wrapped key/metadata file'
                    },
                    'metadata_file': {
                        'bsonType': 'string',
                        'description': 'Path to metadata JSON file'
                    },
                    'sender': {
                        'bsonType': 'string',
                        'description': 'Username of file sender/owner'
                    },
                    'recipients': {
                        'bsonType': 'array',
                        'items': {'bsonType': 'string'},
                        'description': 'Array of recipient usernames'
                    },
                    'wrapped_keys': {
                        'bsonType': 'object',
                        'description': 'Wrapped AES keys for each user {username: hex_key}'
                    },
                    'encryption_type': {
                        'bsonType': 'string',
                        'enum': ['AES-128', 'AES-256'],
                        'description': 'AES encryption type used'
                    },
                    'key_size': {
                        'bsonType': 'int',
                        'description': 'Key size in bits (128 or 256)'
                    },
                    'file_size': {
                        'bsonType': 'int',
                        'description': 'Original file size in bytes'
                    },
                    'file_hash': {
                        'bsonType': 'string',
                        'description': 'SHA-256 hash of original file'
                    },
                    'file_type': {
                        'bsonType': 'string',
                        'description': 'File MIME type or extension'
                    },
                    'compressed': {
                        'bsonType': 'bool',
                        'description': 'Whether file was compressed before encryption'
                    },
                    'self_destruct': {
                        'bsonType': 'bool',
                        'description': 'Auto-delete after first download'
                    },
                    'message': {
                        'bsonType': 'string',
                        'description': 'Optional message to recipients'
                    },
                    'tags': {
                        'bsonType': 'array',
                        'items': {'bsonType': 'string'},
                        'description': 'User-defined tags for categorization'
                    },
                    'created_at': {
                        'bsonType': 'date',
                        'description': 'File encryption timestamp'
                    },
                    'expires_at': {
                        'bsonType': 'date',
                        'description': 'File expiration timestamp'
                    },
                    'download_count': {
                        'bsonType': 'int',
                        'description': 'Number of times file was downloaded'
                    },
                    'downloads': {
                        'bsonType': 'array',
                        'items': {
                            'bsonType': 'object',
                            'properties': {
                                'username': {'bsonType': 'string'},
                                'timestamp': {'bsonType': 'date'},
                                'ip_address': {'bsonType': 'string'}
                            }
                        },
                        'description': 'Download history'
                    },
                    'status': {
                        'bsonType': 'string',
                        'enum': ['active', 'expired', 'deleted', 'self_destructed'],
                        'description': 'File status'
                    },
                    'deleted_at': {
                        'bsonType': 'date',
                        'description': 'Deletion timestamp'
                    }
                }
            }
        }
    }
    
    ENCRYPTED_FILES_INDEXES = [
        {'keys': [('sender', ASCENDING), ('status', ASCENDING)]},
        {'keys': [('recipients', ASCENDING), ('status', ASCENDING)]},
        {'keys': [('created_at', DESCENDING)]},
        {'keys': [('expires_at', ASCENDING)]},
        {'keys': [('status', ASCENDING)]},
        {'keys': [('file_hash', ASCENDING)]},
        {'keys': [('tags', ASCENDING)]},
        {'keys': [('original_filename', TEXT)]},  # Full-text search
    ]
    
    # ========================================================================
    # CONTACTS COLLECTION
    # Stores user contact lists for quick recipient selection
    # ========================================================================
    CONTACTS_SCHEMA = {
        'validator': {
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['owner_username', 'contact_username', 'added_at'],
                'properties': {
                    'owner_username': {
                        'bsonType': 'string',
                        'description': 'Username who owns this contact'
                    },
                    'contact_username': {
                        'bsonType': 'string',
                        'description': 'Username of the contact'
                    },
                    'contact_email': {
                        'bsonType': 'string',
                        'description': 'Email of the contact (cached)'
                    },
                    'contact_full_name': {
                        'bsonType': 'string',
                        'description': 'Full name of the contact (cached)'
                    },
                    'nickname': {
                        'bsonType': 'string',
                        'description': 'Custom nickname for this contact'
                    },
                    'notes': {
                        'bsonType': 'string',
                        'description': 'Personal notes about this contact'
                    },
                    'tags': {
                        'bsonType': 'array',
                        'items': {'bsonType': 'string'},
                        'description': 'Tags for organizing contacts (e.g., work, family)'
                    },
                    'is_favorite': {
                        'bsonType': 'bool',
                        'description': 'Favorite contact flag'
                    },
                    'shared_files_count': {
                        'bsonType': 'int',
                        'description': 'Number of files shared with this contact'
                    },
                    'last_shared_at': {
                        'bsonType': 'date',
                        'description': 'Last time a file was shared with this contact'
                    },
                    'added_at': {
                        'bsonType': 'date',
                        'description': 'When contact was added'
                    },
                    'updated_at': {
                        'bsonType': 'date',
                        'description': 'Last update to contact info'
                    }
                }
            }
        }
    }
    
    CONTACTS_INDEXES = [
        {'keys': [('owner_username', ASCENDING), ('contact_username', ASCENDING)], 'unique': True},
        {'keys': [('owner_username', ASCENDING), ('is_favorite', DESCENDING)]},
        {'keys': [('owner_username', ASCENDING), ('tags', ASCENDING)]},
        {'keys': [('owner_username', ASCENDING), ('last_shared_at', DESCENDING)]},
    ]
    
    # ========================================================================
    # ACTIVITY_LOGS COLLECTION
    # Tracks user actions for audit and activity feed
    # ========================================================================
    ACTIVITY_LOGS_SCHEMA = {
        'validator': {
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['username', 'action', 'timestamp'],
                'properties': {
                    'username': {
                        'bsonType': 'string',
                        'description': 'User who performed the action'
                    },
                    'action': {
                        'bsonType': 'string',
                        'enum': ['login', 'logout', 'register', 'encrypted', 'decrypted', 
                                'shared', 'downloaded', 'deleted', 'profile_updated', 
                                'password_changed', 'contact_added', 'contact_removed'],
                        'description': 'Type of action performed'
                    },
                    'file_id': {
                        'bsonType': 'string',
                        'description': 'Related file ID (if applicable)'
                    },
                    'file_name': {
                        'bsonType': 'string',
                        'description': 'File name (cached for display)'
                    },
                    'target_user': {
                        'bsonType': 'string',
                        'description': 'Target user (for sharing, contacts)'
                    },
                    'ip_address': {
                        'bsonType': 'string',
                        'description': 'IP address of the user'
                    },
                    'user_agent': {
                        'bsonType': 'string',
                        'description': 'Browser/client user agent'
                    },
                    'timestamp': {
                        'bsonType': 'date',
                        'description': 'When action occurred'
                    },
                    'details': {
                        'bsonType': 'object',
                        'description': 'Additional action details'
                    },
                    'success': {
                        'bsonType': 'bool',
                        'description': 'Whether action succeeded'
                    },
                    'error_message': {
                        'bsonType': 'string',
                        'description': 'Error message if action failed'
                    }
                }
            }
        }
    }
    
    ACTIVITY_LOGS_INDEXES = [
        {'keys': [('username', ASCENDING), ('timestamp', DESCENDING)]},
        {'keys': [('action', ASCENDING), ('timestamp', DESCENDING)]},
        {'keys': [('file_id', ASCENDING)]},
        {'keys': [('timestamp', DESCENDING)], 'expireAfterSeconds': 7776000},  # 90 days TTL
    ]
    
    # ========================================================================
    # USER_STATISTICS COLLECTION
    # Aggregated statistics per user (updated periodically)
    # ========================================================================
    USER_STATISTICS_SCHEMA = {
        'validator': {
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['username', 'updated_at'],
                'properties': {
                    'username': {
                        'bsonType': 'string',
                        'description': 'User these stats belong to'
                    },
                    'total_files_sent': {
                        'bsonType': 'int',
                        'description': 'Total files encrypted/sent'
                    },
                    'total_files_received': {
                        'bsonType': 'int',
                        'description': 'Total files received'
                    },
                    'total_storage_used_bytes': {
                        'bsonType': 'long',
                        'description': 'Total storage used in bytes'
                    },
                    'active_files_count': {
                        'bsonType': 'int',
                        'description': 'Number of active files'
                    },
                    'expired_files_count': {
                        'bsonType': 'int',
                        'description': 'Number of expired files'
                    },
                    'deleted_files_count': {
                        'bsonType': 'int',
                        'description': 'Number of deleted files'
                    },
                    'total_downloads': {
                        'bsonType': 'int',
                        'description': 'Total downloads by others'
                    },
                    'contacts_count': {
                        'bsonType': 'int',
                        'description': 'Number of contacts'
                    },
                    'files_by_type': {
                        'bsonType': 'object',
                        'description': 'Count of files by type {pdf: 10, jpg: 5, ...}'
                    },
                    'files_by_month': {
                        'bsonType': 'array',
                        'items': {
                            'bsonType': 'object',
                            'properties': {
                                'month': {'bsonType': 'string'},
                                'count': {'bsonType': 'int'}
                            }
                        },
                        'description': 'Files encrypted per month (last 12 months)'
                    },
                    'top_recipients': {
                        'bsonType': 'array',
                        'items': {
                            'bsonType': 'object',
                            'properties': {
                                'username': {'bsonType': 'string'},
                                'count': {'bsonType': 'int'}
                            }
                        },
                        'description': 'Top 10 recipients'
                    },
                    'updated_at': {
                        'bsonType': 'date',
                        'description': 'Last statistics update'
                    }
                }
            }
        }
    }
    
    USER_STATISTICS_INDEXES = [
        {'keys': [('username', ASCENDING)], 'unique': True},
        {'keys': [('updated_at', DESCENDING)]},
    ]
    
    # ========================================================================
    # SHARED_LINKS COLLECTION
    # Temporary shareable links for files (optional feature)
    # ========================================================================
    SHARED_LINKS_SCHEMA = {
        'validator': {
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['link_id', 'file_id', 'owner_username', 'created_at', 'expires_at'],
                'properties': {
                    'link_id': {
                        'bsonType': 'string',
                        'description': 'Unique shareable link ID/token'
                    },
                    'file_id': {
                        'bsonType': 'string',
                        'description': 'Associated file ID'
                    },
                    'owner_username': {
                        'bsonType': 'string',
                        'description': 'User who created the link'
                    },
                    'password_protected': {
                        'bsonType': 'bool',
                        'description': 'Whether link requires password'
                    },
                    'password_hash': {
                        'bsonType': 'string',
                        'description': 'Hashed password for link access'
                    },
                    'max_downloads': {
                        'bsonType': 'int',
                        'description': 'Maximum number of downloads allowed'
                    },
                    'download_count': {
                        'bsonType': 'int',
                        'description': 'Current download count'
                    },
                    'created_at': {
                        'bsonType': 'date',
                        'description': 'Link creation timestamp'
                    },
                    'expires_at': {
                        'bsonType': 'date',
                        'description': 'Link expiration timestamp'
                    },
                    'is_active': {
                        'bsonType': 'bool',
                        'description': 'Link active status'
                    },
                    'access_logs': {
                        'bsonType': 'array',
                        'items': {
                            'bsonType': 'object',
                            'properties': {
                                'timestamp': {'bsonType': 'date'},
                                'ip_address': {'bsonType': 'string'},
                                'success': {'bsonType': 'bool'}
                            }
                        },
                        'description': 'Link access attempts'
                    }
                }
            }
        }
    }
    
    SHARED_LINKS_INDEXES = [
        {'keys': [('link_id', ASCENDING)], 'unique': True},
        {'keys': [('file_id', ASCENDING)]},
        {'keys': [('owner_username', ASCENDING)]},
        {'keys': [('expires_at', ASCENDING)]},
        {'keys': [('is_active', ASCENDING)]},
    ]
    
    # ========================================================================
    # NOTIFICATIONS COLLECTION
    # User notifications for file sharing, expiry, etc.
    # ========================================================================
    NOTIFICATIONS_SCHEMA = {
        'validator': {
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['username', 'type', 'created_at'],
                'properties': {
                    'username': {
                        'bsonType': 'string',
                        'description': 'User who receives this notification'
                    },
                    'type': {
                        'bsonType': 'string',
                        'enum': ['file_shared', 'file_expiring', 'file_downloaded', 
                                'file_deleted', 'contact_request', 'system_update'],
                        'description': 'Notification type'
                    },
                    'title': {
                        'bsonType': 'string',
                        'description': 'Notification title'
                    },
                    'message': {
                        'bsonType': 'string',
                        'description': 'Notification message'
                    },
                    'file_id': {
                        'bsonType': 'string',
                        'description': 'Related file ID'
                    },
                    'from_user': {
                        'bsonType': 'string',
                        'description': 'User who triggered the notification'
                    },
                    'is_read': {
                        'bsonType': 'bool',
                        'description': 'Read status'
                    },
                    'read_at': {
                        'bsonType': 'date',
                        'description': 'When notification was read'
                    },
                    'created_at': {
                        'bsonType': 'date',
                        'description': 'Notification creation timestamp'
                    },
                    'action_url': {
                        'bsonType': 'string',
                        'description': 'URL to navigate when clicked'
                    },
                    'priority': {
                        'bsonType': 'string',
                        'enum': ['low', 'normal', 'high', 'urgent'],
                        'description': 'Notification priority'
                    }
                }
            }
        }
    }
    
    NOTIFICATIONS_INDEXES = [
        {'keys': [('username', ASCENDING), ('is_read', ASCENDING), ('created_at', DESCENDING)]},
        {'keys': [('created_at', DESCENDING)], 'expireAfterSeconds': 2592000},  # 30 days TTL
    ]
    
    # ========================================================================
    # SYSTEM_SETTINGS COLLECTION
    # Global system configuration and settings
    # ========================================================================
    SYSTEM_SETTINGS_SCHEMA = {
        'validator': {
            '$jsonSchema': {
                'bsonType': 'object',
                'required': ['setting_key', 'setting_value'],
                'properties': {
                    'setting_key': {
                        'bsonType': 'string',
                        'description': 'Unique setting key'
                    },
                    'setting_value': {
                        'description': 'Setting value (any type)'
                    },
                    'description': {
                        'bsonType': 'string',
                        'description': 'Setting description'
                    },
                    'updated_at': {
                        'bsonType': 'date',
                        'description': 'Last update timestamp'
                    },
                    'updated_by': {
                        'bsonType': 'string',
                        'description': 'Admin who updated this setting'
                    }
                }
            }
        }
    }
    
    SYSTEM_SETTINGS_INDEXES = [
        {'keys': [('setting_key', ASCENDING)], 'unique': True},
    ]


# Collection mapping for easy reference
COLLECTIONS = {
    'users': {
        'name': 'users',
        'schema': DatabaseSchema.USERS_SCHEMA,
        'indexes': DatabaseSchema.USERS_INDEXES
    },
    'encrypted_files': {
        'name': 'encrypted_files',
        'schema': DatabaseSchema.ENCRYPTED_FILES_SCHEMA,
        'indexes': DatabaseSchema.ENCRYPTED_FILES_INDEXES
    },
    'contacts': {
        'name': 'contacts',
        'schema': DatabaseSchema.CONTACTS_SCHEMA,
        'indexes': DatabaseSchema.CONTACTS_INDEXES
    },
    'activity_logs': {
        'name': 'activity_logs',
        'schema': DatabaseSchema.ACTIVITY_LOGS_SCHEMA,
        'indexes': DatabaseSchema.ACTIVITY_LOGS_INDEXES
    },
    'user_statistics': {
        'name': 'user_statistics',
        'schema': DatabaseSchema.USER_STATISTICS_SCHEMA,
        'indexes': DatabaseSchema.USER_STATISTICS_INDEXES
    },
    'shared_links': {
        'name': 'shared_links',
        'schema': DatabaseSchema.SHARED_LINKS_SCHEMA,
        'indexes': DatabaseSchema.SHARED_LINKS_INDEXES
    },
    'notifications': {
        'name': 'notifications',
        'schema': DatabaseSchema.NOTIFICATIONS_SCHEMA,
        'indexes': DatabaseSchema.NOTIFICATIONS_INDEXES
    },
    'system_settings': {
        'name': 'system_settings',
        'schema': DatabaseSchema.SYSTEM_SETTINGS_SCHEMA,
        'indexes': DatabaseSchema.SYSTEM_SETTINGS_INDEXES
    }
}
