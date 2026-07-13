import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { 
  ChevronLeftIcon, 
  VideoCameraIcon, 
  PhoneIcon, 
  InformationCircleIcon,
  EllipsisVerticalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { fetchMessages, sendMessage, markAsRead, selectMessages } from '@/store/slices/messagesSlice'
import { fetchRoomParticipants, setCurrentRoom, selectCurrentRoom, fetchRoomById } from '@/store/slices/roomsSlice'
import { selectCurrentUserId } from '@/store/slices/authSlice'
import MessageList from '@/components/messages/MessageList'
import MessageInput from '@/components/messages/MessageInput'
import { useSocket } from '@/socket/socket'

export default function ChatPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { emit, isConnected } = useSocket()
  const currentUserId = useSelector(selectCurrentUserId)
  const currentRoom = useSelector(selectCurrentRoom)
  const messages = useSelector(state => selectMessages(state, roomId))
  const [showRoomInfo, setShowRoomInfo] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Load room and messages on mount
  useEffect(() => {
    if (roomId) {
      dispatch(fetchRoomById(roomId))
      dispatch(fetchMessages({ roomId, params: { limit: 50 } }))
      dispatch(fetchRoomParticipants(roomId))
      emit('join_room', roomId)
    }
    return () => {
      if (roomId) emit('leave_room', roomId)
    }
  }, [roomId, dispatch, emit])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle typing indicators
  const handleTyping = () => {
    emit('typing_start', roomId)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emit('typing_stop', roomId)
    }, 2000)
  }

  const handleSend = (messageData) => {
    dispatch(sendMessage({ roomId, data: messageData }))
    emit('send_message', { roomId, message: messageData })
    emit('typing_stop', roomId)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0 && currentRoom) {
      const lastMessage = messages[0]
      if (lastMessage && !lastMessage.readBy?.some(r => r.user === currentUserId)) {
        dispatch(markAsRead({ roomId, messageId: lastMessage.id }))
        emit('message_read', { roomId, messageId: lastMessage.id })
      }
    }
  }, [messages, currentUserId, roomId, dispatch, emit])

  if (!currentRoom && roomId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-dark-900">
        <div className="text-center">
          <ChevronLeftIcon className="w-16 h-16 mx-auto mb-4 text-dark-300 dark:text-dark-600" />
          <h2 className="text-xl font-medium text-dark-900 dark:text-dark-100">Select a conversation</h2>
          <p className="text-dark-500 dark:text-dark-400 mt-1">Choose a chat from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  const otherParticipant = currentRoom.participants?.find(p => p.id !== currentUserId)

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-dark-900">
      {/* Room Header */}
      <header className="flex items-center gap-3 h-16 px-4 border-b border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900">
        <button
          onClick={() => navigate('/')}
          className="lg:hidden p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
          aria-label="Back to conversations"
        >
          <ChevronLeftIcon className="w-6 h-6 text-dark-600 dark:text-dark-300" />
        </button>
        
        <div className="relative flex-shrink-0">
          <div className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center overflow-hidden',
            currentRoom.type === 'group' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-dark-100 dark:bg-dark-800'
          )}>
            {currentRoom.avatar ? (
              <img src={currentRoom.avatar} alt="" className="w-full h-full object-cover" />
            ) : currentRoom.type === 'group' ? (
              <svg className="w-5 h-5 text-primary-700 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            ) : otherParticipant?.avatar ? (
              <img src={otherParticipant.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-dark-600 dark:text-dark-300">
                {otherParticipant?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          {otherParticipant?.status === 'online' && currentRoom.type !== 'group' && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-900 rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0" onClick={() => setShowRoomInfo(true)}>
          <h3 className="text-sm font-medium text-dark-900 dark:text-dark-100 truncate">
            {currentRoom.name || otherParticipant?.username || 'Unknown'}
          </h3>
          <p className="text-xs text-dark-500 dark:text-dark-400 truncate flex items-center gap-1">
            {currentRoom.type === 'group' 
              ? `${currentRoom.participants?.length || 0} members`
              : otherParticipant?.status === 'online' 
                ? 'Online' 
                : `Last seen ${formatDistanceToNow(otherParticipant?.lastSeen)}`}
            {!isConnected && <span className="text-red-500">• Disconnected</span>}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {currentRoom.type !== 'group' && (
            <>
              <button className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800" aria-label="Voice call">
                <PhoneIcon className="w-5 h-5 text-dark-600 dark:text-dark-300" />
              </button>
              <button className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800" aria-label="Video call">
                <VideoCameraIcon className="w-5 h-5 text-dark-600 dark:text-dark-300" />
              </button>
            </>
          )}
          <button
            onClick={() => setShowRoomInfo(true)}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
            aria-label="Room info"
          >
            <InformationCircleIcon className="w-5 h-5 text-dark-600 dark:text-dark-300" />
          </button>
          <button
            onClick={() => setShowParticipants(true)}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
            aria-label="Participants"
          >
            <svg className="w-5 h-5 text-dark-600 dark:text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          onAddReaction={(messageId, emoji) => emit('add_reaction', { roomId, messageId, emoji })}
          onRemoveReaction={(messageId, emoji) => emit('remove_reaction', { roomId, messageId, emoji })}
          onReply={(message) => {}}
          onEdit={(message) => {}}
          onDelete={(message) => {}}
          onPin={(message) => {}}
          onCopy={(message) => {}}
        />
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input */}
      <MessageInput roomId={roomId} onSend={handleSend} onTyping={handleTyping} />

      {/* Room Info Modal */}
      {showRoomInfo && (
        <RoomInfoModal 
          room={currentRoom} 
          onClose={() => setShowRoomInfo(false)} 
          currentUserId={currentUserId}
        />
      )}

      {/* Participants Modal */}
      {showParticipants && (
        <ParticipantsModal 
          room={currentRoom} 
          onClose={() => setShowParticipants(false)} 
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}

function RoomInfoModal({ room, onClose, currentUserId }) {
  const isAdmin = room.admins?.some(a => a.id === currentUserId) || room.createdBy === currentUserId
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl w-full max-w-md animate-in slide-up">
        <div className="p-4 border-b border-dark-200 dark:border-dark-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-900 dark:text-dark-100">Room Info</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
            <XMarkIcon className="w-5 h-5 text-dark-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-700 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-dark-900 dark:text-dark-100">{room.name || 'Unnamed Group'}</h3>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                {room.type === 'group' ? `${room.participants?.length || 0} members` : 'Private chat'}
              </p>
            </div>
          </div>

          {room.description && (
            <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
              <h4 className="text-sm font-medium text-dark-900 dark:text-dark-100 mb-2">Description</h4>
              <p className="text-sm text-dark-600 dark:text-dark-300">{room.description}</p>
            </div>
          )}

          <div className="border-t border-dark-200 dark:border-dark-700 pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-500 dark:text-dark-400">Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-dark-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-dark-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-dark-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-dark-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-500 dark:text-dark-400">Disappearing messages</span>
              <span className="text-dark-900 dark:text-dark-100">Off</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-500 dark:text-dark-400">Encryption</span>
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                End-to-end encrypted
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="border-t border-dark-200 dark:border-dark-700 pt-4 space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg">
                Edit room info
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg">
                Manage members
              </button>
            </div>
          )}

          <div className="border-t border-dark-200 dark:border-dark-700 pt-4 space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
              {room.type === 'group' ? 'Leave group' : 'Delete chat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ParticipantsModal({ room, onClose, currentUserId }) {
  const isAdmin = room.admins?.some(a => a.id === currentUserId) || room.createdBy === currentUserId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] animate-in slide-up flex flex-col">
        <div className="p-4 border-b border-dark-200 dark:border-dark-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-900 dark:text-dark-100">Participants</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
            <XMarkIcon className="w-5 h-5 text-dark-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {room.participants?.map(participant => {
            const isCurrentUser = participant.id === currentUserId
            const isRoomAdmin = room.admins?.some(a => a.id === participant.id)
            return (
              <div key={participant.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
                  {participant.avatar ? (
                    <img src={participant.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {participant.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-900 dark:text-dark-100 truncate">
                    {participant.username}
                    {isCurrentUser && <span className="ml-2 text-xs text-dark-500 dark:text-dark-400">(You)</span>}
                  </p>
                  <p className="text-xs text-dark-500 dark:text-dark-400">{participant.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {participant.status === 'online' && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                  {isRoomAdmin && (
                    <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                      Admin
                    </span>
                  )}
                  {room.createdBy === participant.id && (
                    <span className="text-xs px-2 py-0.5 bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 rounded-full">
                      Creator
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="p-4 border-t border-dark-200 dark:border-dark-700">
          <button className="w-full btn-primary">Add participants</button>
        </div>
      </div>
    </div>
  )
}

function formatDistanceToNow(dateString) {
  if (!dateString) return 'unknown'
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return date.toLocaleDateString()
}