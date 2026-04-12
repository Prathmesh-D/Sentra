import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiAlertTriangle,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiShield,
  FiSun,
  FiUser,
} from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import {
  settingsService,
  type AutoLockTimeout,
  type DensityOption,
  type FontScaleOption,
  type LastLoginResponse,
  type SessionInfo,
  type SessionTimeout,
  type StatusBadgeStyle,
} from '@/api/settingsService'
import { useDemoGuard } from '@/hooks/use-demo-guard'
import { updateDemoSession } from '@/lib/demoSession'

type SettingsTab = 'account' | 'appearance' | 'security' | 'danger'

type SettingsProfile = {
  id?: string
  name?: string
  createdAt?: string
  created_at?: string
  lastPasswordChangedAt?: string | null
  emailChangePending?: string | null
  isPublic?: boolean
  full_name: string
  username: string
  email: string
  bio: string
  avatar_url?: string
  is_public?: boolean
  password_changed_at?: string
  preferences?: {
    density?: DensityOption
    language?: string
    fontScale?: FontScaleOption
    reduceMotion?: boolean
    statusBadgeStyle?: StatusBadgeStyle
    rowStriping?: boolean
  }
  security?: {
    autoLockTimeout?: AutoLockTimeout
    sessionTimeout?: SessionTimeout
  }
}

type FieldErrors = Record<string, string>

const SETTINGS_TAB_KEY = 'sentra-settings-tab'
const DENSITY_KEY = 'sentra-density'
const FONT_SCALE_KEY = 'sentra-font-scale'
const REDUCE_MOTION_KEY = 'sentra-reduce-motion'
const STATUS_BADGE_STYLE_KEY = 'sentra-status-badge-style'
const ROW_STRIPING_KEY = 'sentra-row-striping'
const FONT_SCALE_TRANSITION_CLASS = 'font-scale-transition'

let fontScaleTransitionTimer: number | null = null

// Shared Settings visual language tokens (reused by Account now, and ready for other tabs).
const SETTINGS_UI = {
  sectionCard: 'rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900',
  sectionTitle: 'text-lg font-bold text-[#2c3e50] dark:text-slate-100',
  sectionSubtle: 'text-sm text-gray-600 dark:text-slate-400',
  fieldLabel: 'text-sm font-semibold text-gray-700 dark:text-slate-300',
  inputBase:
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#005abd]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-[#388bff]/30',
  primaryButton:
    'rounded-lg bg-[#005abd] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004b9f] disabled:cursor-not-allowed disabled:opacity-70',
  subtleButton:
    'rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  linkButton: 'text-xs font-semibold text-[#005abd] underline dark:text-[#60a5fa]',
  dangerButtonSmall:
    'rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40',
}

function safeMessage(error: unknown): string {
  const maybeAxios = error as {
    response?: { status?: number; data?: { error?: string; field?: string } }
    message?: string
  }

  const status = maybeAxios.response?.status
  if (status === 409) return 'This value is already used by another account.'
  if (status === 500) return 'Server error. Please try again in a moment.'
  if (status === 401) return 'Session expired. Please login again.'
  if (!maybeAxios.response && maybeAxios.message) {
    return 'Something went wrong. Please check your connection and try again.'
  }
  return maybeAxios.response?.data?.error || maybeAxios.message || 'Something went wrong. Please try again.'
}

function validateDisplayName(value: string): string {
  if (!value.trim()) return 'Display name is required.'
  if (!/^[A-Za-z\s-]{2,50}$/.test(value.trim())) return 'Use 2-50 letters, spaces, or hyphens.'
  return ''
}

function validateUsername(value: string): string {
  if (!value.trim()) return 'Username is required.'
  if (!/^[a-z0-9_]{3,20}$/.test(value.trim())) return 'Use 3-20 lowercase letters, numbers, or underscores.'
  return ''
}

function validateEmail(value: string): string {
  if (!value.trim()) return 'Email is required.'
  if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(value.trim())) return 'Please enter a valid email address.'
  return ''
}

function validateBio(value: string): string {
  if (value.length > 200) return 'Bio must be at most 200 characters.'
  return ''
}

function validateStrongPassword(value: string): string {
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter.'
  if (!/[0-9]/.test(value)) return 'Include at least one number.'
  if (!/[^A-Za-z0-9]/.test(value)) return 'Include at least one special character.'
  return ''
}

function passwordStrength(value: string): { score: number; label: string } {
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/[0-9]/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'
  return { score, label }
}

function applyDensity(density: DensityOption): DensityOption {
  const root = document.documentElement
  const previous = (localStorage.getItem(DENSITY_KEY) as DensityOption) || 'comfortable'
  root.setAttribute('data-density', density)
  localStorage.setItem(DENSITY_KEY, density)
  return previous
}

function applyFontScale(scale: FontScaleOption): FontScaleOption {
  const root = document.documentElement
  const previous = (localStorage.getItem(FONT_SCALE_KEY) as FontScaleOption) || 'default'
  const nextSize = scale === 'small' ? '14px' : scale === 'large' ? '18px' : '16px'

  // Add a short-lived class so global typography eases between scale changes.
  if (!root.classList.contains('reduce-motion')) {
    root.classList.add(FONT_SCALE_TRANSITION_CLASS)
    if (fontScaleTransitionTimer) {
      window.clearTimeout(fontScaleTransitionTimer)
    }
    fontScaleTransitionTimer = window.setTimeout(() => {
      root.classList.remove(FONT_SCALE_TRANSITION_CLASS)
      fontScaleTransitionTimer = null
    }, 240)
  }

  root.style.fontSize = nextSize
  localStorage.setItem(FONT_SCALE_KEY, scale)
  return previous
}

function applyReducedMotion(enabled: boolean): boolean {
  const root = document.documentElement
  const previous = localStorage.getItem(REDUCE_MOTION_KEY) === '1'
  root.classList.toggle('reduce-motion', enabled)
  localStorage.setItem(REDUCE_MOTION_KEY, enabled ? '1' : '0')
  return previous
}

function applyStatusBadgeStyle(style: StatusBadgeStyle): StatusBadgeStyle {
  const root = document.documentElement
  const previous = (localStorage.getItem(STATUS_BADGE_STYLE_KEY) as StatusBadgeStyle) || 'filled'
  root.setAttribute('data-status-badge-style', style)
  localStorage.setItem(STATUS_BADGE_STYLE_KEY, style)
  return previous
}

function applyRowStriping(enabled: boolean): boolean {
  const root = document.documentElement
  const previous = localStorage.getItem(ROW_STRIPING_KEY) === '1'
  root.setAttribute('data-row-striping', enabled ? 'on' : 'off')
  localStorage.setItem(ROW_STRIPING_KEY, enabled ? '1' : '0')
  return previous
}

function densityClass(density: DensityOption) {
  if (density === 'compact') return 'space-y-4'
  if (density === 'spacious') return 'space-y-8'
  return 'space-y-6'
}

function formatTime(iso?: string | null): string {
  if (!iso) return 'Unavailable'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return 'Unavailable'
  return parsed.toLocaleString()
}

function firstNonEmptyString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return undefined
}

function normalizeSessionInfo(raw: any): SessionInfo {
  return {
    id: firstNonEmptyString(raw?.id, raw?.session_id, raw?.sessionId, raw?._id) || 'unknown-session',
    device: firstNonEmptyString(raw?.device, raw?.deviceName, raw?.client, raw?.platform) || 'Unknown Device',
    browser: firstNonEmptyString(raw?.browser, raw?.userAgentBrowser) || 'Unknown',
    os: firstNonEmptyString(raw?.os, raw?.operatingSystem) || 'Unknown',
    deviceType: firstNonEmptyString(raw?.deviceType, raw?.device_type, raw?.type) || 'desktop',
    ip: firstNonEmptyString(raw?.ip, raw?.ipAddress, raw?.remoteAddr) || '0.0.0.0',
    location: firstNonEmptyString(raw?.location, raw?.geo, raw?.country) || 'Unknown',
    lastActive: firstNonEmptyString(raw?.lastActive, raw?.last_active, raw?.updatedAt, raw?.timestamp) || '',
    isCurrent: Boolean(raw?.isCurrent ?? raw?.is_current ?? raw?.current),
  }
}

