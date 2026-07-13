import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../api/endpoints'

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

export const register = createAsyncThunk(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(credentials)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Registration failed')
    }
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Login failed')
    }
  }
)

export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (refreshToken, { rejectWithValue }) => {
    try {
      const response = await authAPI.refreshToken(refreshToken)
      return response.data
    } catch (error) {
      return rejectWithValue('Token refresh failed')
    }
  }
)

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getMe()
      return response.data
    } catch (error) {
      return rejectWithValue('Failed to fetch user')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Profile update failed')
    }
  }
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.changePassword(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Password change failed')
    }
  }
)

export const searchUsers = createAsyncThunk(
  'auth/searchUsers',
  async (query, { rejectWithValue }) => {
    try {
      const response = await authAPI.searchUsers(query)
      return response.data
    } catch (error) {
      return rejectWithValue('Search failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user
      })
  },
})

export const { logout, setTokens, setUser, clearError } = authSlice.actions
export default authSlice.reducer

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectUser = (state) => state.auth.user
export const selectCurrentUserId = (state) => state.auth.user?._id
export const selectAccessToken = (state) => state.auth.accessToken
export const selectRefreshToken = (state) => state.auth.refreshToken
export const selectAuthLoading = (state) => state.auth.isLoading
export const selectAuthError = (state) => state.auth.error