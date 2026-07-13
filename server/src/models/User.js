const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline',
  },
  customStatus: {
    type: String,
    maxlength: 100,
    default: '',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  friendRequests: {
    sent: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    received: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  pushToken: {
    type: String,
    default: '',
  },
  settings: {
    notifications: {
      messages: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      reactions: { type: Boolean, default: true },
      sounds: { type: Boolean, default: true },
    },
    privacy: {
      showLastSeen: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true },
      allowFriendRequests: { type: Boolean, default: true },
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.virtual('rooms', {
  ref: 'ChatRoom',
  localField: '_id',
  foreignField: 'participants',
});

userSchema.index({ username: 'text', email: 'text' });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    status: this.status,
    customStatus: this.customStatus,
    lastSeen: this.lastSeen,
    isActive: this.isActive,
    settings: this.settings,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);