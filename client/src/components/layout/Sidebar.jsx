import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  UserCircleIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { useSocket } from '@/socket/socket'
import { selectRooms, selectCurrentRoom, setCurrentRoom } from '@/store/slices/roomsSlice'
import { selectSidebarOpen, setSidebarOpen, selectTheme, setTheme, selectUnreadCounts } from '@/store/slices/uiSlice'
import { selectUser } from '@/store/slices/authSlice'

export default function Sidebar({ collapsed = false, onToggle }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const rooms = useSelector(selectRooms)
  const currentRoom = useSelector(selectCurrentRoom)
  const unreadCounts = useSelector(selectUnreadCounts)
  const sidebarOpen = useSelector(selectSidebarOpen)
  const theme = useSelector(selectTheme)
  const user = useSelector(selectUser)
  const { isConnected } = useSocket()

  const handleCreateRoom = () => {
    dispatch(setSidebarOpen(true))
    // Modal will be handled by parent
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    dispatch(setTheme(newTheme))
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('theme', newTheme)
  }

  if (collapsed) {
    return (
      <div className="flex flex-col h-full border-r border-dark-200 dark:border-dark-700 w-20">
        <div className="p-3 border-b border-dark-200 dark:border-dark-700 flex items-center justify-center">
          <Link to="/" className="flex items-center justify-center" onClick={() => dispatch(setSidebarOpen(true))}>
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <HomeIcon className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-1 space-y-1">
          {rooms.map((room) => (
            <Link 
              key={room.id} 
              to={`/rooms/${room.id}`}
              className={clsx(
                'flex items-center justify-center p-2 rounded-lg transition-colors',
                currentRoom?.id === room.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800'
              )}
              title={room.name || 'Chat'}
              aria-label={room.name || 'Chat'}
            >
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center overflow-hidden mx-auto',
                room.type === 'group' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-dark-100 dark:bg-dark-800'
              )}>
                {room.avatar ? (
                  <img src={room.avatar} alt="" className="w-full h-full object-cover" />
                ) : room.type === 'group' ? (
                  <UserGroupIcon className="w-5 h-5 text-primary-700 dark:text-primary-300" />
                ) : (
                  <span className="text-xs font-medium text-dark-600 dark:text-dark-300">
                    {room.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
        <div className="p-3 border-t border-dark-200 dark:border-dark-700 flex justify-center">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronRightIcon className="w-5 h-5 text-dark-600 dark:text-dark-300" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-r border-dark-200 dark:border-dark-700">
      {/* Header */}
      <div className="p-4 border-b border-dark-200 dark:border-dark-700 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={() => dispatch(setSidebarOpen(true))}>
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <HomeIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-dark-900 dark:text-dark-100">Prodigy Chat</span>
        </Link>
        <button
          onClick={handleCreateRoom}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
          aria-label="Create new room"
        >
          <PlusIcon className="w-5 h-5 text-dark-600 dark:text-dark-300" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-dark-200 dark:border-dark-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 text-dark-900 dark:text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Connection status */}
      <div className="px-4 py-2 border-b border-dark-200 dark:border-dark-700 flex items-center gap-2">
        <span className={clsx(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-green-500' : 'bg-red-500'
        )} />
        <span className="text-xs text-dark-500 dark:text-dark-400">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-dark-500 dark:text-dark-400 py-12">
            <HomeIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="text-xs mt-1">Start a new conversation</p>
            <button
              onClick={handleCreateRoom}
              className="mt-4 btn-primary text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              New Chat
            </button>
          </div>
        ) : (
          <ul className="space-y-1" role="list" aria-label="Conversations">
            {rooms.map((room) => (
              <li key={room.id}>
                <RoomListItem 
                  room={room} 
                  isActive={currentRoom?.id === room.id}
                  unreadCount={unreadCounts[room.id] || 0}
                  onClick={() => dispatch(setCurrentRoom(room))}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer with user menu */}
      <div className="p-4 border-t border-dark-200 dark:border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-primary-700 dark:text-primary-300 font-medium text-lg">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-900 dark:text-dark-100 truncate">
              {user?.username || 'User'}
            </p>
            <p className="text-xs text-dark-500 dark:text-dark-400 truncate">
              {user?.email || ''}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5 text-dark-600 dark:text-dark-300" />
              ) : (
                <MoonIcon className="w-5 h-5 text-dark-600 dark:text-dark-300" />
              )}
            </button>
            <Link
              to="/settings"
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              aria-label="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5 text-dark-600 dark:text-dark-300" />
            </Link>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeftIcon className="w-5 h-5 text-dark-600 dark:text-dark-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoomListItem({ room, isActive, unreadCount, onClick }) {
  const otherParticipant = room.participants?.find(p => p.id !== room.currentUserId)
  
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
        'group',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
          : 'text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative flex-shrink-0">
        <div className={clsx(
          'w-10 h-10 rounded-full flex items-center justify-center overflow-hidden',
          room.type === 'group' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-dark-100 dark:bg-dark-800'
        )}>
          {room.avatar ? (
            <img src={room.avatar} alt="" className="w-full h-full object-cover" />
          ) : room.type === 'group' ? (
            <UserGroupIcon className="w-5 h-5 text-primary-700 dark:text-primary-300" />
          ) : otherParticipant?.avatar ? (
            <img src={otherParticipant.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-dark-600 dark:text-dark-300">
              {otherParticipant?.username?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>
        {otherParticipant?.status === 'online' && room.type !== 'group' && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-900 rounded-full" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between gap-2">
          <p className={clsx(
            'font-medium truncate',
            isActive ? 'text-primary-700 dark:text-primary-300' : 'text-dark-900 dark:text-dark-100'
          )}>
            {room.name || otherParticipant?.username || 'Unknown'}
          </p>
          {room.lastActivity && (
            <time className="text-xs text-dark-400 dark:text-dark-500 shrink-0 ml-2"
              dateTime={room.lastActivity}>
              {formatTime(room.lastActivity)}
            </time>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={clsx(
            'text-sm truncate',
            isActive ? 'text-primary-600 dark:text-primary-400' : 'text-dark-500 dark:text-dark-400'
          )}>
            {room.lastMessage?.content 
              ? `${room.lastMessage.sender?.username || 'You'}: ${room.lastMessage.content}` 
              : 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className={clsx(
              'flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium',
              isActive 
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'bg-primary-600 text-white'
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  if (diff < 604800000) return date.toLocaleDateString(undefined, { weekday: 'short' })
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}