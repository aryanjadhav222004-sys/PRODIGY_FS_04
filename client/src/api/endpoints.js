import api from './axios'

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/password', data),
  searchUsers: (query) => api.get('/auth/search', { params: { q: query, limit: 20 } }),
}

export const roomsAPI = {
  getRooms: (params = {}) => api.get('/rooms', { params }),
  getRoomById: (id) => api.get(`/rooms/${id}`),
  createRoom: (data) => api.post('/rooms', data),
  updateRoom: (id, data) => api.put(`/rooms/${id}`, data),
  addParticipants: (id, participants) => api.post(`/rooms/${id}/participants`, { participants }),
  removeParticipant: (id, userId) => api.delete(`/rooms/${id}/participants/${userId}`),
  leaveRoom: (id) => api.post(`/rooms/${id}/leave`),
  deleteRoom: (id) => api.delete(`/rooms/${id}`),
  getParticipants: (id) => api.get(`/rooms/${id}/participants`),
  muteRoom: (id, until) => api.post(`/rooms/${id}/mute`, { until }),
}

export const messagesAPI = {
  getMessages: (roomId, params = {}) => api.get(`/messages/${roomId}`, { params }),
  sendMessage: (roomId, data) => api.post(`/messages/${roomId}`, data),
  editMessage: (roomId, messageId, data) => api.put(`/messages/${roomId}/${messageId}`, data),
  deleteMessage: (roomId, messageId, forEveryone = false) => 
    api.delete(`/messages/${roomId}/${messageId}`, { params: { forEveryone } }),
  markAsRead: (roomId, messageId) => api.post(`/messages/${roomId}/${messageId}/read`),
  addReaction: (roomId, messageId, emoji) => api.post(`/messages/${roomId}/${messageId}/reactions`, { emoji }),
  removeReaction: (roomId, messageId, emoji) => api.delete(`/messages/${roomId}/${messageId}/reactions/${emoji}`),
  pinMessage: (roomId, messageId) => api.post(`/messages/${roomId}/${messageId}/pin`),
  unpinMessage: (roomId, messageId) => api.delete(`/messages/${roomId}/${messageId}/pin`),
}

export const usersAPI = {
  getFriends: () => api.get('/users/friends'),
  sendFriendRequest: (userId) => api.post(`/users/friends/${userId}`),
  acceptFriendRequest: (userId) => api.post(`/users/friends/${userId}/accept`),
  rejectFriendRequest: (userId) => api.delete(`/users/friends/${userId}/reject`),
  removeFriend: (userId) => api.delete(`/users/friends/${userId}`),
  getFriendRequests: () => api.get('/users/friends/requests'),
  blockUser: (userId) => api.post(`/users/block/${userId}`),
  unblockUser: (userId) => api.delete(`/users/block/${userId}`),
  getBlockedUsers: () => api.get('/users/blocked'),
  getSettings: () => api.get('/users/settings'),
  updateSettings: (settings) => api.put('/users/settings', settings),
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const notificationsAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
}