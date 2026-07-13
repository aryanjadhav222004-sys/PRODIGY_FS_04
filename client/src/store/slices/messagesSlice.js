import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { messagesAPI } from '../../api/endpoints'

const initialState = {
  messages: {},
  pagination: {},
  isLoading: {},
  error: null,
  optimisticMessages: {},
}

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ roomId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.getMessages(roomId, params)
      return { roomId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch messages')
    }
  }
)

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ roomId, data }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.sendMessage(roomId, data)
      return { roomId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to send message')
    }
  }
)

export const editMessage = createAsyncThunk(
  'messages/editMessage',
  async ({ roomId, messageId, data }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.editMessage(roomId, messageId, data)
      return { roomId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to edit message')
    }
  }
)

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async ({ roomId, messageId, forEveryone }, { rejectWithValue }) => {
    try {
      await messagesAPI.deleteMessage(roomId, messageId, forEveryone)
      return { roomId, messageId, forEveryone }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete message')
    }
  }
)

export const addReaction = createAsyncThunk(
  'messages/addReaction',
  async ({ roomId, messageId, emoji }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.addReaction(roomId, messageId, emoji)
      return { roomId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add reaction')
    }
  }
)

export const removeReaction = createAsyncThunk(
  'messages/removeReaction',
  async ({ roomId, messageId, emoji }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.removeReaction(roomId, messageId, emoji)
      return { roomId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to remove reaction')
    }
  }
)

export const markAsRead = createAsyncThunk(
  'messages/markAsRead',
  async ({ roomId, messageId }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.markAsRead(roomId, messageId)
      return { roomId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to mark as read')
    }
  }
)

export const pinMessage = createAsyncThunk(
  'messages/pinMessage',
  async ({ roomId, messageId }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.pinMessage(roomId, messageId)
      return { roomId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to pin message')
    }
  }
)

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const { roomId, message } = action.payload
      if (!state.messages[roomId]) {
        state.messages[roomId] = []
      }
      // Avoid duplicates
      const exists = state.messages[roomId].find(m => m.id === message.id)
      if (!exists) {
        state.messages[roomId].unshift(message)
      }
    },
    updateMessage: (state, action) => {
      const { roomId, message } = action.payload
      if (state.messages[roomId]) {
        const index = state.messages[roomId].findIndex(m => m.id === message.id)
        if (index !== -1) {
          state.messages[roomId][index] = message
        }
      }
    },
    removeMessage: (state, action) => {
      const { roomId, messageId } = action.payload
      if (state.messages[roomId]) {
        state.messages[roomId] = state.messages[roomId].filter(m => m.id !== messageId)
      }
    },
    addReactionToMessage: (state, action) => {
      const { roomId, messageId, emoji, userId } = action.payload
      if (state.messages[roomId]) {
        const message = state.messages[roomId].find(m => m.id === messageId)
        if (message) {
          let reaction = message.reactions.find(r => r.emoji === emoji)
          if (!reaction) {
            reaction = { emoji, users: [], createdAt: new Date().toISOString() }
            message.reactions.push(reaction)
          }
          if (!reaction.users.some(u => u.id === userId)) {
            reaction.users.push({ id: userId })
          }
        }
      }
    },
    removeReactionFromMessage: (state, action) => {
      const { roomId, messageId, emoji, userId } = action.payload
      if (state.messages[roomId]) {
        const message = state.messages[roomId].find(m => m.id === messageId)
        if (message) {
          const reaction = message.reactions.find(r => r.emoji === emoji)
          if (reaction) {
            reaction.users = reaction.users.filter(u => u.id !== userId)
            if (reaction.users.length === 0) {
              message.reactions = message.reactions.filter(r => r.emoji !== emoji)
            }
          }
        }
      }
    },
    markMessagesAsRead: (state, action) => {
      const { roomId, messageId, userId } = action.payload
      if (state.messages[roomId]) {
        state.messages[roomId].forEach(message => {
          if (message.id <= messageId && !message.readBy.some(r => r.user.id === userId)) {
            message.readBy.push({ user: { id: userId }, readAt: new Date().toISOString() })
          }
        })
      }
    },
    setOptimisticMessage: (state, action) => {
      const { roomId, tempId, message } = action.payload
      if (!state.optimisticMessages[roomId]) {
        state.optimisticMessages[roomId] = {}
      }
      state.optimisticMessages[roomId][tempId] = message
    },
    removeOptimisticMessage: (state, action) => {
      const { roomId, tempId } = action.payload
      if (state.optimisticMessages[roomId]) {
        delete state.optimisticMessages[roomId][tempId]
      }
    },
    replaceOptimisticMessage: (state, action) => {
      const { roomId, tempId, message } = action.payload
      if (state.optimisticMessages[roomId] && state.optimisticMessages[roomId][tempId]) {
        delete state.optimisticMessages[roomId][tempId]
        if (!state.messages[roomId]) {
          state.messages[roomId] = []
        }
        state.messages[roomId].unshift(message)
      }
    },
    clearMessages: (state, action) => {
      const roomId = action.payload
      if (roomId) {
        delete state.messages[roomId]
        delete state.pagination[roomId]
        delete state.optimisticMessages[roomId]
      } else {
        state.messages = {}
        state.pagination = {}
        state.optimisticMessages = {}
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        state.isLoading[action.meta.arg.roomId] = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { roomId, messages, pagination } = action.payload
        state.isLoading[roomId] = false
        state.messages[roomId] = messages
        state.pagination[roomId] = pagination
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading[action.meta.arg.roomId] = false
        state.error = action.payload
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const {
  addMessage,
  updateMessage,
  removeMessage,
  addReactionToMessage,
  removeReactionFromMessage,
  markMessagesAsRead,
  setOptimisticMessage,
  removeOptimisticMessage,
  replaceOptimisticMessage,
  clearMessages,
  clearError,
} = messagesSlice.actions

export default messagesSlice.reducer

export const selectMessages = (state, roomId) => state.messages.messages[roomId] || []
export const selectMessageLoading = (state, roomId) => state.messages.isLoading[roomId]
export const selectMessagePagination = (state, roomId) => state.messages.pagination[roomId]
export const selectTypingUsers = (state, roomId) => state.ui.typingUsers[roomId] || {}