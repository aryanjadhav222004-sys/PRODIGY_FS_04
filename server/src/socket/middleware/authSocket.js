const { verifyAccessToken, extractTokenFromHeader } = require('../../utils/jwt')
const User = require('../../models/User')

const authenticateSocket = async (socket, next) => {
  try {
    // Try to get token from handshake auth
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.split(' ')[1] ||
                  socket.handshake.query?.token

    if (!token) {
      return next(new Error('Authentication required'))
    }

    const decoded = verifyAccessToken(token)
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'))
    }

    socket.userId = user._id
    socket.username = user.username
    socket.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token expired'))
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid token'))
    }
    next(error)
  }
}

module.exports = { authenticateSocket }