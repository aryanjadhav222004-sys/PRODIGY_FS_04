import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  PaintBrushIcon, 
  MoonIcon, 
  SunIcon, 
  ComputerDesktopIcon,
  KeyIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { changePassword, fetchMe } from '@/store/slices/authSlice'
import { selectUser, selectAuthLoading } from '@/store/slices/authSlice'
import { uploadAvatar, updateSettings, fetchSettings } from '@/store/slices/usersSlice'

const tabs = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheckIcon },
  { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
  { id: 'account', label: 'Account', icon: KeyIcon },
]

export default function SettingsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const loading = useSelector(selectAuthLoading)
  const [activeTab, setActiveTab] = useState('profile')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [theme, setTheme] = useState('system')
  const [settings, setSettings] = useState({
    notifications: { messages: true, mentions: true, reactions: true, sounds: true },
    privacy: { showLastSeen: true, showOnlineStatus: true, allowFriendRequests: true }
  })

  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings)
      setTheme(user.settings.theme || 'system')
    }
  }, [user])

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target.result)
    reader.readAsDataURL(file)
    dispatch(uploadAvatar(file)).then(() => dispatch(fetchMe()))
  }

  const handleSettingChange = (category, key, value) => {
    const newSettings = { ...settings, [category]: { ...settings[category], [key]: value } }
    setSettings(newSettings)
    dispatch(updateSettings(newSettings))
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    handleSettingChange('appearance', 'theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    const errors = {}
    if (!passwordData.current) errors.current = 'Current password is required'
    if (!passwordData.new) errors.new = 'New password is required'
    else if (passwordData.new.length < 8) errors.new = 'Password must be at least 8 characters'
    if (!passwordData.confirm) errors.confirm = 'Please confirm new password'
    else if (passwordData.new !== passwordData.confirm) errors.confirm = 'Passwords do not match'
    
    setPasswordErrors(errors)
    if (Object.keys(errors).length === 0) {
      dispatch(changePassword({ currentPassword: passwordData.current, newPassword: passwordData.new }))
      setPasswordData({ current: '', new: '', confirm: '' })
    }
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion
      alert('Account deletion not implemented yet')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">Settings</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-700 overflow-hidden">
        {/* Tab navigation */}
        <div className="border-b border-dark-200 dark:border-dark-700">
          <nav className="flex overflow-x-auto" aria-label="Settings tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200 hover:border-dark-300 dark:hover:border-dark-600'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab panels */}
        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab user={user} avatarPreview={avatarPreview} onAvatarUpload={handleAvatarUpload} />}
          {activeTab === 'notifications' && <NotificationsTab settings={settings.notifications} onChange={(key, value) => handleSettingChange('notifications', key, value)} />}
          {activeTab === 'privacy' && <PrivacyTab settings={settings.privacy} onChange={(key, value) => handleSettingChange('privacy', key, value)} />}
          {activeTab === 'appearance' && <AppearanceTab theme={theme} onThemeChange={handleThemeChange} />}
          {activeTab === 'account' && <AccountTab passwordData={passwordData} setPasswordData={setPasswordData} passwordErrors={passwordErrors} onPasswordSubmit={handlePasswordSubmit} onDeleteAccount={handleDeleteAccount} />}
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ user, avatarPreview, onAvatarUpload }) {
  return (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-medium text-primary-700 dark:text-primary-300">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <input type="file" accept="image/*" onChange={onAvatarUpload} className="sr-only" />
          </label>
        </div>
        <div>
          <h3 className="text-lg font-medium text-dark-900 dark:text-dark-100">{user?.username}</h3>
          <p className="text-dark-500 dark:text-dark-400 text-sm">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="displayName" className="label">Display Name</label>
          <input type="text" id="displayName" defaultValue={user?.username} className="input" />
        </div>
        <div>
          <label htmlFor="bio" className="label">Bio</label>
          <textarea id="bio" rows={3} className="input" placeholder="Tell others about yourself..." />
        </div>
        <button className="btn-primary w-full">Save Changes</button>
      </div>
    </div>
  )
}

function NotificationsTab({ settings, onChange }) {
  const notificationOptions = [
    { key: 'messages', label: 'Messages', description: 'Notify me when I receive new messages' },
    { key: 'mentions', label: 'Mentions', description: 'Notify me when someone mentions me' },
    { key: 'reactions', label: 'Reactions', description: 'Notify me when someone reacts to my messages' },
    { key: 'sounds', label: 'Sounds', description: 'Play notification sounds' },
  ]

  return (
    <div className="space-y-4 max-w-2xl">
      {notificationOptions.map(opt => (
        <div key={opt.key} className="flex items-center justify-between py-3 border-b border-dark-100 dark:border-dark-800 last:border-0">
          <div>
            <h4 className="font-medium text-dark-900 dark:text-dark-100">{opt.label}</h4>
            <p className="text-sm text-dark-500 dark:text-dark-400">{opt.description}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings[opt.key]}
              onChange={(e) => onChange(opt.key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-dark-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-dark-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-dark-600 peer-checked:bg-primary-600" />
          </label>
        </div>
      ))}
    </div>
  )
}

function PrivacyTab({ settings, onChange }) {
  const privacyOptions = [
    { key: 'showLastSeen', label: 'Show Last Seen', description: 'Allow others to see when you were last online' },
    { key: 'showOnlineStatus', label: 'Show Online Status', description: 'Display your online status to others' },
    { key: 'allowFriendRequests', label: 'Allow Friend Requests', description: 'Let people send you friend requests' },
  ]

  return (
    <div className="space-y-4 max-w-2xl">
      {privacyOptions.map(opt => (
        <div key={opt.key} className="flex items-center justify-between py-3 border-b border-dark-100 dark:border-dark-800 last:border-0">
          <div>
            <h4 className="font-medium text-dark-900 dark:text-dark-100">{opt.label}</h4>
            <p className="text-sm text-dark-500 dark:text-dark-400">{opt.description}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings[opt.key]}
              onChange={(e) => onChange(opt.key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-dark-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-dark-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-dark-600 peer-checked:bg-primary-600" />
          </label>
        </div>
      ))}
      
      <div className="pt-4 border-t border-dark-200 dark:border-dark-700">
        <h4 className="font-medium text-dark-900 dark:text-dark-100 mb-3">Blocked Users</h4>
        <p className="text-sm text-dark-500 dark:text-dark-400 mb-3">Manage users you have blocked</p>
        <button className="btn-secondary">Manage Blocked Users</button>
      </div>
    </div>
  )
}

function AppearanceTab({ theme, onThemeChange }) {
  const themes = [
    { value: 'light', label: 'Light', icon: SunIcon, description: 'Always use light mode' },
    { value: 'dark', label: 'Dark', icon: MoonIcon, description: 'Always use dark mode' },
    { value: 'system', label: 'System', icon: ComputerDesktopIcon, description: 'Match your system setting' },
  ]

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-3 gap-4">
        {themes.map(t => (
          <button
            key={t.value}
            onClick={() => onThemeChange(t.value)}
            className={clsx(
              'p-4 rounded-xl border-2 transition-all text-left',
              theme === t.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center',
                theme === t.value
                  ? 'bg-primary-100 dark:bg-primary-900/30'
                  : 'bg-dark-100 dark:bg-dark-800'
              )}>
                <t.icon className="w-5 h-5 text-primary-700 dark:text-primary-300" />
              </div>
            </div>
            <h4 className="font-medium text-dark-900 dark:text-dark-100">{t.label}</h4>
            <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">{t.description}</p>
            {theme === t.value && (
              <div className="mt-2 flex items-center gap-1 text-primary-600 dark:text-primary-400 text-sm">
                <CheckIcon className="w-4 h-4" />
                Selected
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function AccountTab({ passwordData, setPasswordData, passwordErrors, onPasswordSubmit, onDeleteAccount }) {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-lg font-medium text-dark-900 dark:text-dark-100 mb-4">Change Password</h3>
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="label">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={passwordData.current}
              onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
              className={clsx('input', passwordErrors.current && 'input-error')}
            />
            {passwordErrors.current && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.current}</p>}
          </div>
          <div>
            <label htmlFor="newPassword" className="label">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={passwordData.new}
              onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
              className={clsx('input', passwordErrors.new && 'input-error')}
            />
            {passwordErrors.new && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.new}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
              className={clsx('input', passwordErrors.confirm && 'input-error')}
            />
            {passwordErrors.confirm && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.confirm}</p>}
          </div>
          <button type="submit" className="btn-primary">Update Password</button>
        </form>
      </div>

      <div className="border-t border-dark-200 dark:border-dark-700 pt-8">
        <h3 className="text-lg font-medium text-dark-900 dark:text-dark-100 mb-4">Danger Zone</h3>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">Delete Account</h4>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">Permanently delete your account and all data. This cannot be undone.</p>
            </div>
            <button onClick={onDeleteAccount} className="btn-danger">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  )
}