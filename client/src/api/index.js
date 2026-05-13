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
};

export const seatApi = {
  getAll: () => api.get('/seats'),
  sit: (seatId, playerId) => api.post(`/seats/${seatId}/sit`, { playerId }),
  leave: (playerId) => api.post('/seats/leave', { playerId }),
};

export const gachaApi = {
  getPool: () => api.get('/gacha/pool'),
  pull: (playerId) => api.post('/gacha/pull', { playerId }),
  getInventory: (playerId) => api.get(`/gacha/inventory/${playerId}`),
};

export const taskApi = {
  getTasks: (playerId) => api.get(`/tasks/${playerId}`),
  updateProgress: (playerId, type, value) => api.post('/tasks/progress', { playerId, type, value }),
  claim: (playerId, taskId) => api.post('/tasks/claim', { playerId, taskId }),
};

export default api;
