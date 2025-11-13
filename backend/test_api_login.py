"""Test login API endpoint"""
import requests
import json

url = "http://127.0.0.1:5000/api/auth/login"

# Test with correct credentials
test_cases = [
    {"username": "test1", "password": "123456789", "description": "Correct credentials"},
    {"username": "test1", "password": "wrongpass", "description": "Wrong password"},
    {"username": "test1", "password": "", "description": "Empty password"},
    {"username": "", "password": "123456789", "description": "Empty username"},
]

for test in test_cases:
    print(f"\n{'='*80}")
    print(f"TEST: {test['description']}")
    print(f"{'='*80}")
    print(f"Username: '{test['username']}'")
    print(f"Password: '{test['password']}'")
    
    try:
        response = requests.post(
            url,
            json={"username": test["username"], "password": test["password"]},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Body:")
        print(json.dumps(response.json(), indent=2))
        
    except Exception as e:
        print(f"\nError: {str(e)}")
