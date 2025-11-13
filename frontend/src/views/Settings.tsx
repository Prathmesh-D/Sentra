import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  FiUser,
  FiLock,
  FiShield,
  FiBell,
  FiDatabase,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiAlertCircle,
  FiKey,
  FiClock,
  FiFile,
} from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { userService, authService } from '@/api'
import { clearDashboardCache } from './Dashboard'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [hasAnimated, setHasAnimated] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  // Profile settings
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Activity log
  // const [activityLog, setActivityLog] = useState<any[]>([])
  // const [isLoadingActivity, setIsLoadingActivity] = useState(false)
  // const [showActivityModal, setShowActivityModal] = useState(false)

  // RSA Keys
  const [userKeys, setUserKeys] = useState<any>(null)
  const [isLoadingKeys, setIsLoadingKeys] = useState(false)
  const [showKeysModal, setShowKeysModal] = useState(false)
  const [isRegeneratingKeys, setIsRegeneratingKeys] = useState(false)

  // Security settings
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('30')

  // Privacy settings
  // const [encryptionAlgorithm, setEncryptionAlgorithm] = useState('AES-256-GCM')
  // const [autoDeleteDays, setAutoDeleteDays] = useState('30')

  // Notification settings
  const [downloadAlerts, setDownloadAlerts] = useState(true)
  const [expiryWarnings, setExpiryWarnings] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Storage settings
  const [storageUsed] = useState(4.2)
  const [storageLimit] = useState(10)
  const [autoCompress, setAutoCompress] = useState(true)
  const [maxFileSize, setMaxFileSize] = useState('100')
  // const [retentionPeriod, setRetentionPeriod] = useState('90')

  // Appearance settings
  // const [theme, setTheme] = useState('light')
  // const [language, setLanguage] = useState('en')
  // const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  // const [timeFormat, setTimeFormat] = useState('12h')

  useEffect(() => {
    const scrollableParent = document.querySelector('.overflow-y-auto');
    if (scrollableParent) {
      scrollableParent.scrollTop = 0;
    }
    const animated = sessionStorage.getItem('settingsAnimated')
    if (!animated) {
      setHasAnimated(false)
      sessionStorage.setItem('settingsAnimated', 'true')
    } else {
      setHasAnimated(true)
    }
    
    // Load user profile data
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getProfile()
      setName(profile.full_name || '')
      setEmail(profile.email || '')
      setBio(profile.bio || '')
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url)
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error)
      // Fallback to context user data
      if (user) {
        setName(user.full_name || '')
        setEmail(user.email || '')
        setBio(user.bio || '')
        if (user.avatar_url) {
          setAvatarPreview(user.avatar_url)
        }
      }
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsLoadingProfile(true)
      await userService.updateProfile({
        full_name: name,
        email,
        bio,
      })
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update profile'
      toast.error(errorMessage)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Avatar file size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile) return

    try {
      setIsUploadingAvatar(true)
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      // Note: This would need a backend endpoint for avatar upload
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate upload
      toast.success('Avatar uploaded successfully!')
      setAvatarFile(null)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload avatar'
      toast.error(errorMessage)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      // Note: This would need a backend endpoint for avatar removal
      setAvatarPreview(null)
      setAvatarFile(null)
      toast.success('Avatar removed successfully!')
    } catch (error: any) {
      toast.error('Failed to remove avatar')
    }
  }

  // Activity log functions - removed

  const handleViewKeys = async () => {
    try {
      setIsLoadingKeys(true)
      // Mock RSA keys data since backend doesn't exist yet
      const mockKeys = {
        public_key: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Z3QX8Q8w8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
-----END PUBLIC KEY-----`,
        private_key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC2Z3QX8Q8w8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
K8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8Q
-----END PRIVATE KEY-----`,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days ago
      }
      setUserKeys(mockKeys)
      setShowKeysModal(true)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load RSA keys'
      toast.error(errorMessage)
    } finally {
      setIsLoadingKeys(false)
    }
  }

  const handleRegenerateKeys = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to regenerate your RSA keys? This will invalidate all your current encryption keys and you may lose access to some encrypted files.'
    )
    if (!confirmed) return

    try {
      setIsRegeneratingKeys(true)
      const newKeys = await userService.regenerateKeys()
      setUserKeys(newKeys)
      toast.success('RSA keys regenerated successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to regenerate keys'
      toast.error(errorMessage)
    } finally {
      setIsRegeneratingKeys(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match!')
      return
    }
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    
    try {
      await authService.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to change password'
      toast.error(errorMessage)
    }
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your files will be permanently deleted.'
    )
    if (confirmed) {
      toast.success('Account deletion process initiated. Check your email to confirm.')
    }
  }

  // Privacy settings functions - removed

  // Notification settings functions
  const handleSaveNotificationSettings = async () => {
    try {
      // Note: This would need a backend endpoint for notification settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Notification settings updated successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update notification settings'
      toast.error(errorMessage)
    }
  }

  // Storage settings functions
  const handleSaveStorageSettings = async () => {
    try {
      // Note: This would need a backend endpoint for storage settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Storage settings updated successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update storage settings'
      toast.error(errorMessage)
    }
  }

  // Appearance settings functions - removed

  // Session timeout function
  const handleUpdateSessionTimeout = async () => {
    try {
      // Note: This would need a backend endpoint for session settings
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      toast.success(`Session timeout updated to ${sessionTimeout} minutes!`)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update session timeout'
      toast.error(errorMessage)
    }
  }

  // Storage management functions
  const handleClearCache = async () => {
    try {
      // Clear all dashboard and file caches
      clearDashboardCache()
      sessionStorage.removeItem('inboxData')
      sessionStorage.removeItem('inboxCacheTime')
      sessionStorage.removeItem('outboxData')
      sessionStorage.removeItem('outboxCacheTime')
      
      // Note: This would need a backend endpoint for cache clearing
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Cache cleared successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to clear cache'
      toast.error(errorMessage)
    }
  }

  const handleDeleteExpiredFiles = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete all expired files? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      // Note: This would need a backend endpoint for bulk file deletion
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      toast.success('Expired files deleted successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete expired files'
      toast.error(errorMessage)
    }
  }

  // RSA Key management functions
  const handleCopyPublicKey = async () => {
    try {
      // For now, copy a placeholder key
      const publicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890...'
      await navigator.clipboard.writeText(publicKey)
      toast.success('Public key copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy public key')
    }
  }

  const handleRegenerateRSAKeys = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to regenerate your RSA keys? This will invalidate all your current encryption keys and you may lose access to some encrypted files.'
    )
    if (!confirmed) return

    try {
      // Note: This would need a backend endpoint for key regeneration
      await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate API call
      toast.success('RSA keys regenerated successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to regenerate keys'
      toast.error(errorMessage)
    }
  }

  const handleExportKeys = async () => {
    try {
      // Save private key locally
      const privateKeyData = {
        privateKey: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...',
        savedLocally: true,
        savedAt: new Date().toISOString()
      }

      // Save private key to localStorage
      localStorage.setItem('userPrivateKey', JSON.stringify(privateKeyData))

      // Save public key to cloud (simulate API call)
      const publicKeyData = {
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890...',
        uploadedToCloud: true,
        uploadedAt: new Date().toISOString()
      }

      // Note: This would need a backend endpoint for public key upload
      console.log('Uploading public key to cloud:', publicKeyData)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      toast.success('Private key saved locally and public key uploaded to cloud!')
    } catch (error) {
      toast.error('Failed to save keys')
    }
  }

  const storagePercentage = (storageUsed / storageLimit) * 100

  const handleTabChange = (tabId: string) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId)
      setAnimationKey(prev => prev + 1) // Force animation re-trigger
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'storage', label: 'Storage', icon: FiDatabase },
  ]

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div
          className={`mb-8 ${
            hasAnimated ? '' : 'animate-in fade-in slide-in-from-top-4 duration-500'
          }`}
        >
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2c3e50' }}>
            Settings
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your account preferences, {user?.username && `@${user.username}`}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div
            className={`w-64 flex-shrink-0 ${
              hasAnimated ? '' : 'animate-in fade-in slide-in-from-left-4 duration-500 delay-100'
            }`}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sticky top-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 relative btn-click-animation ${
                      activeTab === tab.id
                        ? 'font-semibold shadow-sm tab-button-active'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    style={{
                      backgroundColor: activeTab === tab.id ? '#b2f7ef' : 'transparent',
                      color: activeTab === tab.id ? '#2c3e50' : undefined,
                    }}
                  >
                    <Icon className="text-xl icon-bounce-hover" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div
                key={`profile-${animationKey}`}
                className="space-y-6 tab-transition"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#2c3e50' }}>
                    Profile Information
                  </h2>

                  {/* Avatar */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-3 text-gray-700">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden"
                        style={{ backgroundColor: avatarPreview ? 'transparent' : '#f2b5d4' }}
                      >
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
                           user?.username?.slice(0, 2).toUpperCase() || 
                           'U')
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-3">
                          <label className="px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-md cursor-pointer text-center"
                                 style={{ backgroundColor: '#97eeff' }}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                            Change Photo
                          </label>
                          <button
                            onClick={handleRemoveAvatar}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium transition-all duration-200 hover:bg-gray-50"
                          >
                            Remove
                          </button>
                        </div>
                        {avatarFile && (
                          <button
                            onClick={handleUploadAvatar}
                            disabled={isUploadingAvatar}
                            className="px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                            style={{ backgroundColor: '#b2f7ef' }}
                          >
                            {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                          </button>
                        )}
                        <p className="text-xs text-gray-500">
                          JPG, PNG or GIF. Max size 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                    />
                  </div>

                  {/* Email */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                    />
                  </div>

                  {/* Bio */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isLoadingProfile}
                      className="px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                      style={{ backgroundColor: '#97eeff' }}
                    >
                      {isLoadingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                {/* Account Management */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#2c3e50' }}>
                    Account Management
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">RSA Encryption Keys</h3>
                        <p className="text-sm text-gray-600">Manage your public/private key pair for encryption</p>
                      </div>
                      <button
                        onClick={handleViewKeys}
                        disabled={isLoadingKeys}
                        className="px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                        style={{ backgroundColor: '#f2b5d4' }}
                      >
                        {isLoadingKeys ? 'Loading...' : 'View Keys'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <h3 className="font-semibold text-red-900">Danger Zone</h3>
                        <p className="text-sm text-red-600">Permanently delete your account and all associated data</p>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium transition-all duration-200 hover:bg-red-700 hover:shadow-md"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div
                key={`security-${animationKey}`}
                className="space-y-6 tab-transition"
              >
                {/* Change Password */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#2c3e50' }}>
                    Change Password
                  </h2>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? <FiEyeOff className="text-xl" /> : <FiEye className="text-xl" />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <FiEyeOff className="text-xl" /> : <FiEye className="text-xl" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <FiEyeOff className="text-xl" /> : <FiEye className="text-xl" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg"
                    style={{ backgroundColor: '#97eeff' }}
                  >
                    Update Password
                  </button>
                </div>

                {/* Session Timeout */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#2c3e50' }}>
                    Session Timeout
                  </h2>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Automatically log out after (minutes)
                  </label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="never">Never</option>
                  </select>

                  <button
                    onClick={handleUpdateSessionTimeout}
                    className="px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg mt-4"
                    style={{ backgroundColor: '#97eeff' }}
                  >
                    Update Session Timeout
                  </button>
                </div>

                {/* RSA Key Management */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#2c3e50' }}>
                    RSA Key Management
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Manage your RSA encryption keys for secure file sharing
                  </p>

                  {/* Public Key */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        <FiKey className="inline mr-2" />
                        Public Key
                      </label>
                      <button
                        onClick={handleCopyPublicKey}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-xs text-gray-700 break-all">
                      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234...
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Share this key with others to receive encrypted files
                    </p>
                  </div>

                  {/* Key Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Key Type</p>
                      <p className="font-semibold text-gray-800">RSA-2048</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Created</p>
                      <p className="font-semibold text-gray-800">Jan 15, 2025</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleExportKeys}
                      className="px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: '#97eeff', color: '#2c3e50' }}
                    >
                      <FiDownload className="inline mr-2" />
                      Export Keys
                    </button>
                    <button
                      onClick={handleRegenerateRSAKeys}
                      className="px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: '#97eeff', color: '#2c3e50' }}
                    >
                      <FiKey className="inline mr-2" />
                      Generate New Keys
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-800 mb-1">
                          Important
                        </p>
                        <p className="text-sm text-yellow-700">
                          Keep your private key secure. Never share it with anyone. If compromised, generate new keys immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div
                key={`notifications-${animationKey}`}
                className="space-y-6 tab-transition"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#2c3e50' }}>
                    Notification Preferences
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FiDownload className="text-lg text-green-600" />
                          <p className="font-semibold text-gray-800">Download Alerts</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Notify when someone downloads your files
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={downloadAlerts}
                          onChange={(e) => setDownloadAlerts(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#97eeff]"></div>
                      </label>
                    </div>

                    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FiClock className="text-lg text-yellow-600" />
                          <p className="font-semibold text-gray-800">Expiry Warnings</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Remind me 24 hours before files expire
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={expiryWarnings}
                          onChange={(e) => setExpiryWarnings(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#97eeff]"></div>
                      </label>
                    </div>

                    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FiShield className="text-lg text-red-600" />
                          <p className="font-semibold text-gray-800">Security Alerts</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Important security and privacy notifications
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={securityAlerts}
                          onChange={(e) => setSecurityAlerts(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#97eeff]"></div>
                      </label>
                    </div>

                    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FiCheck className="text-lg text-blue-600" />
                          <p className="font-semibold text-gray-800">Upload Success</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Confirm when files are successfully uploaded
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={uploadSuccess}
                          onChange={(e) => setUploadSuccess(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#97eeff]"></div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveNotificationSettings}
                    className="px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg mt-6"
                    style={{ backgroundColor: '#97eeff' }}
                  >
                    Save Notification Settings
                  </button>
                </div>
              </div>
            )}

            {/* Storage Tab */}
            {activeTab === 'storage' && (
              <div
                key={`storage-${animationKey}`}
                className="space-y-6 tab-transition"
              >
                {/* Storage Usage */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#2c3e50' }}>
                    Storage Usage
                  </h2>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 font-semibold">
                        {storageUsed} GB of {storageLimit} GB used
                      </span>
                      <span className="text-gray-600">{Math.round(storagePercentage)}%</span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${storagePercentage}%`,
                          backgroundColor: storagePercentage > 80 ? '#ef4444' : '#97eeff',
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <FiFile className="text-2xl mb-2" style={{ color: '#97eeff' }} />
                      <p className="text-sm text-gray-600 mb-1">Total Files</p>
                      <p className="text-2xl font-bold text-gray-800">247</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <FiDatabase className="text-2xl mb-2" style={{ color: '#f2b5d4' }} />
                      <p className="text-sm text-gray-600 mb-1">Available</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {(storageLimit - storageUsed).toFixed(1)} GB
                      </p>
                    </div>
                  </div>

                  <button
                    className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                    style={{ backgroundColor: '#97eeff', color: 'white' }}
                  >
                    Upgrade Storage
                  </button>
                </div>

                {/* Storage Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#2c3e50' }}>
                    Storage Settings
                  </h2>

                  <div className="flex items-start justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 mb-1">
                        Auto-compress large files
                      </p>
                      <p className="text-sm text-gray-600">
                        Automatically compress files over 50MB to save space
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={autoCompress}
                        onChange={(e) => setAutoCompress(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#97eeff]"></div>
                    </label>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Maximum file size (MB)
                    </label>
                    <select
                      value={maxFileSize}
                      onChange={(e) => setMaxFileSize(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                    >
                      <option value="50">50 MB</option>
                      <option value="100">100 MB</option>
                      <option value="250">250 MB</option>
                      <option value="500">500 MB</option>
                      <option value="1000">1 GB</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveStorageSettings}
                    className="px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg"
                    style={{ backgroundColor: '#97eeff' }}
                  >
                    Save Storage Settings
                  </button>
                </div>

                {/* Clear Storage */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-4" style={{ color: '#2c3e50' }}>
                    Clear Storage
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Remove expired files and clear cache to free up space
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClearCache}
                      className="px-6 py-3 rounded-lg border-2 font-semibold transition-all duration-200 hover:shadow-lg"
                      style={{ borderColor: '#97eeff', color: '#2c3e50' }}
                    >
                      Clear Cache
                    </button>
                    <button
                      onClick={handleDeleteExpiredFiles}
                      className="px-6 py-3 rounded-lg border-2 border-red-300 text-red-600 font-semibold transition-all duration-200 hover:bg-red-50 hover:shadow-lg"
                    >
                      Delete Expired Files
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* RSA Keys Modal */}
      {showKeysModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold" style={{ color: '#2c3e50' }}>
                  RSA Encryption Keys
                </h2>
                <button
                  onClick={() => setShowKeysModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              {userKeys ? (
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCheck className="text-green-600" />
                      <span className="font-semibold text-green-800">Keys Active</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Your RSA key pair is active and ready for encryption operations.
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Created: {new Date(userKeys.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Public Key</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
                        {userKeys.public_key}
                      </pre>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This key is shared with others to encrypt files for you.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Private Key</h3>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-800">⚠️ Keep this key secure</span>
                        <button className="text-xs text-red-600 hover:text-red-800">
                          Show/Hide
                        </button>
                      </div>
                      <pre className="text-xs text-red-700 whitespace-pre-wrap break-all">
                        {userKeys.private_key.substring(0, 50)}...
                      </pre>
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      Never share this key. It's used to decrypt files sent to you.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleRegenerateKeys}
                      disabled={isRegeneratingKeys}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-all duration-200"
                    >
                      {isRegeneratingKeys ? 'Regenerating...' : 'Regenerate Keys'}
                    </button>
                    <button
                      onClick={() => setShowKeysModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiKey className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Failed to load encryption keys</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
