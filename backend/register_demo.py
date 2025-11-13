import requests
import json

BASE_URL = "http://localhost:5000/api"

def register_test_user():
    """Register a new test user"""
    print("🔍 Registering test user...")
    data = {
        "username": "testuser2025",
        "email": "testuser2025@example.com",
        "password": "TestPass2025",
        "full_name": "Test User 2025"
    }

    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 201
    except Exception as e:
        print(f"❌ Registration failed: {e}")
        return False

if __name__ == "__main__":
    register_test_user()