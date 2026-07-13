const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'system', 'reply', 'forward'],
    default: 'text',
  },
  content: {
    type: String,
    maxlength: 5000,
    default: '',
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attachment',
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  reactions: [{
    emoji: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
  deliveredTo: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: { type: Date, default: Date.now },
  }],
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ replyTo: 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

messageSchema.virtual('replyToMessage', {
  ref: 'Message',
  localField: 'replyTo',
  foreignField: '_id',
  justOne: true,
});

messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(r => r.user.toString() === userId.toString());
};

messageSchema.methods.addReadReceipt = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
  return this.save();
};

messageSchema.methods.addDeliveryReceipt = function(userId) {
  const exists = this.deliveredTo.some(d => d.user.toString() === userId.toString());
  if (!exists) {
    this.deliveredTo.push({ user: userId, deliveredAt: new Date() });
  }
  return this.save();
};

messageSchema.methods.addReaction = function(emoji, userId) {
  let reaction = this.reactions.find(r => r.emoji === emoji);
  if (!reaction) {
    reaction = { emoji, users: [] };
    this.reactions.push(reaction);
  }
  if (!reaction.users.some(u => u.toString() === userId.toString())) {
    reaction.users.push(userId);
  }
  return this.save();
};

messageSchema.methods.removeReaction = function(emoji, userId) {
  const reaction = this.reactions.find(r => r.emoji === emoji);
  if (reaction) {
    reaction.users = reaction.users.filter(u => u.toString() !== userId.toString());
    if (reaction.users.length === 0) {
      this.reactions = this.reactions.filter(r => r.emoji !== emoji);
    }
  }
  return this.save();
};

messageSchema.methods.softDelete = function(userId, forEveryone = false) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  if (forEveryone) {
    this.content = 'This message was deleted';
    this.attachments = [];
  } else {
    this.deletedFor.push(userId);
  }
  return this.save();
};

messageSchema.methods.toPublicJSON = function(currentUserId = null) {
  const obj = {
    id: this._id,
    room: this.room,
    sender: this.sender,
    type: this.type,
    content: this.isDeleted && (!currentUserId || !this.deletedFor.some(d => d.toString() === currentUserId.toString())) 
      ? 'This message was deleted' 
      : this.content,
    attachments: this.attachments,
    replyTo: this.replyTo,
    forwardedFrom: this.forwardedFrom,
    mentions: this.mentions,
    reactions: this.reactions,
    isEdited: this.isEdited,
    editedAt: this.editedAt,
    isDeleted: this.isDeleted,
    deletedAt: this.deletedAt,
    readBy: this.readBy,
    deliveredTo: this.deliveredTo,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  if (currentUserId) {
    obj.isReadByMe = this.isReadBy(currentUserId);
    obj.myReactions = this.reactions
      .filter(r => r.users.some(u => u.toString() === currentUserId.toString()))
      .map(r => r.emoji);
  }

  return obj;
};

module.exports = mongoose.model('Message', messageSchema);