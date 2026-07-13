require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/prodigy_chat',
    testUri: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/prodigy_chat_test',
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'default-session-secret',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
    mongoSecret: process.env.MONGO_SESSION_SECRET || 'default-mongo-session-secret',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    path: process.env.UPLOAD_PATH || './public/uploads',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};