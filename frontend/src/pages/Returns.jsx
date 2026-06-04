import { useState, useEffect } from 'react';
import { getMyReturns } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FiRefreshCw,
  FiPackage,
  FiCheck,
  FiX,
  FiClock,
} from 'react-icons/fi';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

// Convert a UTC/ISO date string to IST and format it nicely
const formatDateIST = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const steps = ['PENDING', 'APPROVED', 'COMPLETED'];

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const { data } = await getMyReturns();
      setReturns(data);
      toast.success('Returns refreshed');
    } catch (err) {
      toast.error('Failed to load return requests');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchReturns();
  }, [user]);

  const getProgressIndex = (status) => {
    if (status === 'REJECTED') return -1;
    return steps.indexOf(status);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 bg-gray-200 rounded w-48" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
            <div className="flex justify-between mb-3">
              <div className="h-5 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="mt-4 h-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiPackage className="w-6 h-6" /> My Returns & Refunds
        </h1>
        <button
          onClick={fetchReturns}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
        >
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {returns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No return or refund requests.</p>
          <p className="text-sm mt-2">
            Your requests will appear here after you submit a return or refund from your orders.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {returns.map((ret) => {
            const progressIdx = getProgressIndex(ret.status);
            const isRejected = ret.status === 'REJECTED';

            return (
              <div
                key={ret.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="font-bold text-lg">Request #{ret.id}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      Order #{ret.order_id}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[ret.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ret.status}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Reason:</span> {ret.reason}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Refund Amount:</span> ₹
                  {ret.refund_amount?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Submitted on {formatDateIST(ret.created_at)}
                </p>
                {ret.admin_note && (
                  <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                    <span className="font-medium">Admin note:</span> {ret.admin_note}
                  </p>
                )}

                {/* Progress Indicator */}
                <div className="mt-5 pt-4 border-t">
                  {isRejected ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <FiX className="w-5 h-5" />
                      <span className="text-sm font-medium">Request has been rejected</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between relative">
                      {steps.map((step, idx) => {
                        const isCompleted = idx < progressIdx;
                        const isCurrent = idx === progressIdx;
                        return (
                          <div
                            key={step}
                            className="flex flex-col items-center flex-1 relative z-10"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                isCompleted || isCurrent
                                  ? 'bg-green-500'
                                  : 'bg-gray-300'
                              }`}
                            >
                              {isCompleted ? (
                                <FiCheck className="w-4 h-4" />
                              ) : isCurrent ? (
                                <FiClock className="w-4 h-4" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <span className="text-xs mt-1 text-center">{step}</span>
                          </div>
                        );
                      })}
                      {/* Connecting lines */}
                      <div className="absolute top-4 left-[10%] right-[10%] flex h-1 z-0">
                        {steps.map((_, idx) =>
                          idx < steps.length - 1 ? (
                            <div
                              key={idx}
                              className="flex-1 h-full mx-1 rounded"
                              style={{
                                backgroundColor:
                                  idx < progressIdx ? '#22c55e' : '#d1d5db',
                              }}
                            ></div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}