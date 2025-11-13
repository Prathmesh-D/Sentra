"""Check user data in MongoDB"""
from app import create_app
from app.services.database import get_collection
import bcrypt

app = create_app()

with app.app_context():
    users = get_collection('users')
    
    print("="*80)
    print("CHECKING ALL USERS IN DATABASE")
    print("="*80)
    
    all_users = list(users.find({}))
    
    for user in all_users:
        print(f"\nUsername: {user['username']}")
        print(f"Email: {user['email']}")
        print(f"Has password_hash: {bool(user.get('password_hash'))}")
        print(f"Password hash length: {len(user.get('password_hash', ''))}")
        print(f"Password hash type: {type(user.get('password_hash'))}")
        print(f"Is active: {user.get('is_active', True)}")
        
        # Test password verification
        test_password = "123456789"
        password_hash = user.get('password_hash', '')
        
        if password_hash:
            try:
                # Convert to bytes if string
                if isinstance(password_hash, str):
                    hash_bytes = password_hash.encode('utf-8')
                else:
                    hash_bytes = password_hash
                
                result = bcrypt.checkpw(test_password.encode('utf-8'), hash_bytes)
                print(f"Test password '123456789' matches: {result}")
            except Exception as e:
                print(f"Error testing password: {e}")
        
        print("-" * 80)
