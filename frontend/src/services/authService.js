import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('roadguard_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('roadguard_refresh_token', response.data.refresh_token);
      }
      localStorage.setItem('roadguard_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  verifyEmail: async (email, otp) => {
    const response = await api.post('/auth/verify-email', { email, otp });
    if (response.data.access_token) {
      localStorage.setItem('roadguard_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('roadguard_refresh_token', response.data.refresh_token);
      }
      localStorage.setItem('roadguard_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  resendOtp: async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (payload) => {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  },

  refreshToken: async () => {
    const refresh_token = localStorage.getItem('roadguard_refresh_token');
    if (!refresh_token) {
      throw new Error('No refresh token available');
    }
    const response = await api.post('/auth/refresh', { refresh_token });
    if (response.data.access_token) {
      localStorage.setItem('roadguard_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('roadguard_refresh_token', response.data.refresh_token);
      }
      localStorage.setItem('roadguard_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword || newPassword,
    });
    return response.data;
  },

  logout: async () => {
    const refresh_token = localStorage.getItem('roadguard_refresh_token');
    try {
      if (refresh_token) {
        await api.post('/auth/logout', { refresh_token });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('roadguard_token');
      localStorage.removeItem('roadguard_refresh_token');
      localStorage.removeItem('roadguard_user');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('roadguard_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
