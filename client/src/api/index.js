import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Add player ID to headers
api.interceptors.request.use((config) => {
  const playerId = localStorage.getItem('playerId');
  if (playerId) {
    config.headers['X-Player-Id'] = playerId;
  }
  return config;
});

export const playerApi = {
  init: () => api.get('/player/init'),
  get: (id) => api.get(`/player/${id}`),
  updateName: (id, name) => api.put(`/player/${id}/name`, { name }),
  updateAvatar: (id, avatar) => api.put(`/player/${id}/avatar`, { avatar }),
  save: (id, data) => api.post(`/player/${id}/save`, data),
  getOfflineEarnings: (id) => api.get(`/player/${id}/offline-earnings`),
  claimOffline: (id) => api.post(`/player/${id}/claim-offline`),
  heartbeat: (id, options = {}) => api.post(`/player/${id}/heartbeat`, options),
};

export const seatApi = {
  getAll: () => api.get('/seats'),
  sit: (seatId, playerId) => api.post(`/seats/${seatId}/sit`, { playerId }),
  leave: (playerId, force = false) => api.post('/seats/leave', { playerId, force }),
};

export const gachaApi = {
  getPool: () => api.get('/gacha/pool'),
  pull: (playerId, count = 1) => api.post('/gacha/pull', { playerId, count }),
};

export const taskApi = {
  getTasks: (playerId) => api.get(`/tasks/${playerId}`),
  updateProgress: (playerId, type, value) => api.post('/tasks/progress', { playerId, type, value }),
  claim: (playerId, taskId) => api.post('/tasks/claim', { playerId, taskId }),
};

export const bugApi = {
  report: (playerId, description) => api.post('/bugs', { playerId, description }),
};

export const announcementApi = {
  getLatest: () => api.get('/announcements'),
};

export const broadcastApi = {
  getMessages: () => api.get('/broadcast'),
};

export const activityApi = {
  setStatus: (playerId, activityId) => api.post('/activity/status', { playerId, activityId }),
  clearStatus: (playerId) => api.post('/activity/status/clear', { playerId }),
};

export default api;
