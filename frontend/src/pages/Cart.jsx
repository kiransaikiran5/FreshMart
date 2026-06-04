import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { updateCartItem, removeCartItem } from '../services/api';
import { useToast } from '../context/ToastContext';
import ImageWithFallback from '../components/ImageWithFallback';
import ConfirmationModal from '../components/ConfirmationModal';

/**
 * Builds the correct image URL from the value returned by the backend.
 * - If it already starts with http or /static, use it as is.
 * - If it's just a filename, prepend /static/images/.
 */
const getImageSrc = (image) => {
  if (!image) return null;
  if (image.startsWith('http') || image.startsWith('/static/')) {
    return image;
  }
  return `/static/images/${image}`;
};

export default function Cart() {
  const { cartItems, cartTotal, fetchCart, loading: cartLoading } = useCart();
  const toast = useToast();

  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [removingId, setRemovingId] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  // Fetch cart on mount if not already loaded
  useEffect(() => {
    if (!cartLoading && cartItems === null) {
      fetchCart();
    }
  }, []);

  const handleUpdate = async (itemId, newQuantity) => {
    if (newQuantity < 1 || updatingIds.has(itemId)) return;
    setUpdatingIds((prev) => new Set(prev).add(itemId));
    try {
      await updateCartItem(itemId, newQuantity);
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update quantity');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Open the confirmation modal instead of window.confirm
  const handleRemoveClick = (item) => {
    setItemToRemove(item);
    setShowRemoveModal(true);
  };

  const confirmRemove = async () => {
    if (!itemToRemove || removingId) return;
    setRemovingId(itemToRemove.id);
    try {
      await removeCartItem(itemToRemove.id);
      await fetchCart();
      toast.success('Item removed');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not remove item');
    } finally {
      setRemovingId(null);
      setShowRemoveModal(false);
      setItemToRemove(null);
    }
  };

  const cancelRemove = () => {
    setShowRemoveModal(false);
    setItemToRemove(null);
  };

  // Loading skeleton
  if (cartLoading || cartItems === null) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-2xl flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-2xl h-48" />
        </div>
      </div>
    );
  }

  // Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-700">Your cart is empty</h2>
        <p className="text-gray-500 mt-2 max-w-md">
          Looks like you haven't added any products yet. Explore our collection and find something you love!
        </p>
        <Link
          to="/products"
          className="mt-8 inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-lg shadow-green-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Shopping Cart
            <span className="text-lg font-normal text-gray-500 ml-2">({cartItems.length} items)</span>
          </h1>
          <Link to="/products" className="text-sm text-gray-500 hover:text-green-600 font-medium transition">
            Continue Shopping →
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex gap-4 items-center"
              >
                {/* Product Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={getImageSrc(item.image)}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details & Quantity */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{item.product_name}</h3>
                  <p className="text-green-600 font-bold mt-1">₹{item.price}</p>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleUpdate(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updatingIds.has(item.id)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Decrease quantity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="font-semibold w-8 text-center select-none">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdate(item.id, item.quantity + 1)}
                      disabled={updatingIds.has(item.id)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Increase quantity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    {updatingIds.has(item.id) && (
                      <svg className="animate-spin h-4 w-4 text-gray-400 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Subtotal & Remove */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => handleRemoveClick(item)}
                    disabled={removingId === item.id}
                    className="text-red-400 hover:text-red-600 mt-1 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {removingId === item.id ? (
                      <span className="flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Removing...
                      </span>
                    ) : (
                      'Remove'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
              </div>
              <hr className="my-4" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <Link
                to="/checkout"
                className="mt-6 flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Proceed to Checkout
              </Link>
              <Link to="/products" className="mt-4 block w-full text-center text-sm text-gray-500 hover:text-green-600 transition">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Custom confirmation modal */}
      <ConfirmationModal
        isOpen={showRemoveModal}
        title="Remove item"
        message={`Remove "${itemToRemove?.product_name}" from your cart?`}
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
        isLoading={removingId === itemToRemove?.id}
        confirmLabel="Remove"
      />
    </>
  );
}