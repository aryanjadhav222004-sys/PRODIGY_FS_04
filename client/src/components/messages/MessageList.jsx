import { useMemo } from 'react'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import MessageBubble from './MessageBubble'

export default function MessageList({ 
  messages, 
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onCopy
}) {
  const groupedMessages = useMemo(() => groupMessages(messages, currentUserId), [messages, currentUserId])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
      {groupedMessages.map((group, groupIndex) => (
        <div key={group.key} className="flex flex-col gap-2">
          {group.showDate && (
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-dark-200 dark:bg-dark-700" />
              <span className="text-xs text-dark-500 dark:text-dark-400 px-2 bg-white dark:bg-dark-900">
                {formatDateHeader(group.messages[0].createdAt)}
              </span>
              <div className="h-px flex-1 bg-dark-200 dark:bg-dark-700" />
            </div>
          )}
          
          {group.messages.map((message, msgIndex) => (
            <MessageBubble
              key={message.id || message.tempId}
              message={{
                ...message,
                currentUserId,
                isFirst: msgIndex === 0,
                isLast: msgIndex === group.messages.length - 1
              }}
              showAvatar={msgIndex === 0}
              showName={!message.isOwn && group.messages.length > 1 && msgIndex === 0}
              isOwn={message.isOwn}
              onAddReaction={onAddReaction}
              onRemoveReaction={onRemoveReaction}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
              onCopy={onCopy}
            />
          ))}
        </div>
      ))}
      
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-dark-500 dark:text-dark-400">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-1">Send the first message to start the conversation</p>
          </div>
        </div>
      )}
    </div>
  )
}

function groupMessages(messages, currentUserId) {
  if (!messages.length) return []

  const groups = []
  let currentGroup = null

  for (const message of messages) {
    const senderId = message.sender?._id || message.sender?.id || message.senderId
    const isOwn = senderId === currentUserId
    const msgDate = new Date(message.createdAt)

    if (!currentGroup || 
        currentGroup.senderId !== senderId || 
        !isSameDay(msgDate, new Date(currentGroup.lastMessageTime))) {
      if (currentGroup) groups.push(currentGroup)
      currentGroup = {
        key: `${senderId}-${msgDate.getTime()}`,
        senderId,
        sender: message.sender,
        isOwn,
        messages: [message],
        lastMessageTime: message.createdAt,
        showDate: !groups.length || !isSameDay(msgDate, new Date(groups[groups.length - 1].lastMessageTime))
      }
    } else {
      currentGroup.messages.push(message)
      currentGroup.lastMessageTime = message.createdAt
    }
  }

  if (currentGroup) groups.push(currentGroup)
  return groups
}

function isSameDay(date1, date2) {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
}

function formatDateHeader(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, yesterday)) return 'Yesterday'
  
  return date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  })
}