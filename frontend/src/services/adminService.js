import api from './api';

export const adminService = {
  getDashboardData: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  updateUser: async (userId, updateData) => {
    const response = await api.put(`/users/${userId}`, updateData);
    return response.data;
  },

  getMapComplaints: async (params = {}) => {
    const response = await api.get('/maps/complaints', { params });
    return response.data;
  },
};
