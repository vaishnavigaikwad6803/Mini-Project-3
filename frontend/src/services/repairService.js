import api from './api';

export const repairService = {
  getRepairById: async (id) => {
    const response = await api.get(`/repairs/${id}`);
    return response.data;
  },

  updateRepairStage: async (repairId, stageData) => {
    const response = await api.patch(`/repairs/${repairId}/stage`, stageData);
    return response.data;
  },

  submitRepairCompletion: async (repairId, formData) => {
    const response = await api.post(`/repairs/${repairId}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  verifyAndCloseRepair: async (repairId, verificationData) => {
    const response = await api.post(`/repairs/${repairId}/verify`, verificationData);
    return response.data;
  },
};
