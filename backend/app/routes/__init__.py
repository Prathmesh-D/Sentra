"""
Routes package initialization
Imports and exposes all blueprint routes
"""
from app.routes.auth import auth_bp
from app.routes.encryption import encryption_bp
from app.routes.files import files_bp
from app.routes.recipients import recipients_bp
from app.routes.users import users_bp
from app.routes.health import health_bp

__all__ = ['auth_bp', 'encryption_bp', 'files_bp', 'recipients_bp', 'users_bp', 'health_bp']
