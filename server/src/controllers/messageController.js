const { Message, ChatRoom, Attachment, User } = require('../models')
const { NotFoundError, ForbiddenError, BadRequestError } = require('../middleware/errorHandler')
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/uploadService')
const { createNotification } = require('../services/notificationService')

const getMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params
    const { page = 1, limit = 50, cursor } = req.query
    const userId = req.user._id

    const room = await ChatRoom.findById(roomId)
    if (!room) throw new NotFoundError('Room not found')
    if (!room.isParticipant(userId)) throw new ForbiddenError('Not a participant of this room')

    const query = { room: roomId, isDeleted: false }
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) }
    }

    const messages = await Message.find(query)
      .populate('sender', 'username email avatar')
      .populate('replyTo', 'content sender')
      .populate('replyTo.sender', 'username')
      .populate('attachments')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    const total = await Message.countDocuments(query)

    res.json({
      messages: messages.map(m => m.toPublicJSON(userId)).reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}

const sendMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params
    const { content, type = 'text', replyTo, attachments = [] } = req.body
    const userId = req.user._id

    const room = await ChatRoom.findById(roomId)
    if (!room) throw new NotFoundError('Room not found')
    if (!room.isParticipant(userId)) throw new ForbiddenError('Not a participant of this room')

    if (room.type === 'group' && room.settings.onlyAdminsCanSend && !room.isAdmin(userId)) {
      throw new ForbiddenError('Only admins can send messages in this group')
    }

    const message = await Message.create({
      room: roomId,
      sender: userId,
      content: content || '',
      type,
      replyTo,
      attachments,
    })

    await message.populate('sender', 'username email avatar')
    if (replyTo) {
      await message.populate('replyTo', 'content sender')
      await message.populate('replyTo.sender', 'username')
    }
    if (attachments.length > 0) {
      await message.populate('attachments')
    }

    // Update room last activity
    room.lastMessage = message._id
    room.lastActivity = new Date()
    await room.save()

    // Create notifications for other participants
    const otherParticipants = room.participants.filter(p => !p.equals(userId))
    for (const participantId of otherParticipants) {
      await createNotification({
        recipient: participantId,
        sender: userId,
        type: 'message',
        title: 'New message',
        body: content?.substring(0, 100) || 'New message',
        data: { messageId: message._id, roomId },
        priority: 'high',
      })
    }

    res.status(201).json({ message: message.toPublicJSON(userId) })
  } catch (error) {
    next(error)
  }
}

const editMessage = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params
    const { content } = req.body
    const userId = req.user._id

    const message = await Message.findById(messageId)
    if (!message) throw new NotFoundError('Message not found')
    if (!message.sender.equals(userId)) throw new ForbiddenError('Can only edit your own messages')
    if (message.isDeleted) throw new BadRequestError('Cannot edit deleted message')

    message.content = content
    message.isEdited = true
    message.editedAt = new Date()
    await message.save()

    await message.populate('sender', 'username email avatar')
    if (message.replyTo) {
      await message.populate('replyTo', 'content sender')
    }

    res.json({ message: message.toPublicJSON(userId) })
  } catch (error) {
    next(error)
  }
}

const deleteMessage = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params
    const { forEveryone = false } = req.query
    const userId = req.user._id

    const message = await Message.findById(messageId)
    if (!message) throw new NotFoundError('Message not found')
    if (!message.sender.equals(userId)) throw new ForbiddenError('Can only delete your own messages')

    await message.softDelete(userId, forEveryone)

    if (forEveryone) {
      // Emit to all participants for real-time update
    }

    res.json({ message: 'Message deleted' })
  } catch (error) {
    next(error)
  }
}

const markAsRead = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params
    const userId = req.user._id

    const message = await Message.findById(messageId)
    if (!message) throw new NotFoundError('Message not found')

    await message.addReadReceipt(userId)

    res.json({ message: 'Marked as read' })
  } catch (error) {
    next(error)
  }
}

const addReaction = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params
    const { emoji } = req.body
    const userId = req.user._id

    const message = await Message.findById(messageId)
    if (!message) throw new NotFoundError('Message not found')

    await message.addReaction(emoji, userId)

    res.json({ message: 'Reaction added' })
  } catch (error) {
    next(error)
  }
}

const removeReaction = async (req, res, next) => {
  try {
    const { roomId, messageId, emoji } = req.params
    const userId = req.user._id

    const message = await Message.findById(messageId)
    if (!message) throw new NotFoundError('Message not found')

    await message.removeReaction(emoji, userId)

    res.json({ message: 'Reaction removed' })
  } catch (error) {
    next(error)
  }
}

const pinMessage = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params
    const userId = req.user._id

    const room = await ChatRoom.findById(roomId)
    if (!room) throw new NotFoundError('Room not found')
    if (!room.isAdmin(userId)) throw new ForbiddenError('Only admins can pin messages')

    if (!room.pinnedMessages.includes(messageId)) {
      room.pinnedMessages.push(messageId)
      await room.save()
    }

    res.json({ message: 'Message pinned' })
  } catch (error) {
    next(error)
  }
}

const unpinMessage = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params
    const userId = req.user._id

    const room = await ChatRoom.findById(roomId)
    if (!room) throw new NotFoundError('Room not found')
    if (!room.isAdmin(userId)) throw new ForbiddenError('Only admins can unpin messages')

    room.pinnedMessages = room.pinnedMessages.filter(id => !id.equals(messageId))
    await room.save()

    res.json({ message: 'Message unpinned' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markAsRead,
  addReaction,
  removeReaction,
  pinMessage,
  unpinMessage,
}