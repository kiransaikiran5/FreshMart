import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDelivery, getOrders } from '../services/api';
import { FiTruck, FiMapPin, FiClock, FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';

const statuses = ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function DeliveryTracking() {
  const { orderId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deliveryRes, ordersRes] = await Promise.all([
          getDelivery(orderId),
          getOrders(),   // fetch all orders to find this one
        ]);
        setDelivery(deliveryRes.data);

        const foundOrder = ordersRes.data.find(o => o.id === parseInt(orderId));
        if (foundOrder) {
          setOrder(foundOrder);
        }
      } catch (err) {
        setError('Failed to load tracking information');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center text-gray-500">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <FiAlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 text-lg">{error || 'Delivery information not found'}</p>
        <Link to="/orders" className="text-green-600 hover:underline mt-4 inline-block">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentIdx = statuses.indexOf(delivery.delivery_status);
  const isCancelled = order?.order_status === 'CANCELLED';

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-2">Delivery Tracking – Order #{orderId}</h1>

      {/* Cancellation Notice */}
      {isCancelled && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <FiX className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            This order has been <strong>cancelled</strong>. Delivery tracking is no longer active.
            {order && (
              <span> You can <Link to="/returns" className="underline font-medium">request a refund</Link> if you haven't already.</span>
            )}
          </p>
        </div>
      )}

      {/* Tracking Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Info Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-600">
              <FiMapPin className="w-4 h-4" />
              <span className="font-medium">{delivery.delivery_address}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <FiClock className="w-4 h-4" />
              <span>
                {delivery.estimated_time
                  ? `Estimated: ${new Date(delivery.estimated_time).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}`
                  : 'Estimated time not available'}
              </span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isCancelled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {isCancelled ? 'Cancelled' : 'Active'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative pt-2">
          {/* Steps */}
          <div className="flex justify-between relative z-10">
            {statuses.map((s, idx) => {
              const isCompleted = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isPending = idx > currentIdx;
              return (
                <div key={s} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-green-500 text-white ring-4 ring-green-100'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <FiCheck className="w-5 h-5" />
                    ) : isCurrent ? (
                      <FiTruck className="w-5 h-5 animate-pulse" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-xs mt-2 text-center font-medium ${
                    isCompleted || isCurrent ? 'text-green-700' : 'text-gray-400'
                  }`}>
                    {s === 'OUT_FOR_DELIVERY' ? 'OUT FOR\nDELIVERY' : s}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Connecting Lines */}
          <div className="absolute top-5 left-[5%] right-[5%] flex h-1 z-0">
            {statuses.map((_, idx) =>
              idx < statuses.length - 1 ? (
                <div
                  key={idx}
                  className="flex-1 h-full mx-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: idx < currentIdx ? '#22c55e' : '#e5e7eb',
                  }}
                />
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}