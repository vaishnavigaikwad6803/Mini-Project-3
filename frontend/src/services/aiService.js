import api from './api';

export const aiService = {
  validateImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await api.post('/ai/validate-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  detectStandalone: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await api.post('/ai/detect-standalone', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getComplaintAIResult: async (complaintId) => {
    const response = await api.get(`/ai/results/${complaintId}`);
    return response.data;
  },
};
