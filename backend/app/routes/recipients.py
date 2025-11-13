"""
Recipients Management Routes
Handles recipient contacts and sharing
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

recipients_bp = Blueprint('recipients', __name__)


@recipients_bp.route('/', methods=['GET'])
@jwt_required()
def get_recipients():
    """
    Get all saved recipients for the current user
    """
    try:
        username = get_jwt_identity()
        
        from ..services.database import get_db
        from ..services.db_utils import get_user_contacts
        
        db = get_db()
        if db is not None:
            # Get contacts from database
            contacts = get_user_contacts(username)
            
            # Format for frontend
            formatted_contacts = []
            for contact in contacts:
                formatted_contacts.append({
                    '_id': str(contact['_id']),
                    'owner_username': contact['owner_username'],
                    'contact_username': contact['contact_username'],
                    'contact_email': contact.get('contact_email', ''),
                    'contact_full_name': contact.get('contact_full_name', contact['contact_username']),
                    'nickname': contact.get('nickname'),
                    'notes': contact.get('notes', ''),
                    'tags': contact.get('tags', []),
                    'is_favorite': contact.get('is_favorite', False),
                    'shared_files_count': contact.get('shared_files_count', 0),
                    'last_shared_at': contact.get('last_shared_at').isoformat() if contact.get('last_shared_at') else None,
                    'added_at': contact.get('added_at').isoformat() if contact.get('added_at') else None,
                    'updated_at': contact.get('updated_at').isoformat() if contact.get('updated_at') else None
                })
            
            return jsonify({
                'contacts': formatted_contacts,
                'total': len(formatted_contacts)
            }), 200
        else:
            return jsonify({
                'contacts': [],
                'total': 0,
                'error': 'Database not available'
            }), 500
        
    except Exception as e:
        current_app.logger.error(f'Get recipients error: {str(e)}')
        return jsonify({'error': 'Failed to fetch recipients'}), 500


@recipients_bp.route('/', methods=['POST'])
@jwt_required()
def add_recipient():
    """
    Add a new recipient to contacts
    
    Expected JSON:
    {
        "name": "Alice Smith",
        "nickname": "Alice",
        "email": "alice@example.com",
        "public_key": "-----BEGIN PUBLIC KEY-----..."
    }
    """
    try:
        username = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['name', 'email', 'public_key']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # TODO: Phase 2 - Save recipient to MongoDB
        
        return jsonify({
            'message': 'Recipient added successfully',
            'recipient': data,
            'status': 'pending_database_integration'
        }), 201
        
    except Exception as e:
        current_app.logger.error(f'Add recipient error: {str(e)}')
        return jsonify({'error': 'Failed to add recipient'}), 500


@recipients_bp.route('/<recipient_id>', methods=['DELETE'])
@jwt_required()
def delete_recipient(recipient_id):
    """
    Delete a recipient from contacts
    """
    try:
        username = get_jwt_identity()
        from bson import ObjectId
        from ..services.database import get_db
        
        db = get_db()
        if db is None:
            return jsonify({'error': 'Database not available'}), 500
        
        # Find and verify ownership
        try:
            contact = db.contacts.find_one({'_id': ObjectId(recipient_id)})
        except:
            return jsonify({'error': 'Invalid contact ID'}), 400
        
        if not contact:
            return jsonify({'error': 'Contact not found'}), 404
        
        # Verify user owns this contact
        if contact['owner_username'] != username:
            return jsonify({'error': 'Permission denied'}), 403
        
        # Delete the contact
        db.contacts.delete_one({'_id': ObjectId(recipient_id)})
        
        current_app.logger.info(f'[OK] Contact deleted: {recipient_id} by {username}')
        
        return jsonify({
            'message': 'Contact deleted successfully',
            'recipient_id': recipient_id
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Delete recipient error: {str(e)}')
        return jsonify({'error': 'Failed to delete recipient'}), 500


@recipients_bp.route('/search', methods=['GET'])
@jwt_required()
def search_recipients():
    """
    Search for users by username or email
    
    Query params:
    - q: Search query
    """
    try:
        query = request.args.get('q', '')
        
        if len(query) < 2:
            return jsonify({'error': 'Query too short'}), 400
        
        # TODO: Phase 2 - Search users in MongoDB
        
        return jsonify({
            'users': [],
            'total': 0,
            'query': query,
            'status': 'pending_database_integration'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Search error: {str(e)}')
        return jsonify({'error': 'Search failed'}), 500
