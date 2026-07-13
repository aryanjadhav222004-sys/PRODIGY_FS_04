const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true,
    default: 'private',
  },
  description: {
    type: String,
    maxlength: 500,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  settings: {
    onlyAdminsCanSend: { type: Boolean, default: false },
    onlyAdminsCanAddMembers: { type: Boolean, default: true },
    onlyAdminsCanEditInfo: { type: Boolean, default: true },
    disappearingMessages: { type: Number, default: 0 },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  mutedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    until: { type: Date },
  }],
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ lastActivity: -1 });
chatRoomSchema.index({ type: 1 });

chatRoomSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'room',
});

chatRoomSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.toString() === userId.toString());
};

chatRoomSchema.methods.isAdmin = function(userId) {
  return this.admins.some(a => a.toString() === userId.toString());
};

chatRoomSchema.methods.addParticipant = function(userId) {
  if (!this.isParticipant(userId)) {
    this.participants.push(userId);
  }
  return this.save();
};

chatRoomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.toString() !== userId.toString());
  this.admins = this.admins.filter(a => a.toString() !== userId.toString());
  return this.save();
};

chatRoomSchema.methods.toPublicJSON = function(currentUserId = null) {
  const obj = {
    id: this._id,
    name: this.name,
    type: this.type,
    description: this.description,
    avatar: this.avatar,
    participants: this.participants,
    admins: this.admins,
    createdBy: this.createdBy,
    lastMessage: this.lastMessage,
    lastActivity: this.lastActivity,
    settings: this.settings,
    isActive: this.isActive,
    pinnedMessages: this.pinnedMessages,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  if (currentUserId) {
    const muted = this.mutedBy.find(m => m.user.toString() === currentUserId.toString());
    obj.isMuted = !!muted;
    obj.mutedUntil = muted?.until;
  }

  return obj;
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);