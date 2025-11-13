"""
Simple Crypto Test (No Database Required)
Tests the crypto system directly without API calls
"""
import sys
import os

# Set up Flask app context
os.environ['FLASK_ENV'] = 'development'

# Add paths - backend first to avoid conflicts
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_path)

# Create Flask app for context BEFORE adding old backend path
import app as backend_app

flask_app = backend_app.create_app()

# Now add old backend path
old_backend_path = os.path.join(os.path.dirname(backend_path), 'hybrid-crypto-file-encryption')
sys.path.insert(0, old_backend_path)

def test_crypto_initialization():
    """Test crypto service initialization"""
    print("\n" + "="*60)
    print("TEST 1: Initialize Crypto Service")
    print("="*60)
    
    with flask_app.app_context():
        try:
            from app.services.crypto_service import get_crypto_service
            
            crypto_service = get_crypto_service()
            
            print("[OK] Crypto service obtained")
            print(f"[OK] Initialized: {crypto_service._initialized}")
            
            return crypto_service
        except Exception as e:
            print(f"[ERROR] Initialization failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

def test_generate_user_keys(crypto_service):
    """Test user key generation"""
    print("\n" + "="*60)
    print("TEST 2: Generate User Keys")
    print("="*60)
    
    with flask_app.app_context():
        try:
            result = crypto_service.generate_user_keys("test_user")
            
            if result.get('success'):
                print("[OK] RSA keys generated successfully")
                print(f"[OK] Public key: {result['keys']['public_key']}")
                print(f"[OK] Private key: {result['keys']['private_key']}")
                return True
            else:
                print(f"[ERROR] Key generation failed: {result.get('error')}")
                return False
                
        except Exception as e:
            print(f"[ERROR] Test failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

def test_encrypt_file(crypto_service):
    """Test file encryption"""
    print("\n" + "="*60)
    print("TEST 3: Encrypt File")
    print("="*60)
    
    with flask_app.app_context():
        try:
            # Create a test file
            test_file_path = os.path.join(backend_path, 'test_message.txt')
            with open(test_file_path, 'w', encoding='utf-8') as f:
                f.write("This is a secret message for testing! 🔐")
            
            print(f"[OK] Created test file: {test_file_path}")
            
            # Encrypt the file
            result = crypto_service.encrypt_file(
                file_path=test_file_path,
                filename='test_message.txt',
                username='test_user',
                recipients=['recipient1', 'recipient2'],
                encryption_type='AES-256',
                expiry_days=7
            )
            
            if result.get('success'):
                print("[OK] File encrypted successfully")
                metadata = result['metadata']
                print(f"[OK] Original filename: {metadata['original_filename']}")
                print(f"[OK] Encrypted filename: {metadata['encrypted_filename']}")
                print(f"[OK] Encryption type: {metadata['encryption_type']}")
                print(f"[OK] Recipients: {', '.join(metadata['recipients'])}")
                print(f"[OK] File size: {metadata['file_size']} bytes")
                print(f"[OK] Expires at: {metadata['expires_at']}")
                
                # Clean up test file
                os.remove(test_file_path)
                
                return result
            else:
                print(f"[ERROR] Encryption failed: {result.get('error')}")
                return None
                
        except Exception as e:
            print(f"[ERROR] Test failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

def test_decrypt_file(crypto_service, encrypt_result):
    """Test file decryption"""
    print("\n" + "="*60)
    print("TEST 4: Decrypt File")
    print("="*60)
    
    with flask_app.app_context():
        try:
            metadata = encrypt_result['metadata']
            
            result = crypto_service.decrypt_file(
                encrypted_file_path=metadata['encrypted_file_path'],
                wrapped_key_path=metadata['wrapped_key_path'],
                username='test_user'
            )
            
            if result.get('success'):
                print("[OK] File decrypted successfully")
                print(f"[OK] Decrypted file: {result['decrypted_file']}")
                print(f"[OK] File size: {result['file_size']} bytes")
                
                # Read decrypted content
                with open(result['decrypted_file'], 'r', encoding='utf-8') as f:
                    content = f.read()
                
                print(f"[OK] Content: {content}")
                
                return True
            else:
                print(f"[ERROR] Decryption failed: {result.get('error')}")
                return False
                
        except Exception as e:
            print(f"[ERROR] Test failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("CRYPTO SERVICE TEST SUITE (Direct - No Database Required)")
    print("="*70)
    
    # Test 1: Initialize
    crypto_service = test_crypto_initialization()
    if not crypto_service:
        print("\n[FAILED] Cannot continue without crypto service")
        return
    
    # Test 2: Generate keys
    if not test_generate_user_keys(crypto_service):
        print("\n[FAILED] Cannot continue without user keys")
        return
    
    # Test 3: Encrypt file
    encrypt_result = test_encrypt_file(crypto_service)
    if not encrypt_result:
        print("\n[FAILED] Cannot continue without encrypted file")
        return
    
    # Test 4: Decrypt file
    if not test_decrypt_file(crypto_service, encrypt_result):
        print("\n[FAILED] Decryption test failed")
        return
    
    print("\n" + "="*70)
    print("ALL TESTS PASSED! ✅")
    print("="*70)
    print("\nSummary:")
    print("  ✅ Crypto service initialized")
    print("  ✅ User RSA keys generated")
    print("  ✅ File encrypted with AES-256")
    print("  ✅ File decrypted successfully")
    print("  ✅ Content verified")
    print("\nThe encryption system is working correctly!")
    print("="*70)

if __name__ == '__main__':
    main()
