import api from './api';

export const engineerService = {
  getEngineers: async (params = {}) => {
    const response = await api.get('/engineers', { params });
    return response.data;
  },

  getEngineerById: async (id) => {
    const response = await api.get(`/engineers/${id}`);
    return response.data;
  },

  updateEngineer: async (id, updateData) => {
    const response = await api.put(`/engineers/${id}`, updateData);
    return response.data;
  },

  assignEngineerToComplaint: async (complaintId, engineerId, remarks = '') => {
    const response = await api.post(`/engineers/assign-to-complaint?complaint_id=${complaintId}&engineer_id=${engineerId}&remarks=${encodeURIComponent(remarks)}`);
    return response.data;
  },

  getEngineerAssignments: async (engineerId) => {
    const response = await api.get(`/engineers/${engineerId}/assignments`);
    return response.data;
  },

  registerEngineer: async (engineerData) => {
    const response = await api.post('/engineers/register', engineerData);
    return response.data;
  },
};
