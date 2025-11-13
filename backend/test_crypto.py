"""
Test Crypto Integration
Tests the encryption/decryption endpoints
"""
import requests
import json
import os
from datetime import datetime

BASE_URL = "http://127.0.0.1:5000/api"

# Generate unique username for each test run
TEST_USER = f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
TEST_EMAIL = f"{TEST_USER}@example.com"
TEST_PASSWORD = "SecurePass123!"

def test_register():
    """Test user registration"""
    print("\n" + "="*60)
    print("TEST 1: Register User")
    print("="*60)
    
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "username": TEST_USER,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.json().get('access_token')

def test_login():
    """Test user login"""
    print("\n" + "="*60)
    print("TEST 2: Login User")
    print("="*60)
    
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": TEST_USER,
        "password": TEST_PASSWORD
    })
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.json().get('access_token')

def test_encrypt_file(token):
    """Test file encryption"""
    print("\n" + "="*60)
    print("TEST 3: Encrypt File")
    print("="*60)
    
    # Create a test file
    test_file_path = 'test_file.txt'
    with open(test_file_path, 'w') as f:
        f.write("This is a secret message! 🔐")
    
    # Prepare form data
    files = {'file': open(test_file_path, 'rb')}
    data = {
        'recipients': json.dumps(['bob', 'charlie']),
        'encryption_type': 'AES-256',
        'expiry_days': '7',
        'compress': 'false',
        'self_destruct': 'false',
        'message': 'Test encryption'
    }
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.post(
        f"{BASE_URL}/encrypt/encrypt",
        files=files,
        data=data,
        headers=headers
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Clean up test file
    os.remove(test_file_path)
    
    return response.json().get('file_id')

def test_decrypt_file(token, file_id):
    """Test file decryption"""
    print("\n" + "="*60)
    print("TEST 4: Decrypt File")
    print("="*60)
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.post(
        f"{BASE_URL}/encrypt/decrypt/{file_id}",
        headers=headers
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print("File downloaded successfully!")
        # Save decrypted file
        with open('decrypted_test_file.txt', 'wb') as f:
            f.write(response.content)
        print("Saved as: decrypted_test_file.txt")
    else:
        print(f"Response: {json.dumps(response.json(), indent=2)}")

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("CRYPTO INTEGRATION TEST SUITE")
    print("="*60)
    print(f"Test User: {TEST_USER}")
    print("="*60)
    
    try:
        # Test 1: Register new user
        token = test_register()
        
        if not token:
            print("\n[ERROR] Failed to get authentication token")
            return
        
        print(f"\n[OK] Authentication token obtained")
        
        # Test 3: Encrypt file
        file_id = test_encrypt_file(token)
        
        if not file_id:
            print("\n[ERROR] Failed to encrypt file")
            return
        
        print(f"\n[OK] File encrypted with ID: {file_id}")
        
        # Test 4: Decrypt file
        test_decrypt_file(token, file_id)
        
        print("\n" + "="*60)
        print("TEST SUITE COMPLETED")
        print("="*60)
        
    except Exception as e:
        print(f"\n[ERROR] Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
