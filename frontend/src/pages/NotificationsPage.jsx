import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { FiBell, FiCheck, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

/**
 * Format a date string. If it lacks a timezone, treat it as UTC
 * so that toLocaleString() shows the correct local time.
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const fixedStr =
    dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)
      ? dateStr + 'Z'
      : dateStr;
  const date = new Date(fixedStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function NotificationsPage() {
  const { notifications, markRead, fetchNotifications } = useNotifications();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState(new Set()); // track individual marking state

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchNotifications();
      toast.success('Notifications refreshed');
    } catch {
      toast.error('Could not refresh notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    setMarkingAll(true);
    try {
      for (const n of unread) {
        await markRead(n.id);
      }
      await fetchNotifications();
      toast.success(`Marked ${unread.length} notifications as read`);
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  // Mark a single notification as read with toast feedback
  const handleMarkSingle = async (notification) => {
    if (notification.is_read) return;
    setMarkingIds((prev) => new Set(prev).add(notification.id));
    try {
      await markRead(notification.id);
      // Refresh the list to reflect the change (optional; context may already update)
      await fetchNotifications();
      toast.success('Notification marked as read');
    } catch {
      toast.error('Could not mark as read');
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markingAll ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <FiCheckCircle className="w-4 h-4" />
              )}
              Mark all read
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-card">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600">No notifications</h3>
          <p className="text-sm text-gray-400 mt-1">You’re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkSingle(n)}
              className={`group p-4 rounded-xl border transition-all duration-200 ${
                n.is_read
                  ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm cursor-default'
                  : 'bg-blue-50/50 border-blue-200 hover:bg-blue-50 hover:shadow-sm cursor-pointer'
              }`}
            >
              <div className="flex gap-3 items-start">
                {/* Type Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {n.type === 'ORDER' && <span className="text-xl">📦</span>}
                  {n.type === 'PAYMENT' && <span className="text-xl">💰</span>}
                  {n.type === 'DELIVERY' && <span className="text-xl">🚚</span>}
                  {n.type === 'STOCK' && <span className="text-xl">⚠️</span>}
                  {!n.type && <FiBell className="w-5 h-5 text-gray-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {n.title}
                    </h3>
                    {!n.is_read && !markingIds.has(n.id) && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" title="Unread" />
                    )}
                    {markingIds.has(n.id) && (
                      <svg className="animate-spin h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{formatDate(n.created_at)}</span>
                    {n.is_read && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiCheck className="w-3 h-3" />
                        Read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}