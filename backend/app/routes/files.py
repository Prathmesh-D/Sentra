"""
File Management Routes
Handles inbox, outbox, and file operations
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.database import get_db
from bson import ObjectId
from datetime import datetime, timedelta

files_bp = Blueprint('files', __name__)

# ...existing code...

@files_bp.route('/<file_id>/download', methods=['GET'])
@jwt_required()
def download_file(file_id):
    """
    Download a file. If self_destruct is True, delete after download.
    """
    try:
        username = get_jwt_identity()
        from bson import ObjectId
        import os
        from flask import send_file

        db = get_db()
        if db is None:
            return jsonify({'error': 'Database not available'}), 500

        # Find the file
        try:
            file_doc = db.encrypted_files.find_one({'_id': ObjectId(file_id)})
        except:
            return jsonify({'error': 'Invalid file ID'}), 400

        if not file_doc:
            return jsonify({'error': 'File not found'}), 404

        # Verify user is a recipient or sender
        if username not in file_doc.get('recipients', []) and file_doc.get('sender') != username:
            return jsonify({'error': 'Permission denied'}), 403

        encrypted_file_path = file_doc.get('encrypted_file_path')
        if not encrypted_file_path or not os.path.exists(encrypted_file_path):
            return jsonify({'error': 'File not available for download'}), 404

        # Serve the file
        response = send_file(encrypted_file_path, as_attachment=True, download_name=file_doc.get('original_filename', 'file.enc'))

        # If self-destruct, delete after download
        if file_doc.get('self_destruct', False):
            db.encrypted_files.update_one(
                {'_id': ObjectId(file_id)},
                {
                    '$set': {
                        'status': 'deleted',
                        'deleted_at': datetime.utcnow()
                    }
                }
            )
            try:
                os.remove(encrypted_file_path)
            except Exception:
                pass
            metadata_file = file_doc.get('metadata_file')
            if metadata_file and os.path.exists(metadata_file):
                try:
                    os.remove(metadata_file)
                except Exception:
                    pass
            current_app.logger.info(f'[SELF-DESTRUCT] File deleted after download: {file_id}')

        # Increment download count
        db.encrypted_files.update_one(
            {'_id': ObjectId(file_id)},
            {'$inc': {'download_count': 1}}
        )

        return response
    except Exception as e:
        current_app.logger.error(f'Download error: {str(e)}')
        return jsonify({'error': 'Failed to download file'}), 500
"""
File Management Routes
Handles inbox, outbox, and file operations
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.database import get_db
from bson import ObjectId
from datetime import datetime, timedelta

files_bp = Blueprint('files', __name__)


@files_bp.route('/inbox', methods=['GET'])
@jwt_required()
def get_inbox():
    """
    Get all files received by the current user
    
    Query params:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20)
    - filter: Filter by tag
    - sort: Sort field (date, size, sender)
    """
    try:
        username = get_jwt_identity()
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        filter_tag = request.args.get('filter')
        sort_by = request.args.get('sort', 'date')
        
        # Query MongoDB for user's inbox files
        db = get_db()
        if db is not None:
            # Find files where user is in recipients list
            query = {'recipients': username, 'status': {'$ne': 'deleted'}}
            
            if filter_tag:
                query['tag'] = filter_tag
            
            # Sort options
            sort_field = 'created_at' if sort_by == 'date' else sort_by
            sort_order = -1  # Descending (newest first)
            
            # Get files from database
            files_cursor = db.encrypted_files.find(query).sort(sort_field, sort_order).skip((page - 1) * per_page).limit(per_page)
            total = db.encrypted_files.count_documents(query)
            
            # Convert cursor to list and format
            files = []
            for file_doc in files_cursor:
                file_doc['id'] = str(file_doc.pop('_id'))
                files.append(file_doc)
            
            return jsonify({
                'files': files,
                'total': total,
                'page': page,
                'per_page': per_page
            }), 200
        else:
            return jsonify({
                'files': [],
                'total': 0,
                'page': page,
                'per_page': per_page,
                'error': 'Database not available'
            }), 500
        
    except Exception as e:
        current_app.logger.error(f'Inbox error: {str(e)}')
        return jsonify({'error': 'Failed to fetch inbox'}), 500


@files_bp.route('/outbox', methods=['GET'])
@jwt_required()
def get_outbox():
    """
    Get all files sent by the current user
    
    Query params:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20)
    - filter: Filter by tag
    - sort: Sort field (date, size, downloads)
    """
    try:
        username = get_jwt_identity()
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        filter_tag = request.args.get('filter')
        sort_by = request.args.get('sort', 'date')
        
        # Query MongoDB for user's outbox files
        db = get_db()
        if db is not None:
            # Find files where user is the sender
            query = {'sender': username, 'status': {'$ne': 'deleted'}}
            
            if filter_tag:
                query['tag'] = filter_tag
            
            # Sort options
            sort_field = 'created_at' if sort_by == 'date' else sort_by
            sort_order = -1  # Descending (newest first)
            
            # Get files from database
            files_cursor = db.encrypted_files.find(query).sort(sort_field, sort_order).skip((page - 1) * per_page).limit(per_page)
            total = db.encrypted_files.count_documents(query)
            
            # Convert cursor to list and format
            files = []
            for file_doc in files_cursor:
                file_doc['id'] = str(file_doc.pop('_id'))
                files.append(file_doc)
            
            return jsonify({
                'files': files,
                'total': total,
                'page': page,
                'per_page': per_page
            }), 200
        else:
            return jsonify({
                'files': [],
                'total': 0,
                'page': page,
                'per_page': per_page,
                'error': 'Database not available'
            }), 500
        
    except Exception as e:
        current_app.logger.error(f'Outbox error: {str(e)}')
        return jsonify({'error': 'Failed to fetch outbox'}), 500