function normalizeLastLoginResponse(raw: any, sessions: SessionInfo[]): LastLoginResponse {
  const currentSession = sessions.find((session) => session.isCurrent)
  const newestSession = [...sessions].sort((a, b) => {
    const aTs = a.lastActive ? new Date(a.lastActive).getTime() : 0
    const bTs = b.lastActive ? new Date(b.lastActive).getTime() : 0
    return bTs - aTs
  })[0]

  return {
    timestamp: firstNonEmptyString(raw?.timestamp, raw?.lastLogin, raw?.last_login, currentSession?.lastActive, newestSession?.lastActive) || null,
    device: firstNonEmptyString(raw?.device, raw?.deviceName, currentSession?.device, newestSession?.device) || 'Unknown Device',
    browser: firstNonEmptyString(raw?.browser, raw?.userAgentBrowser, currentSession?.browser, newestSession?.browser) || 'Unknown',
    location: firstNonEmptyString(raw?.location, currentSession?.location, newestSession?.location) || null,
  }
}

function hasValidSessionIdentity(session: SessionInfo): boolean {
  const device = firstNonEmptyString(session.device)
  const browser = firstNonEmptyString(session.browser)
  if (!device || !browser) return false
  const invalidTokens = new Set(['unknown', 'unknown device', 'n/a', 'na'])
  return !invalidTokens.has(device.toLowerCase()) && !invalidTokens.has(browser.toLowerCase())
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-500 animate-in fade-in duration-200">{message}</p>
}

function InlineSuccess({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-2 inline-flex items-center gap-2 text-xs text-green-600 animate-in fade-in slide-in-from-top-1 duration-200">
      <FiCheck /> {message}
    </p>
  )
}

