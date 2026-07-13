import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  mobileSidebarOpen: false,
  mobileView: false,
  toasts: [],
  modals: {
    createRoom: false,
    roomSettings: false,
    userProfile: false,
    messageOptions: false,
    emojiPicker: false,
    filePreview: false,
    confirmDelete: false,
  },
  activeModalData: null,
  typingUsers: {},
  unreadCounts: {},
  activeRoomId: null,
  messageInputFocused: false,
  searchQuery: '',
  theme: 'system',
  isOnline: navigator.onLine,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = action.payload
    },
    setMobileView: (state, action) => {
      state.mobileView = action.payload
    },
    openModal: (state, action) => {
      const { modal, data } = action.payload
      state.modals[modal] = true
      state.activeModalData = data || null
    },
    closeModal: (state, action) => {
      const modal = action.payload
      state.modals[modal] = false
      if (state.activeModalData?.modal === modal) {
        state.activeModalData = null
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false
      })
      state.activeModalData = null
    },
    setTypingUser: (state, action) => {
      const { roomId, userId, user, isTyping } = action.payload
      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = {}
      }
      if (isTyping) {
        state.typingUsers[roomId][userId] = { ...user, startedAt: Date.now() }
      } else {
        delete state.typingUsers[roomId][userId]
      }
    },
    clearTypingUsers: (state, action) => {
      const roomId = action.payload
      if (roomId) {
        delete state.typingUsers[roomId]
      } else {
        state.typingUsers = {}
      }
    },
    incrementUnreadCount: (state, action) => {
      const { roomId, count = 1 } = action.payload
      state.unreadCounts[roomId] = (state.unreadCounts[roomId] || 0) + count
    },
    setUnreadCount: (state, action) => {
      const { roomId, count } = action.payload
      state.unreadCounts[roomId] = count
    },
    clearUnreadCount: (state, action) => {
      const roomId = action.payload
      state.unreadCounts[roomId] = 0
    },
    setActiveRoom: (state, action) => {
      state.activeRoomId = action.payload
      if (action.payload) {
        state.unreadCounts[action.payload] = 0
      }
    },
    setMessageInputFocused: (state, action) => {
      state.messageInputFocused = action.payload
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload
    },
    addToast: (state, action) => {
      state.toasts.push({
        id: Date.now(),
        ...action.payload,
      })
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload)
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setMobileView,
  openModal,
  closeModal,
  closeAllModals,
  setTypingUser,
  clearTypingUsers,
  incrementUnreadCount,
  setUnreadCount,
  clearUnreadCount,
  setActiveRoom,
  setMessageInputFocused,
  setSearchQuery,
  setTheme,
  setOnlineStatus,
  addToast,
  removeToast,
} = uiSlice.actions

export default uiSlice.reducer

export const selectSidebarOpen = (state) => state.ui.sidebarOpen
export const selectMobileSidebarOpen = (state) => state.ui.mobileSidebarOpen
export const selectMobileView = (state) => state.ui.mobileView
export const selectModals = (state) => state.ui.modals
export const selectActiveModalData = (state) => state.ui.activeModalData
export const selectTypingUsers = (state, roomId) => state.ui.typingUsers[roomId] || {}
export const selectUnreadCounts = (state) => state.ui.unreadCounts
export const selectActiveRoomId = (state) => state.ui.activeRoomId
export const selectMessageInputFocused = (state) => state.ui.messageInputFocused
export const selectSearchQuery = (state) => state.ui.searchQuery
export const selectTheme = (state) => state.ui.theme
export const selectOnlineStatus = (state) => state.ui.isOnline
export const selectToasts = (state) => state.ui.toasts

export const startTyping = (roomId, userId, user) => ({
  type: 'ui/setTypingUser',
  payload: { roomId, userId, user, isTyping: true }
})

export const stopTyping = (roomId, userId) => ({
  type: 'ui/clearTypingUser',
  payload: { roomId, userId }
})