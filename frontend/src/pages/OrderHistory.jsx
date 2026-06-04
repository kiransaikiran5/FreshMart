import { useState, useEffect } from 'react';
import { getOrders, cancelOrder, requestReturn } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiX,
  FiSend,
  FiTruck,
  FiRotateCcw,
  FiCreditCard,
} from 'react-icons/fi';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [returnModal, setReturnModal] = useState({ open: false, orderId: null });
  const [returnReason, setReturnReason] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const { data } = await getOrders();
      setOrders(data);
    } catch (err) {
      toast.error('Failed to load orders');
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Auto‑refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);   // clean up on unmount
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    setLoadingAction(orderId);
    try {
      await cancelOrder(orderId);
      toast.success(`Order #${orderId} cancelled`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cancel failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReturnRequest = async () => {
    const orderId = returnModal.orderId;
    if (!returnReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setLoadingAction(orderId);
    try {
      await requestReturn({ order_id: orderId, reason: returnReason.trim() });
      toast.success('Refund/return request submitted');
      setReturnModal({ open: false, orderId: null });
      setReturnReason('');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Request failed');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order History</h1>
        <button
          onClick={fetchOrders}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <FiRotateCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No orders yet</p>
          <Link to="/products" className="text-green-600 hover:underline mt-2 inline-block">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <span className="font-bold text-lg">Order #{order.id}</span>
                  <span className="text-sm text-gray-500 ml-3">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    statusColors[order.order_status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {order.order_status}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {item.product_name} × {item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="font-bold text-lg">
                  Total: ₹{order.total_amount.toFixed(2)}
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/delivery/${order.id}`}
                    className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                  >
                    <FiTruck className="w-4 h-4" /> Track
                  </Link>

                  {order.order_status === 'PENDING' && (
                    <button
                      onClick={() => navigate(`/payment/${order.id}`)}
                      className="px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium flex items-center gap-1"
                    >
                      <FiCreditCard className="w-4 h-4" /> Pay Now
                    </button>
                  )}

                  {(order.order_status === 'PENDING' ||
                    order.order_status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={loadingAction === order.id}
                      className="px-4 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium disabled:opacity-50"
                    >
                      {loadingAction === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}

                  {order.order_status === 'DELIVERED' && (
                    <button
                      onClick={() => {
                        setReturnModal({ open: true, orderId: order.id });
                        setReturnReason('');
                      }}
                      className="px-4 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition text-sm font-medium"
                    >
                      Request Return
                    </button>
                  )}

                  {order.order_status === 'CANCELLED' && (
                    <button
                      onClick={() => {
                        setReturnModal({ open: true, orderId: order.id });
                        setReturnReason('');
                      }}
                      className="px-4 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition text-sm font-medium"
                    >
                      Request Refund
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Return / Refund Request Modal */}
      {returnModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                Request Refund / Return (Order #{returnModal.orderId})
              </h2>
              <button
                onClick={() => setReturnModal({ open: false, orderId: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Please describe the reason..."
              className="w-full border p-3 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-green-300 outline-none resize-none"
              rows="4"
              required
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReturnModal({ open: false, orderId: null })}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnRequest}
                disabled={loadingAction === returnModal.orderId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <FiSend className="w-4 h-4" />
                {loadingAction === returnModal.orderId ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}