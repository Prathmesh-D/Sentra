"""
RSA Utilities for Hybrid Cryptography System
"""

import os
import base64
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes

def generate_rsa_keypair(key_size=2048):
    """Generate RSA public/private key pair"""
    print(f"[INFO] Generating RSA-{key_size} keypair...")
    
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size
    )
    public_key = private_key.public_key()
    
    print(f"[SUCCESS] RSA-{key_size} keypair generated successfully")
    return private_key, public_key

def save_keys_to_files(private_key, public_key, keys_dir, key_name="rsa_key"):
    """Save RSA keys to PEM files"""
    os.makedirs(keys_dir, exist_ok=True)
    
    # Save private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    private_key_path = os.path.join(keys_dir, f"{key_name}_private.pem")
    with open(private_key_path, 'wb') as f:
        f.write(private_pem)
    
    # Save public key
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    public_key_path = os.path.join(keys_dir, f"{key_name}_public.pem")
    with open(public_key_path, 'wb') as f:
        f.write(public_pem)
    
    print(f"[SUCCESS] Keys saved to {keys_dir}")
    return private_key_path, public_key_path

def encrypt_aes_key_with_rsa(aes_key, public_key):
    """Encrypt AES key using RSA public key"""
    try:
        encrypted_key = public_key.encrypt(
            aes_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        print("[SUCCESS] AES key encrypted with RSA")
        return encrypted_key
    except Exception as e:
        print(f"[ERROR] RSA encryption failed: {e}")
        return None

def decrypt_aes_key_with_rsa(encrypted_aes_key, private_key):
    """Decrypt AES key using RSA private key"""
    try:
        decrypted_key = private_key.decrypt(
            encrypted_aes_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        print("[SUCCESS] AES key decrypted with RSA")
        return decrypted_key
    except Exception as e:
        print(f"[ERROR] RSA decryption failed: {e}")
        return None

def load_private_key_from_pem(pem_data):
    """Load RSA private key from PEM string"""
    try:
        if isinstance(pem_data, str):
            pem_data = pem_data.encode('utf-8')
        
        private_key = serialization.load_pem_private_key(
            pem_data,
            password=None
        )
        return private_key
    except Exception as e:
        print(f"[ERROR] Failed to load private key from PEM: {e}")
        return None

def load_public_key_from_pem(pem_data):
    """Load RSA public key from PEM string"""
    try:
        if isinstance(pem_data, str):
            pem_data = pem_data.encode('utf-8')
        
        public_key = serialization.load_pem_public_key(pem_data)
        return public_key
    except Exception as e:
        print(f"[ERROR] Failed to load public key from PEM: {e}")
        return None

def load_private_key_from_file(file_path):
    """Load RSA private key from PEM file"""
    try:
        with open(file_path, 'rb') as f:
            pem_data = f.read()
        return load_private_key_from_pem(pem_data)
    except Exception as e:
        print(f"[ERROR] Failed to load private key from file: {e}")
        return None

def load_public_key_from_file(file_path):
    """Load RSA public key from PEM file"""
    try:
        with open(file_path, 'rb') as f:
            pem_data = f.read()
        return load_public_key_from_pem(pem_data)
    except Exception as e:
        print(f"[ERROR] Failed to load public key from file: {e}")
        return None

def get_key_info(public_key):
    """Get information about RSA key"""
    key_size = public_key.key_size
    return {
        "algorithm": "RSA",
        "key_size_bits": key_size,
        "key_size_bytes": key_size // 8,
        "public_exponent": public_key.public_numbers().e
    }
