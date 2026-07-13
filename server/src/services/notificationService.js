const { Notification, User } = require('../models')

const createNotification = async ({ recipient, sender, type, title, body, data, priority = 'normal', channels = { inApp: true, push: false, email: false } }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      body,
      data,
      priority,
      channels,
    })

    // Emit real-time notification
    // This would be called from socket handlers
    return notification
  } catch (error) {
    console.error('Create notification error:', error)
    return null
  }
}

const createBulkNotifications = async (recipients, { sender, type, title, body, data, priority = 'normal' }) => {
  try {
    const notifications = recipients.map(recipient => ({
      recipient,
      sender,
      type,
      title,
      body,
      data,
      priority,
    }))

    return await Notification.insertMany(notifications)
  } catch (error) {
    console.error('Bulk create notifications error:', error)
    return []
  }
}

const markAsRead = async (userId, notificationIds) => {
  try {
    if (!Array.isArray(notificationIds)) {
      notificationIds = [notificationIds]
    }
    return await Notification.updateMany(
      { _id: { $in: notificationIds }, recipient: userId },
      { isRead: true, readAt: new Date() }
    )
  } catch (error) {
    console.error('Mark as read error:', error)
  }
}

const markAllAsRead = async (userId) => {
  try {
    return await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    )
  } catch (error) {
    console.error('Mark all as read error:', error)
  }
}

const getUnreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({ recipient: userId, isRead: false })
  } catch (error) {
    console.error('Get unread count error:', error)
    return 0
  }
}

const deleteNotification = async (userId, notificationId) => {
  try {
    return await Notification.deleteOne({ _id: notificationId, recipient: userId })
  } catch (error) {
    console.error('Delete notification error:', error)
  }
}

module.exports = {
  createNotification,
  createBulkNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
}