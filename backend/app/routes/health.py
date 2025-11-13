"""
Health Check Routes
Provides basic health check endpoints for monitoring
"""
from flask import Blueprint, jsonify
import datetime

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Basic health check endpoint

    Returns:
        JSON: Service health status
    """
    return jsonify({
        "service": "Sentra Encryption API",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }), 200