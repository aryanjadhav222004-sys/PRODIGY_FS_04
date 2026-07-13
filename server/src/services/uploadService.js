const cloudinary = require('cloudinary').v2
const config = require('../config')

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
})

const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: options.folder || 'uploads',
        public_id: options.public_id,
        transformation: options.transformation,
        quality: options.quality || 'auto',
        format: options.format || 'webp',
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    uploadStream.end(buffer)
  })
}

const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId)
}

const uploadImage = async (file, options = {}) => {
  const result = await uploadToCloudinary(file.buffer, {
    folder: 'images',
    transformation: [
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
      { format: 'webp' },
    ],
    ...options,
  })
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    size: result.bytes,
  }
}

const uploadVideo = async (file, options = {}) => {
  const result = await uploadToCloudinary(file.buffer, {
    folder: 'videos',
    resource_type: 'video',
    ...options,
  })
  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration,
    format: result.format,
    size: result.bytes,
  }
}

const uploadAudio = async (file, options = {}) => {
  const result = await uploadToCloudinary(file.buffer, {
    folder: 'audio',
    resource_type: 'video', // Cloudinary uses video for audio too
    ...options,
  })
  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration,
    format: result.format,
    size: result.bytes,
  }
}

const uploadFile = async (file, options = {}) => {
  const result = await uploadToCloudinary(file.buffer, {
    folder: 'files',
    resource_type: 'raw',
    ...options,
  })
  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size: result.bytes,
  }
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadFile,
}