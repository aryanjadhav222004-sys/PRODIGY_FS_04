import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { usersAPI } from '../../api/endpoints'

const initialState = {
  friends: [],
  friendRequests: {
    sent: [],
    received: [],
  },
  blockedUsers: [],
  searchResults: [],
  settings: null,
  isLoading: false,
  error: null,
}

export const fetchFriends = createAsyncThunk(
  'users/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getFriends()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch friends')
    }
  }
)

export const sendFriendRequest = createAsyncThunk(
  'users/sendFriendRequest',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.sendFriendRequest(userId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to send friend request')
    }
  }
)

export const acceptFriendRequest = createAsyncThunk(
  'users/acceptFriendRequest',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.acceptFriendRequest(userId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to accept friend request')
    }
  }
)

export const rejectFriendRequest = createAsyncThunk(
  'users/rejectFriendRequest',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.rejectFriendRequest(userId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to reject friend request')
    }
  }
)

export const removeFriend = createAsyncThunk(
  'users/removeFriend',
  async (userId, { rejectWithValue }) => {
    try {
      await usersAPI.removeFriend(userId)
      return userId
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to remove friend')
    }
  }
)

export const fetchFriendRequests = createAsyncThunk(
  'users/fetchFriendRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getFriendRequests()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch friend requests')
    }
  }
)

export const blockUser = createAsyncThunk(
  'users/blockUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.blockUser(userId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to block user')
    }
  }
)

export const unblockUser = createAsyncThunk(
  'users/unblockUser',
  async (userId, { rejectWithValue }) => {
    try {
      await usersAPI.unblockUser(userId)
      return userId
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to unblock user')
    }
  }
)

export const fetchBlockedUsers = createAsyncThunk(
  'users/fetchBlockedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getBlockedUsers()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch blocked users')
    }
  }
)

export const updateSettings = createAsyncThunk(
  'users/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await usersAPI.updateSettings(settings)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update settings')
    }
  }
)

export const fetchSettings = createAsyncThunk(
  'users/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getSettings()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch settings')
    }
  }
)

export const uploadAvatar = createAsyncThunk(
  'users/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const response = await usersAPI.uploadAvatar(file)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to upload avatar')
    }
  }
)

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addFriendRequest: (state, action) => {
      state.friendRequests.received.unshift(action.payload)
    },
    removeFriendRequest: (state, action) => {
      state.friendRequests.received = state.friendRequests.received.filter(r => r.id !== action.payload)
      state.friendRequests.sent = state.friendRequests.sent.filter(r => r.id !== action.payload)
    },
    clearSearchResults: (state) => {
      state.searchResults = []
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.isLoading = false
        state.friends = action.payload.friends
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.friendRequests.sent.unshift(action.payload)
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        state.friendRequests.received = state.friendRequests.received.filter(r => r.id !== action.payload.userId)
        state.friends.unshift(action.payload.friend)
      })
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        state.friendRequests.received = state.friendRequests.received.filter(r => r.id !== action.payload.userId)
      })
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter(f => f.id !== action.payload)
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.friendRequests = action.payload
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        state.blockedUsers.unshift(action.payload)
        state.friends = state.friends.filter(f => f.id !== action.payload.id)
        state.friendRequests.received = state.friendRequests.received.filter(r => r.id !== action.payload.id)
        state.friendRequests.sent = state.friendRequests.sent.filter(r => r.id !== action.payload.id)
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.blockedUsers = state.blockedUsers.filter(u => u.id !== action.payload)
      })
      .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
        state.blockedUsers = action.payload.blockedUsers
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload.settings
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload.settings
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (state.settings) {
          state.settings.avatar = action.payload.avatar
        }
      })
  },
})

export const {
  addFriendRequest,
  removeFriendRequest,
  clearSearchResults,
  clearError,
} = usersSlice.actions

export default usersSlice.reducer

export const selectFriends = (state) => state.users.friends
export const selectFriendRequests = (state) => state.users.friendRequests
export const selectBlockedUsers = (state) => state.users.blockedUsers
export const selectUserSearchResults = (state) => state.users.searchResults
export const selectUserSettings = (state) => state.users.settings
export const selectUsersLoading = (state) => state.users.isLoading