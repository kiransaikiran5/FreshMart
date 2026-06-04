import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext();

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 5000),
    warning: (msg) => addToast(msg, 'warning', 4000),
    info: (msg) => addToast(msg, 'info', 3500),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container – TOP‑RIGHT, proper width, stacks vertically */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: '360px' }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg border animate-slide-down text-sm font-medium ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : t.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <span className="flex-shrink-0 mt-0.5">
              {t.type === 'success' ? (
                <FiCheckCircle className="w-4 h-4 text-emerald-500" />
              ) : t.type === 'error' ? (
                <FiXCircle className="w-4 h-4 text-red-500" />
              ) : t.type === 'warning' ? (
                <FiAlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <FiInfo className="w-4 h-4 text-blue-500" />
              )}
            </span>
            <span className="flex-1 pr-2">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 mt-0.5"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);