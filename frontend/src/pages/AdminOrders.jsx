import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  getAdminOrders,
  updateOrderStatus,
  getDelivery,
  updateDelivery,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FiRefreshCw,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiUser,
  FiEye,
  FiMapPin,
  FiClock,
  FiEdit3,
} from 'react-icons/fi';
import ConfirmationModal from '../components/ConfirmationModal';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const deliveryStatusMap = {
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

/**
 * Format an ISO date string that is known to be in UTC.
 * (Used for order created_at)
 */
const formatUTCDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  // Ensure it's treated as UTC
  const fixedStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
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

/**
 * Format a naive local date string WITHOUT any timezone shift.
 * (Used for estimated delivery time)
 */
const formatLocalDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr); // interpreted as local time
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calculateTotal = (order) => {
  if (!order.items || order.items.length === 0) return order.total_amount || 0;
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [statusModal, setStatusModal] = useState({ open: false, orderId: null, newStatus: '' });
  const [updating, setUpdating] = useState(false);
  const [deliveryModal, setDeliveryModal] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ status: '', estimated_time: '' });
  const [updatingDelivery, setUpdatingDelivery] = useState(false);

  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminOrders();
      setOrders(data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchOrders();
  }, [isAdmin]);

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setDelivery(null);
    try {
      const { data } = await getDelivery(order.id);
      setDelivery(data);
      setDeliveryForm({
        status: data.delivery_status || '',
        // Slice to "2026-05-30T18:06" for datetime-local input
        estimated_time: data.estimated_time ? data.estimated_time.slice(0, 16) : '',
      });
    } catch {
      setDelivery(null);
      setDeliveryForm({ status: '', estimated_time: '' });
    }
  };

  const handleCloseOrderDetail = () => {
    setSelectedOrder(null);
    setDelivery(null);
  };

  const openStatusModal = (orderId, newStatus) => {
    setStatusModal({ open: true, orderId, newStatus });
  };

  const confirmStatusChange = async () => {
    const { orderId, newStatus } = statusModal;
    if (!orderId || !newStatus) return;
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order #${orderId} updated to ${newStatus}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) handleCloseOrderDetail();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setUpdating(false);
      setStatusModal({ open: false, orderId: null, newStatus: '' });
    }
  };

  const cancelStatusChange = () => {
    setStatusModal({ open: false, orderId: null, newStatus: '' });
  };

  const openDeliveryUpdate = () => {
    if (!delivery) return;
    setDeliveryModal(true);
  };

  const handleDeliveryUpdate = async () => {
    if (!selectedOrder || !delivery) return;
    const { status, estimated_time } = deliveryForm;
    if (!status) {
      toast.warning('Please select a delivery status');
      return;
    }
    setUpdatingDelivery(true);
    try {
      const params = { status };
      // Send the local time string as-is (no UTC conversion)
      if (estimated_time) {
        // Append seconds so backend datetime.fromisoformat() can parse it
        params.estimated_time = estimated_time + ':00';
      }
      await updateDelivery(selectedOrder.id, params);
      toast.success('Delivery status updated');
      const { data } = await getDelivery(selectedOrder.id);
      setDelivery(data);
      setDeliveryForm({
        status: data.delivery_status || '',
        estimated_time: data.estimated_time ? data.estimated_time.slice(0, 16) : '',
      });
      setDeliveryModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setUpdatingDelivery(false);
    }
  };

  const getTrackingSteps = () => {
    if (!selectedOrder) return [];
    const steps = [{ label: 'Order Placed', done: true }];

    if (selectedOrder.order_status === 'CANCELLED') {
      steps.push({ label: 'Cancelled', done: true });
      return steps;
    }

    const isPreparing =
      selectedOrder.order_status === 'CONFIRMED' &&
      (!delivery || delivery.delivery_status === 'PREPARING' || !delivery.delivery_status);
    steps.push({ label: 'Preparing', done: isPreparing });

    const outForDelivery = delivery && delivery.delivery_status === 'OUT_FOR_DELIVERY';
    steps.push({
      label: 'Out for Delivery',
      done: outForDelivery || (delivery && delivery.delivery_status === 'DELIVERED'),
    });

    const isDelivered =
      (delivery && delivery.delivery_status === 'DELIVERED') ||
      selectedOrder.order_status === 'DELIVERED';
    steps.push({ label: 'Delivered', done: isDelivered });

    return steps;
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
          >
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="flex justify-between mb-3">
                  <div className="h-5 bg-gray-200 rounded w-24" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-16 mt-2 ml-auto" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No orders found.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">Order #{order.id}</span>
                    <span className="text-sm text-gray-500">
                      {formatUTCDate(order.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                      <FiUser className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-700">{order.user_email || 'N/A'}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.order_status]}`}
                    >
                      {order.order_status}
                    </span>
                    {order.order_status === 'PENDING' && (
                      <button
                        onClick={() => openStatusModal(order.id, 'CONFIRMED')}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition"
                      >
                        <FiCheckCircle className="w-3 h-3" /> Confirm
                      </button>
                    )}
                    {order.order_status === 'CONFIRMED' && (
                      <button
                        onClick={() => openStatusModal(order.id, 'DELIVERED')}
                        className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition"
                      >
                        <FiTruck className="w-3 h-3" /> Deliver
                      </button>
                    )}
                    {(order.order_status === 'PENDING' || order.order_status === 'CONFIRMED') && (
                      <button
                        onClick={() => openStatusModal(order.id, 'CANCELLED')}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition"
                      >
                        <FiXCircle className="w-3 h-3" /> Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                      title="View details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.product_name} × {item.quantity}
                      </span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-right font-bold mt-2">
                  Total: ₹{calculateTotal(order).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Order #{selectedOrder.id}</h2>
                <button
                  onClick={handleCloseOrderDetail}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 space-y-1 text-sm">
                <p>
                  <span className="font-medium">Customer:</span>{' '}
                  {selectedOrder.user_email || 'N/A'}
                </p>
                {selectedOrder.shipping_address && (
                  <p className="flex items-center gap-1">
                    <FiMapPin className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.shipping_address}</span>
                  </p>
                )}
                <p>
                  <span className="font-medium">Order placed on:</span>{' '}
                  {formatUTCDate(selectedOrder.created_at)}
                </p>
                {delivery && (
                  <>
                    <p>
                      <span className="font-medium">Delivery status:</span>{' '}
                      <span className="font-semibold text-blue-700">
                        {delivery.delivery_status
                          ? deliveryStatusMap[delivery.delivery_status] || delivery.delivery_status
                          : 'N/A'}
                      </span>
                    </p>
                    {delivery.estimated_time && (
                      <p className="flex items-center gap-1">
                        <FiClock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Estimated delivery:</span>{' '}
                        {formatLocalDate(delivery.estimated_time)}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="border-t pt-4 mb-4">
                <h3 className="font-semibold mb-2">Items</h3>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span>₹{calculateTotal(selectedOrder).toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.order_status !== 'CANCELLED' && selectedOrder.order_status !== 'PENDING' && (
                <div>
                  <h3 className="font-semibold mb-3">Delivery Tracking</h3>
                  <div className="relative pl-6 border-l-2 border-gray-200 space-y-5">
                    {getTrackingSteps().map((step, idx, arr) => {
                      const isCurrent = !step.done && (idx === 0 || arr[idx - 1].done);
                      return (
                        <div key={idx} className="relative">
                          <div
                            className={`absolute -left-[29px] w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              step.done
                                ? 'bg-green-500 border-green-500 text-white'
                                : isCurrent
                                ? 'bg-white border-green-500 text-green-500'
                                : 'bg-white border-gray-300 text-gray-300'
                            }`}
                          >
                            {step.done ? (
                              <FiCheckCircle className="w-3 h-3" />
                            ) : isCurrent ? (
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              step.done
                                ? 'text-gray-800 font-medium'
                                : isCurrent
                                ? 'text-green-700 font-medium'
                                : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {delivery && delivery.delivery_status !== 'DELIVERED' && selectedOrder.order_status !== 'CANCELLED' && (
                    <div className="mt-4">
                      <button
                        onClick={openDeliveryUpdate}
                        className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                      >
                        <FiEdit3 className="w-4 h-4" /> Update Delivery Status
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 pb-4">
              <button
                onClick={handleCloseOrderDetail}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Status Update Modal */}
      {deliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-lg font-bold mb-4">Update Delivery Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={deliveryForm.status}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-green-300 outline-none"
                >
                  <option value="">-- Select --</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Estimated Delivery Time (optional)
                </label>
                <input
                  type="datetime-local"
                  value={deliveryForm.estimated_time}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, estimated_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-300 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setDeliveryModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeliveryUpdate}
                disabled={updatingDelivery}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {updatingDelivery ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : null}
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={statusModal.open}
        title="Change order status"
        message={`Change order #${statusModal.orderId} to ${statusModal.newStatus}?`}
        onConfirm={confirmStatusChange}
        onCancel={cancelStatusChange}
        isLoading={updating}
        confirmLabel="Yes, change"
      />
    </>
  );
}