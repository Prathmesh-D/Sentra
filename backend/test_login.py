"""Test login functionality"""
import sys
from app import create_app
from app.services.user_service import UserService

app = create_app()

with app.app_context():
    user_service = UserService()
    
    # Get all users
    users = user_service._get_users_collection()
    all_users = list(users.find({}, {'username': 1, 'email': 1, '_id': 0}))
    
    print("="*80)
    print("USERS IN DATABASE:")
    print("="*80)
    for user in all_users:
        print(f"Username: {user['username']}, Email: {user['email']}")
    print("="*80)
    
    if len(all_users) > 0:
        # Test login with first user
        test_username = all_users[0]['username']
        print(f"\nTesting login for user: {test_username}")
        print("Please enter password for this user:")
        test_password = input("Password: ")
        
        result = user_service.verify_credentials(test_username, test_password)
        
        if result:
            print("\n✓ LOGIN SUCCESSFUL")
            print(f"User authenticated: {result['username']}")
        else:
            print("\n✗ LOGIN FAILED - Invalid credentials")
            
            # Check if password hash exists
            user_doc = users.find_one({'username': test_username})
            if user_doc:
                print(f"\nDEBUG INFO:")
                print(f"- User exists in database")
                print(f"- Password hash length: {len(user_doc.get('password_hash', ''))}")
                print(f"- Password hash starts with: {user_doc.get('password_hash', '')[:20]}...")
