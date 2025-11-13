"""
Authentication Routes
Handles user registration, login, logout, and token management
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required, 
    get_jwt_identity,
    get_jwt
)
from datetime import timedelta
import bcrypt

auth_bp = Blueprint('auth', __name__)

# Import user service
from app.services.user_service import user_service


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    Expected JSON:
    {
        "username": "john_doe",
        "email": "john@example.com",
        "password": "securePassword123",
        "full_name": "John Doe"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        username = data['username']
        email = data['email']
        password = data['password']
        full_name = data.get('full_name', '')
        
        # Create user in database
        user = user_service.create_user(username, email, password, full_name)
        
        if not user:
            return jsonify({'error': 'User already exists or registration failed'}), 400
        
        # Create JWT tokens
        access_token = create_access_token(
            identity=username,
            expires_delta=timedelta(hours=current_app.config['TOKEN_EXPIRY_HOURS'])
        )
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': {
                'username': username,
                'email': email,
                'full_name': full_name
            }
        }), 201
        
    except Exception as e:
        current_app.logger.error(f'Registration error: {str(e)}')
        return jsonify({'error': 'Registration failed'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login
    
    Expected JSON:
    {
        "username": "john_doe",
        "password": "securePassword123"
    }
    
    Returns:
    {
        "access_token": "...",
        "refresh_token": "...",
        "user": {...}
    }
    """
    try:
        data = request.get_json()
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        # Verify credentials from database
        user = user_service.verify_credentials(username, password)
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create JWT tokens
        access_token = create_access_token(
            identity=username,
            expires_delta=timedelta(hours=current_app.config['TOKEN_EXPIRY_HOURS'])
        )
        refresh_token = create_refresh_token(
            identity=username,
            expires_delta=timedelta(days=current_app.config['REFRESH_TOKEN_EXPIRY_DAYS'])
        )
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'username': user['username'],
                'email': user['email'],
                'full_name': user.get('profile', {}).get('full_name', username)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return jsonify({'error': 'Login failed'}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    User logout
    Invalidates the current token
    """
    try:
        # TODO: Phase 2 - Add token to blacklist in database
        
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f'Logout error: {str(e)}')
        return jsonify({'error': 'Logout failed'}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token
    """
    try:
        identity = get_jwt_identity()
        
        new_access_token = create_access_token(
            identity=identity,
            expires_delta=timedelta(hours=current_app.config['TOKEN_EXPIRY_HOURS'])
        )
        
        return jsonify({'access_token': new_access_token}), 200
        
    except Exception as e:
        current_app.logger.error(f'Token refresh error: {str(e)}')
        return jsonify({'error': 'Token refresh failed'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current logged-in user information
    """
    try:
        username = get_jwt_identity()
        
        # Get user from database
        user = user_service.get_user_by_username(username)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'username': user['username'],
            'email': user['email'],
            'full_name': user.get('profile', {}).get('full_name', username),
            'created_at': user['created_at'].isoformat() if user.get('created_at') else None,
            'last_login': user['last_login'].isoformat() if user.get('last_login') else None
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get user error: {str(e)}')
        return jsonify({'error': 'Failed to get user information'}), 500


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change user password
    
    Expected JSON:
    {
        "current_password": "oldPass123",
        "new_password": "newSecurePass456"
    }
    """
    try:
        username = get_jwt_identity()
        data = request.get_json()
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Both current and new password required'}), 400
        
        # Update password in database
        success = user_service.change_password(username, current_password, new_password)
        
        if not success:
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f'Password change error: {str(e)}')
        return jsonify({'error': 'Password change failed'}), 500
