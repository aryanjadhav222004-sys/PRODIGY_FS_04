const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: [
      'message',
      'mention',
      'reaction',
      'reply',
      'friend_request',
      'friend_accepted',
      'room_invite',
      'room_mention',
      'system',
    ],
    required: true,
  },
  title: {
    type: String,
    maxlength: 200,
  },
  body: {
    type: String,
    maxlength: 500,
  },
  data: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String,
    actionUrl: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal',
  },
  channels: {
    inApp: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    body: this.body,
    data: this.data,
    isRead: this.isRead,
    readAt: this.readAt,
    priority: this.priority,
    sender: this.sender,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Notification', notificationSchema);