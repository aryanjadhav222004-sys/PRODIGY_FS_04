const { Notification, User } = require('../models')
const { NotFoundError, ForbiddenError } = require('../middleware/errorHandler')
const { validatePagination } = require('../middleware/validation')

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query
    const userId = req.user._id

    const query = { recipient: userId }
    if (isRead !== undefined) query.isRead = isRead === 'true'

    const notifications = await Notification.find(query)
      .populate('sender', 'username email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    const total = await Notification.countDocuments(query)
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false })

    res.json({
      notifications: notifications.map(n => n.toPublicJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    })
  } catch (error) {
    next(error)
  }
}

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const notification = await Notification.findById(id)
    if (!notification) throw new NotFoundError('Notification not found')
    if (!notification.recipient.equals(userId)) throw new ForbiddenError('Not your notification')

    await notification.markAsRead()

    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    next(error)
  }
}

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    )

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    next(error)
  }
}

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const notification = await Notification.findById(id)
    if (!notification) throw new NotFoundError('Notification not found')
    if (!notification.recipient.equals(userId)) throw new ForbiddenError('Not your notification')

    await notification.deleteOne()

    res.json({ message: 'Notification deleted' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
}