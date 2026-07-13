import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  MagnifyingGlassIcon, 
  UserPlusIcon, 
  XMarkIcon, 
  CheckIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { 
  fetchFriends, 
  fetchFriendRequests, 
  fetchBlockedUsers, 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend, 
  blockUser, 
  unblockUser 
} from '@/store/slices/usersSlice'
import { searchUsers } from '@/store/slices/authSlice'
import { selectFriends, selectFriendRequests, selectBlockedUsers, selectUserSearchResults, selectUsersLoading } from '@/store/slices/usersSlice'
import { selectUser } from '@/store/slices/authSlice'

const tabs = [
  { id: 'all', label: 'All Friends', icon: UserCircleIcon },
  { id: 'requests', label: 'Requests', icon: UserPlusIcon },
  { id: 'blocked', label: 'Blocked', icon: ShieldCheckIcon },
]

export default function FriendsPage() {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectUser)
  const friends = useSelector(selectFriends)
  const friendRequests = useSelector(selectFriendRequests)
  const blockedUsers = useSelector(selectBlockedUsers)
  const searchResults = useSelector(selectUserSearchResults)
  const loading = useSelector(selectUsersLoading)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [addFriendQuery, setAddFriendQuery] = useState('')
  const [addFriendResults, setAddFriendResults] = useState([])

  useEffect(() => {
    dispatch(fetchFriends())
    dispatch(fetchFriendRequests())
    dispatch(fetchBlockedUsers())
  }, [dispatch])

  const handleSearch = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.length >= 2) {
      dispatch(searchUsers(query))
    } else {
      dispatch({ type: 'users/setSearchResults', payload: [] })
    }
  }

  const handleAddFriendSearch = (e) => {
    const query = e.target.value
    setAddFriendQuery(query)
    if (query.length >= 2) {
      dispatch(searchUsers(query)).then(res => {
        setAddFriendResults(res.payload?.users || [])
      })
    } else {
      setAddFriendResults([])
    }
  }

  const handleFriendAction = async (action, userId) => {
    switch (action) {
      case 'add':
        await dispatch(sendFriendRequest(userId))
        setShowAddFriend(false)
        setAddFriendQuery('')
        setAddFriendResults([])
        break
      case 'accept':
        await dispatch(acceptFriendRequest(userId))
        break
      case 'reject':
        await dispatch(rejectFriendRequest(userId))
        break
      case 'remove':
        if (window.confirm('Remove this friend?')) await dispatch(removeFriend(userId))
        break
      case 'block':
        if (window.confirm('Block this user?')) await dispatch(blockUser(userId))
        break
      case 'unblock':
        await dispatch(unblockUser(userId))
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

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">Friends</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Manage your connections and friend requests</p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-700 overflow-hidden">
        <div className="border-b border-dark-200 dark:border-dark-700">
          <nav className="flex" aria-label="Friends tabs">
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
            <div className="flex-1" />
            <button
              onClick={() => setShowAddFriend(true)}
              className="btn-primary mr-4 flex items-center gap-2"
            >
              <UserPlusIcon className="w-4 h-4" />
              Add Friend
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Search bar for All Friends tab */}
          {activeTab === 'all' && (
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search friends..."
                  className="input pl-10"
                />
              </div>
              {searchQuery && searchResults.length > 0 && (
                <div className="mt-2 absolute z-10 bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-700 rounded-lg shadow-lg w-full max-h-60 overflow-auto">
                  {searchResults.map(user => {
                    const status = getFriendshipStatus(user.id)
                    return (
                      <button
                        key={user.id}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-dark-100 dark:hover:bg-dark-800 text-left border-b border-dark-100 dark:border-dark-800 last:border-0"
                        onClick={() => handleFriendAction(status === 'none' ? 'add' : 'remove', user.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (
                            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{user.username?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-dark-900 dark:text-dark-100 truncate">{user.username}</p>
                          <p className="text-sm text-dark-500 dark:text-dark-400 truncate">{user.email}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                          {status === 'friend' ? 'Friend' : status === 'pending_sent' ? 'Pending' : 'Add'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab content */}
          {activeTab === 'all' && (
            <FriendsList 
              friends={friends} 
              searchQuery={searchQuery}
              onAction={handleFriendAction}
              getStatus={getFriendshipStatus}
            />
          )}

          {activeTab === 'requests' && (
            <FriendRequests 
              requests={friendRequests} 
              onAction={handleFriendAction}
            />
          )}

          {activeTab === 'blocked' && (
            <BlockedUsers 
              users={blockedUsers} 
              onAction={handleFriendAction}
            />
          )}
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl w-full max-w-md animate-in slide-up">
            <div className="p-4 border-b border-dark-200 dark:border-dark-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark-900 dark:text-dark-100">Add Friend</h2>
              <button onClick={() => setShowAddFriend(false)} className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
                <XMarkIcon className="w-5 h-5 text-dark-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={addFriendQuery}
                  onChange={handleAddFriendSearch}
                  placeholder="Search by username or email..."
                  className="input pl-10"
                  autoFocus
                />
              </div>
              {addFriendQuery.length >= 2 && (
                <div className="max-h-60 overflow-auto space-y-2">
                  {addFriendResults.length === 0 ? (
                    <p className="text-center text-dark-500 dark:text-dark-400 py-4">No users found</p>
                  ) : (
                    addFriendResults.map(user => {
                      const status = getFriendshipStatus(user.id)
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleFriendAction('add', user.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (
                              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{user.username?.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-dark-900 dark:text-dark-100 truncate">{user.username}</p>
                            <p className="text-sm text-dark-500 dark:text-dark-400 truncate">{user.email}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                            Add
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FriendsList({ friends, searchQuery, onAction, getStatus }) {
  const filtered = friends.filter(f => 
    f.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCircleIcon className="w-16 h-16 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
        <p className="text-dark-500 dark:text-dark-400">No friends yet</p>
        <p className="text-sm text-dark-400 dark:text-dark-500 mt-1">Start by adding some friends!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filtered.map(friend => (
        <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center relative">
            {friend.avatar ? <img src={friend.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{friend.username?.charAt(0).toUpperCase()}</span>
            )}
            {friend.status === 'online' && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-dark-900 rounded-full" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-dark-900 dark:text-dark-100 truncate">{friend.username}</p>
            <p className="text-sm text-dark-500 dark:text-dark-400 truncate">{friend.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {}} className="p-2 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-700 text-dark-500">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onAction('remove', friend.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function FriendRequests({ requests, onAction }) {
  const received = requests.received || []
  const sent = requests.sent || []

  if (received.length === 0 && sent.length === 0) {
    return (
      <div className="text-center py-12">
        <UserPlusIcon className="w-16 h-16 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
        <p className="text-dark-500 dark:text-dark-400">No pending requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {received.length > 0 && (
        <div>
          <h3 className="font-medium text-dark-900 dark:text-dark-100 mb-3">Received ({received.length})</h3>
          <div className="space-y-2">
            {received.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  {req.avatar ? <img src={req.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{req.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-900 dark:text-dark-100">{req.username}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">wants to be your friend</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onAction('accept', req.id)} className="btn-primary text-sm">
                    <CheckIcon className="w-4 h-4 mr-1" /> Accept
                  </button>
                  <button onClick={() => onAction('reject', req.id)} className="btn-ghost text-sm text-red-600">
                    <XMarkIcon className="w-4 h-4 mr-1" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div className="border-t border-dark-200 dark:border-dark-700 pt-6">
          <h3 className="font-medium text-dark-900 dark:text-dark-100 mb-3">Sent ({sent.length})</h3>
          <div className="space-y-2">
            {sent.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  {req.avatar ? <img src={req.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{req.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-900 dark:text-dark-100">{req.username}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">Request sent</p>
                </div>
                <button onClick={() => onAction('reject', req.id)} className="btn-ghost text-sm text-red-600">Cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BlockedUsers({ users, onAction }) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="w-16 h-16 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
        <p className="text-dark-500 dark:text-dark-400">No blocked users</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {users.map(user => (
        <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (
              <span className="text-sm font-medium text-red-700 dark:text-red-300">{user.username?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-dark-900 dark:text-dark-100 truncate">{user.username}</p>
            <p className="text-sm text-dark-500 dark:text-dark-400 truncate">{user.email}</p>
          </div>
          <button onClick={() => onAction('unblock', user.id)} className="btn-primary text-sm">
            <ShieldCheckIcon className="w-4 h-4 mr-1" /> Unblock
          </button>
        </div>
      ))}
    </div>
  )
}

function ChatBubbleLeftRightIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}