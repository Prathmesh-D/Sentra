"""
User Management Routes
Handles user profile and settings
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.database import get_collection, get_db
from app.services.db_utils import (
    get_cached_statistics, 
    get_user_activity, 
    log_activity
)

users_bp = Blueprint('users', __name__)


@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Get current user's profile
    """
    try:
        username = get_jwt_identity()
        
        # TODO: Phase 2 - Get user profile from MongoDB
        
        return jsonify({
            'username': username,
            'status': 'pending_database_integration'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get profile error: {str(e)}')
        return jsonify({'error': 'Failed to get profile'}), 500


@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update user profile
    
    Expected JSON:
    {
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "organization": "University"
    }
    """
    try:
        username = get_jwt_identity()
        data = request.get_json()
        
        # TODO: Phase 2 - Update profile in MongoDB
        
        return jsonify({
            'message': 'Profile updated successfully',
            'username': username
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Update profile error: {str(e)}')
        return jsonify({'error': 'Failed to update profile'}), 500


@users_bp.route('/keys', methods=['GET'])
@jwt_required()
def get_user_keys():
    """
    Get user's RSA public key
    """
    try:
        username = get_jwt_identity()
        
        # TODO: Phase 2 - Get public key from MongoDB
        
        return jsonify({
            'public_key': '',
            'key_type': 'RSA-2048',
            'status': 'pending_database_integration'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get keys error: {str(e)}')
        return jsonify({'error': 'Failed to get keys'}), 500


@users_bp.route('/keys/regenerate', methods=['POST'])
@jwt_required()
def regenerate_keys():
    """
    Regenerate RSA keypair
    """
    try:
        username = get_jwt_identity()
        
        # TODO: Phase 2 - Generate new RSA keypair
        # This will invalidate access to previously encrypted files!
        
        return jsonify({
            'message': 'Keys regenerated successfully',
            'warning': 'You will no longer be able to decrypt old files'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Regenerate keys error: {str(e)}')
        return jsonify({'error': 'Failed to regenerate keys'}), 500


@users_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    """
    Get user's encryption statistics
    """
    try:
        username = get_jwt_identity()
        
        # TODO: Phase 2 - Calculate statistics from MongoDB
        
        return jsonify({
            'total_encrypted': 0,
            'total_decrypted': 0,
            'storage_used': 0,
            'files_sent': 0,
            'files_received': 0,
            'status': 'pending_database_integration'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get statistics error: {str(e)}')
        return jsonify({'error': 'Failed to get statistics'}), 500


@users_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """
    Get dashboard statistics (quick stats only)
    Supports both real-time and cached statistics
    Query param: use_cache=true (default: false for real-time)
    """
    try:
        username = get_jwt_identity()
        use_cache = request.args.get('use_cache', 'false').lower() == 'true'
        
        # Try cached statistics first if requested
        if use_cache:
            cached_stats = get_cached_statistics(username, max_age_minutes=60)
            if cached_stats:
                return jsonify({
                    'files_sent': cached_stats.get('total_files_sent', 0),
                    'files_received': cached_stats.get('total_files_received', 0),
                    'sensitive_files': 0,  # Calculate separately if needed
                    'storage_used_mb': round(cached_stats.get('total_storage_used_bytes', 0) / (1024 * 1024), 2),
                    'storage_limit_mb': 100 * 1024,
                    'total_files': cached_stats.get('total_files_sent', 0) + cached_stats.get('total_files_received', 0),
                    'active_files': cached_stats.get('active_files_count', 0),
                    'expired_files': cached_stats.get('expired_files_count', 0),
                    'cached': True
                }), 200
        
        # Real-time statistics calculation
        
        # Get encrypted_files collection (correct collection name)
        files_collection = get_collection('encrypted_files')
        
        # Count files sent by user (where user is the sender)
        files_sent = files_collection.count_documents({
            'sender': username,
            'status': 'active'
        })
        
        # Count files received by user (in recipients list, excluding files sent to self)
        files_received = files_collection.count_documents({
            'recipients': username,
            'sender': {'$ne': username},  # Don't count files user sent to themselves
            'status': 'active'
        })
        
        # Count sensitive files (self-destruct files only)
        sensitive_files = files_collection.count_documents({
            'sender': username,
            'self_destruct': True,
            'status': {'$in': ['active', 'expired']}  # Not deleted yet
        })
        
        # Calculate storage used using aggregation
        from ..services.cleanup_service import get_total_storage_used
        storage_used_bytes = get_total_storage_used(username)
        storage_used_mb = storage_used_bytes / (1024 * 1024)  # Convert to MB
        storage_limit_mb = 1000  # 1GB default limit
        
        # Count total files (sent or received)
        total_files = files_collection.count_documents({
            '$or': [
                {'sender': username},
                {'recipients': username}
            ]
        })
        
        # Count active files (not expired or deleted)
        active_files = files_collection.count_documents({
            '$or': [
                {'sender': username},
                {'recipients': username}
            ],
            'status': 'active'
        })
        
        # Count expired files
        expired_files = files_collection.count_documents({
            '$or': [
                {'sender': username},
                {'recipients': username}
            ],
            'status': 'expired'
        })
        
        return jsonify({
            'files_sent': files_sent,
            'files_received': files_received,
            'sensitive_files': sensitive_files,
            'storage_used_mb': round(storage_used_mb, 2),
            'storage_limit_mb': storage_limit_mb,
            'total_files': total_files,
            'active_files': active_files,
            'expired_files': expired_files
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get stats error: {str(e)}')
        return jsonify({'error': 'Failed to get statistics'}), 500


@users_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """
    Get complete dashboard data including stats and recent activity
    """
    try:
        username = get_jwt_identity()
        
        # Get encrypted_files collection (correct collection name)
        files_collection = get_collection('encrypted_files')
        
        # Get statistics (reuse logic from /stats)
        files_sent = files_collection.count_documents({
            'sender': username,
            'status': 'active'
        })
        
        files_received = files_collection.count_documents({
            'recipients': username,
            'sender': {'$ne': username},
            'status': 'active'
        })
        
        # Count sensitive files (self-destruct only)
        sensitive_files = files_collection.count_documents({
            'sender': username,
            'self_destruct': True,
            'status': {'$in': ['active', 'expired']}
        })
        
        # Calculate storage used
        from ..services.cleanup_service import get_total_storage_used
        storage_used_bytes = get_total_storage_used(username)
        storage_used_mb = storage_used_bytes / (1024 * 1024)
        storage_limit_mb = 1000  # 1GB default
        
        total_files = files_collection.count_documents({
            '$or': [
                {'sender': username},
                {'recipients': username}
            ]
        })
        
        active_files = files_collection.count_documents({
            '$or': [
                {'sender': username},
                {'recipients': username}
            ],
            'status': 'active'
        })
        
        expired_files = files_collection.count_documents({
            '$or': [
                {'sender': username},
                {'recipients': username}
            ],
            'status': 'expired'
        })
        
        # Get recent activity from file operations (using actual file data)
        recent_activity = []
        
        # Get recent files (most recent first) - use created_at field
        recent_files = files_collection.find({
            '$or': [
                {'sender': username},
                {'recipients': username}
            ]
        }).sort('created_at', -1).limit(10)
        
        for file_doc in recent_files:
            # Determine action based on relationship to user
            if file_doc.get('sender') == username:
                action = 'encrypted'  # User encrypted/uploaded this file
            else:
                action = 'shared'  # File was shared with user
            
            # Format timestamp
            timestamp = file_doc.get('created_at', '')
            if hasattr(timestamp, 'isoformat'):
                timestamp_str = timestamp.isoformat()
            else:
                timestamp_str = str(timestamp)
            
            recent_activity.append({
                'id': str(file_doc['_id']),
                'action': action,
                'file_name': file_doc.get('original_filename', 'Unknown file'),
                'timestamp': timestamp_str,
                'status': 'success' if file_doc.get('status') == 'active' else 'warning'
            })
        
        # Calculate AES encryption type breakdown
        aes_128_count = files_collection.count_documents({
            '$or': [
                {'sender': username},
                {'recipients': username}
            ],
            'encryption_type': 'AES-128',
            'status': 'active'
        })
        
        aes_256_count = files_collection.count_documents({
            '$or': [
                {'sender': username},
                {'recipients': username}
            ],
            'encryption_type': 'AES-256',
            'status': 'active'
        })
        
        total_encrypted = aes_128_count + aes_256_count
        encryption_breakdown = []
        if total_encrypted > 0:
            if aes_128_count > 0:
                encryption_breakdown.append({
                    'type': 'AES-128',
                    'count': aes_128_count,
                    'percentage': round((aes_128_count / total_encrypted) * 100, 1)
                })
            if aes_256_count > 0:
                encryption_breakdown.append({
                    'type': 'AES-256',
                    'count': aes_256_count,
                    'percentage': round((aes_256_count / total_encrypted) * 100, 1)
                })
        
        # Calculate file type distribution using aggregation
        file_type_pipeline = [
            {
                '$match': {
                    '$or': [
                        {'sender': username},
                        {'recipients': username}
                    ],
                    'status': 'active'
                }
            },
            {
                '$group': {
                    '_id': '$file_type',
                    'count': {'$sum': 1}
                }
            },
            {
                '$sort': {'count': -1}
            },
            {
                '$limit': 10
            }
        ]
        
        file_type_results = list(files_collection.aggregate(file_type_pipeline))
        total_files_for_types = sum(r['count'] for r in file_type_results)
        
        file_type_distribution = []
        for result in file_type_results:
            file_type = result['_id'] or 'unknown'
            count = result['count']
            percentage = round((count / total_files_for_types) * 100, 1) if total_files_for_types > 0 else 0
            
            file_type_distribution.append({
                'type': file_type,
                'count': count,
                'percentage': percentage
            })
        
        return jsonify({
            'stats': {
                'files_sent': files_sent,
                'files_received': files_received,
                'sensitive_files': sensitive_files,
                'storage_used_mb': round(storage_used_mb, 2),
                'storage_limit_mb': storage_limit_mb,
                'total_files': total_files,
                'active_files': active_files,
                'expired_files': expired_files
            },
            'recent_activity': recent_activity,
            'encryption_breakdown': encryption_breakdown,
            'file_type_distribution': file_type_distribution
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get dashboard error: {str(e)}')
        return jsonify({'error': 'Failed to get dashboard data'}), 500
