import { useState, useRef } from 'react'
import { 
  ChevronDownIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowPathIcon,
  FlagIcon,
  DocumentDuplicateIcon,
  BookmarkIcon,
  HeartIcon,
  FaceSmileIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import ReactionPicker from './ReactionPicker'

const emojiMap = {
  '❤️': '❤️',
  '👍': '👍',
  '👎': '👎',
  '😂': '😂',
  '😮': '😮',
  '😢': '😢',
  '😡': '😡',
  '🎉': '🎉',
  '🔥': '🔥',
  '👀': '👀',
}

export default function MessageBubble({ 
  message, 
  showAvatar = true, 
  showName = false, 
  isOwn = false,
  isFirst = true,
  onAddReaction,
  onRemoveReaction,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onCopy
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const menuRef = useRef(null)
  const reactionsRef = useRef(null)

  const isEdited = message.isEdited
  const isDeleted = message.isDeleted
  const hasReactions = message.reactions?.length > 0

  const myReactions = message.reactions?.filter(r => 
    r.users?.some(u => u.id === message.currentUserId)
  ).map(r => r.emoji) || []

  const formatTime = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const handleMenuClick = (e) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleReactionsClick = (e) => {
    e.stopPropagation()
    setShowReactions(!showReactions)
  }

  const handleAddReaction = (emoji) => {
    onAddReaction?.(message.id, emoji)
    setShowReactions(false)
  }

  const handleRemoveReaction = (emoji) => {
    onRemoveReaction?.(message.id, emoji)
  }

  const handleAction = (action) => {
    switch (action) {
      case 'reply':
        onReply?.(message)
        break
      case 'edit':
        onEdit?.(message)
        break
      case 'delete':
        onDelete?.(message)
        break
      case 'pin':
        onPin?.(message)
        break
      case 'copy':
        navigator.clipboard.writeText(message.content)
        break
    }
    setShowMenu(false)
  }

  if (isDeleted) {
    return (
      <div className={clsx('flex gap-3', isOwn ? 'flex-row-reverse' : '')}>
        {showAvatar && (
          <div className="w-8 h-8 flex-shrink-0" />
        )}
        <div className={clsx(
          'max-w-[70%] px-4 py-2 rounded-2xl',
          isOwn 
            ? 'bg-dark-100 dark:bg-dark-800 rounded-tr-none' 
            : 'bg-dark-100 dark:bg-dark-800 rounded-tl-none'
        )}>
          <p className="text-sm text-dark-500 dark:text-dark-400 italic">
            This message was deleted
          </p>
          <p className="text-xs text-dark-400 dark:text-dark-500 mt-1">
            {formatTime(message.deletedAt)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={clsx('flex gap-3 animate-in fade-in slide-up', isOwn ? 'flex-row-reverse' : '')}
      data-message-id={message.id}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="w-8 h-8 flex-shrink-0">
          <div className="w-full h-full rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
            {message.sender?.avatar ? (
              <img src={message.sender.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {message.sender?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Sender name (for group chats) */}
        {showName && !isOwn && (
          <div className="mb-1">
            <span className="text-xs font-medium text-dark-500 dark:text-dark-400">
              {message.sender?.username}
            </span>
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={clsx(
            'mb-1.5 p-2 rounded-lg border max-w-full',
            isOwn 
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' 
              : 'bg-dark-50 dark:bg-dark-800 border-dark-200 dark:border-dark-700'
          )}>
            <div className="flex items-center gap-2 mb-1">
              <ArrowPathIcon className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
              <span className="text-xs font-medium text-dark-600 dark:text-dark-300">
                {message.replyTo.sender?.username || 'Unknown'}
              </span>
            </div>
            <p className="text-sm text-dark-600 dark:text-dark-300 truncate">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Message bubble */}
        <div 
          className={clsx(
            'relative max-w-[70%] px-4 py-2 rounded-2xl',
            isOwn 
              ? 'bg-primary-600 rounded-tr-none text-white' 
              : 'bg-dark-100 dark:bg-dark-800 rounded-tl-none text-dark-900 dark:text-dark-100'
          )}
          onContextMenu={(e) => {
            e.preventDefault()
            setShowMenu(true)
          }}
        >
          {/* Forwarded indicator */}
          {message.forwardedFrom && (
            <div className="text-xs text-primary-200 dark:text-primary-400 mb-1 flex items-center gap-1">
              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
              Forwarded
            </div>
          )}

          {/* Message content based on type */}
          {renderMessageContent(message, isOwn)}

          {/* Metadata row */}
          <div className={clsx(
            'flex items-center gap-1.5 mt-1.5',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            <time 
              className={clsx(
                'text-xs',
                isOwn ? 'text-primary-100' : 'text-dark-400 dark:text-dark-500'
              )}
              title={new Date(message.createdAt).toLocaleString()}
            >
              {formatTime(message.createdAt)}
            </time>
            
            {isEdited && (
              <span className={clsx(
                'text-xs',
                isOwn ? 'text-primary-100' : 'text-dark-400 dark:text-dark-500'
              )}>
                (edited)
              </span>
            )}

            {isOwn && message.readBy?.length > 0 && (
              <span className="text-xs text-primary-100 flex items-center gap-0.5">
                <CheckIcon className="w-3.5 h-3.5" />
                Read
              </span>
            )}

            {isOwn && message.deliveredTo?.length > 0 && message.readBy?.length === 0 && (
              <span className="text-xs text-primary-100 flex items-center gap-0.5">
                <CheckIcon className="w-3.5 h-3.5" />
                Delivered
              </span>
            )}
          </div>

          {/* Reactions */}
          {hasReactions && (
            <div 
              className="flex flex-wrap gap-1 mt-2"
              onClick={handleReactionsClick}
              role="button"
              tabIndex={0}
              aria-label="Reactions"
            >
              {message.reactions.map(reaction => {
                const isMyReaction = myReactions.includes(reaction.emoji)
                return (
                  <button
                    key={reaction.emoji}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isMyReaction) {
                        handleRemoveReaction(reaction.emoji)
                      } else {
                        handleAddReaction(reaction.emoji)
                      }
                    }}
                    className={clsx(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all',
                      isMyReaction
                        ? isOwn
                          ? 'bg-white/30 ring-2 ring-white/50'
                          : 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500/50'
                        : 'bg-white/10 dark:bg-dark-700/50 hover:bg-white/20 dark:hover:bg-dark-600/50'
                    )}
                    aria-pressed={isMyReaction}
                  >
                    <span style={{ fontSize: '12px' }}>{reaction.emoji}</span>
                    <span className="font-medium">
                      {reaction.users?.length || 0}
                    </span>
                  </button>
                )
              })}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowReactions(true)
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/10 dark:bg-dark-700/50 hover:bg-white/20 dark:hover:bg-dark-600/50 transition-colors"
                aria-label="Add reaction"
              >
                <FaceSmileIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <div 
            ref={menuRef}
            className="absolute z-20 mt-1 w-48 bg-white dark:bg-dark-900 rounded-lg shadow-lg border border-dark-200 dark:border-dark-700 py-1"
            role="menu"
          >
            {message.replyTo && (
              <button
                onClick={() => handleAction('reply')}
                className="w-full px-3 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 flex items-center gap-2"
                role="menuitem"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reply
              </button>
            )}
            {isOwn && (
              <>
                <button
                  onClick={() => handleAction('edit')}
                  className="w-full px-3 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 flex items-center gap-2"
                  role="menuitem"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleAction('pin')}
                  className="w-full px-3 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 flex items-center gap-2"
                  role="menuitem"
                >
                  <BookmarkIcon className="w-4 h-4" />
                  Pin
                </button>
                <button
                  onClick={() => handleAction('copy')}
                  className="w-full px-3 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 flex items-center gap-2"
                  role="menuitem"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  Copy
                </button>
                <hr className="my-1 border-dark-200 dark:border-dark-700" />
                <button
                  onClick={() => handleAction('delete')}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  role="menuitem"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div 
            ref={reactionsRef}
            className="absolute z-20 bottom-full mb-1 left-0"
          >
            <ReactionPicker 
              onSelect={handleAddReaction}
              onClose={() => setShowReactions(false)}
              myReactions={myReactions}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function renderMessageContent(message, isOwn) {
  const textColor = isOwn ? 'text-white' : 'text-dark-900 dark:text-dark-100'
  
  switch (message.type) {
    case 'image':
      return (
        <div className="relative">
          <img 
            src={message.content} 
            alt="Shared image"
            className="max-w-xs rounded-lg cursor-zoom-in"
            onClick={() => window.open(message.content, '_blank')}
          />
          {message.caption && (
            <p className={clsx('mt-2', textColor)}>{message.caption}</p>
          )}
        </div>
      )
    case 'video':
      return (
        <video 
          src={message.content} 
          controls 
          className="max-w-xs rounded-lg"
        />
      )
    case 'audio':
      return (
        <audio 
          src={message.content} 
          controls 
          className="w-full max-w-xs"
        />
      )
    case 'file':
      return (
        <a 
          href={message.content} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg bg-white/10 dark:bg-dark-700/50"
        >
          <DocumentIcon className="w-8 h-8 text-primary-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className={clsx('font-medium truncate', textColor)}>{message.fileName || 'File'}</p>
            <p className={clsx('text-xs truncate', isOwn ? 'text-primary-200' : 'text-dark-500')}>
              {formatFileSize(message.fileSize)}
            </p>
          </div>
          <DownloadIcon className="w-5 h-5" />
        </a>
      )
    case 'system':
      return (
        <p className={clsx('text-center text-sm italic', isOwn ? 'text-primary-200' : 'text-dark-500')}>
          {message.content}
        </p>
      )
    default:
      return (
        <p className={clsx('whitespace-pre-wrap break-words', textColor)}>
          {message.content}
        </p>
      )
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function DocumentIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 3a2 2 0 012-2h11a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V3zm8.59 3.29a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L13.586 9H4a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function DownloadIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}