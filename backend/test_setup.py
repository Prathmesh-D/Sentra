"""
Test script to verify backend setup
Run this to check if everything is configured correctly
"""
import sys
from pathlib import Path

def check_dependencies():
    """Check if required packages are installed"""
    print("🔍 Checking dependencies...")
    required = [
        'flask',
        'flask_cors',
        'flask_jwt_extended',
        'pymongo',
        'cryptography',
        'bcrypt',
        'dotenv'
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package)
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ❌ {package} - MISSING")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        return False
    return True


def check_env_file():
    """Check if .env file exists"""
    print("\n🔍 Checking environment configuration...")
    env_file = Path('.env')
    env_example = Path('.env.example')
    
    if not env_file.exists():
        print("   ❌ .env file not found")
        if env_example.exists():
            print("   💡 Copy .env.example to .env and configure it")
        return False
    
    print("   ✅ .env file exists")
    return True


def check_directories():
    """Check if required directories exist"""
    print("\n🔍 Checking directory structure...")
    from config import Config
    Config.create_directories()
    print("   ✅ All directories created")
    return True


def test_flask_app():
    """Try to create Flask app"""
    print("\n🔍 Testing Flask application...")
    try:
        from app import create_app
        app = create_app()
        print("   ✅ Flask app created successfully")
        print(f"   📝 Registered routes:")
        for rule in app.url_map.iter_rules():
            if not rule.rule.startswith('/static'):
                print(f"      {rule.rule}")
        return True
    except Exception as e:
        print(f"   ❌ Failed to create app: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 SENTRA BACKEND SETUP TEST")
    print("=" * 60)
    
    results = []
    results.append(("Dependencies", check_dependencies()))
    results.append(("Environment", check_env_file()))
    results.append(("Directories", check_directories()))
    results.append(("Flask App", test_flask_app()))
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{name:.<30} {status}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n🎉 All tests passed! Backend is ready.")
        print("Run: python server.py")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
    
    print("=" * 60)
    return 0 if all_passed else 1


if __name__ == '__main__':
    sys.exit(main())
