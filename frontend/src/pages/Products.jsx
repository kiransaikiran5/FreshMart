import { useState, useEffect } from 'react';
import {
  getProducts,
  addToCart,
  getCategories,
  addToWishlist,
  removeFromWishlist,
  getRecommendations,
} from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { FiSearch, FiMenu, FiX, FiHeart } from 'react-icons/fi';
import ImageWithFallback from '../components/ImageWithFallback';

/**
 * Build full image URL
 */
const getImageSrc = (img) => {
  if (!img) return null;
  if (img.startsWith('http') || img.startsWith('/static/')) {
    return img;
  }
  return `/static/images/${img}`;
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Original filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('');

  // New advanced filters
  const [availability, setAvailability] = useState(false);
  const [discounted, setDiscounted] = useState(false);
  const [brand, setBrand] = useState('');
  const [minRating, setMinRating] = useState('');

  // Search suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recommended, setRecommended] = useState([]);

  const { fetchCart } = useCart();
  const { isInWishlist, fetchWishlist } = useWishlist();
  const { user } = useAuth();
  const toast = useToast();

  // Category icons
  const categoryIcons = {
    Fruits: '🍎',
    Vegetables: '🥬',
    Dairy: '🥛',
    Bakery: '🍞',
    Beverages: '🥤',
    'Meat & Fish': '🍗',
    Snacks: '🍿',
  };

  // Fetch categories on mount
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  // Fetch recommendations when user changes
  useEffect(() => {
    if (user) {
      getRecommendations()
        .then((res) => setRecommended(res.data))
        .catch(() => setRecommended([]));
    } else {
      setRecommended([]);
    }
  }, [user]);

  // Fetch products based on all filters
  const fetchProducts = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category_id = category;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (sort) params.sort_by = sort;
    if (availability) params.availability = true;
    if (discounted) params.discounted = true;
    if (brand) params.brand = brand;
    if (minRating) params.min_rating = minRating;

    try {
      const { data } = await getProducts(params);
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category, minPrice, maxPrice, sort, availability, discounted, brand, minRating]);

  // Add to cart
  const handleAdd = async (productId) => {
    try {
      await addToCart(productId, 1);
      fetchCart();
      toast.success('Item added to cart');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add');
    }
  };

  // Wishlist toggle
  const handleWishlistToggle = async (productId) => {
    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(productId);
        toast.success('Added to wishlist');
      }
      fetchWishlist();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  // Category click (sidebar)
  const handleCategoryClick = (catId) => {
    setCategory((prev) => (prev === catId ? '' : catId));
    setSidebarOpen(false);
  };

  // Search input change with suggestions
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.length > 1) {
      try {
        const { data } = await getProducts({ search: value });
        setSuggestions(data.map(p => p.name).slice(0, 5));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-2 md:p-4 mb-8 text-white shadow-lg">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            🥬 Fresh & Organic
          </h2>
          <p className="mt-3 text-lg opacity-90">
            Up to 30% OFF on fruits and vegetables. Limited time offer!
          </p>
          <button
            onClick={() => setCategory('1')}
            className="mt-5 bg-white text-green-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-green-50 transition"
          >
            Shop Fruits
          </button>
        </div>
      </div>

      {/* MOBILE CATEGORY BUTTON */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm"
        >
          <FiMenu className="w-4 h-4" />
          Categories
        </button>
      </div>

      <div className="flex gap-6">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:block w-60 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sticky top-20">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCategory('')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    category === '' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🛒 All Products
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                      category === cat.id ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{categoryIcons[cat.category_name] || '🛒'}</span>
                    <span>{cat.category_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* MOBILE SIDEBAR */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Categories</h3>
                <button onClick={() => setSidebarOpen(false)}><FiX className="w-5 h-5 text-gray-600" /></button>
              </div>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => { setCategory(''); setSidebarOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">🛒 All Products</button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button onClick={() => handleCategoryClick(cat.id)} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center gap-3">
                      <span className="text-lg">{categoryIcons[cat.category_name] || '🛒'}</span>
                      <span>{cat.category_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          {/* FILTERS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              {/* SEARCH with autocomplete */}
              <div className="relative flex-1 min-w-[220px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groceries..."
                  value={search}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-green-300"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 mt-1 py-1">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSearch(s); setShowSuggestions(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-gray-700"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CATEGORY */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                ))}
              </select>

              {/* MIN PRICE */}
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-28 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
              />

              {/* MAX PRICE */}
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-28 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
              />

              {/* BRAND */}
              <input
                type="text"
                placeholder="Brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-28 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
              />

              {/* AVAILABILITY CHECKBOX */}
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availability}
                  onChange={(e) => setAvailability(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-300"
                />
                In Stock Only
              </label>

              {/* DISCOUNTED CHECKBOX */}
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discounted}
                  onChange={(e) => setDiscounted(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-300"
                />
                Discounted Only
              </label>

              {/* MIN RATING */}
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                placeholder="Min Rating"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-24 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
              />

              {/* SORT */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
              >
                <option value="">Sort by</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
                <option value="name_desc">Name: Z-A</option>
                <option value="rating">Rating</option>
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
              </select>
            </div>
          </div>

          {/* RECOMMENDED FOR YOU */}
          {recommended.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">✨ Recommended for You</h2>
                <button
                  onClick={() => {
                    getRecommendations().then(res => setRecommended(res.data)).catch(() => {});
                  }}
                  className="text-sm text-green-600 hover:underline"
                >
                  Refresh
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {recommended.map(p => (
                  <div key={p.id} className="min-w-[220px] max-w-[220px] bg-white rounded-xl shadow-card hover:shadow-lg transition flex-shrink-0 snap-start">
                    <Link to={`/products/${p.id}`} className="block overflow-hidden rounded-t-xl bg-white">
                      {/* Image properly contained */}
                      <div className="h-40 flex items-center justify-center p-3 bg-gray-50">
                        <ImageWithFallback
                          src={getImageSrc(p.image)}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link to={`/products/${p.id}`} className="text-sm font-semibold text-gray-800 line-clamp-1">{p.name}</Link>
                      <p className="text-green-600 font-bold text-sm mt-1">₹{p.price}</p>
                      <button
                        onClick={() => handleAdd(p.id)}
                        className="mt-2 w-full bg-green-600 text-white text-xs py-1.5 rounded-lg hover:bg-green-700 transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOADING / EMPTY / PRODUCT GRID */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse">
                  <div className="h-56 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-3xl mb-3">😔 No Products Found</h2>
              <p className="text-gray-500">Try changing filters or search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="group bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
                  <Link to={`/products/${p.id}`} className="relative bg-white h-56 p-4 flex items-center justify-center overflow-hidden">
                    <ImageWithFallback
                      src={getImageSrc(p.image)}
                      alt={p.name}
                      className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow">10% OFF</div>
                    <button
                      onClick={(e) => { e.preventDefault(); handleWishlistToggle(p.id); }}
                      className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow hover:bg-white transition"
                      title={isInWishlist(p.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <FiHeart className={`w-5 h-5 ${isInWishlist(p.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                    </button>
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <Link to={`/products/${p.id}`} className="font-semibold text-gray-800 hover:text-green-600 line-clamp-2 min-h-[3rem]">{p.name}</Link>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">₹{p.price}</span>
                      <span className="text-sm text-gray-400 line-through">₹{Math.floor(p.price + 20)}</span>
                    </div>
                    <div className="mt-2">
                      {p.stock_quantity > 10 ? (
                        <span className="text-sm text-green-600 font-medium">✅ In Stock</span>
                      ) : p.stock_quantity > 0 ? (
                        <span className="text-sm text-orange-500 font-medium">⚠ Only {p.stock_quantity} left</span>
                      ) : (
                        <span className="text-sm text-red-500 font-medium">❌ Out of Stock</span>
                      )}
                    </div>
                    <div className="mt-auto pt-4">
                      {p.stock_quantity > 0 ? (
                        <button onClick={() => handleAdd(p.id)} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition active:scale-95">Add to Cart</button>
                      ) : (
                        <button disabled className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-semibold cursor-not-allowed">Out of Stock</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}