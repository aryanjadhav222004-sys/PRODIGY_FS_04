const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const { default: MongoStore } = require('connect-mongo')
const path = require('path')

const config = require('./config')
const { connectDB } = require('./utils/database')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const { authenticateSocket } = require('./socket/middleware/authSocket')

// Import routes
const authRoutes = require('./routes/auth')
const roomRoutes = require('./routes/rooms')
const messageRoutes = require('./routes/messages')
const userRoutes = require('./routes/users')
const notificationRoutes = require('./routes/notifications')

// Import socket handlers
const { setupSocketHandlers } = require('./socket')

const app = express()
const server = http.createServer(app)

// Global error handlers for unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Async handler wrapper for Express 5
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}))
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}))
app.use(compression())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.mongodb.uri,
    collectionName: 'sessions',
    ttl: config.session.maxAge / 1000,
  }),
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: config.session.maxAge,
    sameSite: 'lax',
  },
}))

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notifications', notificationRoutes)

// Socket.io authentication middleware
io.use(authenticateSocket)

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId, socket.id)
  setupSocketHandlers(io, socket)
})

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB()
    
    const PORT = config.port
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`)
      console.log(`📡 Socket.io server ready`)
      console.log(`🌐 Client URL: ${config.clientUrl}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

startServer()

module.exports = { app, server, io }