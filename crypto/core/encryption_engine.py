#!/usr/bin/env python3
"""
Hybrid Cryptography File Encryption System - Main Application
Combines AES file encryption with RSA key encryption for secure file sharing
"""

import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from . import aes_utils, rsa_utils
import utils.file_helper as file_helper

class HybridCryptoSystem:
    """Main class for hybrid cryptography file encryption system"""
    
    def __init__(self, base_dir=None):
        """
        Initialize the crypto system
        
        Args:
            base_dir (str): Base directory for the project (default: current directory)
        """
        if base_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
        
        self.base_dir = base_dir
        self.folders = file_helper.create_project_folders(base_dir)
        
        # Key storage
        self.private_key = None
        self.public_key = None
        
        print(f"[CRYPTO] Hybrid Crypto System initialized at: {base_dir}")
    
    def generate_or_load_keys(self, key_name="main_key", force_new=False):
        """
        Generate new RSA keys or load existing ones
        
        Args:
            key_name (str): Name for the key files
            force_new (bool): Force generation of new keys
            
        Returns:
            bool: True if successful, False otherwise
        """
        private_key_path = os.path.join(self.folders['keys'], f"{key_name}_private.pem")
        public_key_path = os.path.join(self.folders['keys'], f"{key_name}_public.pem")
        
        # Try to load existing keys first (unless forced to create new)
        if not force_new and os.path.exists(private_key_path) and os.path.exists(public_key_path):
            try:
                self.private_key = rsa_utils.load_private_key_from_file(private_key_path)
                self.public_key = rsa_utils.load_public_key_from_file(public_key_path)
                print(f"[SUCCESS] Loaded existing RSA keys: {key_name}")
                return True
            except Exception as e:
                print(f"[WARNING] Failed to load existing keys: {e}")
        
        # Generate new keys
        try:
            self.private_key, self.public_key = rsa_utils.generate_rsa_keypair()
            rsa_utils.save_keys_to_files(self.private_key, self.public_key, self.folders['keys'], key_name)
            return True
        except Exception as e:
            print(f"[ERROR] Failed to generate RSA keys: {e}")
            return False
    
    def encrypt_file(self, input_file_path, sender="Unknown", receiver="Unknown"):
        """
        Encrypt a file using hybrid cryptography (AES + RSA)
        
        Args:
            input_file_path (str): Path to file to encrypt
            sender (str): Sender identifier
            receiver (str): Receiver identifier
            
        Returns:
            dict: Encryption result with file paths and metadata
        """
        print(f"\n[LOCK] ENCRYPTING FILE: {os.path.basename(input_file_path)}")
        print("-" * 50)
        
        try:
            # Ensure we have keys
            if not self.private_key or not self.public_key:
                if not self.generate_or_load_keys():
                    return {"success": False, "error": "Failed to load/generate RSA keys"}
            
            # Generate AES key
            aes_key = aes_utils.generate_aes_key()
            
            # Generate output filename
            encrypted_filename = file_helper.generate_filename(
                os.path.basename(input_file_path), 
                suffix="encrypted",
                extension=".enc"
            )
            encrypted_file_path = os.path.join(self.folders['encrypted'], encrypted_filename)
            
            # Encrypt file with AES
            success, iv, tag, file_info = aes_utils.encrypt_file(
                input_file_path, 
                encrypted_file_path, 
                aes_key
            )
            
            if not success:
                return {"success": False, "error": "AES encryption failed"}
            
            # Encrypt AES key with RSA
            encrypted_aes_key = rsa_utils.encrypt_aes_key_with_rsa(aes_key, self.public_key)
            
            if encrypted_aes_key is None:
                return {"success": False, "error": "RSA key encryption failed"}
            
            # Create metadata
            metadata = file_helper.create_encryption_metadata(
                file_info, encrypted_filename, iv, tag, encrypted_aes_key, sender, receiver
            )
            
            # Save metadata
            metadata_filename = file_helper.generate_filename(
                os.path.basename(input_file_path),
                suffix="metadata", 
                extension=".json"
            )
            metadata_file_path = os.path.join(self.folders['metadata'], metadata_filename)
            
            file_helper.save_metadata(metadata, metadata_file_path)
            
            result = {
                "success": True,
                "encrypted_file": encrypted_file_path,
                "metadata_file": metadata_file_path,
                "original_file_info": file_info,
                "sender": sender,
                "receiver": receiver
            }
            
            print(f"[OK] Encryption completed successfully!")
            print(f"   Encrypted file: {encrypted_filename}")
            print(f"   Metadata file: {metadata_filename}")
            
            return result
            
        except Exception as e:
            error_msg = f"Encryption failed: {e}"
            print(f"[ERROR] {error_msg}")
            return {"success": False, "error": error_msg}
    
    def decrypt_file(self, metadata_file_path, output_filename=None):
        """
        Decrypt a file using metadata and RSA private key
        
        Args:
            metadata_file_path (str): Path to metadata JSON file
            output_filename (str): Optional custom output filename
            
        Returns:
            dict: Decryption result with file path and verification status
        """
        print(f"\n[UNLOCK] DECRYPTING FILE FROM METADATA: {os.path.basename(metadata_file_path)}")
        print("-" * 60)
        
        try:
            # Ensure we have private key
            if not self.private_key:
                if not self.generate_or_load_keys():
                    return {"success": False, "error": "Failed to load RSA private key"}
            
            # Load metadata
            metadata = file_helper.load_metadata(metadata_file_path)
            if not metadata:
                return {"success": False, "error": "Failed to load metadata"}
            
            # Extract encryption details
            encrypted_filename = metadata["encrypted_file"]
            iv = bytes.fromhex(metadata["iv"])
            tag = bytes.fromhex(metadata["tag"])
            encrypted_aes_key = bytes.fromhex(metadata["encrypted_aes_key"])
            original_file_info = metadata["original_file"]
            
            # Locate encrypted file
            encrypted_file_path = os.path.join(self.folders['encrypted'], encrypted_filename)
            if not os.path.exists(encrypted_file_path):
                return {"success": False, "error": f"Encrypted file not found: {encrypted_filename}"}
            
            # Decrypt AES key with RSA
            aes_key = rsa_utils.decrypt_aes_key_with_rsa(encrypted_aes_key, self.private_key)
            if aes_key is None:
                return {"success": False, "error": "RSA key decryption failed"}
            
            # Generate output filename
            if output_filename is None:
                output_filename = file_helper.generate_filename(
                    original_file_info["name"],
                    suffix="decrypted",
                    extension=original_file_info["extension"],
                    include_timestamp=True
                )
            
            decrypted_file_path = os.path.join(self.folders['decrypted'], output_filename)
            
            # Decrypt file with AES
            success = aes_utils.decrypt_file(
                encrypted_file_path,
                decrypted_file_path,
                aes_key,
                iv,
                tag
            )
            if not success:
                return {"success": False, "error": "AES decryption failed"}

                # Verify file integrity
                integrity_check = aes_utils.verify_file_integrity(
                    decrypted_file_path,
                    original_file_info["sha256_hash"]
                )

                result = {
                    "success": True,
                    "decrypted_file": decrypted_file_path,
                    "original_file_info": original_file_info,
                    "integrity_verified": integrity_check,
                    "sender": metadata.get("communication", {}).get("sender", "Unknown"),
                    "receiver": metadata.get("communication", {}).get("receiver", "Unknown")
                }

                print(f"[OK] Decryption completed successfully!")
                print(f"   Decrypted file: {os.path.basename(decrypted_file_path)}")
                print(f"   Integrity check: {'PASSED' if integrity_check else 'FAILED'}")

                return result
            
        except Exception as e:
            error_msg = f"Decryption failed: {e}"
            print(f"[ERROR] {error_msg}")
            return {"success": False, "error": error_msg}
    
    def encrypt_multiple_files(self, input_folder, sender="Unknown", receiver="Unknown"):
        """
        Encrypt multiple files from a folder
        
        Args:
            input_folder (str): Path to folder containing files to encrypt
            sender (str): Sender identifier
            receiver (str): Receiver identifier
            
        Returns:
            dict: Results summary
        """
        print(f"\n[FOLDER] BATCH ENCRYPTION FROM: {input_folder}")
        print("=" * 60)
        
        files = file_helper.list_files_in_folder(input_folder)
        
        if not files:
            print("[WARNING] No files found to encrypt")
            return {"success": True, "encrypted_count": 0, "failed_count": 0, "results": []}
        
        results = []
        successful = 0
        failed = 0
        
        for file_path in files:
            print(f"\n[FILE] Processing: {os.path.basename(file_path)}")
            result = self.encrypt_file(file_path, sender, receiver)
            
            results.append({
                "file": os.path.basename(file_path),
                "result": result
            })
            
            if result["success"]:
                successful += 1
            else:
                failed += 1
        
        summary = {
            "success": True,
            "encrypted_count": successful,
            "failed_count": failed,
            "total_files": len(files),
            "results": results
        }
        
        print(f"\n[SUMMARY] BATCH ENCRYPTION SUMMARY:")
        print(f"   Total files: {len(files)}")
        print(f"   [OK] Successful: {successful}")
        print(f"   [ERROR] Failed: {failed}")
        
        return summary
    
    def show_status(self):
        """Display system status and folder contents"""
        print("\n" + "="*70)
        print("🎯 HYBRID CRYPTO SYSTEM STATUS")
        print("="*70)
        
        # Key status
        print(f"\n[KEY] RSA KEYS:")
        if self.private_key and self.public_key:
            key_info = rsa_utils.get_key_info(self.public_key)
            print(f"   Status: [OK] Loaded ({key_info['algorithm']}-{key_info['key_size_bits']})")
        else:
            print(f"   Status: [ERROR] Not loaded")
        
        # Folder contents
        file_helper.print_folder_contents(self.folders)

