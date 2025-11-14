"""
Cryptography Service
Integrates the existing HybridCryptoSystem with Flask backend
"""
import os
import sys
import json
from pathlib import Path
from datetime import datetime, timedelta
from flask import current_app
from bson import ObjectId

# Add the project root to Python path so crypto package can be imported
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, PROJECT_ROOT)

# Import from crypto package
from crypto.core.encryption_engine import HybridCryptoSystem
from crypto.core import aes_utils, rsa_utils
from crypto.utils import file_helper


class CryptoService:
    """Service for handling file encryption and decryption"""
    
    def __init__(self):
        """Initialize the crypto service"""
        self.crypto_system = None
        self._initialized = False
    
    def get_file_type(self, filename):
        """
        Extract file type/extension from filename
        """
        if not filename or '.' not in filename:
            return 'unknown'
        
        extension = filename.rsplit('.', 1)[-1].lower()
        
        # Map extensions to friendly names
        extension_map = {
            # Documents
            'pdf': 'PDF',
            'doc': 'Document',
            'docx': 'Document',
            'txt': 'Text',
            'rtf': 'Document',
            'odt': 'Document',
            
            # Spreadsheets
            'xls': 'Spreadsheet',
            'xlsx': 'Spreadsheet',
            'csv': 'Spreadsheet',
            'ods': 'Spreadsheet',
            
            # Presentations
            'ppt': 'Presentation',
            'pptx': 'Presentation',
            'odp': 'Presentation',
            
            # Images
            'jpg': 'Image',
            'jpeg': 'Image',
            'png': 'Image',
            'gif': 'Image',
            'bmp': 'Image',
            'svg': 'Image',
            'webp': 'Image',
            
            # Archives
            'zip': 'Archive',
            'rar': 'Archive',
            '7z': 'Archive',
            'tar': 'Archive',
            'gz': 'Archive',
            
            # Videos
            'mp4': 'Video',
            'avi': 'Video',
            'mkv': 'Video',
            'mov': 'Video',
            'wmv': 'Video',
            
            # Audio
            'mp3': 'Audio',
            'wav': 'Audio',
            'flac': 'Audio',
            'aac': 'Audio',
            
            # Code
            'py': 'Code',
            'js': 'Code',
            'html': 'Code',
            'css': 'Code',
            'java': 'Code',
            'cpp': 'Code',
            'c': 'Code',
        }
        
        return extension_map.get(extension, extension.upper())
    
    def initialize(self, base_dir):
        """
        Initialize the HybridCryptoSystem
        
        Args:
            base_dir (str): Base directory for crypto operations
        """
        try:
            if not self._initialized:
                # Create crypto working directory
                crypto_dir = os.path.join(base_dir, 'crypto')
                os.makedirs(crypto_dir, exist_ok=True)
                
                # Initialize hybrid crypto system
                self.crypto_system = HybridCryptoSystem(base_dir=crypto_dir)
                self._initialized = True
                
                current_app.logger.info(f'[OK] Crypto system initialized at: {crypto_dir}')
                
        except Exception as e:
            current_app.logger.error(f'[ERROR] Failed to initialize crypto system: {str(e)}')
            raise
    
    def _ensure_initialized(self):
        """Ensure crypto system is initialized"""
        if not self._initialized:
            raise RuntimeError("Crypto service not initialized. Call initialize() first.")
    
    def encrypt_file(self, file_path, filename, username, recipients, encryption_type='AES-256',
                    expiry_days=7, compress=False, self_destruct=False, message=''):
        """
        Encrypt a file using hybrid cryptography
        
        Args:
            file_path (str): Path to file to encrypt
            filename (str): Original filename
            username (str): Username of sender
            recipients (list): List of recipient usernames
            encryption_type (str): AES-128 or AES-256
            expiry_days (int): Days until file expires
            compress (bool): Whether to compress file
            self_destruct (bool): Whether file self-destructs after reading
            message (str): Optional message to recipients
            
        Returns:
            dict: Encryption result with metadata
        """
        self._ensure_initialized()
        
        try:
            current_app.logger.info(f'[*] Starting encryption: {filename}')
            
            # Compress file if requested
            actual_file_path = file_path
            original_size = os.path.getsize(file_path)
            compressed_size = original_size
            
            if compress:
                try:
                    import gzip
                    import shutil
                    
                    compressed_path = file_path + '.gz'
                    with open(file_path, 'rb') as f_in:
                        with gzip.open(compressed_path, 'wb', compresslevel=6) as f_out:
                            shutil.copyfileobj(f_in, f_out)
                    
                    compressed_size = os.path.getsize(compressed_path)
                    compression_ratio = (1 - compressed_size / original_size) * 100
                    
                    current_app.logger.info(f'[COMPRESS] {original_size} -> {compressed_size} bytes ({compression_ratio:.1f}% saved)')
                    
                    actual_file_path = compressed_path
                except Exception as compress_error:
                    current_app.logger.warning(f'[WARN] Compression failed, using original file: {str(compress_error)}')
                    compress = False  # Mark as not compressed
            
            # Generate or load sender's keys
            sender_key_name = f"user_{username}"
            if not self.crypto_system.generate_or_load_keys(key_name=sender_key_name):
                raise Exception("Failed to load/generate sender keys")
            
            # Determine AES key size
            key_size = 32 if encryption_type == 'AES-256' else 16
            
            # Encrypt the file
            result = self.crypto_system.encrypt_file(
                input_file_path=actual_file_path,
                sender=username,
                receiver=','.join(recipients) if recipients else 'Unknown'
            )
            
            # Clean up compressed temp file if used
            if compress and actual_file_path != file_path and os.path.exists(actual_file_path):
                os.remove(actual_file_path)
            
            if not result.get('success'):
                raise Exception(result.get('error', 'Encryption failed'))
            
            if not result.get('success'):
                raise Exception(result.get('error', 'Encryption failed'))
            
            # Get the AES key from the encrypted metadata file
            import json
            with open(result['metadata_file'], 'r') as f:
                metadata_content = json.load(f)
            
            # Extract the encrypted AES key from metadata (it was encrypted with sender's key)
            encrypted_aes_key_hex = metadata_content.get('encrypted_aes_key')
            
            # Wrap the AES key for all recipients (including sender)
            all_users = [username] + (recipients if recipients else [])
            wrapped_keys = {}
            
            # For sender, use the already wrapped key
            wrapped_keys[username] = encrypted_aes_key_hex
            
            # Wrap for each recipient using their public keys
            if recipients:
                # Load the original AES key by decrypting with sender's private key
                try:
                    sender_key_name = f"user_{username}"
                    private_key_path = os.path.join(self.crypto_system.folders['keys'], f"{sender_key_name}_private.pem")
                    private_key = rsa_utils.load_private_key_from_file(private_key_path)
                    
                    encrypted_aes_key_bytes = bytes.fromhex(encrypted_aes_key_hex)
                    aes_key = rsa_utils.decrypt_aes_key_with_rsa(encrypted_aes_key_bytes, private_key)
                    
                    if aes_key:
                        # Now wrap it for each recipient
                        recipient_wrapped_keys = self.wrap_key_for_recipients(aes_key, recipients)
                        wrapped_keys.update(recipient_wrapped_keys)
                except Exception as e:
                    current_app.logger.warning(f'[WARN] Could not wrap keys for recipients: {str(e)}')
            
            # Calculate expiry date
            expiry_date = datetime.utcnow() + timedelta(days=expiry_days)
            
            # Get file type from filename
            file_type = self.get_file_type(filename)
            
            # Upload encrypted file to GridFS (cloud storage)
            from app.services.database import get_gridfs
            fs = get_gridfs()
            
            with open(result['encrypted_file'], 'rb') as encrypted_file:
                gridfs_id = fs.put(
                    encrypted_file,
                    filename=os.path.basename(result['encrypted_file']),
                    content_type='application/octet-stream',
                    metadata={
                        'original_filename': filename,
                        'sender': username,
                        'encryption_type': encryption_type
                    }
                )
            
            current_app.logger.info(f'[OK] Encrypted file uploaded to GridFS: {gridfs_id}')
            
            # Clean up local encrypted file after uploading to cloud
            try:
                os.remove(result['encrypted_file'])
                if result.get('metadata_file') and os.path.exists(result['metadata_file']):
                    os.remove(result['metadata_file'])
                current_app.logger.info('[OK] Local encrypted files cleaned up')
            except Exception as e:
                current_app.logger.warning(f'[WARN] Failed to cleanup local files: {str(e)}')
            
            # Prepare metadata (store GridFS ID instead of file path)
            metadata = {
                'original_filename': filename,
                'file_type': file_type,
                'encrypted_filename': os.path.basename(result['encrypted_file']),
                'gridfs_id': str(gridfs_id),  # Store GridFS file ID for cloud retrieval
                'sender': username,
                'recipients': recipients,
                'wrapped_keys': wrapped_keys,  # Store wrapped keys for all users
                'encryption_type': encryption_type,
                'key_size': key_size * 8,  # bits
                'file_size': result.get('original_file_info', {}).get('size_bytes', 0),
                'file_hash': result.get('original_file_info', {}).get('sha256', ''),
                'compressed': compress,
                'self_destruct': self_destruct,
                'message': message,
                'created_at': datetime.utcnow(),
                'expires_at': expiry_date,
                'download_count': 0,
                'status': 'active'
            }
            
            current_app.logger.info(f'[OK] File encrypted and stored in cloud: {filename}')
            
            return {
                'success': True,
                'metadata': metadata,
                'gridfs_id': str(gridfs_id)
            }
            
        except Exception as e:
            current_app.logger.error(f'[ERROR] Encryption failed: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }
    
    def decrypt_file(self, encrypted_file_path, wrapped_key_path, username, wrapped_key_hex=None, output_dir=None):
        """
        Decrypt a file using hybrid cryptography
        
        Args:
            encrypted_file_path (str): Path to encrypted file (not used with metadata approach)
            wrapped_key_path (str): Path to metadata file (contains all decryption info)
            username (str): Username of recipient (for loading their private key)
            wrapped_key_hex (str): Hex-encoded wrapped key for this specific user (new format)
            output_dir (str): Output directory for decrypted file
            
        Returns:
            dict: Decryption result with file path
        """
        self._ensure_initialized()
        
        try:
            current_app.logger.info(f'[*] Starting decryption for user: {username}')
            
            # Load user's RSA private key
            user_key_name = f"user_{username}"
            if not self.crypto_system.generate_or_load_keys(key_name=user_key_name):
                raise Exception(f"Failed to load RSA keys for user: {username}")
            
            # If we have the wrapped key directly, use it (new format)
            if wrapped_key_hex:
                current_app.logger.info('[*] Using wrapped key from metadata')
                
                # Load user's private key
                private_key_path = os.path.join(
                    self.crypto_system.folders['keys'],
                    f"{user_key_name}_private.pem"
                )
                private_key = rsa_utils.load_private_key_from_file(private_key_path)
                
                # Decrypt the wrapped AES key
                wrapped_key_bytes = bytes.fromhex(wrapped_key_hex)
                aes_key = rsa_utils.decrypt_aes_key_with_rsa(wrapped_key_bytes, private_key)
                
                if aes_key is None:
                    raise Exception("Failed to decrypt wrapped AES key")
                
                # Load metadata file to get IV and tag
                import json
                with open(wrapped_key_path, 'r') as f:
                    metadata_content = json.load(f)
                
                iv = bytes.fromhex(metadata_content['iv'])
                tag = bytes.fromhex(metadata_content['tag'])
                original_filename = metadata_content['original_file']['name']
                
                # Decrypt the file
                if output_dir is None:
                    output_dir = self.crypto_system.folders['decrypted']
                
                output_path = os.path.join(output_dir, original_filename)
                success = aes_utils.decrypt_file(encrypted_file_path, output_path, aes_key, iv, tag)
                
                if not success:
                    raise Exception("AES decryption failed")
                
                current_app.logger.info(f'[OK] File decrypted successfully')
                
                return {
                    'success': True,
                    'decrypted_file': output_path,
                    'file_size': os.path.getsize(output_path),
                    'integrity_verified': True
                }
            
            # Fall back to old format using crypto_system.decrypt_file()
            current_app.logger.info('[*] Using legacy metadata file format')
            
            # Load recipient's private key
            recipient_key_name = f"user_{username}"
            if not self.crypto_system.generate_or_load_keys(key_name=recipient_key_name):
                raise Exception("Failed to load recipient keys")
            
            # The wrapped_key_path is actually the metadata file path
            metadata_file_path = wrapped_key_path
            
            # Decrypt the file using metadata
            result = self.crypto_system.decrypt_file(
                metadata_file_path=metadata_file_path
            )
            
            if not result.get('success'):
                raise Exception(result.get('error', 'Decryption failed'))
            
            current_app.logger.info(f'[OK] File decrypted successfully')
            
            return {
                'success': True,
                'decrypted_file': result['decrypted_file'],
                'file_size': result.get('original_file_info', {}).get('size', 0),
                'integrity_verified': result.get('integrity_verified', False)
            }
            
        except Exception as e:
            current_app.logger.error(f'[ERROR] Decryption failed: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }
    
    def wrap_key_for_recipients(self, aes_key, recipients):
        """
        Wrap AES key with RSA public key for multiple recipients
        
        Args:
            aes_key (bytes): AES key to wrap
            recipients (list): List of recipient usernames
            
        Returns:
            dict: Mapping of username to wrapped key
        """
        self._ensure_initialized()
        
        wrapped_keys = {}
        
        for recipient in recipients:
            try:
                # Load recipient's public key
                recipient_key_name = f"user_{recipient}"
                public_key_path = os.path.join(
                    self.crypto_system.folders['keys'],
                    f"{recipient_key_name}_public.pem"
                )
                
                if not os.path.exists(public_key_path):
                    current_app.logger.warning(f'[WARN] Public key not found for: {recipient}')
                    continue
                
                # Load public key
                public_key = rsa_utils.load_public_key_from_file(public_key_path)
                
                # Wrap AES key with recipient's public key
                wrapped_key = rsa_utils.encrypt_aes_key_with_rsa(aes_key, public_key)
                
                # Store as hex for database (not base64)
                wrapped_keys[recipient] = wrapped_key.hex()
                
                current_app.logger.info(f'[OK] Wrapped key for recipient: {recipient}')
                
            except Exception as e:
                current_app.logger.error(f'[ERROR] Failed to wrap key for {recipient}: {str(e)}')
                
        return wrapped_keys
    
    def get_user_keys_path(self, username):
        """
        Get paths to user's RSA keys
        
        Args:
            username (str): Username
            
        Returns:
            dict: Paths to public and private keys
        """
        self._ensure_initialized()
        
        key_name = f"user_{username}"
        keys_dir = self.crypto_system.folders['keys']
        
        return {
            'public_key': os.path.join(keys_dir, f"{key_name}_public.pem"),
            'private_key': os.path.join(keys_dir, f"{key_name}_private.pem")
        }
    
    def generate_user_keys(self, username):
        """
        Generate RSA keys for a new user
        
        Args:
            username (str): Username
            
        Returns:
            dict: Paths to generated keys
        """
        self._ensure_initialized()
        
        try:
            key_name = f"user_{username}"
            
            # Generate new keys
            if not self.crypto_system.generate_or_load_keys(key_name=key_name, force_new=True):
                raise Exception("Failed to generate keys")
            
            keys = self.get_user_keys_path(username)
            
            current_app.logger.info(f'[OK] Generated RSA keys for user: {username}')
            
            return {
                'success': True,
                'keys': keys
            }
            
        except Exception as e:
            current_app.logger.error(f'[ERROR] Key generation failed: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }
    
    def cleanup_temp_files(self, *file_paths):
        """
        Clean up temporary files
        
        Args:
            *file_paths: Paths to files to delete
        """
        for file_path in file_paths:
            try:
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
                    current_app.logger.info(f'[OK] Cleaned up temp file: {os.path.basename(file_path)}')
            except Exception as e:
                current_app.logger.warning(f'[WARN] Failed to cleanup {file_path}: {str(e)}')


# Global crypto service instance
crypto_service = CryptoService()


def get_crypto_service():
    """Get the global crypto service instance"""
    return crypto_service
