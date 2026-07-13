import { useState, useRef, useEffect } from 'react'
import { 
  PaperClipIcon, 
  FaceSmileIcon, 
  MicrophoneIcon, 
  PaperAirplaneIcon,
  XMarkIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { useDispatch, useSelector } from 'react-redux'
import { useSocket } from '../../socket/socket'
import { startTyping, stopTyping } from '../../store/slices/uiSlice'
import { sendMessage } from '../../store/slices/messagesSlice'

export default function MessageInput({ roomId }) {
  const dispatch = useDispatch()
  const { emit } = useSocket()
  const currentUser = useSelector(state => state.auth.user)
  const [text, setText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Handle input change
  const handleChange = (e) => {
    const value = e.target.value
    setText(value)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }

    // Typing indicator
    emit('typing_start', roomId)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      emit('typing_stop', roomId)
    }, 2000)
  }

  // Handle key down
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle send
  const handleSend = () => {
    const messageText = text.trim()
    if (!messageText && attachments.length === 0) return

    const messageData = {
      content: messageText,
      type: attachments.length > 0 ? getMessageType(attachments[0]) : 'text',
      attachments: attachments.map(a => a.id),
      tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // Optimistic update
    dispatch(sendMessage({ roomId, data: messageData }))
    emit('send_message', { roomId, message: messageData })

    // Clear input
    setText('')
    setAttachments([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setShowEmojiPicker(false)
    setShowAttachments(false)
  }

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      if (attachments.length + files.length > 5) return
      const attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file)
      }
      setAttachments(prev => [...prev, attachment])
    })
    e.target.value = ''
  }

  // Remove attachment
  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  // Get message type from attachment
  const getMessageType = (attachment) => {
    if (attachment.type.startsWith('image/')) return 'image'
    if (attachment.type.startsWith('video/')) return 'video'
    if (attachment.type.startsWith('audio/')) return 'audio'
    return 'file'
  }

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      emit('typing_stop', roomId)
    }
  }, [emit, roomId])

  return (
    <div className="border-t border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-4">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((att) => (
            <div 
              key={att.id} 
              className="flex items-center gap-2 px-3 py-1.5 bg-dark-100 dark:bg-dark-800 rounded-lg"
            >
              <div className="w-8 h-8 rounded flex items-center justify-center bg-primary-100 dark:bg-primary-900/30">
                {att.type.startsWith('image/') && att.preview ? (
                  <img src={att.preview} alt="" className="w-full h-full object-cover rounded" />
                ) : att.type.startsWith('video/') ? (
                  <VideoIcon className="w-4 h-4 text-primary-700 dark:text-primary-300" />
                ) : att.type.startsWith('audio/') ? (
                  <MusicalNoteIcon className="w-4 h-4 text-primary-700 dark:text-primary-300" />
                ) : (
                  <DocumentIcon className="w-4 h-4 text-primary-700 dark:text-primary-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-900 dark:text-dark-100 truncate">
                  {att.name}
                </p>
                <p className="text-xs text-dark-500 dark:text-dark-400">
                  {formatSize(att.size)}
                </p>
              </div>
              <button
                onClick={() => removeAttachment(att.id)}
                className="p-1 rounded hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
                aria-label="Remove attachment"
              >
                <XMarkIcon className="w-4 h-4 text-dark-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input area */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <div className="relative">
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <label
            htmlFor="file-upload"
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors text-dark-600 dark:text-dark-300"
            aria-label="Attach file"
          >
            <PaperClipIcon className="w-5 h-5" />
          </label>
        </div>

        {/* Emoji button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            showEmojiPicker 
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-600 dark:text-dark-300'
          )}
          aria-label="Emoji picker"
          aria-expanded={showEmojiPicker}
        >
          <FaceSmileIcon className="w-5 h-5" />
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full px-4 py-2.5 pr-12 rounded-2xl bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 text-dark-900 dark:text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-[150px]"
            rows={1}
            aria-label="Message input"
          />
          {/* Voice recording button */}
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={clsx(
              'absolute right-2 bottom-2 p-2 rounded-full transition-colors',
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'hover:bg-dark-200 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300'
            )}
            aria-label={isRecording ? 'Stop recording' : 'Record voice message'}
          >
            <MicrophoneIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() && attachments.length === 0}
          className={clsx(
            'p-2.5 rounded-full transition-all duration-200 flex-shrink-0',
            (text.trim() || attachments.length > 0)
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-dark-200 dark:bg-dark-700 text-dark-400 dark:text-dark-500 cursor-not-allowed'
          )}
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-700 rounded-xl shadow-lg p-2 z-20 animate-in slide-up">
          <EmojiPicker onSelect={(emoji) => setText(text + emoji)} />
        </div>
      )}
    </div>
  )
}

