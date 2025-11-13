"""
AES Utilities for Hybrid Cryptography System
Handles AES file encryption/decryption, key generation, and file information
"""

import os
import hashlib
import mimetypes
from pathlib import Path
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

def generate_aes_key(key_size=32):
    """
    Generate a random AES key
    
    Args:
        key_size (int): Key size in bytes (16=128-bit, 24=192-bit, 32=256-bit)
        
    Returns:
        bytes: Random AES key
    """
    if key_size not in [16, 24, 32]:
        print(f"[WARNING] Invalid key size {key_size}, using 32 bytes (AES-256)")
        key_size = 32
    
    key = os.urandom(key_size)
    print(f"[SUCCESS] Generated AES-{key_size*8} key")
    return key

def get_file_info(file_path):
    """
    Get comprehensive file information
    
    Args:
        file_path (str): Path to file
        
    Returns:
        dict: File information including size, type, hash
    """
    file_path = Path(file_path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Get file stats
    stat_info = file_path.stat()
    
    # Determine MIME type
    mime_type, encoding = mimetypes.guess_type(str(file_path))
    if mime_type is None:
        mime_type = "application/octet-stream"
    
    # Calculate SHA-256 hash
    sha256_hash = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(8192):
            sha256_hash.update(chunk)
    
    file_info = {
        "name": file_path.name,
        "path": str(file_path),
        "extension": file_path.suffix.lower(),
        "size_bytes": stat_info.st_size,
        "size_mb": round(stat_info.st_size / (1024 * 1024), 3),
        "mime_type": mime_type,
        "encoding": encoding,
        "sha256_hash": sha256_hash.hexdigest()
    }
    
    print(f"[INFO] File analyzed: {file_info['name']} ({file_info['size_mb']} MB, {mime_type})")
    return file_info

def encrypt_file(input_file_path, output_file_path, aes_key):
    """
    Encrypt a file using AES-GCM
    
    Args:
        input_file_path (str): Path to input file
        output_file_path (str): Path to output encrypted file
        aes_key (bytes): AES encryption key
        
    Returns:
        tuple: (success, iv, tag, file_info) or (False, None, None, None)
    """
    try:
        # Get file info first
        file_info = get_file_info(input_file_path)
        
        # Generate random IV (96-bit for GCM)
        iv = os.urandom(12)
        
        # Create cipher
        cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv))
        encryptor = cipher.encryptor()
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_file_path), exist_ok=True)
        
        # Encrypt file
        with open(input_file_path, 'rb') as infile, open(output_file_path, 'wb') as outfile:
            while chunk := infile.read(8192):
                encrypted_chunk = encryptor.update(chunk)
                outfile.write(encrypted_chunk)
        
        # Finalize encryption and get authentication tag
        encryptor.finalize()
        tag = encryptor.tag
        
        print(f"[SUCCESS] File encrypted: {os.path.basename(output_file_path)}")
        return True, iv, tag, file_info
        
    except Exception as e:
        print(f"[ERROR] Encryption failed: {e}")
        return False, None, None, None

def decrypt_file(encrypted_file_path, output_file_path, aes_key, iv, tag):
    """
    Decrypt a file using AES-GCM
    
    Args:
        encrypted_file_path (str): Path to encrypted file
        output_file_path (str): Path to output decrypted file
        aes_key (bytes): AES decryption key
        iv (bytes): Initialization vector
        tag (bytes): Authentication tag
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create cipher for decryption
        cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv, tag))
        decryptor = cipher.decryptor()
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_file_path), exist_ok=True)
        
        # Decrypt file
        with open(encrypted_file_path, 'rb') as infile, open(output_file_path, 'wb') as outfile:
            while chunk := infile.read(8192):
                decrypted_chunk = decryptor.update(chunk)
                outfile.write(decrypted_chunk)
        
        # Finalize decryption (this verifies the authentication tag)
        decryptor.finalize()
        
        print(f"[SUCCESS] File decrypted: {os.path.basename(output_file_path)}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Decryption failed: {e}")
        return False

def verify_file_integrity(file_path, expected_hash):
    """
    Verify file integrity using SHA-256 hash
    
    Args:
        file_path (str): Path to file to verify
        expected_hash (str): Expected SHA-256 hash
        
    Returns:
        bool: True if hash matches, False otherwise
    """
    try:
        sha256_hash = hashlib.sha256()
        with open(file_path, 'rb') as f:
            while chunk := f.read(8192):
                sha256_hash.update(chunk)
        
        actual_hash = sha256_hash.hexdigest()
        
        if actual_hash == expected_hash:
            print("[SUCCESS] File integrity verified ✓")
            return True
        else:
            print("[WARNING] File integrity check failed ✗")
            print(f"Expected: {expected_hash}")
            print(f"Actual:   {actual_hash}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Integrity verification failed: {e}")
        return False

def get_recommended_key_size(file_size_mb, file_type):
    """
    Get recommended AES key size based on file characteristics
    
    Args:
        file_size_mb (float): File size in megabytes
        file_type (str): MIME type of file
        
    Returns:
        int: Recommended key size in bytes
    """
    # Always use AES-256 (32 bytes) for maximum security
    # This is the current best practice
    return 32

if __name__ == "__main__":
    # Test AES functionality
    print("🧪 Testing AES Utilities")
    print("=" * 30)
    
    # Create test file
    test_file = "test_file.txt"
    test_content = "Hello, World! This is a test file for AES encryption.\nMultiple lines of text to test encryption."
    
    with open(test_file, 'w') as f:
        f.write(test_content)
    
    # Generate AES key
    aes_key = generate_aes_key()
    
    # Test encryption
    encrypted_file = "test_file.enc"
    success, iv, tag, file_info = encrypt_file(test_file, encrypted_file, aes_key)
    
    if success:
        print(f"Original hash: {file_info['sha256_hash']}")
        
        # Test decryption
        decrypted_file = "test_file_decrypted.txt"
        decrypt_success = decrypt_file(encrypted_file, decrypted_file, aes_key, iv, tag)
        
        if decrypt_success:
            # Verify integrity
            if verify_file_integrity(decrypted_file, file_info['sha256_hash']):
                print("✅ AES encryption/decryption test PASSED!")
            else:
                print("❌ Integrity verification FAILED!")
        else:
            print("❌ Decryption FAILED!")
    else:
        print("❌ Encryption FAILED!")
    
    # Cleanup
    for f in [test_file, encrypted_file, decrypted_file]:
        if os.path.exists(f):
            os.remove(f)
