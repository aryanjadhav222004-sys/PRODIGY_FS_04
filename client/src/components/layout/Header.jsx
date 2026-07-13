import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon, 
  UserCircleIcon, 
  Cog6ToothIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneIcon,
  HomeIcon,
  UserGroupIcon,
  EllipsisVerticalIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { selectCurrentRoom } from '@/store/slices/roomsSlice'
import { selectUser } from '@/store/slices/authSlice'
import { selectTheme, setTheme } from '@/store/slices/uiSlice'
import { useDispatch } from 'react-redux'

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentRoom = useSelector(selectCurrentRoom)
  const user = useSelector(selectUser)
  const theme = useSelector(selectTheme)
  const isMobile = window.innerWidth < 1024

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    dispatch(setTheme(newTheme))
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('theme', newTheme)
  }

  const handleLeaveRoom = () => {
    navigate('/')
  }

  if (!currentRoom) {
    return (
      <header className="h-16 border-b border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/80 backdrop-blur-lg flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {isMobile && (
            <button
              onClick={() => document.querySelector('aside')?.classList.toggle('-translate-x-full')}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors lg:hidden"
              aria-label="Open sidebar"
            >
              <Bars3Icon className="w-6 h-6 text-dark-600 dark:text-dark-300" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <HomeIcon className="w-6 h-6 text-primary-700 dark:text-primary-300" />
            </div>
            <div>
              <h1 className="font-semibold text-dark-900 dark:text-dark-100">Prodigy Chat</h1>
              <p className="text-xs text-dark-500 dark:text-dark-400">Select a conversation</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </div>
      </header>
    )
  }

  return (
    <header className="h-16 border-b border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/80 backdrop-blur-lg flex items-center justify-between px-4 sticky top-0 z-30">
      {/* Left side - Room info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {isMobile && (
          <button
            onClick={() => document.querySelector('aside')?.classList.toggle('-translate-x-full')}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors lg:hidden"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="w-6 h-6 text-dark-600 dark:text-dark-300" />
          </button>
        )}
        
        <Link
          to={`/rooms/${currentRoom.id}`}
          className="flex items-center gap-3 min-w-0 flex-1"
          onClick={(e) => e.preventDefault()}
        >
          <div className="relative flex-shrink-0">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center overflow-hidden',
              currentRoom.type === 'group' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-dark-100 dark:bg-dark-800'
            )}>
              {currentRoom.avatar ? (
                <img src={currentRoom.avatar} alt="" className="w-full h-full object-cover" />
              ) : currentRoom.type === 'group' ? (
                <UserGroupIcon className="w-6 h-6 text-primary-700 dark:text-primary-300" />
              ) : (
                <UserCircleIcon className="w-6 h-6 text-dark-400 dark:text-dark-500" />
              )}
            </div>
            {currentRoom.type !== 'group' && currentRoom.otherUser?.status === 'online' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-900 rounded-full" />
            )}
          </div>
          
          <div className="min-w-0">
            <h1 className="font-medium text-dark-900 dark:text-dark-100 truncate">
              {currentRoom.name || currentRoom.otherUser?.username || 'Unknown'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-dark-500 dark:text-dark-400">
              {currentRoom.type === 'group' && (
                <>
                  <UserGroupIcon className="w-3.5 h-3.5" />
                  <span>{currentRoom.participants?.length || 0} members</span>
                </>
              )}
              {currentRoom.otherUser?.status && currentRoom.type !== 'group' && (
                <span className="flex items-center gap-1">
                  <span className={clsx(
                    'w-1.5 h-1.5 rounded-full',
                    currentRoom.otherUser.status === 'online' ? 'bg-green-500' :
                    currentRoom.otherUser.status === 'away' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  )} />
                  {currentRoom.otherUser.status === 'online' ? 'Online' : 
                   currentRoom.otherUser.status === 'away' ? 'Away' : 'Offline'}
                </span>
              )}
              {currentRoom.otherUser?.lastSeen && currentRoom.type !== 'group' && currentRoom.otherUser.status !== 'online' && (
                <span>Last seen {formatLastSeen(currentRoom.otherUser.lastSeen)}</span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-1 ml-4">
        {/* Call buttons for 1-on-1 */}
        {currentRoom.type !== 'group' && (
          <>
            <button
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors text-dark-600 dark:text-dark-300"
              aria-label="Voice call"
              title="Voice call"
            >
              <PhoneIcon className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors text-dark-600 dark:text-dark-300"
              aria-label="Video call"
              title="Video call"
            >
              <VideoCameraIcon className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Search in conversation */}
        <div className="relative hidden sm:block">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search in conversation"
            className="w-48 sm:w-64 pl-10 pr-4 py-2 rounded-lg bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 text-dark-900 dark:text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            aria-label="Search in conversation"
          />
        </div>

        {/* Theme toggle */}
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors text-dark-600 dark:text-dark-300"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>

        {/* Room menu */}
        <div className="relative">
          <button
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors text-dark-600 dark:text-dark-300"
            aria-label="Room options"
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
          {/* Dropdown would go here */}
        </div>
      </div>
    </header>
  )
}

function formatLastSeen(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return date.toLocaleDateString(undefined, { weekday: 'short' })
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}