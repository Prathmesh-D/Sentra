# Sentra Encryption Platform - Database Schema Documentation

## Overview
Complete MongoDB database structure with 8 collections for managing users, files, contacts, activity, and notifications.

---

## Collections

### 1. **users** - User Accounts
Stores user authentication, profile data, and RSA keys.

**Key Fields:**
- `username` (string, unique) - Login username
- `email` (string, unique) - Email address
- `password_hash` (string) - Bcrypt hashed password
- `full_name` (string) - User's full name
- `public_key` (string) - RSA public key (PEM format)
- `private_key_encrypted` (string, optional) - Encrypted private key
- `phone` (string) - Phone number
- `organization` (string) - Company/organization
- `role` (enum: user/admin/premium) - User tier
- `storage_limit_mb` (number) - Storage quota
- `created_at` (date) - Registration date
- `last_login` (date) - Last login timestamp
- `is_active` (bool) - Account status
- `email_verified` (bool) - Email verification status
- `two_factor_enabled` (bool) - 2FA status

**Indexes:**
- username (unique)
- email (unique)
- created_at (descending)
- is_active
- role

---

### 2. **encrypted_files** - File Metadata
Stores all encrypted file information and access control.

**Key Fields:**
- `original_filename` (string) - Original file name
- `encrypted_filename` (string) - Encrypted file name on disk
- `encrypted_file_path` (string) - Full file path
- `sender` (string) - File owner username
- `recipients` (array[string]) - List of recipient usernames
- `wrapped_keys` (object) - AES keys wrapped for each user
- `encryption_type` (enum: AES-128/AES-256) - Encryption method
- `file_size` (int) - Original file size in bytes
- `file_hash` (string) - SHA-256 hash
- `file_type` (string) - MIME type/extension
- `compressed` (bool) - Compression flag
- `self_destruct` (bool) - Auto-delete after download
- `message` (string) - Message to recipients
- `tags` (array[string]) - User-defined tags
- `created_at` (date) - Upload timestamp
- `expires_at` (date) - Expiration date
- `download_count` (int) - Download counter
- `downloads` (array) - Download history with user/timestamp/IP
- `status` (enum: active/expired/deleted/self_destructed)

**Indexes:**
- sender + status
- recipients + status
- created_at (descending)
- expires_at
- status
- file_hash
- tags
- original_filename (text search)

---

### 3. **contacts** - User Contact Lists
Manages frequently used recipients for quick file sharing.

**Key Fields:**
- `owner_username` (string) - Contact list owner
- `contact_username` (string) - Contact's username
- `contact_email` (string) - Cached email
- `contact_full_name` (string) - Cached full name
- `nickname` (string) - Custom nickname
- `notes` (string) - Personal notes
- `tags` (array[string]) - Organization tags (work, family, etc.)
- `is_favorite` (bool) - Favorite flag
- `shared_files_count` (int) - Number of shared files
- `last_shared_at` (date) - Last sharing timestamp
- `added_at` (date) - When added
- `updated_at` (date) - Last update

**Indexes:**
- owner_username + contact_username (unique)
- owner_username + is_favorite
- owner_username + tags
- owner_username + last_shared_at

**Auto-Population:**
- Contacts are automatically added when you share files
- Statistics update automatically on each share

---

### 4. **activity_logs** - Audit Trail
Tracks all user actions for security and activity feeds.

**Key Fields:**
- `username` (string) - User who performed action
- `action` (enum) - Action type:
  - login, logout, register
  - encrypted, decrypted, shared, downloaded, deleted
  - profile_updated, password_changed
  - contact_added, contact_removed
- `file_id` (string) - Related file (if applicable)
- `file_name` (string) - Cached file name
- `target_user` (string) - Target user (for sharing/contacts)
- `ip_address` (string) - User IP
- `user_agent` (string) - Browser/client info
- `timestamp` (date) - When occurred
- `details` (object) - Additional data
- `success` (bool) - Action result
- `error_message` (string) - Error if failed

**Indexes:**
- username + timestamp (descending)
- action + timestamp
- file_id
- timestamp with TTL (90 days auto-delete)

**Usage:**
- Automatic logging on file encryption, sharing, downloads
- Powers the "Recent Activity" dashboard widget
- Security audit trail

---

### 5. **user_statistics** - Cached Analytics
Pre-calculated statistics for fast dashboard loading.

**Key Fields:**
- `username` (string, unique) - User
- `total_files_sent` (int) - Files encrypted/sent
- `total_files_received` (int) - Files received
- `total_storage_used_bytes` (long) - Storage used
- `active_files_count` (int) - Active files
- `expired_files_count` (int) - Expired files
- `deleted_files_count` (int) - Deleted files
- `total_downloads` (int) - Download count
- `contacts_count` (int) - Number of contacts
- `files_by_type` (object) - Breakdown by file type
- `files_by_month` (array) - Last 12 months trend
- `top_recipients` (array) - Most frequent recipients
- `updated_at` (date) - Last calculation

**Indexes:**
- username (unique)
- updated_at

**Update Strategy:**
- Calculate on-demand with 60-minute cache
- Background job for periodic updates (optional)
- Use `?use_cache=true` query param in API

---

### 6. **shared_links** - Public File Links
Temporary shareable links for files (optional feature).

**Key Fields:**
- `link_id` (string, unique) - Shareable token/URL
- `file_id` (string) - Associated file
- `owner_username` (string) - Link creator
- `password_protected` (bool) - Requires password
- `password_hash` (string) - Link password (hashed)
- `max_downloads` (int) - Download limit
- `download_count` (int) - Current downloads
- `created_at` (date) - Creation date
- `expires_at` (date) - Expiration date
- `is_active` (bool) - Active status
- `access_logs` (array) - Access attempts

