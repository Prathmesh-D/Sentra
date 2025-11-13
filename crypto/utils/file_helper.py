"""
File Helper Utilities for Hybrid Cryptography System
Handles metadata generation, folder management, and file operations
"""

import os
import json
import time
from datetime import datetime
from pathlib import Path

def create_project_folders(base_dir):
    """
    Create all necessary project folders
    
    Args:
        base_dir (str): Base directory for the project
        
    Returns:
        dict: Dictionary of folder paths
    """
    folders = {
        'files': os.path.join(base_dir, 'files'),
        'encrypted': os.path.join(base_dir, 'encrypted'), 
        'decrypted': os.path.join(base_dir, 'decrypted'),
        'metadata': os.path.join(base_dir, 'metadata'),
        'keys': os.path.join(base_dir, 'keys')
    }
    
    # Create all folders
    for folder_name, folder_path in folders.items():
        os.makedirs(folder_path, exist_ok=True)
        print(f"[INFO] Folder ready: {folder_name}/ -> {folder_path}")
    
    return folders

def generate_timestamp():
    """
    Generate timestamp string for file naming
    
    Returns:
        str: Timestamp in format YYYYMMDD_HHMMSS
    """
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def generate_filename(original_name, suffix="", extension=".enc", include_timestamp=True):
    """
    Generate filename with optional timestamp and suffix
    
    Args:
        original_name (str): Original filename
        suffix (str): Optional suffix to add
        extension (str): File extension
        include_timestamp (bool): Whether to include timestamp
        
    Returns:
        str: Generated filename
    """
    base_name = Path(original_name).stem
    
    parts = [base_name]
    
    if suffix:
        parts.append(suffix)
        
    if include_timestamp:
        parts.append(generate_timestamp())
    
    filename = "_".join(parts) + extension
    return filename

