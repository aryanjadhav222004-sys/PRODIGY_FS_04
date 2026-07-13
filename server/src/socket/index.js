const { Message, ChatRoom, User, Notification } = require('../models')
const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt')

const onlineUsers = new Map()
const userSockets = new Map()

const setupSocketHandlers = (io, socket) => {
  const userId = socket.userId

  // Track online users
  onlineUsers.set(userId, socket.id)
  userSockets.set(socket.id, userId)

  // Update user status
  updateUserStatus(userId, 'online')

  // Join user's rooms
  joinUserRooms(socket, userId)

  // Handle room joining
  socket.on('join_room', async (roomId) => {
    try {
      const room = await ChatRoom.findById(roomId)
      if (!room || !room.isParticipant(userId)) {
        socket.emit('error', { message: 'Not authorized to join this room' })
        return
      }

      socket.join(roomId)
      console.log(`User ${userId} joined room ${roomId}`)
    } catch (error) {
      socket.emit('error', { message: 'Failed to join room' })
    }
  })

  // Handle room leaving
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId)
    console.log(`User ${userId} left room ${roomId}`)
  })

  // Handle sending message
  socket.on('send_message', async (data) => {
    try {
      const { roomId, message } = data
      
      const room = await ChatRoom.findById(roomId)
      if (!room || !room.isParticipant(userId)) {
        socket.emit('error', { message: 'Not authorized to send message' })
        return
      }

      // Create message
      const newMessage = await Message.create({
        room: roomId,
        sender: userId,
        content: message.content || '',
        type: message.type || 'text',
        replyTo: message.replyTo,
        attachments: message.attachments || [],
      })

      await newMessage.populate('sender', 'username email avatar')
      if (newMessage.replyTo) {
        await newMessage.populate('replyTo', 'content sender')
      }
      if (newMessage.attachments.length > 0) {
        await newMessage.populate('attachments')
      }

      // Update room
      room.lastMessage = newMessage._id
      room.lastActivity = new Date()
      await room.save()

      const messageData = newMessage.toPublicJSON(userId)

      // Emit to room
      io.to(roomId).emit('new_message', messageData)

      // Create notifications for other participants
      const otherParticipants = room.participants.filter(p => !p.equals(userId))
      for (const participantId of otherParticipants) {
        await Notification.create({
          recipient: participantId,
          sender: userId,
          type: 'message',
          title: 'New message',
          body: message.content?.substring(0, 100) || 'New message',
          data: { messageId: newMessage._id, roomId },
          priority: 'high',
        })
      }

      // Emit notification events
      for (const participantId of otherParticipants) {
        io.to(participantId.toString()).emit('notification_created', {
          type: 'message',
          title: 'New message',
          body: message.content?.substring(0, 100) || 'New message',
          data: { messageId: newMessage._id, roomId },
        })
      }
    } catch (error) {
      console.error('Send message error:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // Handle typing
  socket.on('typing_start', (roomId) => {
    socket.to(roomId).emit('user_typing', { roomId, userId, username: socket.username })
  })

  socket.on('typing_stop', (roomId) => {
    socket.to(roomId).emit('user_stopped_typing', { roomId, userId })
  })

  // Handle read receipts
  socket.on('mark_read', async (data) => {
    try {
      const { roomId, messageId } = data
      const message = await Message.findById(messageId)
      if (message) {
        await message.addReadReceipt(userId)
        
        // Emit to sender
        const senderSocketId = onlineUsers.get(message.sender.toString())
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_read', { messageId, readBy: userId, readAt: new Date() })
        }
      }
    } catch (error) {
      console.error('Mark read error:', error)
    }
  })

  // Handle reactions
  socket.on('add_reaction', async (data) => {
    try {
      const { messageId, emoji } = data
      const message = await Message.findById(messageId)
      if (!message) return

      await message.addReaction(emoji, userId)

      // Emit to room
      io.to(message.room.toString()).emit('reaction_added', { messageId, emoji, userId })
    } catch (error) {
      console.error('Add reaction error:', error)
    }
  })

  socket.on('remove_reaction', async (data) => {
    try {
      const { messageId, emoji } = data
      const message = await Message.findById(messageId)
      if (!message) return

      await message.removeReaction(emoji, userId)

      // Emit to room
      io.to(message.room.toString()).emit('reaction_removed', { messageId, emoji, userId })
    } catch (error) {
      console.error('Remove reaction error:', error)
    }
  })

  // Handle status change
  socket.on('status_change', async (status) => {
    const user = await User.findByIdAndUpdate(userId, { status }, { new: true })
    if (user) {
      // Emit to all friends/rooms
      io.emit('user_status_change', { userId, status })
    }
  })

  // Handle disconnect
  socket.on('disconnect', async (reason) => {
    console.log(`User ${userId} disconnected: ${reason}`)
    
    // Clean up
    onlineUsers.delete(userId)
    userSockets.delete(socket.id)

    // Update status to offline after grace period
    setTimeout(async () => {
      if (!onlineUsers.has(userId)) {
        await updateUserStatus(userId, 'offline')
        io.emit('user_offline', { userId, lastSeen: new Date() })
      }
    }, 5000)
  })

  // Handle connection error
  socket.on('error', (error) => {
    console.error(`Socket error for user ${userId}:`, error)
  })
}

const joinUserRooms = async (socket, userId) => {
  try {
    const rooms = await ChatRoom.find({ 
      participants: userId, 
      isActive: true 
    }).select('_id')
    
    rooms.forEach(room => {
      socket.join(room._id.toString())
    })
  } catch (error) {
    console.error('Join user rooms error:', error)
  }
}

const updateUserStatus = async (userId, status) => {
  try {
    await User.findByIdAndUpdate(userId, { 
      status,
      lastSeen: status === 'offline' ? new Date() : undefined,
    })
  } catch (error) {
    console.error('Update user status error:', error)
  }
}

// Socket authentication middleware
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  extractTokenFromHeader(socket.handshake.headers.authorization)
    
    if (!token) {
      return next(new Error('Authentication required'))
    }

    const decoded = verifyAccessToken(token)
    const user = await User.findById(decoded.userId).select('username email avatar status')
    
    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'))
    }

    socket.userId = user._id.toString()
    socket.username = user.username
    socket.user = user
    next()
  } catch (error) {
    next(new Error('Invalid token'))
  }
}

// Utility functions
const emitToUser = (io, userId, event, data) => {
  const socketId = onlineUsers.get(userId)
  if (socketId) {
    io.to(socketId).emit(event, data)
  }
}

const emitToRoom = (io, roomId, event, data, excludeUserId = null) => {
  io.to(roomId).emit(event, data)
}

module.exports = {
  setupSocketHandlers,
  socketAuthMiddleware,
  onlineUsers,
  emitToUser,
  emitToRoom,
}