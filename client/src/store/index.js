import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import roomsReducer from './slices/roomsSlice'
import messagesReducer from './slices/messagesSlice'
import usersReducer from './slices/usersSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rooms: roomsReducer,
    messages: messagesReducer,
    users: usersReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/connected', 'socket/disconnected'],
        ignoredPaths: ['socket.instance'],
      },
    }),
})