@files_bp.route('/<file_id>', methods=['GET'])
@jwt_required()
def get_file_details(file_id):
    """
    Get detailed information about a specific file
    """
    try:
        username = get_jwt_identity()
        
        # TODO: Phase 2 - Get file from MongoDB
        # Verify user has access
        
        return jsonify({
            'file_id': file_id,
            'status': 'pending_database_integration'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'File details error: {str(e)}')
        return jsonify({'error': 'Failed to get file details'}), 500


@files_bp.route('/<file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    """
    Delete a file (only owner can delete)
    """
    try:
        username = get_jwt_identity()
        from bson import ObjectId
        import os
        
        db = get_db()
        if db is None:
            return jsonify({'error': 'Database not available'}), 500
        
        # Find the file
        try:
            file_doc = db.encrypted_files.find_one({'_id': ObjectId(file_id)})
        except:
            return jsonify({'error': 'Invalid file ID'}), 400
        
        if not file_doc:
            return jsonify({'error': 'File not found'}), 404
        
        # Verify user is the sender (owner)
        if file_doc['sender'] != username:
            return jsonify({'error': 'Permission denied'}), 403
        
        # Mark as deleted in database (soft delete)
        db.encrypted_files.update_one(
            {'_id': ObjectId(file_id)},
            {
                '$set': {
                    'status': 'deleted',
                    'deleted_at': datetime.utcnow()
                }
            }
        )
        
        # Optionally delete physical files
        try:
            from ..services.crypto_service import get_crypto_service
            crypto_service = get_crypto_service()
            
            encrypted_file_path = file_doc.get('encrypted_file_path')
            if encrypted_file_path and os.path.exists(encrypted_file_path):
                os.remove(encrypted_file_path)
                current_app.logger.info(f'[OK] Deleted encrypted file: {encrypted_file_path}')
            
            metadata_file = file_doc.get('metadata_file')
            if metadata_file and os.path.exists(metadata_file):
                os.remove(metadata_file)
                current_app.logger.info(f'[OK] Deleted metadata file: {metadata_file}')
        except Exception as e:
            current_app.logger.warning(f'[WARN] Failed to delete physical files: {str(e)}')
        
        # Log activity
        from ..services.db_utils import log_activity
        log_activity(
            username=username,
            action='deleted',
            file_id=file_id,
            file_name=file_doc['original_filename'],
            success=True
        )
        
        current_app.logger.info(f'[OK] File deleted: {file_id} by {username}')
        
        return jsonify({
            'message': 'File deleted successfully',
            'file_id': file_id
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'File deletion error: {str(e)}')
        return jsonify({'error': 'Failed to delete file'}), 500


@files_bp.route('/<file_id>/extend', methods=['POST'])
@jwt_required()
def extend_expiry(file_id):
    """
    Extend file expiry date
    
    Expected JSON:
    {
        "days": 7
    }
    """
    try:
        username = get_jwt_identity()
        data = request.get_json()
        from bson import ObjectId
        from datetime import datetime, timedelta
        
        days = data.get('days', 7)
        
        db = get_db()
        if db is None:
            return jsonify({'error': 'Database not available'}), 500
        
        # Find the file
        try:
            file_doc = db.encrypted_files.find_one({'_id': ObjectId(file_id)})
        except:
            return jsonify({'error': 'Invalid file ID'}), 400
        
        if not file_doc:
            return jsonify({'error': 'File not found'}), 404
        
        # Verify user is the sender (owner)
        if file_doc['sender'] != username:
            return jsonify({'error': 'Permission denied'}), 403
        
        # Calculate new expiry date
        current_expiry = file_doc.get('expires_at')
        if isinstance(current_expiry, str):
            current_expiry = datetime.fromisoformat(current_expiry.replace('Z', '+00:00'))
        
        new_expiry = current_expiry + timedelta(days=days)
        
        # Update in database
        db.encrypted_files.update_one(
            {'_id': ObjectId(file_id)},
            {
                '$set': {
                    'expires_at': new_expiry,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        # Log activity
        from ..services.db_utils import log_activity
        log_activity(
            username=username,
            action='extended',
            file_id=file_id,
            file_name=file_doc['original_filename'],
            success=True,
            details={'extended_days': days, 'new_expiry': new_expiry.isoformat()}
        )
        
        current_app.logger.info(f'[OK] File expiry extended: {file_id} by {days} days')
        
        return jsonify({
            'message': 'Expiry extended successfully',
            'file_id': file_id,
            'extended_days': days,
            'new_expiry': new_expiry.isoformat()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Extend expiry error: {str(e)}')
        return jsonify({'error': 'Failed to extend expiry'}), 500
