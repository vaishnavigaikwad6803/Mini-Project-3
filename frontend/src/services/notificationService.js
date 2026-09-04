import api from './api';

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (notificationIds = null, markAll = false) => {
    const response = await api.post('/notifications/mark-read', {
      notification_ids: notificationIds,
      mark_all: markAll,
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data.unread_count;
  },
};
