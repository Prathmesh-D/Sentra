"""
File Cleanup Service
Handles automatic cleanup of expired and deleted files
"""
from datetime import datetime
import os
import logging
from app.services.database import get_db

logger = logging.getLogger(__name__)


def cleanup_expired_files():
    """
    Cleanup expired files - mark as expired and delete physical files
    Should be run periodically (e.g., daily cron job)
    """
    try:
        db = get_db()
        if db is None:
            logger.error('[CLEANUP] Database not available')
            return
        
        # Find files that have expired but are still marked as active
        expired_files = db.encrypted_files.find({
            'status': 'active',
            'expires_at': {'$lt': datetime.utcnow()}
        })
        
        cleaned_count = 0
        for file_doc in expired_files:
            try:
                file_id = str(file_doc['_id'])
                
                # Mark as expired in database
                db.encrypted_files.update_one(
                    {'_id': file_doc['_id']},
                    {
                        '$set': {
                            'status': 'expired',
                            'expired_at': datetime.utcnow()
                        }
                    }
                )
                
                # Delete physical files
                encrypted_file_path = file_doc.get('encrypted_file_path')
                if encrypted_file_path and os.path.exists(encrypted_file_path):
                    os.remove(encrypted_file_path)
                    logger.info(f'[CLEANUP] Deleted expired file: {encrypted_file_path}')
                
                metadata_file = file_doc.get('metadata_file')
                if metadata_file and os.path.exists(metadata_file):
                    os.remove(metadata_file)
                    logger.info(f'[CLEANUP] Deleted metadata: {metadata_file}')
                
                cleaned_count += 1
                logger.info(f'[CLEANUP] Expired file cleaned: {file_id}')
                
            except Exception as e:
                logger.error(f'[CLEANUP] Failed to cleanup file {file_id}: {str(e)}')
                continue
        
        logger.info(f'[CLEANUP] Cleaned {cleaned_count} expired files')
        return cleaned_count
        
    except Exception as e:
        logger.error(f'[CLEANUP] Cleanup failed: {str(e)}')
        return 0


def cleanup_deleted_files():
    """
    Cleanup files marked as deleted - remove physical files
    Should be run periodically
    """
    try:
        db = get_db()
        if db is None:
            return 0
        
        # Find files marked as deleted
        deleted_files = db.encrypted_files.find({'status': 'deleted'})

        cleaned_count = 0
        for file_doc in deleted_files:
            try:
                # Delete physical files
                encrypted_file_path = file_doc.get('encrypted_file_path')
                if encrypted_file_path and os.path.exists(encrypted_file_path):
                    os.remove(encrypted_file_path)

                metadata_file = file_doc.get('metadata_file')
                if metadata_file and os.path.exists(metadata_file):
                    os.remove(metadata_file)

                # Remove document from DB (hard delete)
                db.encrypted_files.delete_one({'_id': file_doc['_id']})

                cleaned_count += 1

            except Exception as e:
                logger.error(f'[CLEANUP] Failed to cleanup deleted file: {str(e)}')
                continue

        logger.info(f'[CLEANUP] Hard deleted {cleaned_count} deleted files')
        return cleaned_count
        
    except Exception as e:
        logger.error(f'[CLEANUP] Cleanup deleted files failed: {str(e)}')
        return 0


def get_total_storage_used(username):
    """
    Calculate total storage used by a user's active files
    
    Args:
        username: Username to calculate storage for
        
    Returns:
        int: Total bytes used
    """
    try:
        db = get_db()
        if db is None:
            return 0
        
        # Aggregate file sizes for active files only
        pipeline = [
            {
                '$match': {
                    'sender': username,
                    'status': {'$in': ['active', 'expired']}  # Include expired but not deleted
                }
            },
            {
                '$group': {
                    '_id': None,
                    'total_size': {'$sum': '$file_size'}
                }
            }
        ]
        
        result = list(db.encrypted_files.aggregate(pipeline))
        
        if result:
            return result[0]['total_size']
        return 0
        
    except Exception as e:
        logger.error(f'[CLEANUP] Failed to calculate storage: {str(e)}')
        return 0
