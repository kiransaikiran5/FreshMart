import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, markNotificationRead } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const eventSourceRef = useRef(null);

  // 1. Fetch existing notifications on mount (initial load)
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 2. Connect to SSE stream when user is logged in
  useEffect(() => {
    if (!user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const url = `http://localhost:8000/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('new_notification', (event) => {
      try {
        const newNotif = JSON.parse(event.data);
        setNotifications(prev => [newNotif, ...prev]);
        if (!newNotif.is_read) {
          setUnreadCount(prev => prev + 1);
        }
      } catch (err) {
        console.error('SSE parse error', err);
      }
    });

    es.onerror = (err) => {
      console.error('SSE error (auto‑reconnecting)', err);
      // EventSource automatically attempts to reconnect
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [user]);

  const markRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const value = { notifications, unreadCount, fetchNotifications, markRead };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);