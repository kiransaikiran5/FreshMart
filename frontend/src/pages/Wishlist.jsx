import { useState, useEffect } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiRefreshCw } from 'react-icons/fi';
import { removeFromWishlist, moveWishlistToCart } from '../services/api';
import ImageWithFallback from '../components/ImageWithFallback';
import ConfirmationModal from '../components/ConfirmationModal';

// -- Image URL helper --
const getImageSrc = (img) => {
  if (!img) return null;
  if (img.startsWith('http') || img.startsWith('/static/')) return img;
  return `/static/images/${img}`;
};

// -- Professional Heart Icon (Amazon style) --
const HeartIcon = ({ className = "w-5 h-5", filled = false }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function Wishlist() {
  const { wishlistItems, fetchWishlist, loading } = useWishlist();
  const { fetchCart } = useCart();
  const toast = useToast();
  const [removingId, setRemovingId] = useState(null);
  const [movingId, setMovingId] = useState(null);
  const [removeModal, setRemoveModal] = useState({ open: false, productId: null, productName: '' });

  useEffect(() => {
    if (wishlistItems === null) fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    setRemoveModal({ open: false, productId: null, productName: '' });
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveToCart = async (productId) => {
    setMovingId(productId);
    try {
      await moveWishlistToCart(productId);
      toast.success('Moved to cart');
      fetchWishlist();
      fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to move to cart');
    } finally {
      setMovingId(null);
    }
  };

  // Loading skeleton
  if (loading || wishlistItems === null) {
    return (
      <div className="max-w-6xl mx-auto p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="h-64 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex gap-2 mt-4">
                  <div className="h-10 bg-gray-200 rounded flex-1" />
                  <div className="h-10 bg-gray-200 rounded w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <HeartIcon className="w-10 h-10 text-red-300" filled />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h1>
        <p className="text-gray-500 mb-6">Save items you love by clicking the heart icon on any product.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-medium"
        >
          <FiShoppingCart className="w-4 h-4" />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <HeartIcon className="w-5 h-5 text-red-500" filled />
            </span>
            My Wishlist ({wishlistItems.length})
          </h1>
          <button
            onClick={fetchWishlist}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
          >
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
            >
              <Link
                to={`/products/${item.product_id}`}
                className="relative bg-white h-64 p-4 flex items-center justify-center overflow-hidden"
              >
                <ImageWithFallback
                  src={getImageSrc(item.product_image)}
                  alt={item.product_name}
                  className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                />
              </Link>

              <div className="p-4 flex flex-col flex-1">
                <Link
                  to={`/products/${item.product_id}`}
                  className="font-semibold text-gray-800 hover:text-green-600 line-clamp-2 min-h-[2.5rem]"
                >
                  {item.product_name}
                </Link>
                <p className="text-green-600 font-bold text-lg mt-1">₹{item.product_price}</p>
                <p className={`text-xs mt-1 ${item.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {item.stock_quantity > 0 ? `In stock (${item.stock_quantity})` : 'Out of stock'}
                </p>

                <div className="mt-auto pt-4 flex gap-2">
                  {item.stock_quantity > 0 ? (
                    <button
                      onClick={() => handleMoveToCart(item.product_id)}
                      disabled={movingId === item.product_id}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                    >
                      {movingId === item.product_id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <FiShoppingCart className="w-4 h-4" />
                      )}
                      {movingId === item.product_id ? 'Moving...' : 'Add to Cart'}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-200 text-gray-400 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed"
                    >
                      Out of Stock
                    </button>
                  )}

                  {/* Heart removal button */}
                  <button
                    onClick={() => setRemoveModal({ open: true, productId: item.product_id, productName: item.product_name })}
                    disabled={removingId === item.product_id}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 transition text-red-500 hover:text-red-600 disabled:opacity-50"
                    title="Remove from wishlist"
                  >
                    {removingId === item.product_id ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <HeartIcon className="w-5 h-5 text-red-500" filled />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={removeModal.open}
        title="Remove from Wishlist"
        message={`Remove "${removeModal.productName}" from your wishlist?`}
        onConfirm={() => handleRemove(removeModal.productId)}
        onCancel={() => setRemoveModal({ open: false, productId: null, productName: '' })}
        isLoading={removingId === removeModal.productId}
        confirmLabel="Remove"
      />
    </>
  );
}