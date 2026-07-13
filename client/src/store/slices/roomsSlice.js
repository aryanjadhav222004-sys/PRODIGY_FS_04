import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { roomsAPI } from '../../api/endpoints'

const initialState = {
  rooms: [],
  currentRoom: null,
  participants: [],
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  },
  isLoading: false,
  error: null,
}

export const fetchRooms = createAsyncThunk(
  'rooms/fetchRooms',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await roomsAPI.getRooms(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch rooms')
    }
  }
)

export const fetchRoomById = createAsyncThunk(
  'rooms/fetchRoomById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await roomsAPI.getRoomById(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch room')
    }
  }
)

export const createRoom = createAsyncThunk(
  'rooms/createRoom',
  async (data, { rejectWithValue }) => {
    try {
      const response = await roomsAPI.createRoom(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create room')
    }
  }
)

export const updateRoom = createAsyncThunk(
  'rooms/updateRoom',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await roomsAPI.updateRoom(id, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update room')
    }
  }
)

export const addParticipants = createAsyncThunk(
  'rooms/addParticipants',
  async ({ id, participants }, { rejectWithValue }) => {
    try {
      const response = await roomsAPI.addParticipants(id, participants)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add participants')
    }
  }
)

export const removeParticipant = createAsyncThunk(
  'rooms/removeParticipant',
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      const response = await roomsAPI.removeParticipant(id, userId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to remove participant')
    }
  }
)

export const leaveRoom = createAsyncThunk(
  'rooms/leaveRoom',
  async (id, { rejectWithValue }) => {
    try {
      const response = await roomsAPI.leaveRoom(id)
      return { roomId: id, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to leave room')
    }
  }
)

export const deleteRoom = createAsyncThunk(
  'rooms/deleteRoom',
  async (id, { rejectWithValue }) => {
    try {
      await roomsAPI.deleteRoom(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete room')
    }
  }
)

export const fetchRoomParticipants = createAsyncThunk(
  'rooms/fetchParticipants',
  async (id, { rejectWithValue }) => {
    try {
      const response = await roomsAPI.getParticipants(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch participants')
    }
  }
)

export const muteRoom = createAsyncThunk(
  'rooms/muteRoom',
  async ({ id, until }, { rejectWithValue }) => {
    try {
      const response = await roomsAPI.muteRoom(id, until)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to mute room')
    }
  }
)

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setCurrentRoom: (state, action) => {
      state.currentRoom = action.payload
    },
    addRoom: (state, action) => {
      const exists = state.rooms.find(r => r.id === action.payload.id)
      if (!exists) {
        state.rooms.unshift(action.payload)
      }
    },
    updateRoomInList: (state, action) => {
      const index = state.rooms.findIndex(r => r.id === action.payload.id)
      if (index !== -1) {
        state.rooms[index] = { ...state.rooms[index], ...action.payload }
      }
    },
    removeRoomFromList: (state, action) => {
      state.rooms = state.rooms.filter(r => r.id !== action.payload)
    },
    addParticipantToRoom: (state, action) => {
      const { roomId, participant } = action.payload
      if (state.currentRoom?.id === roomId) {
        state.currentRoom.participants.push(participant)
      }
      const room = state.rooms.find(r => r.id === roomId)
      if (room) {
        room.participants.push(participant)
      }
    },
    removeParticipantFromRoom: (state, action) => {
      const { roomId, userId } = action.payload
      if (state.currentRoom?.id === roomId) {
        state.currentRoom.participants = state.currentRoom.participants.filter(p => p.id !== userId)
      }
      const room = state.rooms.find(r => r.id === roomId)
      if (room) {
        room.participants = room.participants.filter(p => p.id !== userId)
      }
    },
    updateRoomActivity: (state, action) => {
      const { roomId, lastMessage, lastActivity } = action.payload
      const room = state.rooms.find(r => r.id === roomId)
      if (room) {
        room.lastMessage = lastMessage
        room.lastActivity = lastActivity
      }
      if (state.currentRoom?.id === roomId) {
        state.currentRoom.lastMessage = lastMessage
        state.currentRoom.lastActivity = lastActivity
      }
      // Re-sort rooms by lastActivity
      state.rooms.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.isLoading = false
        state.rooms = action.payload.rooms
        state.pagination = action.payload.pagination
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(fetchRoomById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchRoomById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentRoom = action.payload.room
        state.participants = action.payload.room.participants || []
      })
      .addCase(fetchRoomById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.rooms.unshift(action.payload.room)
        state.currentRoom = action.payload.room
      })
      .addCase(updateRoom.fulfilled, (state, action) => {
        if (state.currentRoom?.id === action.payload.room.id) {
          state.currentRoom = action.payload.room
        }
        const index = state.rooms.findIndex(r => r.id === action.payload.room.id)
        if (index !== -1) {
          state.rooms[index] = action.payload.room
        }
      })
      .addCase(addParticipants.fulfilled, (state, action) => {
        if (state.currentRoom?.id === action.payload.room.id) {
          state.currentRoom = action.payload.room
        }
      })
      .addCase(removeParticipant.fulfilled, (state, action) => {
        if (state.currentRoom?.id === action.payload.room.id) {
          state.currentRoom = action.payload.room
        }
      })
      .addCase(leaveRoom.fulfilled, (state, action) => {
        state.rooms = state.rooms.filter(r => r.id !== action.payload.roomId)
        if (state.currentRoom?.id === action.payload.roomId) {
          state.currentRoom = null
        }
      })
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.rooms = state.rooms.filter(r => r.id !== action.payload)
        if (state.currentRoom?.id === action.payload) {
          state.currentRoom = null
        }
      })
      .addCase(fetchRoomParticipants.fulfilled, (state, action) => {
        state.participants = action.payload.participants
      })
  },
})

export const {
  setCurrentRoom,
  addRoom,
  updateRoomInList,
  removeRoomFromList,
  addParticipantToRoom,
  removeParticipantFromRoom,
  updateRoomActivity,
  clearError,
} = roomsSlice.actions

export default roomsSlice.reducer

export const selectRooms = (state) => state.rooms.rooms
export const selectCurrentRoom = (state) => state.rooms.currentRoom
export const selectRoomParticipants = (state) => state.rooms.participants
export const selectRoomsLoading = (state) => state.rooms.isLoading
export const selectRoomsPagination = (state) => state.rooms.pagination