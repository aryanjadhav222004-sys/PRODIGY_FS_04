import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'

const quickReactions = ['❤️', '👍', '👎', '😂', '😮', '😢', '😡', '🎉', '🔥', '👀']

export default function ReactionPicker({ 
  onSelect, 
  onClose, 
  myReactions = [] 
}) {
  const pickerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div 
      ref={pickerRef}
      className="bg-white dark:bg-dark-900 rounded-lg shadow-lg border border-dark-200 dark:border-dark-700 p-2 w-56"
      role="menu"
    >
      <div className="flex items-center gap-1 mb-2 px-1">
        <span className="text-xs font-medium text-dark-500 dark:text-dark-400">Quick reactions</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {quickReactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className={clsx(
              'p-1.5 rounded-lg transition-colors text-xl',
              myReactions.includes(emoji)
                ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500/50'
                : 'hover:bg-dark-100 dark:hover:bg-dark-800'
            )}
            role="menuitem"
            aria-pressed={myReactions.includes(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <hr className="my-2 border-dark-200 dark:border-dark-700" />
      <div className="flex items-center justify-center px-1">
        <button
          onClick={onClose}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          More emojis →
        </button>
      </div>
    </div>
  )
}