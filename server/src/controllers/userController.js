const { User, ChatRoom } = require('../models')
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../middleware/errorHandler')
const uploadService = require('../services/uploadService')
const cloudinary = require('cloudinary').v2

const getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username email avatar status lastSeen customStatus settings')
      .populate('friendRequests.sent', 'username email avatar')
      .populate('friendRequests.received', 'username email avatar')
      .populate('blockedUsers', 'username email avatar')

    res.json({
      friends: user.friends.map(f => f.toPublicJSON()),
      friendRequests: {
        sent: user.friendRequests.sent.map(r => r.toPublicJSON()),
        received: user.friendRequests.received.map(r => r.toPublicJSON()),
      },
      blockedUsers: user.blockedUsers.map(b => b.toPublicJSON()),
    })
  } catch (error) {
    next(error)
  }
}

const sendFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user._id

    if (userId === currentUserId.toString()) {
      throw new BadRequestError('Cannot send friend request to yourself')
    }

    const targetUser = await User.findById(userId)
    if (!targetUser) throw new NotFoundError('User not found')

    const currentUser = await User.findById(currentUserId)
    
    // Check if already friends
    if (currentUser.friends.includes(userId)) {
      throw new ConflictError('Already friends with this user', 'ALREADY_FRIENDS')
    }

    // Check if request already sent
    if (currentUser.friendRequests.sent.includes(userId)) {
      throw new ConflictError('Friend request already sent', 'REQUEST_SENT')
    }

    // Check if request received
    if (currentUser.friendRequests.received.includes(userId)) {
      throw new ConflictError('This user already sent you a friend request', 'REQUEST_RECEIVED')
    }

    // Check if blocked
    if (currentUser.blockedUsers.includes(userId) || targetUser.blockedUsers.includes(currentUserId)) {
      throw new ForbiddenError('Cannot send friend request to this user')
    }

    // Check privacy settings
    if (!targetUser.settings.privacy.allowFriendRequests) {
      throw new ForbiddenError('This user is not accepting friend requests')
    }

    currentUser.friendRequests.sent.push(userId)
    targetUser.friendRequests.received.push(currentUserId)
    
    await Promise.all([currentUser.save(), targetUser.save()])

    // Create notification
    await createNotification({
      recipient: userId,
      sender: currentUserId,
      type: 'friend_request',
      title: 'New friend request',
      body: `${currentUser.username} sent you a friend request`,
      data: { userId: currentUserId },
      priority: 'high',
    })

    res.json({ message: 'Friend request sent' })
  } catch (error) {
    next(error)
  }
}

const acceptFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user._id

    const currentUser = await User.findById(currentUserId)
    const targetUser = await User.findById(userId)

    if (!targetUser) throw new NotFoundError('User not found')
    if (!currentUser.friendRequests.received.includes(userId)) {
      throw new BadRequestError('No friend request from this user')
    }

    // Add to friends
    currentUser.friends.push(userId)
    targetUser.friends.push(currentUserId)

    // Remove from requests
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(id => !id.equals(userId))
    targetUser.friendRequests.sent = targetUser.friendRequests.sent.filter(id => !id.equals(currentUserId))

    await Promise.all([currentUser.save(), targetUser.save()])

    // Create notification
    await createNotification({
      recipient: userId,
      sender: currentUserId,
      type: 'friend_accepted',
      title: 'Friend request accepted',
      body: `${currentUser.username} accepted your friend request`,
      data: { userId: currentUserId },
    })

    res.json({ 
      message: 'Friend request accepted',
      friend: targetUser.toPublicJSON(),
    })
  } catch (error) {
    next(error)
  }
}

const rejectFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user._id

    const currentUser = await User.findById(currentUserId)

    if (!currentUser.friendRequests.received.includes(userId)) {
      throw new BadRequestError('No friend request from this user')
    }

    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(id => !id.equals(userId))
    
    // Also remove from sender's sent requests
    await User.findByIdAndUpdate(userId, {
      $pull: { 'friendRequests.sent': currentUserId }
    })

    await currentUser.save()

    res.json({ message: 'Friend request rejected' })
  } catch (error) {
    next(error)
  }
}

const removeFriend = async (req, res, next) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user._id

    const currentUser = await User.findById(currentUserId)

    if (!currentUser.friends.includes(userId)) {
      throw new BadRequestError('Not friends with this user')
    }

    currentUser.friends = currentUser.friends.filter(id => !id.equals(userId))
    
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: currentUserId }
    })

    await currentUser.save()

    res.json({ message: 'Friend removed' })
  } catch (error) {
    next(error)
  }
}

