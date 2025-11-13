"""
User Service
Handles user management, authentication, and RSA key generation
"""
from datetime import datetime
from bson import ObjectId
import bcrypt
import logging
from flask import current_app

from app.services.database import get_collection

logger = logging.getLogger(__name__)




class UserService:
    """Service class for user operations"""
    
    def __init__(self):
        """Initialize user service"""
        pass
    
    def _get_users_collection(self):
        """Get users collection"""
        collection_name = current_app.config['MONGO_COLLECTION_USERS']
        return get_collection(collection_name)
    
    def create_user(self, username, email, password, full_name=None):
        """
        Create a new user with RSA keypair
        
        Args:
            username (str): Unique username
            email (str): User email
            password (str): Plain text password (will be hashed)
            full_name (str): User's full name
            
        Returns:
            dict: Created user document or None if failed
        """
        try:
            users = self._get_users_collection()
            
            # Check if user already exists
            if users.find_one({'$or': [{'username': username}, {'email': email}]}):
                logger.warning(f"User already exists: {username} or {email}")
                return None
            
            # Hash password with bcrypt
            password_hash = bcrypt.hashpw(
                password.encode('utf-8'),
                bcrypt.gensalt(rounds=current_app.config['BCRYPT_ROUNDS'])
            )
            
            # Generate RSA keypair using new crypto module
            from crypto.core.rsa_utils import generate_rsa_keypair
            from cryptography.hazmat.primitives import serialization
            private_key, public_key = generate_rsa_keypair()
            public_key_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode('utf-8')
            private_key_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ).decode('utf-8')
            # Create user document
            user_doc = {
                'username': username,
                'email': email,
                'password_hash': password_hash.decode('utf-8'),
                'public_key': public_key_pem,
                'private_key_encrypted': private_key_pem,  # TODO: Encrypt this
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'last_login': None,
                'is_active': True,
                'profile': {
                    'full_name': full_name or username,
                    'phone': '',
                    'organization': ''
                }
            }
            result = users.insert_one(user_doc)
            user_doc['_id'] = result.inserted_id
            logger.info(f"[OK] User created: {username}")
            return user_doc
            result = users.insert_one(user_doc)
            user_doc['_id'] = result.inserted_id
            
            logger.info(f"[OK] User created: {username}")
            return user_doc
            
        except Exception as e:
            logger.error(f"Failed to create user {username}: {e}")
            return None
    
    def verify_credentials(self, username, password):
        """
        Verify user credentials
        
        Args:
            username (str): Username
            password (str): Plain text password
            
        Returns:
            dict: User document if valid, None otherwise
        """
        try:
            users = self._get_users_collection()
            
            # Find user
            user = users.find_one({'username': username})
            if not user:
                logger.warning(f"User not found: {username}")
                return None
            
            # Check if active
            if not user.get('is_active', True):
                logger.warning(f"User inactive: {username}")
                return None
            
            # Verify password
            password_hash = user['password_hash'].encode('utf-8')
            if bcrypt.checkpw(password.encode('utf-8'), password_hash):
                # Update last login
                users.update_one(
                    {'_id': user['_id']},
                    {'$set': {'last_login': datetime.utcnow()}}
                )
                logger.info(f"[OK] User authenticated: {username}")
                return user
            else:
                logger.warning(f"Invalid password for user: {username}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to verify credentials for {username}: {e}")
            return None
    
    def get_user_by_username(self, username):
        """Get user by username"""
        try:
            users = self._get_users_collection()
            return users.find_one({'username': username})
        except Exception as e:
            logger.error(f"Failed to get user {username}: {e}")
            return None
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            users = self._get_users_collection()
            return users.find_one({'_id': ObjectId(user_id)})
        except Exception as e:
            logger.error(f"Failed to get user by id {user_id}: {e}")
            return None
    
    def update_profile(self, username, profile_data):
        """
        Update user profile
        
        Args:
            username (str): Username
            profile_data (dict): Profile fields to update
            
        Returns:
            bool: True if successful
        """
        try:
            users = self._get_users_collection()
            
            update_fields = {
                'updated_at': datetime.utcnow()
            }
            
            # Update allowed profile fields
            allowed_fields = ['full_name', 'email', 'phone', 'organization']
            for field in allowed_fields:
                if field in profile_data:
                    if field == 'email':
                        update_fields['email'] = profile_data['email']
                    else:
                        update_fields[f'profile.{field}'] = profile_data[field]
            
            result = users.update_one(
                {'username': username},
                {'$set': update_fields}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Failed to update profile for {username}: {e}")
            return False
    
    def change_password(self, username, current_password, new_password):
        """
        Change user password
        
        Args:
            username (str): Username
            current_password (str): Current password
            new_password (str): New password
            
        Returns:
            bool: True if successful
        """
        try:
            # Verify current password
            user = self.verify_credentials(username, current_password)
            if not user:
                return False
            
            # Hash new password
            new_password_hash = bcrypt.hashpw(
                new_password.encode('utf-8'),
                bcrypt.gensalt(rounds=current_app.config['BCRYPT_ROUNDS'])
            )
            
            # Update password
            users = self._get_users_collection()
            result = users.update_one(
                {'username': username},
                {'$set': {
                    'password_hash': new_password_hash.decode('utf-8'),
                    'updated_at': datetime.utcnow()
                }}
            )
            
            logger.info(f"[OK] Password changed for user: {username}")
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Failed to change password for {username}: {e}")
            return False
    
    def get_user_public_key(self, username):
        """Get user's RSA public key"""
        try:
            users = self._get_users_collection()
            user = users.find_one({'username': username}, {'public_key': 1})
            return user.get('public_key') if user else None
        except Exception as e:
            logger.error(f"Failed to get public key for {username}: {e}")
            return None


# Singleton instance
user_service = UserService()