**Indexes:**
- link_id (unique)
- file_id
- owner_username
- expires_at
- is_active

---

### 7. **notifications** - In-App Notifications
Real-time notifications for users.

**Key Fields:**
- `username` (string) - Recipient
- `type` (enum) - Notification type:
  - file_shared, file_expiring, file_downloaded
  - file_deleted, contact_request, system_update
- `title` (string) - Notification title
- `message` (string) - Notification text
- `file_id` (string) - Related file
- `from_user` (string) - Who triggered it
- `is_read` (bool) - Read status
- `read_at` (date) - When read
- `created_at` (date) - Creation time
- `action_url` (string) - Navigation URL
- `priority` (enum: low/normal/high/urgent)

**Indexes:**
- username + is_read + created_at
- created_at with TTL (30 days auto-delete)

**Auto-Creation:**
- Notification sent when file is shared
- Notification for expiring files (can be automated)
- Notification for downloads (optional)

---

### 8. **system_settings** - Configuration
Global system settings and configuration.

**Key Fields:**
- `setting_key` (string, unique) - Setting identifier
- `setting_value` (any type) - Setting value
- `description` (string) - What it controls
- `updated_at` (date) - Last update
- `updated_by` (string) - Admin who updated

**Default Settings:**
- `max_file_size_mb`: 100
- `default_storage_limit_mb`: 102400 (100 GB)
- `default_file_expiry_days`: 30
- `enable_file_sharing`: true
- `enable_shared_links`: true
- `enable_notifications`: true
- `max_recipients_per_file`: 50
- `activity_log_retention_days`: 90

---

## Initialization

### Setup Database
Run once to create all collections with validation:

```python
from app.services.db_init import initialize_collections, create_default_settings

initialize_collections()  # Creates collections and indexes
create_default_settings()  # Adds default system settings
```

### Auto-Executed
The database initialization runs automatically when:
- Server starts (`run.py`)
- `db_manager.create_indexes()` is called

---

## Data Relationships

### User → Files
- **One-to-Many**: User can own many files
- Query: `{sender: username}`

### User → Contacts
- **One-to-Many**: User can have many contacts
- Query: `{owner_username: username}`
- **Auto-populated** when sharing files

### File → Recipients
- **Many-to-Many**: Files can have multiple recipients
- Stored as array in `recipients` field
- Each recipient gets wrapped key in `wrapped_keys` object

### User → Activity Logs
- **One-to-Many**: User has many log entries
- Query: `{username: username}`
- **TTL**: Auto-deletes after 90 days

### User → Notifications
- **One-to-Many**: User has many notifications
- Query: `{username: username, is_read: false}`
- **TTL**: Auto-deletes after 30 days

### User → Statistics (Cached)
- **One-to-One**: One stats document per user
- Updated every 60 minutes (configurable)
- Calculated on-demand if missing/stale

---

## API Integration

### Dashboard Stats
```
GET /api/users/stats?use_cache=true
```
- `use_cache=false` (default): Real-time calculation
- `use_cache=true`: Use cached statistics (faster, 60min old)

### Dashboard with Activity
```
GET /api/users/dashboard
```
Returns both statistics and recent activity feed.

### Contacts Management
```
GET /api/users/contacts
POST /api/users/contacts
DELETE /api/users/contacts/:id
```

### Notifications
```
GET /api/users/notifications?unread=true
PUT /api/users/notifications/:id/read
```

---

## Performance Optimizations

### Indexes
- All collections have optimized indexes
- Compound indexes for common query patterns
- Text search on file names

### Caching
- User statistics cached for 60 minutes
- Contact info cached (email, full_name)
- Reduces database queries

### TTL (Time-To-Live)
- Activity logs: 90 days
- Notifications: 30 days
- Automatic cleanup by MongoDB

### Aggregation Pipelines
- Storage calculation uses aggregation (faster)
- Statistics use aggregation for complex queries
- Top recipients calculated via pipeline

---

## Data Flow Examples

### File Encryption Flow
1. User uploads file → encrypted_files created
2. For each recipient:
   - Contact auto-added/updated in contacts
   - Notification created for recipient
3. Activity log entry created
4. User statistics marked for recalculation

### Dashboard Load Flow
1. Check cached statistics (user_statistics)
2. If cache < 60min old: Use cached data
3. If cache too old: Recalculate from encrypted_files
4. Fetch recent activity from activity_logs
5. Return combined data

### Contact Auto-Population
1. User shares file with recipient
2. System checks if contact exists
3. If new: Create contact with cached user info
4. If exists: Update shared_files_count and last_shared_at
5. Contact appears in user's contact list

---

## Validation Rules

All collections have JSON Schema validation:
- Required fields enforced
- Data types validated
- Enum values restricted
- Email patterns validated
- Validation level: **moderate** (new docs only)
- Validation action: **warn** (log but allow)

---

## Future Enhancements

### Planned Features
- [ ] Shared links API endpoints
- [ ] Background statistics calculator
- [ ] File expiry notification scheduler
- [ ] Contact import/export
- [ ] Advanced search with filters
- [ ] File sharing analytics dashboard
- [ ] Bulk operations API

### Scalability
- Ready for sharding (username-based)
- Read replicas for stats
- File metadata separate from binary storage
- Cache layer (Redis) for hot data
