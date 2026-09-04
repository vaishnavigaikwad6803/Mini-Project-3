import api from './api';

export const complaintService = {
  submitComplaint: async (formData) => {
    // Requires multipart/form-data for image upload
    const response = await api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getComplaints: async (params = {}) => {
    const response = await api.get('/complaints', { params });
    return response.data;
  },

  getMyComplaints: async () => {
    const response = await api.get('/complaints', { params: { my_complaints: true } });
    return response.data;
  },

  getComplaintById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  updateComplaintStatus: async (id, status, remarks = '') => {
    const response = await api.patch(`/complaints/${id}/status`, { status, remarks });
    return response.data;
  },

  getCitizenStats: async () => {
    const response = await api.get('/complaints/citizen/stats');
    return response.data;
  },

  deleteComplaint: async (id, reason) => {
    const response = await api.delete(`/complaints/${id}`, {
      data: { reason },
    });
    return response.data;
  },
};
