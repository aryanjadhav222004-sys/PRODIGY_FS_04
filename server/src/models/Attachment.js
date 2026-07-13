const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
  },
  storedName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    format: String,
  },
  isProcessed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

attachmentSchema.index({ uploadedBy: 1 });
attachmentSchema.index({ message: 1 });
attachmentSchema.index({ room: 1 });

attachmentSchema.virtual('type').get(function() {
  if (this.mimeType.startsWith('image/')) return 'image';
  if (this.mimeType.startsWith('video/')) return 'video';
  if (this.mimeType.startsWith('audio/')) return 'audio';
  return 'file';
});

attachmentSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    originalName: this.originalName,
    mimeType: this.mimeType,
    size: this.size,
    url: this.url,
    thumbnailUrl: this.thumbnailUrl,
    type: this.type,
    metadata: this.metadata,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Attachment', attachmentSchema);