def main():
    """Main application entry point"""
    print("[START] HYBRID CRYPTOGRAPHY FILE ENCRYPTION SYSTEM")
    print("=" * 70)
    print("[FEATURES] Features:")
    print("   • AES-256-GCM file encryption")
    print("   • RSA-2048-OAEP key encryption") 
    print("   • File integrity verification")
    print("   • Organized folder structure")
    print("   • Comprehensive metadata")
    print("=" * 70)
    
    # Initialize system
    crypto_system = HybridCryptoSystem()
    
    # Generate/load keys
    crypto_system.generate_or_load_keys()
    
    # Demo with sample files
    sample_files = file_helper.list_files_in_folder(crypto_system.folders['files'])
    
    if sample_files:
        print(f"\n🎯 DEMO: Encrypting {len(sample_files)} file(s) from files/ folder")
        
        # Encrypt each file
        for file_path in sample_files[:3]:  # Limit to first 3 files
            result = crypto_system.encrypt_file(file_path, sender="Alice", receiver="Bob")
            
            if result["success"]:
                # Try to decrypt it back
                decrypt_result = crypto_system.decrypt_file(result["metadata_file"])
                
                if decrypt_result["success"]:
                    print(f"   [TEST] Round-trip test: PASSED")
                else:
                    print(f"   [TEST] Round-trip test: FAILED")
    else:
        print("\n[INFO] No files found in files/ folder")
        print("   Add some files to files/ folder and run again!")
        
        # Create a demo file
        demo_file_path = os.path.join(crypto_system.folders['files'], "demo.txt")
        demo_content = """Hello! This is a demo file for the Hybrid Crypto System.

This file demonstrates:
• AES-256 file encryption
• RSA-2048 key encryption  
• File integrity verification
• Metadata generation

The system encrypts this file with AES, then encrypts the AES key with RSA
for secure sharing between users.

Created by: Hybrid Crypto System v1.0"""
        
        with open(demo_file_path, 'w', encoding='utf-8') as f:
            f.write(demo_content)
        
        print(f"   [NOTE] Created demo file: {os.path.basename(demo_file_path)}")
        
        # Encrypt the demo file
        result = crypto_system.encrypt_file(demo_file_path, sender="System", receiver="User")
        if result["success"]:
            # Decrypt it back
            decrypt_result = crypto_system.decrypt_file(result["metadata_file"])
            if decrypt_result["success"]:
                print(f"   [TEST] Demo encryption/decryption: PASSED")
    
    # Show final status
    crypto_system.show_status()
    
    print(f"\n✨ System ready! Add files to files/ folder and run again to encrypt them.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 System interrupted by user")
    except Exception as e:
        print(f"\n❌ System error: {e}")
        import traceback
        traceback.print_exc()
