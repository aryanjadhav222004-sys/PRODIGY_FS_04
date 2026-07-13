import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  UserIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  BlockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe, updateProfile, uploadAvatar } from '@/store/slices/authSlice'
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, blockUser, unblockUser } from '@/store/slices/usersSlice'
import { selectUser, selectAuthLoading } from '@/store/slices/authSlice'
import { selectFriends, selectFriendRequests, selectBlockedUsers } from '../../store/slices/usersSlice'

export default function ProfilePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userId } = useParams()
  const currentUser = useSelector(selectUser)
  const loading = useSelector(selectAuthLoading)
  const friends = useSelector(selectFriends)
  const friendRequests = useSelector(selectFriendRequests)
  const blockedUsers = useSelector(selectBlockedUsers)
  const [isOwnProfile, setIsOwnProfile] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ username: '', bio: '' })

  const profileUser = isOwnProfile ? currentUser : friends.find(f => f.id === userId) || currentUser

  useEffect(() => {
    if (userId && userId !== currentUser?.id) {
      setIsOwnProfile(false)
      // TODO: Fetch user profile
    } else {
      setIsOwnProfile(true)
    }
  }, [userId, currentUser])

  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setEditData({ username: currentUser.username || '', bio: currentUser.bio || '' })
    }
  }, [currentUser, isOwnProfile])

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target.result)
    reader.readAsDataURL(file)
    dispatch(uploadAvatar(file)).then(() => dispatch(fetchMe()))
  }

  const handleSaveProfile = () => {
    dispatch(updateProfile(editData)).then(() => {
      setEditMode(false)
      dispatch(fetchMe())
    })
  }

  const handleFriendAction = async (action, targetUserId) => {
    switch (action) {
      case 'add':
        await dispatch(sendFriendRequest(targetUserId))
        break
      case 'accept':
        await dispatch(acceptFriendRequest(targetUserId))
        break
      case 'reject':
        await dispatch(rejectFriendRequest(targetUserId))
        break
      case 'block':
        await dispatch(blockUser(targetUserId))
        break
      case 'unblock':
        await dispatch(unblockUser(targetUserId))
        break
    }
  }

  const getFriendshipStatus = (userId) => {
    if (!currentUser) return 'none'
    if (userId === currentUser.id) return 'self'
    if (friends.some(f => f.id === userId)) return 'friend'
    if (friendRequests.sent.some(r => r.id === userId)) return 'pending_sent'
    if (friendRequests.received.some(r => r.id === userId)) return 'pending_received'
    if (blockedUsers.some(b => b.id === userId)) return 'blocked'
    return 'none'
  }

  const status = isOwnProfile ? 'self' : getFriendshipStatus(userId)

  const tabs = [
    { id: 'info', label: 'Info', icon: UserIcon },
    { id: 'friends', label: 'Friends', icon: UserGroupIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  ]

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 rounded-full bg-dark-200 dark:bg-dark-700 mx-auto mb-4"></div>
          <p className="text-dark-500 dark:text-dark-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-700 overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600" />
        <div className="px-6 pb-6 -mt-16 flex items-start gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-dark-900 bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
              {profileUser.avatar ? (
                <img src={profileUser.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-medium text-primary-700 dark:text-primary-300">
                  {profileUser.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                <PencilIcon className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
              </label>
            )}
          </div>
          <div className="flex-1 pt-4">
            <div className="flex items-baseline gap-3 mb-2">
              <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">
                {editMode ? (
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-transparent border-b border-primary-500 focus:outline-none text-2xl font-bold text-dark-900 dark:text-dark-100"
                  />
                ) : (
                  profileUser.username
                )}
              </h1>
              {isOwnProfile && editMode && (
                <button onClick={handleSaveProfile} className="btn-primary text-sm">
                  <CheckIcon className="w-4 h-4 mr-1" /> Save
                </button>
              )}
              {isOwnProfile && !editMode && (
                <button onClick={() => setEditMode(true)} className="btn-ghost text-sm">
                  <PencilIcon className="w-4 h-4 mr-1" /> Edit
                </button>
              )}
            </div>
            <p className="text-dark-500 dark:text-dark-400">@{profileUser.username}</p>
            <p className="text-sm text-dark-400 dark:text-dark-500 mt-1">{profileUser.email}</p>
            
            {/* Status badge */}
            <div className="flex items-center gap-3 mt-3">
              <span className={clsx(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                profileUser.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                profileUser.status === 'away' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-gray-100 text-gray-800 dark:bg-dark-800 dark:text-dark-300'
              )}>
                <span className={clsx('w-1.5 h-1.5 rounded-full', profileUser.status === 'online' ? 'bg-green-500' : profileUser.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400')} />
                {profileUser.status === 'online' ? 'Online' : profileUser.status === 'away' ? 'Away' : 'Offline'}
              </span>
              {profileUser.customStatus && (
                <span className="text-sm text-dark-500 dark:text-dark-400 italic">"{profileUser.customStatus}"</span>
              )}
            </div>
          </div>
        </div>

        {/* Friend actions for other users */}
        {!isOwnProfile && status !== 'self' && (
          <div className="px-6 pb-6 flex gap-3">
            {status === 'none' && (
              <button 
                onClick={() => handleFriendAction('add', userId)}
                className="btn-primary flex-1"
              >
                <PlusIcon className="w-4 h-4 mr-1" /> Add Friend
              </button>
            )}
            {status === 'pending_sent' && (
              <button className="btn-secondary flex-1" disabled>
                <ClockIcon className="w-4 h-4 mr-1" /> Request Sent
              </button>
            )}
            {status === 'pending_received' && (
              <div className="flex gap-2 flex-1">
                <button onClick={() => handleFriendAction('accept', userId)} className="btn-primary flex-1">
                  <CheckIcon className="w-4 h-4 mr-1" /> Accept
                </button>
                <button onClick={() => handleFriendAction('reject', userId)} className="btn-ghost flex-1 text-red-600">
                  <XMarkIcon className="w-4 h-4 mr-1" /> Decline
                </button>
              </div>
            )}
            {status === 'friend' && (
              <button onClick={() => navigate(`/chat/${userId}`)} className="btn-primary flex-1">
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" /> Message
              </button>
            )}
            {status === 'blocked' && (
              <button onClick={() => handleFriendAction('unblock', userId)} className="btn-secondary flex-1">
                <ShieldCheckIcon className="w-4 h-4 mr-1" /> Unblock
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-700 overflow-hidden">
        <div className="border-b border-dark-200 dark:border-dark-700">
          <nav className="flex" aria-label="Profile tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
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

        <div className="p-6">
          {activeTab === 'info' && (
            <ProfileInfo user={profileUser} editMode={editMode} editData={editData} setEditData={setEditData} isOwn={isOwnProfile} />
          )}
          {activeTab === 'friends' && (
            <FriendsList 
              friends={friends} 
              requests={friendRequests} 
              blocked={blockedUsers}
              currentUserId={currentUser?.id}
              onAction={handleFriendAction}
            />
          )}
          {activeTab === 'security' && (
            <SecuritySettings />
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileInfo({ user, editMode, editData, setEditData, isOwn }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Username</label>
          <input
            type="text"
            value={editMode ? editData.username : user.username}
            onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
            disabled={!editMode}
            className={clsx('input', !editMode && 'bg-dark-50 dark:bg-dark-800')}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" value={user.email} disabled className="input bg-dark-50 dark:bg-dark-800" />
        </div>
      </div>
      
      <div>
        <label className="label">Bio</label>
        <textarea
          rows={4}
          value={editMode ? editData.bio : user.bio || ''}
          onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
          disabled={!editMode}
          className={clsx('input', !editMode && 'bg-dark-50 dark:bg-dark-800')}
          placeholder="Tell others about yourself..."
        />
      </div>

      <div className="border-t border-dark-200 dark:border-dark-700 pt-6 space-y-4">
        <h3 className="font-medium text-dark-900 dark:text-dark-100">Privacy Settings</h3>
        <div className="space-y-3">
          <PrivacyToggle label="Show Last Seen" value={user.settings?.privacy?.showLastSeen} />
          <PrivacyToggle label="Show Online Status" value={user.settings?.privacy?.showOnlineStatus} />
          <PrivacyToggle label="Allow Friend Requests" value={user.settings?.privacy?.allowFriendRequests} />
        </div>
      </div>
    </div>
  )
}

function PrivacyToggle({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-dark-700 dark:text-dark-300">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={value} className="sr-only peer" />
        <div className="w-11 h-6 bg-dark-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-dark-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-dark-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-dark-600 peer-checked:bg-primary-600" />
      </label>
    </div>
  )
}

function FriendsList({ friends, requests, blocked, currentUserId, onAction }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-dark-900 dark:text-dark-100 mb-3">Friends ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-dark-500 dark:text-dark-400 text-center py-8">No friends yet</p>
        ) : (
          <div className="space-y-2">
            {friends.map(friend => (
              <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  {friend.avatar ? <img src={friend.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{friend.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark-900 dark:text-dark-100 truncate">{friend.username}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">{friend.email}</p>
                </div>
                {friend.status === 'online' && <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {(requests.received?.length || requests.sent?.length) && (
        <div className="border-t border-dark-200 dark:border-dark-700 pt-6">
          <h3 className="font-medium text-dark-900 dark:text-dark-100 mb-3">Friend Requests</h3>
          
          {requests.received?.map(req => (
            <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{req.username?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-dark-900 dark:text-dark-100">{req.username}</p>
                <p className="text-sm text-dark-500 dark:text-dark-400">wants to be your friend</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onAction('accept', req.id)} className="btn-primary text-sm">Accept</button>
                <button onClick={() => onAction('reject', req.id)} className="btn-ghost text-sm text-red-600">Decline</button>
              </div>
            </div>
          ))}

          {requests.sent?.map(req => (
            <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{req.username?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-dark-900 dark:text-dark-100">{req.username}</p>
                <p className="text-sm text-dark-500 dark:text-dark-400">Request sent</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {blocked?.length && (
        <div className="border-t border-dark-200 dark:border-dark-700 pt-6">
          <h3 className="font-medium text-dark-900 dark:text-dark-100 mb-3">Blocked Users</h3>
          <div className="space-y-2">
            {blocked.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">{user.username?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-900 dark:text-dark-100">{user.username}</p>
                </div>
                <button onClick={() => onAction('unblock', user.id)} className="btn-ghost text-sm text-red-600">Unblock</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Two-Factor Authentication</h3>
        <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">Add an extra layer of security to your account</p>
        <button className="btn-primary">Enable 2FA</button>
      </div>

      <div className="border-t border-dark-200 dark:border-dark-700 pt-6 space-y-4">
        <h3 className="font-medium text-dark-900 dark:text-dark-100">Active Sessions</h3>
        <p className="text-sm text-dark-500 dark:text-dark-400">Manage devices logged into your account</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-dark-50 dark:bg-dark-800">
            <div>
              <p className="font-medium text-dark-900 dark:text-dark-100">Current Session</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">Chrome on Windows • Active now</p>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">Current</span>
          </div>
        </div>
        <button className="btn-secondary w-full">Log out of all other sessions</button>
      </div>

      <div className="border-t border-dark-200 dark:border-dark-700 pt-6">
        <h3 className="font-medium text-dark-900 dark:text-dark-100 mb-3">Change Password</h3>
        <button className="btn-secondary">Change Password</button>
      </div>
    </div>
  )
}

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}