import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllReturns, updateReturnStatus } from '../services/api';
import { useToast } from '../context/ToastContext';
import { FiRefreshCw, FiCheck, FiX, FiUser } from 'react-icons/fi';
import ConfirmationModal from '../components/ConfirmationModal';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState({ open: false, returnId: null, newStatus: '' });
  const [updating, setUpdating] = useState(false);
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const { data } = await getAllReturns();
      setReturns(data);
    } catch {
      toast.error('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchReturns();
  }, [isAdmin]);

  const openStatusModal = (returnId, newStatus) => {
    setStatusModal({ open: true, returnId, newStatus });
  };

  const confirmStatusChange = async () => {
    const { returnId, newStatus } = statusModal;
    if (!returnId || !newStatus) return;
    setUpdating(true);
    try {
      await updateReturnStatus(returnId, newStatus);
      toast.success(`Return #${returnId} updated to ${newStatus}`);
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setUpdating(false);
      setStatusModal({ open: false, returnId: null, newStatus: '' });
    }
  };

  const cancelStatusChange = () => {
    setStatusModal({ open: false, returnId: null, newStatus: '' });
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex justify-between mb-3">
                <div className="h-5 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="mt-4 h-6 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Returns Management</h1>
          <button
            onClick={fetchReturns}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
          >
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {returns.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No return requests.</div>
        ) : (
          <div className="space-y-4">
            {returns.map((ret) => (
              <div
                key={ret.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="font-bold text-lg">Return #{ret.id}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      Order #{ret.order_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                      <FiUser className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-700">
                        {ret.user_email || 'Unknown user'}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[ret.status]}`}>
                      {ret.status}
                    </span>
                    {ret.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => openStatusModal(ret.id, 'APPROVED')}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                          title="Approve"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openStatusModal(ret.id, 'REJECTED')}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          title="Reject"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {ret.status === 'APPROVED' && (
                      <button
                        onClick={() => openStatusModal(ret.id, 'COMPLETED')}
                        className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 transition"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Reason:</span> {ret.reason}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Refund Amount:</span> ₹{ret.refund_amount?.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Requested on {new Date(ret.created_at).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour12: true,
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={statusModal.open}
        title="Change return status"
        message={`Change return #${statusModal.returnId} to ${statusModal.newStatus}?`}
        onConfirm={confirmStatusChange}
        onCancel={cancelStatusChange}
        isLoading={updating}
        confirmLabel="Yes, change"
      />
    </>
  );
}