function EmojiPicker({ onSelect }) {
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
    '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
    '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗',
    '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚',
    '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦',
    '💨', '🕳️', '💣', '💬', '👁️', '🗨️', '🗯️', '💭', '💤', '👋',
    '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
    '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
    '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
    '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻',
    '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄',
    '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '👩', '🧓', '👴',
    '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦',
    '🤷', '🧑‍⚕️', '🧑‍🎓', '🧑‍🏫', '🧑‍⚖️', '🧑‍🌾', '🧑‍🍳', '🧑‍🔧', '🧑‍🏭', '🧑‍💼',
    '🧑‍🔬', '🧑‍💻', '🧑‍🎤', '🧑‍🎨', '🧑‍✈️', '🧑‍🚀', '🧑‍🚒', '👮', '🕵️', '💂',
    '🥷', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰',
    '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜',
    '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🏃', '💃', '🕺', '🕴️',
    '👯', '🧖', '🧗', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏄', '🚣',
    '🏊', '⛹️', '🏋️', '🚴', '🚵', '🤸', '🤼', '🤽', '🤾', '🤹',
    '🧘', '🛀', '🛌', '🧑‍🤝‍🧑', '👭', '👫', '👬', '💏', '💑', '👨‍👩‍👦',
    '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦',
    '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦',
    '👩‍👧', '👩‍👧‍👧', '🗣️', '👤', '👥', '🫂', '👣', '🦰', '🦱', '🦳',
    '🦲', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉',
    '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅',
    '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋',
    '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🦂',
    '🦠', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼',
    '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️',
    '🍀', '🍁', '🍂', '🍃', '🍄', '🪵', '🪨', '🌰', '🍅', '🍆',
    '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄',
    '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🥞', '🧇',
    '🧈', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧂', '🥫',
    '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣',
    '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨',
    '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮',
    '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶',
    '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🥄',
    '🍴', '🍽️', '🥢', '🥣', '🏺', '🌍', '🌎', '🌏', '🌐', '🗺️',
    '🗾', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️',
    '🏞️', '🏟️', '🏛️', '🏗️', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣',
    '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯',
    '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋',
    '⛲', '⛱️', '🏖️', '🏝️', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆',
    '🌇', '🌆', '🌃', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪',
    '🚂', '🚁', '🚀', '🛸', '🚁', '🛩️', '🛫', '🛬', '🪂', '💺',
    '🚀', '🛰️', '🛸', '🛎️', '🧳', '⌛', '⏳', '⌚', '⏰', '⏱️',
    '⏲️', '🕰️', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘',
    '🌙', '🌚', '🌛', '🌜', '☀️', '🌝', '🌞', '🪐', '⭐', '🌟',
    '🌠', '🌌', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️',
    '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '☔', '⛱️', '⚡', '❄️',
    '☃️', '⛄', '☄️', '🌊', '💧', '💦', '💨', '💭', '💤', '💣',
    '💥', '🎃', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊',
    '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁', '🎗️',
    '🎟️', '🎫', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '⚾',
    '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑',
    '🏒', '🥍', '🏓', '🏸', '🥅', '🥊', '🥋', '🥌', '⛸️', '🎿',
    '⛷️', '🏂', '🏌️', '🏄', '🏄‍♀️', '🏄‍♂️', '🚣', '🚣‍♀️', '🚣‍♂️', '🏊',
    '🏊‍♀️', '🏊‍♂️', '⛹️', '⛹️‍♀️', '⛹️‍♂️', '🏋️', '🏋️‍♀️', '🏋️‍♂️', '🚴', '🚴‍♀️',
    '🚴‍♂️', '🚵', '🚵‍♀️', '🚵‍♂️', '🤸', '🤸‍♀️', '🤸‍♂️', '🤼', '🤽', '🤽‍♀️',
    '🤽‍♂️', '🤾', '🤾‍♀️', '🤾‍♂️', '🤹', '🤹‍♀️', '🤹‍♂️', '🧘', '🧘‍♀️', '🧘‍♂️',
    '🛀', '🛌', '🧑‍🤝‍🧑', '👭', '👫', '👬', '💏', '💑', '👨‍👩‍👦', '👨‍👩‍👧',
    '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧',
    '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧',
    '👩‍👧‍👧', '🗣️', '👤', '👥', '🫂', '👣', '🦰', '🦱', '🦳', '🦲',
  ]

  return (
    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto scrollbar-thin">
      {emojis.map((emoji, i) => (
        <button
          key={i}
          onClick={() => onSelect(emoji)}
          className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg transition-colors text-2xl"
          aria-label={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}