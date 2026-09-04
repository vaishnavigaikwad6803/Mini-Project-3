import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('roadguard_token', response.data.access_token);
      localStorage.setItem('roadguard_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.access_token) {
      localStorage.setItem('roadguard_token', response.data.access_token);
      localStorage.setItem('roadguard_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('roadguard_token');
    localStorage.removeItem('roadguard_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('roadguard_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
