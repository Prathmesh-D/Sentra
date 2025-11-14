"""
Encryption Routes
Handles file encryption and decryption operations
"""
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import json
from pathlib import Path
from datetime import datetime
from bson import ObjectId

from ..services.crypto_service import get_crypto_service
from ..services.database import get_db
from ..services.db_utils import (
    add_contact, 
    update_contact_share_stats, 
    log_activity,
    create_notification
)

encryption_bp = Blueprint('encryption', __name__)


@encryption_bp.route('/encrypt', methods=['POST'])
@jwt_required()
def encrypt_file():
    """
    Encrypt a file
    
    Expected Form Data:
    - file: File to encrypt
    - recipients: JSON array of recipient usernames
    - encryption_type: "AES-128" or "AES-256"
    - expiry_days: Number of days before expiration
    - compress: Boolean
    - self_destruct: Boolean
    - message: Optional message to recipients
    """
    try:
        username = get_jwt_identity()
        crypto_service = get_crypto_service()
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
            metadata['meta_id'] = metadata['_id']  # Explicitly add meta_id for robust linkage
        # Get form data
        recipients_json = request.form.get('recipients', '[]')
        try:
            recipients = json.loads(recipients_json)
        except:
            recipients = []
            
        encryption_type = request.form.get('encryption_type', 'AES-256')
        expiry_days = int(request.form.get('expiry_days', 7))
        compress = request.form.get('compress', 'false').lower() == 'true'
        self_destruct = request.form.get('self_destruct', 'false').lower() == 'true'
        message = request.form.get('message', '')
        processing_mode = request.form.get('processing_mode', 'ai')  # 'ai' or 'manual'
        manual_tag = request.form.get('tag', '')
        
        # AI Auto-tagging and encryption level selection
        tag = manual_tag
        if processing_mode == 'ai':
            try:
                from ..services.ai_service import get_ai_service
                ai_service = get_ai_service()
                
                # Analyze filename
                analysis = ai_service.analyze_filename(original_filename)
                
                # Override encryption type if AI suggests higher security
                if analysis['recommended_aes'] == 'AES-256' and encryption_type == 'AES-128':
                    encryption_type = 'AES-256'
                    current_app.logger.info(f"[AI] Upgraded to AES-256: {analysis['reason']}")
                
                # Set tag from AI
                tag = analysis['tag']
                
                current_app.logger.info(f"[AI] Analysis: score={analysis['sensitivity_score']}, tag={tag}, aes={encryption_type}")
            except Exception as ai_error:
                current_app.logger.warning(f'[WARN] AI analysis failed: {str(ai_error)}')
                tag = manual_tag or 'General'
        else:
            tag = manual_tag or 'General'
        
        # Validate file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > current_app.config['MAX_FILE_SIZE']:
            return jsonify({'error': 'File too large'}), 413
        
        # Save uploaded file temporarily
        temp_dir = os.path.join(current_app.config['DATA_DIR'], 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        original_filename = secure_filename(file.filename)
        temp_file_path = os.path.join(temp_dir, f"temp_{username}_{original_filename}")
        file.save(temp_file_path)
        
        try:
            # Encrypt the file
            result = crypto_service.encrypt_file(
                file_path=temp_file_path,
                filename=original_filename,
                username=username,
                recipients=recipients,
                encryption_type=encryption_type,
                expiry_days=expiry_days,
                compress=compress,
                self_destruct=self_destruct,
                message=message
            )
            
            if not result.get('success'):
                return jsonify({'error': result.get('error', 'Encryption failed')}), 500
            
            # Add tag to metadata
            metadata = result['metadata']
            metadata['tag'] = tag
            metadata['processing_mode'] = processing_mode
            
            # Store metadata in database (if available)
            try:
                db = get_db()
                if db is not None:
                    metadata = result['metadata']
                    metadata['_id'] = ObjectId()
                    
                    # Insert into database
                    db.encrypted_files.insert_one(metadata)
                    
                    file_id = str(metadata['_id'])
                    current_app.logger.info(f'[OK] Stored metadata in database: {file_id}')
                    
                    # Auto-add recipients to contacts and update stats
                    for recipient in recipients:
                        try:
                            # Get recipient details from users collection
                            user_doc = db.users.find_one({'username': recipient})
                            if user_doc:
                                add_contact(
                                    owner_username=username,
                                    contact_username=recipient,
                                    contact_email=user_doc.get('email'),
                                    contact_full_name=user_doc.get('full_name')
                                )
                                update_contact_share_stats(username, recipient)
                                
                                # Create notification for recipient
                                create_notification(
                                    username=recipient,
                                    notification_type='file_shared',
                                    title='New File Shared',
                                    message=f'{username} shared "{original_filename}" with you',
                                    file_id=file_id,
                                    from_user=username,
                                    action_url=f'/inbox',
                                    priority='normal'
                                )
                        except Exception as contact_error:
                            current_app.logger.warning(f'[WARN] Failed to update contact: {contact_error}')
                    
                    # Log activity
                    log_activity(
                        username=username,
                        action='encrypted',
                        file_id=file_id,
                        file_name=original_filename,
                        success=True,
                        details={
                            'recipients': recipients,
                            'encryption_type': encryption_type,
                            'file_size': file_size
                        }
                    )
                else:
                    file_id = f"local_{datetime.utcnow().timestamp()}"
                    
            except Exception as db_error:
                current_app.logger.warning(f'[WARN] Database storage failed: {str(db_error)}')
                file_id = f"local_{datetime.utcnow().timestamp()}"
            
            # Clean up temp file
            crypto_service.cleanup_temp_files(temp_file_path)
            
            return jsonify({
                'success': True,
                'message': 'File encrypted successfully',
                'file_id': file_id,
                'filename': original_filename,
                'encrypted_filename': result['metadata']['encrypted_filename'],
                'recipients': recipients,
                'encryption_type': encryption_type,
                'expires_at': result['metadata']['expires_at'].isoformat() if isinstance(result['metadata']['expires_at'], datetime) else result['metadata']['expires_at']
            }), 200
            
        except Exception as e:
            # Clean up temp file on error
            crypto_service.cleanup_temp_files(temp_file_path)
            raise e
        
    except Exception as e:
        current_app.logger.error(f'[ERROR] Encryption error: {str(e)}')
        return jsonify({'error': 'Encryption failed', 'details': str(e)}), 500


@encryption_bp.route('/decrypt/<file_id>', methods=['POST'])
@jwt_required()
def decrypt_file(file_id):
    """
    Decrypt a file
    
    URL Params:
    - file_id: MongoDB ObjectId of the encrypted file
    
    Returns:
    - Decrypted file as download
    """
    try:
        username = get_jwt_identity()
        crypto_service = get_crypto_service()
        
        # Get file metadata from database
        try:
            db = get_db()
            if db is None:
                return jsonify({'error': 'Database not available'}), 503
            
            file_metadata = db.encrypted_files.find_one({'_id': ObjectId(file_id)})
            
            if not file_metadata:
                return jsonify({'error': 'File not found'}), 404
                
        except Exception as db_error:
            current_app.logger.error(f'[ERROR] Database query failed: {str(db_error)}')
            return jsonify({'error': 'Failed to retrieve file metadata'}), 500
        
        # Verify user is a recipient or sender
        if username != file_metadata['sender'] and username not in file_metadata.get('recipients', []):
            return jsonify({'error': 'Access denied - not authorized to decrypt this file'}), 403
        
        # Check if file has expired
        if file_metadata.get('expires_at'):
            if datetime.utcnow() > file_metadata['expires_at']:
                return jsonify({'error': 'File has expired'}), 410
        
        # Check self-destruct
        if file_metadata.get('self_destruct') and file_metadata.get('download_count', 0) > 0:
            return jsonify({'error': 'File has self-destructed after first download'}), 410
        
        # Download encrypted file from GridFS (cloud storage)
        gridfs_id = file_metadata.get('gridfs_id')
        
        if not gridfs_id:
            # Fallback to old method with local file paths for backward compatibility
            current_app.logger.warning('[WARN] File uses old local storage method, attempting fallback...')
            encrypted_file_rel = file_metadata.get('encrypted_file_path')
            metadata_file_rel = file_metadata.get('metadata_file')
            wrapped_key_rel = file_metadata.get('wrapped_key_path', metadata_file_rel)
            
            # Resolve relative paths against DATA_DIR (backward compatible with absolute paths)
            data_dir = current_app.config['DATA_DIR']
            
            # Check if path is already absolute (old format) or relative (new format)
            if encrypted_file_rel and os.path.isabs(encrypted_file_rel):
                encrypted_file_path = encrypted_file_rel  # Already absolute, use as-is
            else:
                encrypted_file_path = os.path.join(data_dir, encrypted_file_rel) if encrypted_file_rel else None
                
            if metadata_file_rel and os.path.isabs(metadata_file_rel):
                metadata_file_path = metadata_file_rel
            else:
                metadata_file_path = os.path.join(data_dir, metadata_file_rel) if metadata_file_rel else None
                
            if wrapped_key_rel and os.path.isabs(wrapped_key_rel):
                wrapped_key_path = wrapped_key_rel
            else:
                wrapped_key_path = os.path.join(data_dir, wrapped_key_rel) if wrapped_key_rel else None
            
            if not encrypted_file_path or not os.path.exists(encrypted_file_path):
                current_app.logger.error(f'[ERROR] Encrypted file not found: {encrypted_file_path}')
                return jsonify({'error': 'Encrypted file not found. Please re-upload this file.'}), 404
        else:
            # New GridFS method - download from cloud
            try:
                from app.services.database import get_gridfs
                from bson import ObjectId
                
                fs = get_gridfs()
                grid_out = fs.get(ObjectId(gridfs_id))
                
                # Save to temp location for decryption
                temp_dir = os.path.join(current_app.config['DATA_DIR'], 'temp')
                os.makedirs(temp_dir, exist_ok=True)
                encrypted_file_path = os.path.join(temp_dir, f"temp_encrypted_{file_id}.enc")
                
                with open(encrypted_file_path, 'wb') as f:
                    f.write(grid_out.read())
                
                current_app.logger.info(f'[OK] Downloaded encrypted file from GridFS: {gridfs_id}')
                wrapped_key_path = None  # Keys are stored in metadata
                
            except Exception as gridfs_error:
                current_app.logger.error(f'[ERROR] Failed to download from GridFS: {str(gridfs_error)}')
                return jsonify({'error': 'Failed to retrieve encrypted file from cloud storage'}), 500
        
        # Check if we have wrapped_keys in metadata (new format)
        wrapped_keys = file_metadata.get('wrapped_keys', {})
        user_wrapped_key = wrapped_keys.get(username)
        
        if not user_wrapped_key:
            # Fall back to old format with metadata file
            if not wrapped_key_path or not os.path.exists(wrapped_key_path):
                return jsonify({'error': 'Encryption key not found'}), 404
        
        # Decrypt the file
        result = crypto_service.decrypt_file(
            encrypted_file_path=encrypted_file_path,
            wrapped_key_path=wrapped_key_path,
            username=username,
            wrapped_key_hex=user_wrapped_key
        )
        
        if not result.get('success'):
            return jsonify({'error': result.get('error', 'Decryption failed')}), 500
        
        decrypted_file_path = result['decrypted_file']
        
        # Update download count
        try:
            db.encrypted_files.update_one(
                {'_id': ObjectId(file_id)},
                {
                    '$inc': {'download_count': 1},
                    '$set': {'last_accessed': datetime.utcnow()}
                }
            )
            
            # If self-destruct, delete the file from GridFS and database
            if file_metadata.get('self_destruct'):
                db.encrypted_files.update_one(
                    {'_id': ObjectId(file_id)},
                    {'$set': {'status': 'deleted'}}
                )
                # Delete from GridFS if using cloud storage
                if gridfs_id:
                    try:
                        from app.services.database import get_gridfs
                        fs = get_gridfs()
                        fs.delete(ObjectId(gridfs_id))
                        current_app.logger.info(f'[OK] Deleted self-destruct file from GridFS: {gridfs_id}')
                    except Exception as e:
                        current_app.logger.warning(f'[WARN] Failed to delete from GridFS: {str(e)}')
                else:
                    # Old local file cleanup
                    crypto_service.cleanup_temp_files(encrypted_file_path, wrapped_key_path)
                
        except Exception as db_error:
            current_app.logger.warning(f'[WARN] Failed to update download count: {str(db_error)}')
        
        # Send file
        original_filename = file_metadata.get('original_filename', 'decrypted_file')
        
        response = send_file(
            decrypted_file_path,
            as_attachment=True,
            download_name=original_filename,
            mimetype='application/octet-stream'
        )
        
        # Clean up temp files after sending (for GridFS downloads)
        if gridfs_id and os.path.exists(encrypted_file_path):
            try:
                os.remove(encrypted_file_path)
                current_app.logger.info('[OK] Cleaned up temp encrypted file')
            except Exception as e:
                current_app.logger.warning(f'[WARN] Failed to cleanup temp file: {str(e)}')
        
        return response
        
    except Exception as e:
        current_app.logger.error(f'[ERROR] Decryption error: {str(e)}')
        return jsonify({'error': 'Decryption failed', 'details': str(e)}), 500


@encryption_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_sensitivity():
    """
    Analyze file sensitivity using AI
    
    Expected Form Data:
    - file: File to analyze
    
    Returns:
    {
        "sensitivity_score": 85,
        "tags": ["confidential", "personal"],
        "risk_level": "high",
        "recommendations": {...}
    }
    """
    try:
        username = get_jwt_identity()
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        filename = secure_filename(file.filename)

        # Use AIService to analyze filename
        from ..services.ai_service import get_ai_service
        ai_service = get_ai_service()
        analysis = ai_service.analyze_filename(filename)

        # Structure response
        response = {
            'filename': filename,
            'sensitivity_score': analysis['sensitivity_score'],
            'tags': analysis.get('matched_keywords', []),
            'risk_level': (
                'high' if analysis['sensitivity_score'] >= 60 else
                'medium' if analysis['sensitivity_score'] >= 35 else
                'low'
            ),
            'recommendations': {
                'recommended_aes': analysis['recommended_aes'],
                'reason': analysis['reason'],
                'tag': analysis['tag']
            }
        }
        return jsonify(response), 200
    except Exception as e:
        current_app.logger.error(f'[ERROR] Analysis error: {str(e)}')
        return jsonify({'error': 'Analysis failed', 'details': str(e)}), 500
