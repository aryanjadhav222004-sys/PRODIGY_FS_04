# Prodigy Chat

A full-stack real-time chat application built with modern technologies. Features private messaging, group chats, real-time messaging, file sharing, and more.

## Tech Stack

### Frontend
- **React 18** with Vite
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time communication
- **Headless UI** for accessible components
- **Heroicons** for icons
- **React Hot Toast** for notifications
- **Emoji Picker React** for emoji support

### Backend
- **Node.js** with Express 5
- **Socket.io** for real-time communication
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Express Session** with MongoDB store
- **Cloudinary** for file uploads
- **Nodemailer** for emails
- **Helmet**, **CORS**, **Compression** for security/performance

## Features

- 🔐 **Authentication** - JWT-based auth with refresh tokens
- 💬 **Real-time Messaging** - Private & group chats with Socket.io
- 👥 **Group Chats** - Create groups, add/remove members, group settings
- 📎 **File Sharing** - Images, videos, audio, documents via Cloudinary
- 😀 **Emoji Reactions** - React to messages with emojis
- 🔔 **Notifications** - Real-time notifications
- 👤 **User Profiles** - Avatars, status, custom status
- 🌙 **Dark Mode** - System-aware dark/light theme
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔒 **Security** - Helmet, CORS, rate limiting, input validation

## Project Structure

```
prodigy-chat/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store & slices
│   │   ├── styles/         # Global styles
│   │   └── types/          # TypeScript types
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── socket/         # Socket.io handlers
│   │   └── utils/          # Utility functions
│   └── ...
└── package.json            # Root package.json (workspaces)
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (for file uploads)
- Email service (for notifications)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd prodigy-chat

# Install all dependencies
npm run install:all

# Copy environment files
cp .env.example .env
cp server/.env.example server/.env
```

### Environment Variables

**Root `.env`:**
```env
CLIENT_URL=http://localhost:5173
```

**Server `.env`:**
```env
# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/prodigy_chat

# Session
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=86400000

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# MongoDB Session Store
MONGO_SESSION_SECRET=mongo-session-secret

# Cloudinary (file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Redis (optional, for scaling)
REDIS_URL=redis://localhost:6379
```

### Running the Application

```bash
# Development (runs both client & server)
npm run dev

# Or run separately:
npm run dev:client  # Frontend on http://localhost:5173
npm run dev:server  # Backend on http://localhost:3000

# Production build
npm run build

# Start production server
npm start
```

### Database Seeding

```bash
cd server
npm run seed
```

