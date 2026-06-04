import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  const toggle = () => setOpen((prev) => !prev);

  const handleMarkRead = async (id) => {
    await markRead(id);
    // Keep dropdown open – user might want to read more.
    // (If you prefer auto‑close, uncomment the next line)
    // setOpen(false);
  };

  const handleViewAll = () => setOpen(false);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={toggle}
        className="relative p-2 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 font-bold shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-scale-in origin-top-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <FiBell className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 6).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleMarkRead(notif.id)}
                  className={`w-full text-left px-4 py-3 flex gap-3 items-start border-b border-gray-50 last:border-0 transition-colors ${
                    notif.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'
                  }`}
                >
                  {/* Type Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {notif.type === 'ORDER' && <span className="text-lg">📦</span>}
                    {notif.type === 'PAYMENT' && <span className="text-lg">💰</span>}
                    {notif.type === 'DELIVERY' && <span className="text-lg">🚚</span>}
                    {notif.type === 'STOCK' && <span className="text-lg">⚠️</span>}
                    {!notif.type && <FiBell className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${notif.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0" title="Unread" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            to="/notifications"
            onClick={handleViewAll}
            className="block text-center text-sm text-green-600 hover:text-green-700 font-medium py-2 border-t border-gray-100 hover:bg-gray-50 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}