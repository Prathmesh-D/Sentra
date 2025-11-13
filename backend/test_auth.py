"""
Test Authentication Endpoints
Quick script to test user registration and login
"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test health endpoint"""
    print("\n🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_register():
    """Test user registration"""
    print("\n🔍 Testing user registration...")
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            return response.json().get('access_token')
        return None
    except Exception as e:
        print(f"❌ Registration failed: {e}")
        return None

def test_login():
    """Test user login"""
    print("\n🔍 Testing user login...")
    data = {
        "username": "testuser",
        "password": "TestPass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            return response.json().get('access_token')
        return None
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return None

def test_get_current_user(token):
    """Test get current user with token"""
    print("\n🔍 Testing get current user...")
    
    if not token:
        print("❌ No token available")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Get user failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 80)
    print("🧪 AUTHENTICATION ENDPOINT TESTS")
    print("=" * 80)
    print("\n⚠️  Make sure the server is running: python run.py")
    
    # Test health
    if not test_health():
        print("\n❌ Server is not running!")
        return
    
    # Test registration
    token = test_register()
    if token:
        print("\n✅ Registration successful!")
    else:
        print("\n⚠️  Registration failed or user already exists, trying login...")
    
    # Test login
    token = test_login()
    if token:
        print("\n✅ Login successful!")
        print(f"Token: {token[:50]}...")
    else:
        print("\n❌ Login failed!")
        return
    
    # Test get current user
    if test_get_current_user(token):
        print("\n✅ Get current user successful!")
    else:
        print("\n❌ Get current user failed!")
    
    print("\n" + "=" * 80)
    print("✅ TESTS COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    main()