Creates test users:
- `admin@test.com` / `Admin123`
- `test@test.com` / `Password123`
- `john@test.com` / `Password123`
- `jane@test.com` / `Password123`
- `bob@test.com` / `Password123`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/auth/search` | Search users |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms` | Create room |
| GET | `/api/rooms` | List user's rooms |
| GET | `/api/rooms/:id` | Get room details |
| PUT | `/api/rooms/:id` | Update room |
| POST | `/api/rooms/:id/participants` | Add participants |
| DELETE | `/api/rooms/:id/participants/:userId` | Remove participant |
| POST | `/api/rooms/:id/leave` | Leave room |
| DELETE | `/api/rooms/:id` | Delete room |
| GET | `/api/rooms/:id/participants` | List participants |
| POST | `/api/rooms/:id/mute` | Mute/unmute room |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:roomId` | Get messages |
| POST | `/api/messages/:roomId` | Send message |
| PUT | `/api/messages/:roomId/:messageId` | Edit message |
| DELETE | `/api/messages/:roomId/:messageId` | Delete message |
| POST | `/api/messages/:roomId/:messageId/read` | Mark as read |
| POST | `/api/messages/:roomId/:messageId/reactions` | Add reaction |
| DELETE | `/api/messages/:roomId/:messageId/reactions/:emoji` | Remove reaction |
| POST | `/api/messages/:roomId/:messageId/pin` | Pin message |
| DELETE | `/api/messages/:roomId/:messageId/pin` | Unpin message |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/friends` | Get friends & requests |
| POST | `/api/users/friends/:userId` | Send friend request |
| POST | `/api/users/friends/:userId/accept` | Accept request |
| DELETE | `/api/users/friends/:userId/reject` | Reject request |
| DELETE | `/api/users/friends/:userId` | Remove friend |
| GET | `/api/users/friends/requests` | Get friend requests |
| POST | `/api/users/block/:userId` | Block user |
| DELETE | `/api/users/block/:userId` | Unblock user |
| GET | `/api/users/blocked` | Get blocked users |
| GET | `/api/users/settings` | Get settings |
| PUT | `/api/users/settings` | Update settings |
| GET | `/api/users/profile/:userId?` | Get profile |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/avatar` | Upload avatar |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

## Socket Events

### Client → Server
| Event | Data | Description |
|-------|------|-------------|
| `join_room` | `roomId` | Join a room |
| `leave_room` | `roomId` | Leave a room |
| `send_message` | `{ roomId, message }` | Send message |
| `typing_start` | `roomId` | Start typing |
| `typing_stop` | `roomId` | Stop typing |
| `mark_read` | `{ roomId, messageId }` | Mark message read |
| `add_reaction` | `{ roomId, messageId, emoji }` | Add reaction |
| `remove_reaction` | `{ roomId, messageId, emoji }` | Remove reaction |
| `status_change` | `status` | Update status |

### Server → Client
| Event | Data | Description |
|-------|------|-------------|
| `new_message` | `message` | New message received |
| `message_updated` | `message` | Message edited |
| `message_deleted` | `{ messageId, forEveryone, deletedBy }` | Message deleted |
| `message_read` | `{ messageId, readBy, readAt }` | Message read |
| `reaction_added` | `{ messageId, emoji, userId, user }` | Reaction added |
| `reaction_removed` | `{ messageId, emoji, userId }` | Reaction removed |
| `user_typing` | `{ roomId, userId, username }` | User typing |
| `user_stopped_typing` | `{ roomId, userId }` | User stopped |
| `user_online` | `userId` | User came online |
| `user_offline` | `{ userId, lastSeen }` | User went offline |
| `user_status_change` | `{ userId, status }` | Status changed |
| `room_created` | `room` | Room created |
| `room_updated` | `room` | Room updated |
| `participant_added` | `{ roomId, participant }` | Participant added |
| `participant_removed` | `{ roomId, userId }` | Participant removed |
| `room_deleted` | `roomId` | Room deleted |
| `notification_created` | `notification` | New notification |
| `notification_read` | `{ notificationId }` | Notification read |

## Scripts

```bash
# Root
npm run dev              # Start both client & server
npm run dev:client       # Start client only
npm run dev:server       # Start server only
npm run build            # Build all packages
npm run build:client     # Build client only
npm run build:server     # Build server only
npm run start            # Start production server
npm run install:all      # Install all dependencies
npm run lint             # Lint all packages
npm run test             # Run tests

# Server only
cd server
npm run dev              # Development with nodemon
npm run start            # Production
npm run seed             # Seed database
npm run lint             # Lint server
npm run test             # Run tests

# Client only
cd client
npm run dev              # Development
npm run build            # Production build
npm run preview          # Preview build
npm run lint             # Lint client
npm run test             # Run tests
```

## Deployment

### Docker (Recommended)

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-Specific Configs

- **Development**: Uses local MongoDB, verbose logging
- **Production**: Uses MongoDB Atlas, optimized builds, compression, rate limiting
- **Staging**: Mirror of production with test data

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

ISC License - see LICENSE file for details.

## Acknowledgments

- [Socket.io](https://socket.io/) for real-time communication
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Headless UI](https://headlessui.com/) for accessible components
- [Heroicons](https://heroicons.com/) for beautiful icons
- [Redux Toolkit](https://redux-toolkit.js.org/) for state management
- [MongoDB](https://www.mongodb.com/) for database
- [Cloudinary](https://cloudinary.com/) for media management