import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getProduct,
  getProductReviews,
  submitReview,
  getAverageRating,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  getFrequentlyBoughtTogether,
} from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import StarRating from '../components/StarRating';
import ImageWithFallback from '../components/ImageWithFallback';
import { FiHeart } from 'react-icons/fi';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newReview, setNewReview] = useState({ rating: 5, review_text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [fbtProducts, setFbtProducts] = useState([]);

  const { user } = useAuth();
  const { fetchCart } = useCart();
  const { isInWishlist, fetchWishlist } = useWishlist();
  const toast = useToast();

  const fetchProductData = async () => {
    setLoading(true);
    setError(null);
    try {
      const prodRes = await getProduct(id);
      setProduct(prodRes.data);
    } catch {
      setError('Failed to load product.');
      toast.error('Could not load product details');
    }
    setLoading(false);
  };

  const fetchReviewsAndRating = async () => {
    setReviewsLoading(true);
    try {
      const [revsRes, avgRes] = await Promise.allSettled([
        getProductReviews(id),
        getAverageRating(id),
      ]);
      if (revsRes.status === 'fulfilled') {
        setReviews(revsRes.value.data);
      } else {
        setReviews([]);
      }
      if (avgRes.status === 'fulfilled') {
        setAvgRating(avgRes.value.data.average_rating);
      } else {
        setAvgRating(0);
      }
    } catch {}
    setReviewsLoading(false);
  };

  const fetchFrequentlyBoughtTogether = async () => {
    if (!id) return;
    try {
      const res = await getFrequentlyBoughtTogether(id);
      setFbtProducts(res.data);
    } catch {
      setFbtProducts([]);
    }
  };

  const loadAllData = () => {
    fetchProductData();
    fetchReviewsAndRating();
    fetchFrequentlyBoughtTogether();
  };

  useEffect(() => {
    loadAllData();
  }, [id]);

  const handleAddCart = async () => {
    try {
      await addToCart(product.id, 1);
      fetchCart();
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not add to cart');
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(product.id, 1);
      fetchCart();
      navigate('/cart');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not proceed');
    }
  };

  const handleAddCartForFbt = async (productId) => {
    try {
      await addToCart(productId, 1);
      fetchCart();
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product.id);
        toast.success('Added to wishlist');
      }
      fetchWishlist();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not update wishlist');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.review_text.trim()) {
      toast.error('Please write a review');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReview({
        product_id: product.id,
        rating: newReview.rating,
        review_text: newReview.review_text.trim(),
      });
      toast.success('Review submitted');
      setNewReview({ rating: 5, review_text: '' });
      fetchReviewsAndRating();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper to get image source for FBT items
  const getFbtImageSrc = (p) => {
    if (p.image && (p.image.startsWith('http') || p.image.startsWith('/static/'))) {
      return p.image;
    }
    if (p.image) {
      return `/static/images/${p.image}`;
    }
    return 'https://via.placeholder.com/300x300?text=No+Image'; // Square placeholder
  };

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button onClick={loadAllData} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">Retry</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 animate-pulse">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl bg-gray-200 h-96" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-xl">Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-1">
        <button onClick={() => navigate('/products')} className="hover:text-green-600 transition">Products</button>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* ---------- MAIN IMAGE ---------- */}
        {/* ✅ Changed object-cover → object-contain to show the full product without cropping */}
        <div className="rounded-2xl overflow-hidden shadow-lg bg-white h-80 md:h-96 p-4 flex items-center justify-center">
          <ImageWithFallback
            src={product.image || 'https://via.placeholder.com/500x500?text=No+Image'}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Product Details (unchanged) */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">{product.name}</h1>
              <button
                onClick={handleWishlistToggle}
                className="p-2 rounded-full hover:bg-gray-100 transition flex-shrink-0"
                title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <FiHeart className={`w-6 h-6 ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
              </button>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <span className="text-3xl font-bold text-green-600">₹{product.price}</span>
              {product.stock_quantity > 0 ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">In Stock</span>
              ) : (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">Out of Stock</span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <StarRating rating={avgRating} size="text-xl" />
              <span className="text-gray-500 text-sm">({reviews.length} reviews)</span>
            </div>

            <p className="mt-6 text-gray-600 leading-relaxed">{product.description || 'No description available.'}</p>

            {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
              <p className="mt-2 text-sm text-orange-600 font-medium">Only {product.stock_quantity} left in stock – order soon</p>
            )}
          </div>

          {product.stock_quantity > 0 && (
            <div className="flex gap-4 mt-8">
              <button onClick={handleAddCart} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Add to Cart
              </button>
              <button onClick={handleBuyNow} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-95">Buy Now</button>
            </div>
          )}
        </div>
      </div>

      {/* Frequently Bought Together – uniform square cards (unchanged) */}
      {fbtProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🛒 Frequently Bought Together</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {fbtProducts.map(p => (
              <div key={p.id} className="min-w-[160px] max-w-[160px] bg-white rounded-xl shadow-card hover:shadow-lg transition flex-shrink-0 snap-start">
                <Link to={`/products/${p.id}`} className="block overflow-hidden rounded-t-xl bg-gray-50 h-40">
                  <ImageWithFallback
                    src={getFbtImageSrc(p)}
                    alt={p.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <div className="p-3">
                  <Link to={`/products/${p.id}`} className="text-sm font-semibold text-gray-800 line-clamp-1">{p.name}</Link>
                  <p className="text-green-600 font-bold text-sm mt-1">₹{p.price}</p>
                  <button onClick={() => handleAddCartForFbt(p.id)} className="mt-2 w-full bg-green-600 text-white text-xs py-1.5 rounded-lg hover:bg-green-700 transition">Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section (unchanged) */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>
        {user && (
          <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-6 rounded-2xl shadow-inner mb-8 border border-gray-200">
            <h3 className="font-semibold text-lg mb-4">Write a Review</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-600">Your Rating:</span>
              <StarRating rating={newReview.rating} onRate={(r) => setNewReview({ ...newReview, rating: r })} interactive size="text-2xl" />
            </div>
            <textarea value={newReview.review_text} onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })} placeholder="Share your experience with this product..." rows={4} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500/30 outline-none resize-none transition" maxLength={500} />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-gray-400">{newReview.review_text.length}/500</span>
              <button type="submit" disabled={submittingReview} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {submittingReview ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : ('Submit Review')}
              </button>
            </div>
          </form>
        )}
        {reviewsLoading ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="animate-spin h-6 w-6 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl">
            <p className="text-gray-400 text-lg">No reviews yet.</p>
            {!user && <p className="text-gray-400 mt-2">Log in to write the first review.</p>}
          </div>
        ) : (
          <div className="space-y-5">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">{review.username?.charAt(0).toUpperCase() || 'U'}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-gray-800">{review.username || 'Anonymous'}</span>
                        <div className="mt-1"><StarRating rating={review.rating} size="text-sm" /></div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-600 text-sm leading-relaxed">{review.review_text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}