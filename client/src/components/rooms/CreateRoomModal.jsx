import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clsx } from 'clsx'
import { XMarkIcon, UserCircleIcon, UserGroupIcon, MagnifyingGlassIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { searchUsers } from '@/store/slices/authSlice'
import { createRoom } from '@/store/slices/roomsSlice'
import { selectUserSearchResults, selectAuthLoading } from '@/store/slices/authSlice'
import { selectCurrentUserId } from '@/store/slices/authSlice'

export default function CreateRoomModal({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const currentUserId = useSelector(selectCurrentUserId)
  const searchResults = useSelector(selectUserSearchResults)
  const loading = useSelector(selectAuthLoading)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [roomType, setRoomType] = useState('private')
  const [roomName, setRoomName] = useState('')
  const [roomDescription, setRoomDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchDebounce, setSearchDebounce] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSelectedUsers([])
      setRoomName('')
      setRoomDescription('')
      setRoomType('private')
      setSearchQuery('')
    }
  }, [isOpen])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchDebounce.length >= 2) {
        dispatch(searchUsers(searchDebounce))
      } else {
        dispatch({ type: 'auth/setSearchResults', payload: [] })
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchDebounce, dispatch])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    setSearchDebounce(value)
  }

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => 
      prev.some(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedUsers.length === 0 && roomType === 'private') return
    if (roomType === 'group' && !roomName.trim()) return

    setIsSubmitting(true)
    try {
      const participants = selectedUsers.map(u => u.id)
      if (roomType === 'private' && participants.length === 1) {
        // For private chats, check if room already exists
        const existingRoom = await window.electron?.ipcRenderer?.invoke?.('check-private-room', participants[0])
        if (existingRoom) {
          // Navigate to existing room
        } else {
          await dispatch(createRoom({ type: 'private', participants })).unwrap()
        }
      } else {
        await dispatch(createRoom({ 
          type: 'group', 
          name: roomName, 
          description: roomDescription, 
          participants 
        })).unwrap()
      }
      onClose()
    } catch (error) {
      console.error('Failed to create room:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-dark-900 dark:text-white">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-500 hover:text-dark-700 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Room Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Conversation Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRoomType('private')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  roomType === 'private'
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <UserCircleIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Private</span>
              </button>
              <button
                type="button"
                onClick={() => setRoomType('group')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  roomType === 'group'
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <UserGroupIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Group</span>
              </button>
            </div>
          </div>

          {/* Group Details */}
          {roomType === 'group' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="roomDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="roomDescription"
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  rows={2}
                  placeholder="What's this group about?"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Participant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Participants <span className="text-red-500">{roomType === 'private' ? ' *' : ''}</span>
            </label>
            <div className="relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={roomType === 'private' ? "Search for a user to start a chat..." : "Search for users to add to group..."}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              {loading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-10">
                  <div className="flex items-center justify-center py-4 text-gray-500 dark:text-gray-400">
                    <svg className="animate-spin h-5 w-5 text-primary-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                </div>
              )}
              {!loading && searchDebounce.length >= 2 && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-10">
                  <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </div>
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-10 max-h-60 overflow-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUserSelection(user)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                        selectedUsers.some(u => u.id === user.id) && 'bg-primary-50 dark:bg-primary-900/30'
                      )}
                    >
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                              {user.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        {selectedUsers.some(u => u.id === user.id) && (
                          <span className="absolute bottom-0 right-0 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Selected ({selectedUsers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <span key={user.id} className="flex items-center gap-1.5 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm">
                      {user.username}
                      <button
                        type="button"
                        onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                        className="w-4 h-4 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 flex items-center justify-center"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (roomType === 'private' && selectedUsers.length === 0) || (roomType === 'group' && !roomName.trim())}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  {roomType === 'private' ? 'Start Chat' : 'Create Group'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRoomModal