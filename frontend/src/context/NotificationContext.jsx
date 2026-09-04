import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll every 30 seconds for live updates
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (ids = null, markAll = false) => {
    try {
      await notificationService.markAsRead(ids, markAll);
      if (markAll) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      } else if (ids) {
        setNotifications((prev) =>
          prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - ids.length));
      }
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    showToast,
    toastMessage,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Global Toast Floating Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
            toastMessage.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' :
            toastMessage.type === 'error' ? 'bg-rose-950/90 border-rose-500 text-rose-200' :
            toastMessage.type === 'warning' ? 'bg-amber-950/90 border-amber-500 text-amber-200' :
            'bg-slate-900/90 border-slate-700 text-slate-200'
          } backdrop-blur-md`}>
            <span className="text-sm font-medium">{toastMessage.message}</span>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