function SuccessTickPanel({
  title,
  subtitle,
  fading,
}: {
  title: string
  subtitle: string
  fading?: boolean
}) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-10 shadow-sm animate-in fade-in duration-300 dark:border-slate-700 dark:bg-slate-900 ${fading ? 'encrypt-success-fade-out' : ''}`}>
      <div className="flex flex-col items-center justify-center text-center gap-3">
        <div className="encrypt-success-icon">
          <svg className="w-20 h-20" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="encrypt-success-circle" cx="28" cy="28" r="26" stroke="#22c55e" strokeWidth="3" fill="none" />
            <path className="encrypt-success-check" d="M17 28l7 7 15-15" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-gray-600 mt-1 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

function fieldClass(error?: string, isValid?: boolean) {
  if (error) {
    return 'border-red-300 bg-red-50/40 text-red-900 placeholder:text-red-300 focus:border-red-400 focus:ring-red-200 dark:border-red-700 dark:bg-red-950/30 dark:text-red-200 dark:placeholder:text-red-500'
  }
  if (isValid) {
    return 'border-green-300 bg-green-50/30 text-gray-900 focus:border-green-400 focus:ring-green-200 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-slate-100'
  }
  return 'border-gray-300 text-gray-900 focus:border-[#005abd] focus:ring-[#005abd]/20 dark:border-slate-600 dark:text-slate-100 dark:focus:border-[#60a5fa] dark:focus:ring-[#60a5fa]/30'
}

function PasswordInput({
  label,
  value,
  setValue,
  shown,
  setShown,
  disabled,
  onBlur,
  error,
  isValid,
}: {
  label: string
  value: string
  setValue: (v: string) => void
  shown: boolean
  setShown: (v: boolean) => void
  disabled: boolean
  onBlur: () => void
  error?: string
  isValid?: boolean
}) {
  return (
    <div>
      <label className={SETTINGS_UI.fieldLabel}>{label}</label>
      <div className="relative mt-1">
        <input
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={`w-full ${SETTINGS_UI.inputBase} pr-11 disabled:opacity-60 ${fieldClass(error, isValid)}`}
        />
        <button
          type="button"
          onClick={() => setShown(!shown)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {shown ? <FiEyeOff /> : <FiEye />}
        </button>
        {!error && isValid ? <FiCheck className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 text-green-600" /> : null}
      </div>
      <InlineError message={error} />
    </div>
  )
}

function AccountTab({
  model,
  refreshModel,
}: {
  model: SettingsProfile | null
  refreshModel: () => Promise<void>
}) {
  const { updateUser, isDemo } = useAuth()
  const { triggerDemoBlock } = useDemoGuard()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [original, setOriginal] = useState({ displayName: '', username: '', bio: '', avatarUrl: null as string | null, isPublic: false })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [avatarHint, setAvatarHint] = useState('')

  const [profileErrors, setProfileErrors] = useState<FieldErrors>({})
  const [profileTouched, setProfileTouched] = useState({ name: false, username: false, bio: false })
  const [profileError, setProfileError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'unchanged' | 'invalid'>('idle')
  const usernameDebounceRef = useRef<number | null>(null)

  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailShowPassword, setEmailShowPassword] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [devToken, setDevToken] = useState('')
  const [emailErrors, setEmailErrors] = useState<FieldErrors>({})
  const [emailTouched, setEmailTouched] = useState({ newEmail: false, emailPassword: false })
  const [emailError, setEmailError] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [confirmingEmail, setConfirmingEmail] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({})
  const [passwordTouched, setPasswordTouched] = useState({ currentPassword: false, newPassword: false, confirmPassword: false })
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null)

  const [successCard, setSuccessCard] = useState<{
    section: 'profile' | 'email' | 'password' | null
    title: string
    subtitle: string
    fading: boolean
  }>({ section: null, title: '', subtitle: '', fading: false })

  const [shakeProfile, setShakeProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!model) return
    const nextName = model.name || model.full_name || ''
    const nextUsername = model.username || ''
    const nextBio = model.bio || ''
    const nextAvatar = model.avatar_url || null
    const nextPublic = typeof model.isPublic === 'boolean' ? model.isPublic : (model.is_public ?? false)

    setDisplayName(nextName)
    setUsername(nextUsername)
    setBio(nextBio)
    setAvatarUrl(nextAvatar)
    setIsPublic(nextPublic)
    setOriginal({ displayName: nextName, username: nextUsername, bio: nextBio, avatarUrl: nextAvatar, isPublic: nextPublic })
    setLastChangedAt(model.lastPasswordChangedAt || model.password_changed_at || null)
    setPendingEmail(model.emailChangePending || null)
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarRemoved(false)
    setProfileTouched({ name: false, username: false, bio: false })
    setEmailTouched({ newEmail: false, emailPassword: false })
    setPasswordTouched({ currentPassword: false, newPassword: false, confirmPassword: false })
  }, [model])

  useEffect(() => {
    if (!countdown) return
    const t = window.setTimeout(() => setCountdown((v) => Math.max(v - 1, 0)), 1000)
    return () => window.clearTimeout(t)
  }, [countdown])

  useEffect(() => {
    if (!successCard.section) return

    const startFade = window.setTimeout(() => {
      setSuccessCard((prev) => {
        if (!prev.section) return prev
        return { ...prev, fading: true }
      })
    }, 1200)

    const clearPanel = window.setTimeout(() => {
      setSuccessCard({ section: null, title: '', subtitle: '', fading: false })
    }, 1550)

    return () => {
      window.clearTimeout(startFade)
      window.clearTimeout(clearPanel)
    }
  }, [successCard.section])

  const showSuccessCard = (
    section: 'profile' | 'email' | 'password',
    title: string,
    subtitle: string,
  ) => {
    setSuccessCard({ section, title, subtitle, fading: false })
  }

  useEffect(() => {
    const normalized = username.trim().toLowerCase()
    if (username !== normalized) {
      setUsername(normalized)
      return
    }

    const usernameValidation = validateUsername(username)
    if (usernameValidation) {
      setUsernameStatus('invalid')
      return
    }
    if (!model?.username || normalized === model.username) {
      setUsernameStatus('unchanged')
      return
    }

    if (usernameDebounceRef.current) {
      window.clearTimeout(usernameDebounceRef.current)
    }

    usernameDebounceRef.current = window.setTimeout(async () => {
      if (isDemo) {
        setUsernameStatus('available')
        return
      }
      try {
        setUsernameStatus('checking')
        const response = await settingsService.checkUsernameAvailability(normalized)
        setUsernameStatus(response.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)

    return () => {
      if (usernameDebounceRef.current) {
        window.clearTimeout(usernameDebounceRef.current)
      }
    }
  }, [username, model?.username, isDemo])

  const avatarDisplay = avatarRemoved ? null : (avatarPreview || avatarUrl)
  const initials = useMemo(() => {
    const source = (displayName || username || 'U').trim()
    return source.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U'
  }, [displayName, username])

  const profileDirty = useMemo(() => {
    return (
      displayName !== original.displayName ||
      username !== original.username ||
      bio !== original.bio ||
      isPublic !== original.isPublic ||
      avatarRemoved ||
      !!avatarFile
    )
  }, [displayName, username, bio, isPublic, original, avatarRemoved, avatarFile])

  const strength = passwordStrength(newPassword)
  const passwordValid = !validateStrongPassword(newPassword) && confirmPassword === newPassword && !!currentPassword
  const emailValid = !validateEmail(newEmail) && newEmail.toLowerCase() !== (model?.email || '').toLowerCase() && !!emailPassword

  const humanizeLastChanged = (iso?: string | null) => {
    if (!iso) return 'Password has never been changed'
    const dt = new Date(iso)
    if (Number.isNaN(dt.getTime())) return 'Password has never been changed'
    const days = Math.max(0, Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24)))
    return `Last password change: ${days} day${days === 1 ? '' : 's'} ago`
  }

  const mapErrors = (payload: any, setFieldErrors: (next: FieldErrors) => void, setSection: (value: string) => void) => {
    const incomingErrors = payload?.response?.data?.errors
    if (incomingErrors && typeof incomingErrors === 'object') {
      setFieldErrors(incomingErrors as FieldErrors)
      return
    }
    setSection(safeMessage(payload))
  }

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

  const validateProfile = (): FieldErrors => ({
    name: validateDisplayName(displayName),
    username: validateUsername(username),
    bio: validateBio(bio),
  })

  const onAvatarFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setProfileErrors((prev) => ({ ...prev, avatar: 'Only JPG, PNG, and WEBP are supported.' }))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileErrors((prev) => ({ ...prev, avatar: 'Avatar must be 2MB or smaller.' }))
      return
    }
    setProfileErrors((prev) => ({ ...prev, avatar: '' }))
    setAvatarFile(file)
    setAvatarRemoved(false)
    setAvatarHint('New photo selected')
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const syncUserEverywhere = (userObj: any) => {
    updateUser({
      username: userObj.username,
      email: userObj.email,
      full_name: userObj.name,
      bio: userObj.bio,
      avatar_url: userObj.avatarUrl || undefined,
      is_public: userObj.isPublic,
      password_changed_at: userObj.lastPasswordChangedAt || undefined,
    })
  }

  const onSaveProfile = async () => {
    setProfileError('')
    const validation = validateProfile()
    setProfileErrors((prev) => ({ ...prev, ...validation }))
    if (Object.values(validation).some(Boolean) || usernameStatus === 'taken' || usernameStatus === 'checking') {
      setShakeProfile(true)
      window.setTimeout(() => setShakeProfile(false), 450)
      return
    }

    try {
      setSavingProfile(true)
      let nextAvatarUrl = avatarUrl

      if (isDemo) {
        if (avatarFile) {
          nextAvatarUrl = await toBase64(avatarFile)
        }
        if (avatarRemoved) {
          nextAvatarUrl = null
        }

        const demoUser = {
          id: model?.id || 'demo-user',
          name: displayName,
          username,
          email: model?.email || '',
          bio,
          avatarUrl: nextAvatarUrl,
          isPublic,
          lastPasswordChangedAt: lastChangedAt,
          createdAt: model?.createdAt || model?.created_at,
        }
        updateDemoSession((current) => ({
          ...current,
          user: {
            ...current.user,
            username: demoUser.username,
            full_name: demoUser.name,
            email: demoUser.email,
            bio: demoUser.bio,
            avatar_url: demoUser.avatarUrl || '',
            is_public: demoUser.isPublic,
            password_changed_at: demoUser.lastPasswordChangedAt || null,
          },
        }))
        syncUserEverywhere(demoUser)
        setOriginal({ displayName, username, bio, avatarUrl: nextAvatarUrl, isPublic })
        setAvatarUrl(nextAvatarUrl)
        setAvatarFile(null)
        setAvatarHint('')
        setAvatarRemoved(false)
        showSuccessCard('profile', 'Profile Updated', 'Your profile changes were saved successfully.')
        return
      }

      if (avatarFile) {
        const payload = await toBase64(avatarFile)
        const avatarResponse = await settingsService.uploadAvatar({ avatarBase64: payload, mimeType: avatarFile.type })
        nextAvatarUrl = avatarResponse.avatarUrl
      } else if (avatarRemoved) {
        await settingsService.deleteAvatar()
        nextAvatarUrl = null
      }

      const response = await settingsService.updateProfile({
        name: displayName,
        username,
        bio,
        isPublic,
      })
      const returnedUser = response?.user || response
      syncUserEverywhere(returnedUser)
      setOriginal({ displayName, username, bio, avatarUrl: returnedUser.avatarUrl || null, isPublic: returnedUser.isPublic })
      setAvatarUrl(returnedUser.avatarUrl || null)
      setAvatarFile(null)
      setAvatarHint('')
      setAvatarRemoved(false)
      showSuccessCard('profile', 'Profile Updated', 'Your profile changes were saved successfully.')
      await refreshModel()
    } catch (error) {
      mapErrors(error, (next) => setProfileErrors((prev) => ({ ...prev, ...next })), setProfileError)
    } finally {
      setSavingProfile(false)
    }
  }

  const onRequestEmailChange = async () => {
    if (isDemo) {
      triggerDemoBlock()
      return
    }
    const nextErrors: FieldErrors = {}
    const emailValidation = validateEmail(newEmail)
    if (emailValidation) nextErrors.newEmail = emailValidation
    if ((model?.email || '').toLowerCase() === newEmail.trim().toLowerCase()) nextErrors.newEmail = 'New email must be different from current email.'
    if (!emailPassword) nextErrors.emailPassword = 'Current password is required.'
    setEmailErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    try {
      setSendingEmail(true)
      setEmailError('')
      const response = await settingsService.requestEmailChange({ newEmail: newEmail.trim(), currentPassword: emailPassword })
      setPendingEmail(newEmail.trim())
      setCountdown(60)
      setDevToken(response?.devToken || '')
      showSuccessCard('email', 'Email Update Started', 'Verification was sent to your new email.')
    } catch (error) {
      mapErrors(error, setEmailErrors, setEmailError)
    } finally {
      setSendingEmail(false)
    }
  }

  const onCancelEmailChange = async () => {
    try {
      if (!isDemo) {
        await settingsService.cancelEmailChange()
      }
      setPendingEmail(null)
      setDevToken('')
      setNewEmail('')
      setEmailPassword('')
      setCountdown(0)
      setEmailErrors({})
      setEmailError('')
    } catch {
      setEmailError('Something went wrong. Please try again.')
    }
  }

  const onConfirmToken = async () => {
    if (!devToken) return
    try {
      setConfirmingEmail(true)
      setEmailError('')
      const response = await settingsService.confirmEmailChange(devToken)
      updateUser({ email: response.newEmail })
      setPendingEmail(null)
      setDevToken('')
      setNewEmail('')
      setEmailPassword('')
      setCountdown(0)
      showSuccessCard('email', 'Email Updated', 'Your account email has been updated successfully.')
      await refreshModel()
    } catch (error) {
      setEmailError(safeMessage(error))
    } finally {
      setConfirmingEmail(false)
    }
  }

  const onUpdatePassword = async () => {
    if (isDemo) {
      triggerDemoBlock()
      return
    }
    const nextErrors: FieldErrors = {}
    if (!currentPassword) nextErrors.currentPassword = 'Current password is required.'
    const strengthError = validateStrongPassword(newPassword)
    if (strengthError) nextErrors.newPassword = strengthError
    if (newPassword === currentPassword && newPassword) nextErrors.newPassword = 'New password must be different from current password.'
    if (confirmPassword !== newPassword) nextErrors.confirmPassword = 'Passwords do not match'
    setPasswordErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    try {
      setSavingPassword(true)
      setPasswordError('')
      const response = await settingsService.updatePassword({ currentPassword, newPassword, confirmNewPassword: confirmPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setLastChangedAt(response?.lastPasswordChangedAt || new Date().toISOString())
      updateUser({ password_changed_at: response?.lastPasswordChangedAt || new Date().toISOString() })
      showSuccessCard('password', 'Password Updated', 'Your password was changed successfully.')
    } catch (error) {
      mapErrors(error, setPasswordErrors, setPasswordError)
    } finally {
      setSavingPassword(false)
    }
  }

  const disableProfileSave = !profileDirty || savingProfile || usernameStatus === 'checking' || usernameStatus === 'taken' || Object.values(validateProfile()).some(Boolean)

  return (
    <div className="space-y-6">
      <section className={`${SETTINGS_UI.sectionCard} animate-in fade-in slide-in-from-bottom-1 duration-200 ${shakeProfile ? 'animate-shake' : ''}`}>
        <h2 className={SETTINGS_UI.sectionTitle}>Profile Information</h2>
        <p className={`mt-1 ${SETTINGS_UI.sectionSubtle}`}>Keep your identity details current and easy to recognize.</p>
        {successCard.section === 'profile' ? (
          <div className="mt-5">
            <SuccessTickPanel title={successCard.title} subtitle={successCard.subtitle} fading={successCard.fading} />
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex flex-col items-center md:w-80">
            <div className="relative h-72 w-72 overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-[#b2f7ef] to-[#97eeff] dark:border-slate-600 dark:from-slate-700 dark:to-slate-600">
              {avatarDisplay ? (
                <img src={avatarDisplay} alt="Avatar" className="h-full w-full object-cover transition-opacity duration-200" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-[#084d45] dark:text-slate-100">{initials}</div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatarFileSelected} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className={`mt-3 ${SETTINGS_UI.subtleButton}`}>Change photo</button>
            {(avatarUrl || avatarPreview) && !avatarRemoved ? (
              <button
                type="button"
                onClick={() => {
                  setAvatarRemoved(true)
                  setAvatarFile(null)
                  setAvatarPreview(null)
                }}
                className={`mt-2 ${SETTINGS_UI.dangerButtonSmall}`}
              >
                Remove photo
              </button>
            ) : null}
            {avatarHint ? <p className="mt-2 text-xs text-green-600">{avatarHint}</p> : null}
            <InlineError message={profileErrors.avatar} />
          </div>

          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <div>
              <label className={SETTINGS_UI.fieldLabel}>Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => {
                  setProfileTouched((prev) => ({ ...prev, name: true }))
                  setProfileErrors((prev) => ({ ...prev, name: validateDisplayName(displayName) }))
                }}
                className={`mt-1 w-full ${SETTINGS_UI.inputBase} ${fieldClass(profileErrors.name, profileTouched.name && !!displayName && !profileErrors.name)}`}
              />
              <InlineError message={profileErrors.name} />
            </div>
            <div>
              <label className={SETTINGS_UI.fieldLabel}>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                onBlur={() => {
                  setProfileTouched((prev) => ({ ...prev, username: true }))
                  setProfileErrors((prev) => ({ ...prev, username: validateUsername(username) }))
                }}
                className={`mt-1 w-full ${SETTINGS_UI.inputBase} ${fieldClass(profileErrors.username, profileTouched.username && usernameStatus === 'available')}`}
              />
              <InlineError message={profileErrors.username} />
              <div className="mt-1 text-xs transition-opacity duration-150">
                {usernameStatus === 'checking' ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-slate-700 dark:text-slate-300">Checking...</span> : null}
                {usernameStatus === 'available' ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">✓ Available</span> : null}
                {usernameStatus === 'taken' ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">✗ Already taken</span> : null}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={SETTINGS_UI.fieldLabel}>Bio</label>
              <textarea
                value={bio}
                rows={3}
                onChange={(e) => setBio(e.target.value)}
                onBlur={() => {
                  setProfileTouched((prev) => ({ ...prev, bio: true }))
                  setProfileErrors((prev) => ({ ...prev, bio: validateBio(bio) }))
                }}
                className={`mt-1 w-full resize-none ${SETTINGS_UI.inputBase} ${fieldClass(profileErrors.bio, profileTouched.bio && bio.length > 0 && !profileErrors.bio)}`}
              />
              <div className={`mt-1 text-right text-xs transition-colors duration-200 ${bio.length >= 190 ? 'text-red-500' : bio.length >= 160 ? 'text-amber-500' : 'text-gray-500'}`}>
                {bio.length} / 200
              </div>
              <InlineError message={profileErrors.bio} />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={onSaveProfile}
                disabled={disableProfileSave}
                className={SETTINGS_UI.primaryButton}
              >
                {savingProfile ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving profile...</span>
                ) : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
        )}
        <InlineError message={profileError} />
      </section>

      <section className={`${SETTINGS_UI.sectionCard} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
        <h2 className={SETTINGS_UI.sectionTitle}>Email Address</h2>
        <p className={`mt-1 ${SETTINGS_UI.sectionSubtle}`}>Update your login email with verification for safety.</p>
        {successCard.section === 'email' ? (
          <div className="mt-5">
            <SuccessTickPanel title={successCard.title} subtitle={successCard.subtitle} fading={successCard.fading} />
          </div>
        ) : !pendingEmail ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className={SETTINGS_UI.fieldLabel}>Current email</label>
              <div className="relative">
                <input readOnly value={model?.email || ''} className={`mt-1 w-full ${SETTINGS_UI.inputBase} border-gray-300 bg-gray-50 text-gray-600 pr-10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300`} />
                <FiLock className="absolute right-3 top-3 text-gray-400 dark:text-slate-500" />
              </div>
            </div>
            <div>
              <label className={SETTINGS_UI.fieldLabel}>New email</label>
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onBlur={() => {
                  setEmailTouched((prev) => ({ ...prev, newEmail: true }))
                  setEmailErrors((prev) => ({ ...prev, newEmail: validateEmail(newEmail) }))
                }}
                className={`mt-1 w-full ${SETTINGS_UI.inputBase} ${fieldClass(emailErrors.newEmail, emailTouched.newEmail && !!newEmail && !emailErrors.newEmail)}`}
              />
              <InlineError message={emailErrors.newEmail} />
            </div>
            <div className="md:col-span-2">
              <label className={SETTINGS_UI.fieldLabel}>Current password</label>
              <div className="relative mt-1">
                <input
                  type={emailShowPassword ? 'text' : 'password'}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  onBlur={() => {
                    setEmailTouched((prev) => ({ ...prev, emailPassword: true }))
                    setEmailErrors((prev) => ({ ...prev, emailPassword: emailPassword ? '' : 'Current password is required.' }))
                  }}
                  className={`w-full ${SETTINGS_UI.inputBase} pr-10 ${fieldClass(emailErrors.emailPassword, emailTouched.emailPassword && !!emailPassword && !emailErrors.emailPassword)}`}
                />
                <button type="button" className="absolute right-3 top-2.5 text-gray-500 dark:text-slate-400" onClick={() => setEmailShowPassword((v) => !v)}>{emailShowPassword ? <FiEyeOff /> : <FiEye />}</button>
              </div>
              <InlineError message={emailErrors.emailPassword} />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={onRequestEmailChange}
                disabled={!emailValid || sendingEmail}
                className={SETTINGS_UI.primaryButton}
              >
                {sendingEmail ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Sending verification...</span> : 'Update Email'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3 overflow-hidden rounded-lg border border-green-200 bg-green-50 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-sm font-semibold text-green-700">✓ Verification email sent to {pendingEmail}</p>
            <p className="text-xs text-green-700">Click the link in the email to confirm your new address</p>
            {countdown > 0 ? (
              <p className="text-xs text-gray-600 dark:text-slate-400">Resend available in 0:{String(countdown).padStart(2, '0')}</p>
            ) : (
              <button type="button" onClick={onRequestEmailChange} className={SETTINGS_UI.linkButton}>Didn't receive it? Resend verification email</button>
            )}
            <button type="button" onClick={onCancelEmailChange} className={SETTINGS_UI.dangerButtonSmall}>Cancel email change</button>
            {devToken ? (
              <div className="rounded border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700">Dev mode: Confirm token → {devToken}</p>
                <button type="button" onClick={onConfirmToken} disabled={confirmingEmail} className={`mt-2 ${SETTINGS_UI.primaryButton}`}>{confirmingEmail ? 'Confirming...' : 'Confirm Now'}</button>
              </div>
            ) : null}
          </div>
        )}
        <InlineError message={emailError} />
      </section>

      <section className={`${SETTINGS_UI.sectionCard} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
        <h2 className={SETTINGS_UI.sectionTitle}>Change Password</h2>
        <p className={`mt-1 ${SETTINGS_UI.sectionSubtle}`}>Use a strong password to keep your account secure.</p>
        {successCard.section === 'password' ? (
          <div className="mt-5">
            <SuccessTickPanel title={successCard.title} subtitle={successCard.subtitle} fading={successCard.fading} />
          </div>
        ) : (
        <div className="mt-4 grid gap-4">
          <PasswordInput
            label="Current Password"
            value={currentPassword}
            setValue={setCurrentPassword}
            shown={showCurrent}
            setShown={setShowCurrent}
            disabled={savingPassword}
            onBlur={() => {
              setPasswordTouched((prev) => ({ ...prev, currentPassword: true }))
              setPasswordErrors((prev) => ({ ...prev, currentPassword: currentPassword ? '' : 'Current password is required.' }))
            }}
            error={passwordErrors.currentPassword}
            isValid={passwordTouched.currentPassword && !!currentPassword && !passwordErrors.currentPassword}
          />
          <PasswordInput
            label="New Password"
            value={newPassword}
            setValue={setNewPassword}
            shown={showNew}
            setShown={setShowNew}
            disabled={savingPassword}
            onBlur={() => {
              setPasswordTouched((prev) => ({ ...prev, newPassword: true }))
              setPasswordErrors((prev) => ({ ...prev, newPassword: validateStrongPassword(newPassword) }))
            }}
            error={passwordErrors.newPassword}
            isValid={passwordTouched.newPassword && !!newPassword && !passwordErrors.newPassword}
          />
          <div className="-mt-2 flex gap-1">
            {[1, 2, 3, 4].map((segment) => (
              <div key={segment} className={`h-2 flex-1 rounded-full transition-all duration-150 ${strength.score >= segment ? segment === 1 ? 'bg-red-500' : segment === 2 ? 'bg-orange-500' : segment === 3 ? 'bg-yellow-500' : 'bg-green-500' : 'bg-gray-200'}`} />
            ))}
          </div>
          <p className="-mt-1 text-xs text-gray-600 dark:text-slate-400">{strength.label}</p>
          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            setValue={setConfirmPassword}
            shown={showConfirm}
            setShown={setShowConfirm}
            disabled={savingPassword}
            onBlur={() => {
              setPasswordTouched((prev) => ({ ...prev, confirmPassword: true }))
              setPasswordErrors((prev) => ({ ...prev, confirmPassword: confirmPassword === newPassword ? '' : 'Passwords do not match' }))
            }}
            error={passwordErrors.confirmPassword}
            isValid={passwordTouched.confirmPassword && !!confirmPassword && confirmPassword === newPassword}
          />
          {confirmPassword && confirmPassword === newPassword ? <p className="text-xs text-green-600">✓ Passwords match</p> : null}
          <button
            type="button"
            onClick={onUpdatePassword}
            disabled={!passwordValid || savingPassword}
            className={`mt-2 ${SETTINGS_UI.primaryButton}`}
          >
            {savingPassword ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Updating password...</span> : 'Update Password'}
          </button>
          <p className="text-xs text-gray-500 dark:text-slate-400">{humanizeLastChanged(lastChangedAt)}</p>
        </div>
        )}
        <InlineError message={passwordError} />
      </section>
    </div>
  )
}

function AppearanceTab({ model }: { model: SettingsProfile | null }) {
  const { updateUser, isDemo } = useAuth()

  const [density, setDensity] = useState<DensityOption>('comfortable')
  const [fontScale, setFontScale] = useState<FontScaleOption>('default')
  const [reduceMotion, setReduceMotion] = useState(false)
  const [statusBadgeStyle, setStatusBadgeStyle] = useState<StatusBadgeStyle>('filled')
  const [rowStriping, setRowStriping] = useState(false)
  const [savingAppearance, setSavingAppearance] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const modelDensity = model?.preferences?.density || (localStorage.getItem(DENSITY_KEY) as DensityOption) || 'comfortable'
    const modelFontScale = model?.preferences?.fontScale || (localStorage.getItem(FONT_SCALE_KEY) as FontScaleOption) || 'default'
    const modelReduceMotion = typeof model?.preferences?.reduceMotion === 'boolean'
      ? model.preferences.reduceMotion
      : localStorage.getItem(REDUCE_MOTION_KEY) === '1'
    const modelStatusBadgeStyle = model?.preferences?.statusBadgeStyle || (localStorage.getItem(STATUS_BADGE_STYLE_KEY) as StatusBadgeStyle) || 'filled'
    const modelRowStriping = typeof model?.preferences?.rowStriping === 'boolean'
      ? model.preferences.rowStriping
      : localStorage.getItem(ROW_STRIPING_KEY) === '1'

    setDensity(modelDensity)
    setFontScale(modelFontScale)
    setReduceMotion(modelReduceMotion)
    setStatusBadgeStyle(modelStatusBadgeStyle)
    setRowStriping(modelRowStriping)

    applyDensity(modelDensity)
    applyFontScale(modelFontScale)
    applyReducedMotion(modelReduceMotion)
    applyStatusBadgeStyle(modelStatusBadgeStyle)
    applyRowStriping(modelRowStriping)
  }, [
    model?.preferences?.density,
    model?.preferences?.fontScale,
    model?.preferences?.reduceMotion,
    model?.preferences?.statusBadgeStyle,
    model?.preferences?.rowStriping,
  ])

  useEffect(() => {
    if (!success) return
    const t = window.setTimeout(() => setSuccess(''), 2500)
    return () => window.clearTimeout(t)
  }, [success])

  const pushUserPreferences = (next: {
    density: DensityOption
    fontScale: FontScaleOption
    reduceMotion: boolean
    statusBadgeStyle: StatusBadgeStyle
    rowStriping: boolean
  }) => {
    updateUser({
      preferences: {
        ...model?.preferences,
        density: next.density,
        fontScale: next.fontScale,
        reduceMotion: next.reduceMotion,
        statusBadgeStyle: next.statusBadgeStyle,
        rowStriping: next.rowStriping,
      },
    })
  }

  const saveDensity = async (nextDensity: DensityOption) => {
    const previous = applyDensity(nextDensity)
    setDensity(nextDensity)

    try {
      setSavingAppearance(true)
      setError('')
      if (!isDemo) {
        await settingsService.updatePreferences({ density: nextDensity })
      }
      pushUserPreferences({
        density: nextDensity,
        fontScale,
        reduceMotion,
        statusBadgeStyle,
        rowStriping,
      })
      setSuccess('Density updated.')
    } catch (err) {
      applyDensity(previous)
      setDensity(previous)
      setError(safeMessage(err))
    } finally {
      setSavingAppearance(false)
    }
  }

  const densityOptions: DensityOption[] = ['compact', 'comfortable', 'spacious']
  const fontScaleOptions: FontScaleOption[] = ['small', 'default', 'large']

  const saveFontScale = async (nextScale: FontScaleOption) => {
    const previous = applyFontScale(nextScale)
    setFontScale(nextScale)

    try {
      setSavingAppearance(true)
      setError('')
      if (!isDemo) {
        await settingsService.updatePreferences({ fontScale: nextScale })
      }
      pushUserPreferences({
        density,
        fontScale: nextScale,
        reduceMotion,
        statusBadgeStyle,
        rowStriping,
      })
      setSuccess('Font size updated.')
    } catch (err) {
      applyFontScale(previous)
      setFontScale(previous)
      setError(safeMessage(err))
    } finally {
      setSavingAppearance(false)
    }
  }

  const onToggleReduceMotion = async (next: boolean) => {
    const previous = applyReducedMotion(next)
    setReduceMotion(next)

    try {
      setSavingAppearance(true)
      setError('')
      if (!isDemo) {
        await settingsService.updatePreferences({ reduceMotion: next })
      }
      pushUserPreferences({
        density,
        fontScale,
        reduceMotion: next,
        statusBadgeStyle,
        rowStriping,
      })
      setSuccess('Motion preference updated.')
    } catch (err) {
      applyReducedMotion(previous)
      setReduceMotion(previous)
      setError(safeMessage(err))
    } finally {
      setSavingAppearance(false)
    }
  }

  const saveStatusBadgeStyle = async (nextStyle: StatusBadgeStyle) => {
    const previous = applyStatusBadgeStyle(nextStyle)
    setStatusBadgeStyle(nextStyle)

    try {
      setSavingAppearance(true)
      setError('')
      if (!isDemo) {
        await settingsService.updatePreferences({ statusBadgeStyle: nextStyle })
      }
      pushUserPreferences({
        density,
        fontScale,
        reduceMotion,
        statusBadgeStyle: nextStyle,
        rowStriping,
      })
      setSuccess('Badge style updated.')
    } catch (err) {
      applyStatusBadgeStyle(previous)
      setStatusBadgeStyle(previous)
      setError(safeMessage(err))
    } finally {
      setSavingAppearance(false)
    }
  }

  const onToggleRowStriping = async (next: boolean) => {
    const previous = applyRowStriping(next)
    setRowStriping(next)

    try {
      setSavingAppearance(true)
      setError('')
      if (!isDemo) {
        await settingsService.updatePreferences({ rowStriping: next })
      }
      pushUserPreferences({
        density,
        fontScale,
        reduceMotion,
        statusBadgeStyle,
        rowStriping: next,
      })
      setSuccess('Row striping updated.')
    } catch (err) {
      applyRowStriping(previous)
      setRowStriping(previous)
      setError(safeMessage(err))
    } finally {
      setSavingAppearance(false)
    }
  }

  const onResetAppearance = async () => {
    const previousDensity = density
    const previousFontScale = fontScale
    const previousReduceMotion = reduceMotion
    const previousStatusBadgeStyle = statusBadgeStyle
    const previousRowStriping = rowStriping

    applyDensity('comfortable')
    applyFontScale('default')
    applyReducedMotion(false)
    applyStatusBadgeStyle('filled')
    applyRowStriping(false)
    setDensity('comfortable')
    setFontScale('default')
    setReduceMotion(false)
    setStatusBadgeStyle('filled')
    setRowStriping(false)

    try {
      setSavingAppearance(true)
      setError('')
      if (!isDemo) {
        await settingsService.updatePreferences({
          density: 'comfortable',
          fontScale: 'default',
          reduceMotion: false,
          statusBadgeStyle: 'filled',
          rowStriping: false,
        })
      }
      pushUserPreferences({
        density: 'comfortable',
        fontScale: 'default',
        reduceMotion: false,
        statusBadgeStyle: 'filled',
        rowStriping: false,
      })
      setSuccess('Appearance reset to defaults.')
    } catch (err) {
      applyDensity(previousDensity)
      applyFontScale(previousFontScale)
      applyReducedMotion(previousReduceMotion)
      applyStatusBadgeStyle(previousStatusBadgeStyle)
      applyRowStriping(previousRowStriping)
      setDensity(previousDensity)
      setFontScale(previousFontScale)
      setReduceMotion(previousReduceMotion)
      setStatusBadgeStyle(previousStatusBadgeStyle)
      setRowStriping(previousRowStriping)
      setError(safeMessage(err))
    } finally {
      setSavingAppearance(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-[#2c3e50] dark:text-slate-100">Readability</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Tune spacing and typography for your day-to-day file workflows.</p>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Layout Density</p>
          <div className="mt-2 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800/70">
            {densityOptions.map((option) => {
              const active = option === density
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => saveDensity(option)}
                  disabled={savingAppearance}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${
                    active ? 'bg-[#005abd] text-white shadow-sm' : 'text-gray-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Font Scale</p>
          <div className="mt-2 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800/70">
            {fontScaleOptions.map((option) => {
              const active = option === fontScale
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => saveFontScale(option)}
                  disabled={savingAppearance}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${
                    active ? 'bg-[#005abd] text-white shadow-sm' : 'text-gray-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-[#2c3e50] dark:text-slate-100">Comfort</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Reduce visual fatigue by minimizing non-essential motion.</p>

        <div className="mt-4 grid gap-4">
          <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Reduce motion</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Minimize non-essential animation transitions across UI.</p>
            </div>
            <button
              type="button"
              onClick={() => onToggleReduceMotion(!reduceMotion)}
              disabled={savingAppearance}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                reduceMotion ? 'bg-[#005abd] text-white' : 'border border-gray-300 bg-white text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {reduceMotion ? 'On' : 'Off'}
            </button>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-[#2c3e50] dark:text-slate-100">List & Badge Styling</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Control status chip appearance and readability in inbox and outbox rows.</p>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Status Badge Style</p>
          <div className="mt-2 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800/70">
            {(['filled', 'outline', 'minimal'] as StatusBadgeStyle[]).map((style) => {
              const active = style === statusBadgeStyle
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => saveStatusBadgeStyle(style)}
                  disabled={savingAppearance}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${
                    active ? 'bg-[#005abd] text-white shadow-sm' : 'text-gray-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {style}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Table row striping</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Apply alternating row backgrounds for easier line-by-line scanning.</p>
            </div>
            <button
              type="button"
              onClick={() => onToggleRowStriping(!rowStriping)}
              disabled={savingAppearance}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                rowStriping ? 'bg-[#005abd] text-white' : 'border border-gray-300 bg-white text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {rowStriping ? 'On' : 'Off'}
            </button>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onResetAppearance} disabled={savingAppearance} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            Reset Appearance
          </button>
        </div>
      </section>

      {isDemo ? <p className="text-xs text-gray-500 dark:text-slate-400">Demo mode: appearance changes are local to this session.</p> : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      <InlineSuccess message={success} />
    </div>
  )
}

function SecurityTab({ model }: { model: SettingsProfile | null }) {
  const { isDemo, updateUser } = useAuth()
  const { triggerDemoBlock } = useDemoGuard()

  const [autoLockTimeout, setAutoLockTimeout] = useState<AutoLockTimeout>('15m')
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [lastLogin, setLastLogin] = useState<LastLoginResponse | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [savingSecurity, setSavingSecurity] = useState(false)
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAutoLock, setShowAutoLock] = useState(false)
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null)

  const SESSION_PREVIEW_COUNT = 4

  const autoLockMs = useMemo(() => {
    if (autoLockTimeout === '5m') return 5 * 60 * 1000
    if (autoLockTimeout === '15m') return 15 * 60 * 1000
    if (autoLockTimeout === '30m') return 30 * 60 * 1000
    return null
  }, [autoLockTimeout])

  useEffect(() => {
    setAutoLockTimeout(model?.security?.autoLockTimeout || '15m')
  }, [model?.security?.autoLockTimeout])

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSessions(true)
        setError('')

        if (isDemo) {
          const demoSessions = [
            {
              id: 'demo-current',
              device: 'Desktop App (Demo)',
              browser: 'Electron',
              os: 'Windows',
              deviceType: 'desktop',
              ip: '127.0.0.1',
              location: 'Local',
              lastActive: new Date().toISOString(),
              isCurrent: true,
            },
            {
              id: 'demo-secondary',
              device: 'Browser Session (Demo)',
              browser: 'Chrome',
              os: 'Windows',
              deviceType: 'desktop',
              ip: '192.168.1.36',
              location: 'Local Network',
              lastActive: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              isCurrent: false,
            },
          ].map(normalizeSessionInfo)
          setSessions(demoSessions)
          setLastLogin(normalizeLastLoginResponse({
            timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
            browser: 'Demo Browser',
            device: 'Desktop App (Demo)',
            location: 'Local',
          }, demoSessions))
          return
        }

        const [sessionResponse, lastLoginResponse] = await Promise.all([
          settingsService.getSessions(),
          settingsService.getLastLogin(),
        ])
        const normalizedSessions = (sessionResponse.sessions || []).map(normalizeSessionInfo)
        setSessions(normalizedSessions)
        setLastLogin(normalizeLastLoginResponse(lastLoginResponse, normalizedSessions))
      } catch (err) {
        setError(safeMessage(err))
      } finally {
        setLoadingSessions(false)
      }
    }

    load()
  }, [isDemo])

  useEffect(() => {
    if (!success) return
    const t = window.setTimeout(() => setSuccess(''), 3000)
    return () => window.clearTimeout(t)
  }, [success])

  useEffect(() => {
    const handleDocClick = () => {
      setOpenSessionMenuId(null)
    }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [])

  useEffect(() => {
    if (!autoLockMs || isDemo) {
      setShowAutoLock(false)
      return
    }

    let timer = window.setTimeout(() => setShowAutoLock(true), autoLockMs)

    const resetTimer = () => {
      window.clearTimeout(timer)
      setShowAutoLock(false)
      timer = window.setTimeout(() => setShowAutoLock(true), autoLockMs)
    }

    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('mousedown', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    window.addEventListener('scroll', resetTimer, true)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('mousedown', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
      window.removeEventListener('scroll', resetTimer, true)
    }
  }, [autoLockMs, isDemo])

  const persistSecurity = async (payload: {
    autoLockTimeout?: AutoLockTimeout
  }) => {
    if (isDemo) {
      triggerDemoBlock()
      return
    }

    try {
      setSavingSecurity(true)
      setError('')
      const response = await settingsService.updateSecurity(payload)
      const merged = {
        autoLockTimeout: response?.security?.autoLockTimeout || payload.autoLockTimeout || autoLockTimeout,
        sessionTimeout: model?.security?.sessionTimeout,
      }
      updateUser({ security: merged })
      setSuccess('Security setting saved.')
    } catch (err) {
      setError(safeMessage(err))
      throw err
    } finally {
      setSavingSecurity(false)
    }
  }

  const onAutoLockSelect = async (next: AutoLockTimeout) => {
    const previous = autoLockTimeout
    setAutoLockTimeout(next)
    try {
      await persistSecurity({ autoLockTimeout: next })
    } catch {
      setAutoLockTimeout(previous)
    }
  }

  const revokeSession = async (sessionId: string) => {
    setRevokingIds((prev) => new Set(prev).add(sessionId))
    try {
      if (isDemo) {
        triggerDemoBlock()
        return
      }
      await settingsService.revokeSession(sessionId)
      setSessions((prev) => prev.filter((session) => session.id !== sessionId))
      setSuccess('Session revoked.')
    } catch (err) {
      setError(safeMessage(err))
    } finally {
      setRevokingIds((prev) => {
        const next = new Set(prev)
        next.delete(sessionId)
        return next
      })
    }
  }

  const revokeAllOtherSessions = async () => {
    try {
      if (isDemo) {
        triggerDemoBlock()
        return
      }
      await settingsService.revokeAllOtherSessions()
      setSessions((prev) => prev.filter((session) => session.isCurrent))
      setSuccess('All other sessions revoked.')
    } catch (err) {
      setError(safeMessage(err))
    }
  }

  const displayableSessions = useMemo(() => sessions.filter(hasValidSessionIdentity), [sessions])

  const sortedSessions = useMemo(() => {
    return [...displayableSessions].sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1
      const aTs = a.lastActive ? new Date(a.lastActive).getTime() : 0
      const bTs = b.lastActive ? new Date(b.lastActive).getTime() : 0
      return bTs - aTs
    })
  }, [displayableSessions])

  const visibleSessions = showAllSessions ? sortedSessions : sortedSessions.slice(0, SESSION_PREVIEW_COUNT)
  const hiddenSessionsCount = Math.max(0, sortedSessions.length - SESSION_PREVIEW_COUNT)

  const autoLockOptions: AutoLockTimeout[] = ['5m', '15m', '30m', 'never']

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-[#2c3e50] dark:text-slate-100">Security Preferences</h2>

        <div className="mt-4 grid gap-4">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Auto-lock timeout</p>
            <div className="mt-3 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800/70">
              {autoLockOptions.map((option) => {
                const active = option === autoLockTimeout
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onAutoLockSelect(option)}
                    disabled={savingSecurity}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      active ? 'bg-[#005abd] text-white shadow-sm' : 'text-gray-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {option === 'never' ? 'Never' : option.replace('m', ' min')}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-[#2c3e50] dark:text-slate-100">Last Login</h2>
        <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-slate-300">
          <p><span className="font-semibold">When:</span> {formatTime(lastLogin?.timestamp || null)}</p>
          <p><span className="font-semibold">Device:</span> {firstNonEmptyString(lastLogin?.device) || 'Unknown Device'}</p>
          <p><span className="font-semibold">Browser:</span> {firstNonEmptyString(lastLogin?.browser) || 'Unknown'}</p>
          <p><span className="font-semibold">Location:</span> {firstNonEmptyString(lastLogin?.location) || 'Unknown'}</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#2c3e50] dark:text-slate-100">Active Sessions</h2>
          <button type="button" onClick={revokeAllOtherSessions} disabled={loadingSessions} className="text-xs font-semibold text-[#005abd] underline disabled:opacity-60">
            Revoke All Other Sessions
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {visibleSessions.map((session) => {
            const revoking = revokingIds.has(session.id)
            const menuOpen = openSessionMenuId === session.id
            return (
              <div key={session.id} className="rounded-lg border border-gray-200 p-3 transition-all duration-200 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">{session.device}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{session.browser} on {session.os} | {session.ip}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{session.location} | Last active: {formatTime(session.lastActive)}</p>
                  </div>
                  <div className="relative flex items-center gap-2">
                    {session.isCurrent ? <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Current</span> : null}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenSessionMenuId((prev) => (prev === session.id ? null : session.id))
                      }}
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      More
                    </button>
                    {menuOpen ? (
                      <div className="absolute right-0 top-8 z-20 min-w-[140px] rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                        {!session.isCurrent ? (
                          <button
                            type="button"
                            onClick={() => revokeSession(session.id)}
                            disabled={revoking}
                            className="w-full rounded px-2 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            {revoking ? 'Revoking...' : 'Revoke Session'}
                          </button>
                        ) : (
                          <div className="px-2 py-1.5 text-xs text-gray-500">Current session</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {hiddenSessionsCount > 0 ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowAllSessions((prev) => !prev)}
              className="text-xs font-semibold text-[#005abd] underline"
            >
              {showAllSessions ? 'Show Less' : `Show More (${hiddenSessionsCount})`}
            </button>
          </div>
        ) : null}
      </section>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      <InlineSuccess message={success} />

      {showAutoLock ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 text-center shadow-xl animate-in zoom-in-95 duration-150 dark:bg-slate-900">
            <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <FiLock />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Session auto-locked</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Activity paused due to inactivity timeout. Continue when ready.</p>
            <button
              type="button"
              onClick={() => setShowAutoLock(false)}
              className={`mt-4 ${SETTINGS_UI.primaryButton}`}
            >
              Unlock
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DangerZoneTab() {
  const { isDemo, logout } = useAuth()
  const { triggerDemoBlock } = useDemoGuard()

  const [logoutPhrase, setLogoutPhrase] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deletePhrase, setDeletePhrase] = useState('')
  const [processingLogout, setProcessingLogout] = useState(false)
  const [processingDelete, setProcessingDelete] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!success) return
    const t = window.setTimeout(() => setSuccess(''), 3000)
    return () => window.clearTimeout(t)
  }, [success])

  const onLogoutAll = async () => {
    if (isDemo) {
      triggerDemoBlock()
      return
    }
    if (logoutPhrase !== 'LOGOUT ALL') {
      setError('Type LOGOUT ALL to confirm.')
      return
    }

    try {
      setProcessingLogout(true)
      setError('')
      await settingsService.logoutAllDevices()
      setSuccess('Logged out all other devices.')
      setLogoutPhrase('')
    } catch (err) {
      setError(safeMessage(err))
    } finally {
      setProcessingLogout(false)
    }
  }

  const onDeleteAccount = async () => {
    if (isDemo) {
      triggerDemoBlock()
      return
    }

    if (!deletePassword) {
      setError('Password is required for account deletion.')
      return
    }

    if (deletePhrase !== 'DELETE MY ACCOUNT') {
      setError('Type DELETE MY ACCOUNT exactly to continue.')
      return
    }

    try {
      setProcessingDelete(true)
      setError('')
      await settingsService.deleteAccount(deletePassword, deletePhrase)
      sessionStorage.clear()
      localStorage.clear()
      await logout()
      setSuccess('Account deleted permanently.')
    } catch (err) {
      setError(safeMessage(err))
    } finally {
      setProcessingDelete(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900/60 dark:bg-red-950/20">
        <div className="flex items-center gap-2 text-red-700">
          <FiAlertTriangle />
          <h2 className="text-lg font-bold">Danger Zone</h2>
        </div>

        <div className="mt-4 rounded-lg border border-red-200 bg-white p-4 dark:border-red-900/60 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Logout All Other Devices</h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">This immediately invalidates every other active session.</p>

          <label className="mt-3 block text-xs font-semibold text-gray-700 dark:text-slate-300">Type LOGOUT ALL to confirm</label>
          <input
            value={logoutPhrase}
            onChange={(e) => setLogoutPhrase(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />

          <button
            type="button"
            onClick={onLogoutAll}
            disabled={processingLogout || logoutPhrase !== 'LOGOUT ALL'}
            className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processingLogout ? 'Processing...' : 'Logout Other Devices'}
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-red-200 bg-white p-4 dark:border-red-900/60 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Delete Account</h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">This action is permanent and cannot be undone.</p>
          <button
            type="button"
            onClick={() => {
              if (isDemo) {
                triggerDemoBlock()
                return
              }
              setShowDeleteModal(true)
            }}
            className="mt-3 rounded-lg border border-red-400 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Delete My Account
          </button>
        </div>
      </section>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      <InlineSuccess message={success} />

      {showDeleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl animate-in zoom-in-95 duration-150 dark:bg-slate-900">
            <h4 className="text-lg font-bold text-red-700">Delete Account</h4>
            <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">Type the confirmation phrase and your password to proceed.</p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Type DELETE MY ACCOUNT</label>
              <input
                value={deletePhrase}
                onChange={(e) => setDeletePhrase(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDeleteAccount}
                disabled={!deletePassword || deletePhrase !== 'DELETE MY ACCOUNT' || processingDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingDelete ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function Settings() {
  const { user, isDemo } = useAuth()

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const cached = localStorage.getItem(SETTINGS_TAB_KEY) as SettingsTab | null
    if (cached === 'account' || cached === 'appearance' || cached === 'security' || cached === 'danger') return cached
    return 'account'
  })
  const [error, setError] = useState('')
  const [model, setModel] = useState<SettingsProfile | null>(null)

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof FiUser }> = [
    { id: 'account', label: 'Account', icon: FiUser },
    { id: 'appearance', label: 'Appearance', icon: FiSun },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'danger', label: 'Danger Zone', icon: FiAlertTriangle },
  ]

  useEffect(() => {
    localStorage.setItem(SETTINGS_TAB_KEY, activeTab)
  }, [activeTab])

  const refreshModel = async () => {
    try {
      setError('')

      if (isDemo) {
        setModel({
          full_name: user?.full_name || user?.username || '',
          username: user?.username || '',
          email: user?.email || '',
          bio: user?.bio || '',
          avatar_url: user?.avatar_url,
          is_public: user?.is_public ?? true,
          password_changed_at: user?.password_changed_at,
          preferences: {
            density: user?.preferences?.density as DensityOption | undefined,
            language: user?.preferences?.language,
            fontScale: user?.preferences?.fontScale as FontScaleOption | undefined,
            reduceMotion: user?.preferences?.reduceMotion,
            statusBadgeStyle: user?.preferences?.statusBadgeStyle as StatusBadgeStyle | undefined,
            rowStriping: user?.preferences?.rowStriping,
          },
          security: {
            autoLockTimeout: user?.security?.autoLockTimeout as AutoLockTimeout | undefined,
            sessionTimeout: user?.security?.sessionTimeout,
          },
        })
        return
      }

      const response = await settingsService.getProfile()
      if (response?.user) {
        setModel({
          id: response.user.id,
          name: response.user.name,
          full_name: response.user.name,
          username: response.user.username,
          email: response.user.email,
          bio: response.user.bio || '',
          avatar_url: response.user.avatarUrl || undefined,
          isPublic: response.user.isPublic,
          is_public: response.user.isPublic,
          createdAt: response.user.createdAt,
          lastPasswordChangedAt: response.user.lastPasswordChangedAt,
          password_changed_at: response.user.lastPasswordChangedAt,
          emailChangePending: response.emailChangePending || null,
          preferences: response.preferences,
          security: response.security,
        })
      } else {
        setModel(response)
      }
    } catch (err) {
      setError(safeMessage(err))
      setModel({
        full_name: user?.full_name || user?.username || '',
        username: user?.username || '',
        email: user?.email || '',
        bio: user?.bio || '',
        avatar_url: user?.avatar_url,
        is_public: user?.is_public ?? true,
        password_changed_at: user?.password_changed_at,
        preferences: {
          density: user?.preferences?.density as DensityOption | undefined,
          language: user?.preferences?.language,
          fontScale: user?.preferences?.fontScale as FontScaleOption | undefined,
          reduceMotion: user?.preferences?.reduceMotion,
          statusBadgeStyle: user?.preferences?.statusBadgeStyle as StatusBadgeStyle | undefined,
          rowStriping: user?.preferences?.rowStriping,
        },
        security: {
          autoLockTimeout: user?.security?.autoLockTimeout as AutoLockTimeout | undefined,
          sessionTimeout: user?.security?.sessionTimeout,
        },
      })
    } finally {
      // intentionally no visible loading indicator in Settings
    }
  }

  useEffect(() => {
    refreshModel()
  }, [isDemo, user?.username, user?.email, user?.full_name, user?.bio, user?.avatar_url, user?.is_public, user?.password_changed_at, user?.preferences, user?.security])

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)

  return (
    <div className="h-full">
      <div className={`mx-auto max-w-7xl p-8 ${densityClass((model?.preferences?.density as DensityOption) || 'comfortable')}`}>
        <div>
          <h1 className="text-4xl font-bold text-[#2c3e50] dark:text-[#e2e8f0]">Settings</h1>
          <p className="mt-1 text-gray-600 dark:text-slate-400">Manage account details, appearance, security, and critical account actions.</p>
          {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="relative grid grid-cols-4 gap-1">
            <div
              className="absolute bottom-0 top-0 z-0 rounded-lg bg-[#d9ecff] dark:bg-[#1e3a5f] transition-transform duration-300 ease-out"
              style={{ width: '25%', transform: `translateX(${activeIndex * 100}%)` }}
            />

            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-center text-sm transition-all ${
                    active ? 'font-semibold text-[#2c3e50] dark:text-[#e2e8f0]' : 'text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="text-sm" />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>

        <main key={activeTab} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
          {activeTab === 'account' ? <AccountTab model={model} refreshModel={refreshModel} /> : null}
          {activeTab === 'appearance' ? <AppearanceTab model={model} /> : null}
          {activeTab === 'security' ? <SecurityTab model={model} /> : null}
          {activeTab === 'danger' ? <DangerZoneTab /> : null}
        </main>
      </div>
    </div>
  )
}