def save_metadata(metadata_dict, metadata_file_path):
    """
    Save metadata to JSON file
    
    Args:
        metadata_dict (dict): Metadata dictionary
        metadata_file_path (str): Path to save metadata file
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        os.makedirs(os.path.dirname(metadata_file_path), exist_ok=True)
        
        with open(metadata_file_path, 'w', encoding='utf-8') as f:
            json.dump(metadata_dict, f, indent=2, ensure_ascii=False)
        
        print(f"[SUCCESS] Metadata saved: {os.path.basename(metadata_file_path)}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to save metadata: {e}")
        return False

def load_metadata(metadata_file_path):
    """
    Load metadata from JSON file
    
    Args:
        metadata_file_path (str): Path to metadata file
        
    Returns:
        dict: Metadata dictionary or None if failed
    """
    try:
        with open(metadata_file_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        print(f"[SUCCESS] Metadata loaded: {os.path.basename(metadata_file_path)}")
        return metadata
        
    except Exception as e:
        print(f"[ERROR] Failed to load metadata: {e}")
        return None

def create_encryption_metadata(file_info, encrypted_filename, iv, tag, encrypted_aes_key, sender="Unknown", receiver="Unknown"):
    """
    Create comprehensive metadata for encrypted file
    
    Args:
        file_info (dict): Original file information
        encrypted_filename (str): Name of encrypted file
        iv (bytes): Initialization vector
        tag (bytes): Authentication tag
        encrypted_aes_key (bytes): RSA-encrypted AES key
        sender (str): Sender identifier
        receiver (str): Receiver identifier
        
    Returns:
        dict: Complete metadata dictionary
    """
    timestamp = generate_timestamp()
    
    metadata = {
        # Encryption details
        "encrypted_file": encrypted_filename,
        "iv": iv.hex(),
        "tag": tag.hex(), 
        "encrypted_aes_key": encrypted_aes_key.hex(),
        "aes_key_size": len(iv) * 8 if len(iv) <= 4 else 256,  # Estimate key size
        
        # Original file information
        "original_file": {
            "name": file_info["name"],
            "extension": file_info["extension"],
            "size_bytes": file_info["size_bytes"],
            "size_mb": file_info["size_mb"],
            "mime_type": file_info["mime_type"],
            "encoding": file_info["encoding"],
            "sha256_hash": file_info["sha256_hash"]
        },
        
        # Encryption session details
        "encryption_info": {
            "algorithm": "AES-GCM + RSA-OAEP",
            "aes_mode": "GCM",
            "rsa_padding": "OAEP",
            "timestamp": timestamp,
            "created_at": datetime.now().isoformat()
        },
        
        # Communication details
        "communication": {
            "sender": sender,
            "receiver": receiver
        },
        
        # Metadata version for future compatibility
        "metadata_version": "1.0"
    }
    
    return metadata

def list_files_in_folder(folder_path, extensions=None):
    """
    List files in a folder with optional extension filtering
    
    Args:
        folder_path (str): Path to folder
        extensions (list): List of file extensions to include (e.g., ['.txt', '.pdf'])
        
    Returns:
        list: List of file paths
    """
    try:
        folder_path = Path(folder_path)
        
        if not folder_path.exists():
            print(f"[WARNING] Folder does not exist: {folder_path}")
            return []
        
        files = []
        for file_path in folder_path.iterdir():
            if file_path.is_file():
                if extensions is None or file_path.suffix.lower() in extensions:
                    files.append(str(file_path))
        
        print(f"[INFO] Found {len(files)} file(s) in {folder_path.name}/")
        return sorted(files)
        
    except Exception as e:
        print(f"[ERROR] Failed to list files: {e}")
        return []

def get_folder_summary(folder_path):
    """
    Get summary of files in a folder
    
    Args:
        folder_path (str): Path to folder
        
    Returns:
        dict: Folder summary with file count and total size
    """
    try:
        folder_path = Path(folder_path)
        
        if not folder_path.exists():
            return {"file_count": 0, "total_size_mb": 0, "files": []}
        
        files = []
        total_size = 0
        
        for file_path in folder_path.iterdir():
            if file_path.is_file() and not file_path.name.startswith('.'):
                size = file_path.stat().st_size
                total_size += size
                files.append({
                    "name": file_path.name,
                    "size_bytes": size,
                    "size_mb": round(size / (1024 * 1024), 3)
                })
        
        return {
            "file_count": len(files),
            "total_size_mb": round(total_size / (1024 * 1024), 3),
            "files": sorted(files, key=lambda x: x["name"])
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to get folder summary: {e}")
        return {"file_count": 0, "total_size_mb": 0, "files": []}

def print_folder_contents(folders):
    """
    Print summary of all project folders
    
    Args:
        folders (dict): Dictionary of folder paths
    """
    print("\n" + "="*60)
    print("[FOLDERS] PROJECT FOLDER CONTENTS")
    print("="*60)
    
    for folder_name, folder_path in folders.items():
        summary = get_folder_summary(folder_path)
        print(f"\n[{folder_name.upper()}] ({summary['file_count']} files, {summary['total_size_mb']} MB)")
        
        for file_info in summary['files'][:5]:  # Show first 5 files
            print(f"   • {file_info['name']} ({file_info['size_mb']} MB)")
        
        if len(summary['files']) > 5:
            print(f"   ... and {len(summary['files']) - 5} more files")

def cleanup_temp_files(folder_path, pattern="temp_*"):
    """
    Clean up temporary files matching a pattern
    
    Args:
        folder_path (str): Path to folder
        pattern (str): File pattern to match
        
    Returns:
        int: Number of files removed
    """
    try:
        import glob
        
        pattern_path = os.path.join(folder_path, pattern)
        temp_files = glob.glob(pattern_path)
        
        removed_count = 0
        for temp_file in temp_files:
            try:
                os.remove(temp_file)
                removed_count += 1
            except:
                pass
        
        if removed_count > 0:
            print(f"[INFO] Cleaned up {removed_count} temporary file(s)")
        
        return removed_count
        
    except Exception as e:
        print(f"[ERROR] Cleanup failed: {e}")
        return 0

if __name__ == "__main__":
    # Test file helper functionality
    print("🧪 Testing File Helper Utilities")
    print("=" * 40)
    
    # Test folder creation
    base_dir = "test_project"
    folders = create_project_folders(base_dir)
    
    # Test file operations
    test_file = os.path.join(folders['files'], "test.txt")
    with open(test_file, 'w') as f:
        f.write("Test content")
    
    # Test metadata
    test_metadata = {
        "test": True,
        "timestamp": generate_timestamp()
    }
    
    metadata_file = os.path.join(folders['metadata'], "test_metadata.json")
    save_metadata(test_metadata, metadata_file)
    
    loaded_metadata = load_metadata(metadata_file)
    
    if loaded_metadata and loaded_metadata.get("test"):
        print("[OK] File helper utilities test PASSED!")
    else:
        print("[ERROR] File helper utilities test FAILED!")
    
    # Print folder contents
    print_folder_contents(folders)
    
    # Cleanup
    import shutil
    if os.path.exists(base_dir):
        shutil.rmtree(base_dir)
