import { io } from 'socket.io-client'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccessToken } from '../store/slices/authSlice'

let socket = null

export const initializeSocket = (token) => {
  if (socket?.connected) {
    return socket
  }

  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const useSocket = () => {
  const dispatch = useDispatch()
  const accessToken = useSelector(selectAccessToken)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        disconnectSocket()
        socketRef.current = null
        setIsConnected(false)
      }
      return
    }

    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = initializeSocket(accessToken)
    }

    const s = socketRef.current

    s.on('connect', () => {
      setIsConnected(true)
      console.log('Socket connected:', s.id)
    })

    s.on('disconnect', (reason) => {
      setIsConnected(false)
      console.log('Socket disconnected:', reason)
    })

    s.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    // Message events
    s.on('new_message', (message) => {
      dispatch({ type: 'messages/addMessage', payload: message })
    })

    s.on('message_updated', (data) => {
      dispatch({ type: 'messages/updateMessage', payload: data })
    })

    s.on('message_deleted', (data) => {
      dispatch({ type: 'messages/deleteMessage', payload: data })
    })

    s.on('message_read', (data) => {
      dispatch({ type: 'messages/markAsRead', payload: data })
    })

    // Reaction events
    s.on('reaction_added', (data) => {
      dispatch({ type: 'messages/addReaction', payload: data })
    })

    s.on('reaction_removed', (data) => {
      dispatch({ type: 'messages/removeReaction', payload: data })
    })

    // Typing events
    s.on('user_typing', (data) => {
      dispatch({ type: 'ui/setTypingUser', payload: data })
    })

    s.on('user_stopped_typing', (data) => {
      dispatch({ type: 'ui/clearTypingUser', payload: data })
    })

    // Presence events
    s.on('user_online', (userId) => {
      dispatch({ type: 'rooms/updateUserStatus', payload: { userId, status: 'online' } })
    })

    s.on('user_offline', (data) => {
      dispatch({ type: 'rooms/updateUserStatus', payload: data })
    })

    s.on('user_status_change', (data) => {
      dispatch({ type: 'rooms/updateUserStatus', payload: data })
    })

    // Room events
    s.on('room_created', (room) => {
      dispatch({ type: 'rooms/addRoom', payload: room })
    })

    s.on('room_updated', (room) => {
      dispatch({ type: 'rooms/updateRoomInList', payload: room })
    })

    s.on('participant_added', (data) => {
      dispatch({ type: 'rooms/addParticipantToRoom', payload: data })
    })

    s.on('participant_removed', (data) => {
      dispatch({ type: 'rooms/removeParticipantFromRoom', payload: data })
    })

    s.on('room_deleted', (roomId) => {
      dispatch({ type: 'rooms/removeRoomFromList', payload: roomId })
    })

    // Notification events
    s.on('notification_created', (notification) => {
      dispatch({ type: 'notifications/addNotification', payload: notification })
    })

    s.on('notification_read', (data) => {
      dispatch({ type: 'notifications/markAsRead', payload: data })
    })

    return () => {
      // Don't disconnect on unmount, keep socket alive
      // Cleanup listeners if needed
    }
  }, [accessToken, dispatch])

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  const joinRoom = useCallback((roomId) => {
    emit('join_room', roomId)
  }, [emit])

  const leaveRoom = useCallback((roomId) => {
    emit('leave_room', roomId)
  }, [emit])

  const sendMessage = useCallback((roomId, message) => {
    emit('send_message', { roomId, message })
  }, [emit])

  const startTyping = useCallback((roomId) => {
    emit('typing_start', roomId)
  }, [emit])

  const stopTyping = useCallback((roomId) => {
    emit('typing_stop', roomId)
  }, [emit])

  const markAsRead = useCallback((roomId, messageId) => {
    emit('mark_read', { roomId, messageId })
  }, [emit])

  const addReaction = useCallback((messageId, emoji) => {
    emit('add_reaction', { messageId, emoji })
  }, [emit])

  const removeReaction = useCallback((messageId, emoji) => {
    emit('remove_reaction', { messageId, emoji })
  }, [emit])

  const updateStatus = useCallback((status) => {
    emit('status_change', status)
  }, [emit])

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    addReaction,
    removeReaction,
    updateStatus,
  }
}

export default useSocket