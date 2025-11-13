"""
Flask Application Factory
Creates and configures the Flask application
"""
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import get_config
import logging
from pathlib import Path

# Import blueprints
from app.routes import auth_bp, encryption_bp, files_bp, recipients_bp, users_bp

# Import services
from app.services.crypto_service import get_crypto_service

def create_app(config_name='development'):
    """
    Application factory pattern
    Creates and configures the Flask application
    
    Args:
        config_name: Configuration to use (development, production, testing)
    
    Returns:
        Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    config_class = get_config()
    app.config.from_object(config_class)
    
    # Create required directories
    config_class.create_directories()
    
    # Initialize extensions
    CORS(app, origins=config_class.CORS_ORIGINS)
    jwt = JWTManager(app)
    
    # Configure logging
    setup_logging(app)
    
    # Initialize crypto service
    with app.app_context():
        try:
            crypto_service = get_crypto_service()
            crypto_service.initialize(app.config['DATA_DIR'])
            app.logger.info('[OK] Crypto service initialized')
        except Exception as e:
            app.logger.error(f'[ERROR] Failed to initialize crypto service: {str(e)}')
            app.logger.warning('[WARN] Encryption features may not work correctly')
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(encryption_bp, url_prefix='/api/encrypt')
    app.register_blueprint(files_bp, url_prefix='/api/files')
    app.register_blueprint(recipients_bp, url_prefix='/api/recipients')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {
            'status': 'healthy',
            'service': 'Sentra Encryption API',
            'version': '1.0.0'
        }, 200
    
    # Root endpoint
    @app.route('/')
    def index():
        return {
            'message': 'Sentra Encryption API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'encryption': '/api/encrypt',
                'files': '/api/files',
                'recipients': '/api/recipients',
                'users': '/api/users',
                'health': '/api/health'
            }
        }, 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Endpoint not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Internal server error: {error}')
        return {'error': 'Internal server error'}, 500
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token has expired'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'error': 'Invalid token'}, 401
    
    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return {'error': 'Missing authorization token'}, 401
    
    app.logger.info('[OK] Flask application created successfully')
    return app


def setup_logging(app):
    """Configure application logging"""
    log_level = getattr(logging, app.config['LOG_LEVEL'])
    log_file = Path(app.config['LOG_FILE'])
    log_file.parent.mkdir(parents=True, exist_ok=True)
    
    # File handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(log_level)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(file_formatter)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_formatter = logging.Formatter(
        '%(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    
    # Configure app logger
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)