const getFriendRequests = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.sent', 'username email avatar')
      .populate('friendRequests.received', 'username email avatar')

    res.json({
      sent: user.friendRequests.sent.map(r => r.toPublicJSON()),
      received: user.friendRequests.received.map(r => r.toPublicJSON()),
    })
  } catch (error) {
    next(error)
  }
}

const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user._id

    if (userId === currentUserId.toString()) {
      throw new BadRequestError('Cannot block yourself')
    }

    const targetUser = await User.findById(userId)
    if (!targetUser) throw new NotFoundError('User not found')

    const currentUser = await User.findById(currentUserId)

    currentUser.blockedUsers.push(userId)
    targetUser.blockedUsers.push(currentUserId)

    // Remove friend relationship if exists
    if (currentUser.friends.includes(userId)) {
      currentUser.friends = currentUser.friends.filter(id => !id.equals(userId))
      targetUser.friends = targetUser.friends.filter(id => !id.equals(currentUserId))
    }

    // Remove friend requests
    currentUser.friendRequests.sent = currentUser.friendRequests.sent.filter(id => !id.equals(userId))
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(id => !id.equals(userId))
    targetUser.friendRequests.sent = targetUser.friendRequests.sent.filter(id => !id.equals(currentUserId))
    targetUser.friendRequests.received = targetUser.friendRequests.received.filter(id => !id.equals(currentUserId))

    await Promise.all([currentUser.save(), targetUser.save()])

    res.json({ message: 'User blocked' })
  } catch (error) {
    next(error)
  }
}

const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user._id

    const currentUser = await User.findById(currentUserId)
    currentUser.blockedUsers = currentUser.blockedUsers.filter(id => !id.equals(userId))
    
    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: currentUserId }
    })

    await currentUser.save()

    res.json({ message: 'User unblocked' })
  } catch (error) {
    next(error)
  }
}

const getBlockedUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'username email avatar')

    res.json({
      blockedUsers: user.blockedUsers.map(b => b.toPublicJSON()),
    })
  } catch (error) {
    next(error)
  }
}

const getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('settings')
    res.json({ settings: user.settings })
  } catch (error) {
    next(error)
  }
}

const updateSettings = async (req, res, next) => {
  try {
    const { notifications, privacy, theme } = req.body
    const user = await User.findById(req.user._id)

    if (notifications) {
      user.settings.notifications = { ...user.settings.notifications, ...notifications }
    }
    if (privacy) {
      user.settings.privacy = { ...user.settings.privacy, ...privacy }
    }
    if (theme) {
      user.settings.theme = theme
    }

    await user.save()
    res.json({ settings: user.settings })
  } catch (error) {
    next(error)
  }
}

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw new BadRequestError('No file uploaded')

    const result = await uploadService.uploadImage(req.file.buffer, {
      folder: 'avatars',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ],
    })

    const user = await User.findById(req.user._id)
    
    // Delete old avatar if exists
    if (user.avatar) {
      const publicId = user.avatar.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(`avatars/${publicId}`)
    }

    user.avatar = result.secure_url
    await user.save()

    res.json({ 
      avatar: user.avatar,
      message: 'Avatar updated',
    })
  } catch (error) {
    next(error)
  }
}

const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (user.avatar) {
      const publicId = user.avatar.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(`avatars/${publicId}`)
      user.avatar = ''
      await user.save()
    }
    res.json({ message: 'Avatar deleted' })
  } catch (error) {
    next(error)
  }
}

const getProfile = async (req, res, next) => {
  try {
    const { userId } = req.params
    const targetId = userId || req.user._id

    const user = await User.findById(targetId)
    if (!user) throw new NotFoundError('User not found')

    const isOwn = targetId === req.user._id.toString()
    const isFriend = user.friends.includes(req.user._id)
    const isBlocked = user.blockedUsers.includes(req.user._id)

    res.json({ 
      user: user.toPublicJSON(req.user._id),
      isOwn,
      isFriend,
      isBlocked,
    })
  } catch (error) {
    next(error)
  }
}

const updateProfile = async (req, res, next) => {
  try {
    const { username, bio, customStatus } = req.body
    const user = await User.findById(req.user._id)

    if (username && username !== user.username) {
      const exists = await User.findOne({ username, _id: { $ne: user._id } })
      if (exists) throw new ConflictError('Username already taken', 'USERNAME_EXISTS')
      user.username = username
    }

    if (bio !== undefined) user.bio = bio
    if (customStatus !== undefined) user.customStatus = customStatus

    await user.save()
    res.json({ user: user.toPublicJSON(req.user._id) })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendRequests,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getSettings,
  updateSettings,
  uploadAvatar,
  deleteAvatar,
  getProfile,
  updateProfile,
}