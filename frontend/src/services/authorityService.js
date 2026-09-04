import api from './api';

export const authorityService = {
  getAuthorities: async (params = {}) => {
    const response = await api.get('/authorities', { params });
    return response.data;
  },

  getAuthorityById: async (id) => {
    const response = await api.get(`/authorities/${id}`);
    return response.data;
  },

  createAuthority: async (authorityData) => {
    const response = await api.post('/authorities', authorityData);
    return response.data;
  },

  updateAuthority: async (id, updateData) => {
    const response = await api.put(`/authorities/${id}`, updateData);
    return response.data;
  },

  getAuthorityComplaints: async (authorityId, status = null) => {
    const params = status ? { status } : {};
    const response = await api.get(`/authorities/${authorityId}/complaints`, { params });
    return response.data;
  },

  getAuthorityStats: async (authorityId) => {
    const response = await api.get(`/authorities/${authorityId}/stats`);
    return response.data;
  },
};
