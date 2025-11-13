"""
Database Utility Functions
Helper functions for common database operations
"""
from datetime import datetime, timedelta
from bson import ObjectId
from app.services.database import get_collection
import logging

logger = logging.getLogger(__name__)


# ========================================================================
# CONTACTS UTILITIES
# ========================================================================

def add_contact(owner_username, contact_username, contact_email=None, contact_full_name=None, nickname=None):
    """
    Add a contact to user's contact list
    
    Args:
        owner_username: User adding the contact
        contact_username: Username of contact to add
        contact_email: Contact's email (optional, cached)
        contact_full_name: Contact's full name (optional, cached)
        nickname: Custom nickname (optional)
        
    Returns:
        dict: Created contact document or None
    """
    try:
        contacts = get_collection('contacts')
        
        # Check if contact already exists
        existing = contacts.find_one({
            'owner_username': owner_username,
            'contact_username': contact_username
        })
        
        if existing:
            logger.info(f"Contact already exists: {owner_username} -> {contact_username}")
            return existing
        
        # Create contact
        contact_doc = {
            'owner_username': owner_username,
            'contact_username': contact_username,
            'contact_email': contact_email,
            'contact_full_name': contact_full_name,
            'nickname': nickname,
            'notes': '',
            'tags': [],
            'is_favorite': False,
            'shared_files_count': 0,
            'last_shared_at': None,
            'added_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = contacts.insert_one(contact_doc)
        contact_doc['_id'] = result.inserted_id
        
        logger.info(f"[OK] Contact added: {owner_username} -> {contact_username}")
        return contact_doc
        
    except Exception as e:
        logger.error(f"Failed to add contact: {e}")
        return None


def get_user_contacts(username, filter_tags=None, favorites_only=False, limit=None):
    """
    Get user's contact list
    
    Args:
        username: User whose contacts to fetch
        filter_tags: Filter by tags (optional)
        favorites_only: Show only favorites
        limit: Limit number of results
        
    Returns:
        list: List of contact documents
    """
    try:
        contacts = get_collection('contacts')
        
        query = {'owner_username': username}
        
        if filter_tags:
            query['tags'] = {'$in': filter_tags if isinstance(filter_tags, list) else [filter_tags]}
        
        if favorites_only:
            query['is_favorite'] = True
        
        cursor = contacts.find(query).sort('last_shared_at', -1)
        
        if limit:
            cursor = cursor.limit(limit)
        
        return list(cursor)
        
    except Exception as e:
        logger.error(f"Failed to get contacts: {e}")
        return []


def update_contact_share_stats(owner_username, contact_username):
    """
    Update contact statistics when a file is shared
    
    Args:
        owner_username: User sharing the file
        contact_username: Contact receiving the file
    """
    try:
        contacts = get_collection('contacts')
        
        contacts.update_one(
            {
                'owner_username': owner_username,
                'contact_username': contact_username
            },
            {
                '$inc': {'shared_files_count': 1},
                '$set': {
                    'last_shared_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            },
            upsert=True  # Create if doesn't exist
        )
        
    except Exception as e:
        logger.error(f"Failed to update contact stats: {e}")


def get_frequent_recipients(username, limit=10):
    """
    Get user's most frequent recipients
    
    Args:
        username: User to get recipients for
        limit: Number of results
        
    Returns:
        list: List of contacts sorted by frequency
    """
    try:
        contacts = get_collection('contacts')
        
        results = contacts.find(
            {'owner_username': username}
        ).sort('shared_files_count', -1).limit(limit)
        
        return list(results)
        
    except Exception as e:
        logger.error(f"Failed to get frequent recipients: {e}")
        return []


# ========================================================================
# ACTIVITY LOG UTILITIES
# ========================================================================

def log_activity(username, action, file_id=None, file_name=None, target_user=None, 
                success=True, error_message=None, ip_address=None, details=None):
    """
    Log user activity
    
    Args:
        username: User performing action
        action: Action type (see schema for valid values)
        file_id: Related file ID
        file_name: File name
        target_user: Target user (for sharing, contacts)
        success: Whether action succeeded
        error_message: Error message if failed
        ip_address: User IP address
        details: Additional details dict
        
    Returns:
        bool: Success status
    """
    try:
        activity_logs = get_collection('activity_logs')
        
        log_doc = {
            'username': username,
            'action': action,
            'file_id': file_id,
            'file_name': file_name,
            'target_user': target_user,
            'ip_address': ip_address,
            'user_agent': None,  # Can be added from request
            'timestamp': datetime.utcnow(),
            'details': details or {},
            'success': success,
            'error_message': error_message
        }
        
        activity_logs.insert_one(log_doc)
        return True
        
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")
        return False


def get_user_activity(username, action_filter=None, limit=50, skip=0):
    """
    Get user's activity history
    
    Args:
        username: User to get activity for
        action_filter: Filter by action type
        limit: Number of results
        skip: Number to skip (for pagination)
        
    Returns:
        list: Activity log entries
    """
    try:
        activity_logs = get_collection('activity_logs')
        
        query = {'username': username}
        if action_filter:
            query['action'] = action_filter
        
        results = activity_logs.find(query).sort('timestamp', -1).skip(skip).limit(limit)
        
        return list(results)
        
    except Exception as e:
        logger.error(f"Failed to get activity: {e}")
        return []


# ========================================================================
# STATISTICS UTILITIES
# ========================================================================

def calculate_user_statistics(username):
    """
    Calculate comprehensive statistics for a user
    
    Args:
        username: User to calculate stats for
        
    Returns:
        dict: Statistics document
    """
    try:
        files = get_collection('encrypted_files')
        contacts = get_collection('contacts')
        
        # Count files sent
        files_sent = files.count_documents({'sender': username})
        
        # Count files received
        files_received = files.count_documents({
            'recipients': username,
            'sender': {'$ne': username}
        })
        
        # Calculate storage
        pipeline = [
            {'$match': {'sender': username, 'status': 'active'}},
            {'$group': {'_id': None, 'total': {'$sum': '$file_size'}}}
        ]
        storage_result = list(files.aggregate(pipeline))
        storage_used = storage_result[0]['total'] if storage_result else 0
        
        # Count by status
        active_count = files.count_documents({'sender': username, 'status': 'active'})
        expired_count = files.count_documents({'sender': username, 'status': 'expired'})
        deleted_count = files.count_documents({'sender': username, 'status': 'deleted'})
        
        # Count downloads
        total_downloads = 0
        for file_doc in files.find({'sender': username}, {'download_count': 1}):
            total_downloads += file_doc.get('download_count', 0)
        
        # Count contacts
        contacts_count = contacts.count_documents({'owner_username': username})
        
        # Files by type
        files_by_type = {}
        for file_doc in files.find({'sender': username}, {'file_type': 1}):
            file_type = file_doc.get('file_type', 'unknown')
            files_by_type[file_type] = files_by_type.get(file_type, 0) + 1
        
        # Files by month (last 12 months)
        files_by_month = []
        for i in range(12):
            month_start = datetime.utcnow().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            count = files.count_documents({
                'sender': username,
                'created_at': {'$gte': month_start, '$lt': month_end}
            })
            
            files_by_month.append({
                'month': month_start.strftime('%Y-%m'),
                'count': count
            })
        
        # Top recipients
        pipeline = [
            {'$match': {'sender': username}},
            {'$unwind': '$recipients'},
            {'$group': {'_id': '$recipients', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]
        top_recipients = []
        for result in files.aggregate(pipeline):
            top_recipients.append({
                'username': result['_id'],
                'count': result['count']
            })
        
        stats = {
            'username': username,
            'total_files_sent': files_sent,
            'total_files_received': files_received,
            'total_storage_used_bytes': storage_used,
            'active_files_count': active_count,
            'expired_files_count': expired_count,
            'deleted_files_count': deleted_count,
            'total_downloads': total_downloads,
            'contacts_count': contacts_count,
            'files_by_type': files_by_type,
            'files_by_month': files_by_month,
            'top_recipients': top_recipients,
            'updated_at': datetime.utcnow()
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Failed to calculate statistics: {e}")
        return None


def update_user_statistics(username):
    """
    Update cached statistics for a user
    
    Args:
        username: User to update stats for
        
    Returns:
        bool: Success status
    """
    try:
        stats = calculate_user_statistics(username)
        if not stats:
            return False
        
        user_statistics = get_collection('user_statistics')
        
        user_statistics.update_one(
            {'username': username},
            {'$set': stats},
            upsert=True
        )
        
        logger.info(f"[OK] Updated statistics for {username}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to update statistics: {e}")
        return False


def get_cached_statistics(username, max_age_minutes=60):
    """
    Get cached statistics for a user (calculate if too old)
    
    Args:
        username: User to get stats for
        max_age_minutes: Maximum age of cached stats
        
    Returns:
        dict: Statistics document
    """
    try:
        user_statistics = get_collection('user_statistics')
        
        stats = user_statistics.find_one({'username': username})
        
        # Check if stats exist and are recent
        if stats:
            age = datetime.utcnow() - stats['updated_at']
            if age.total_seconds() < (max_age_minutes * 60):
                return stats
        
        # Recalculate if no stats or too old
        logger.info(f"Recalculating statistics for {username}")
        update_user_statistics(username)
        
        return user_statistics.find_one({'username': username})
        
    except Exception as e:
        logger.error(f"Failed to get cached statistics: {e}")
        return calculate_user_statistics(username)


# ========================================================================
# NOTIFICATION UTILITIES
# ========================================================================

def create_notification(username, notification_type, title, message, 
                       file_id=None, from_user=None, action_url=None, priority='normal'):
    """
    Create a notification for a user
    
    Args:
        username: User to notify
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        file_id: Related file ID
        from_user: User who triggered notification
        action_url: URL to navigate to
        priority: Notification priority
        
    Returns:
        bool: Success status
    """
    try:
        notifications = get_collection('notifications')
        
        notification = {
            'username': username,
            'type': notification_type,
            'title': title,
            'message': message,
            'file_id': file_id,
            'from_user': from_user,
            'is_read': False,
            'read_at': None,
            'created_at': datetime.utcnow(),
            'action_url': action_url,
            'priority': priority
        }
        
        notifications.insert_one(notification)
        logger.info(f"[OK] Notification created for {username}: {title}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        return False


def get_user_notifications(username, unread_only=False, limit=20):
    """
    Get user's notifications
    
    Args:
        username: User to get notifications for
        unread_only: Only return unread notifications
        limit: Number of results
        
    Returns:
        list: Notification documents
    """
    try:
        notifications = get_collection('notifications')
        
        query = {'username': username}
        if unread_only:
            query['is_read'] = False
        
        results = notifications.find(query).sort('created_at', -1).limit(limit)
        
        return list(results)
        
    except Exception as e:
        logger.error(f"Failed to get notifications: {e}")
        return []


def mark_notification_read(notification_id):
    """
    Mark a notification as read
    
    Args:
        notification_id: Notification ID to mark as read
        
    Returns:
        bool: Success status
    """
    try:
        notifications = get_collection('notifications')
        
        notifications.update_one(
            {'_id': ObjectId(notification_id)},
            {
                '$set': {
                    'is_read': True,
                    'read_at': datetime.utcnow()
                }
            }
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {e}")
        return False
