import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import NotificationBell from './NotificationBell';
import {
  FiShoppingCart,
  FiPackage,
  FiUser,
  FiLogOut,
  FiLayout,
  FiChevronDown,
  FiMenu,
  FiX,
  FiGrid,
  FiShoppingBag,
  FiHeart,
  FiAward,
  FiClock,
} from 'react-icons/fi';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const adminMenuRef = useRef(null);

  // Close user menu & admin menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  // Helper to check active route
  const isActive = (path) =>
    location.pathname === path
      ? 'text-green-600 bg-green-50'
      : 'text-gray-600 hover:text-green-600 hover:bg-green-50';

  // Username from AuthContext (JWT payload)
  const displayName = user?.username || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-2 text-green-600 font-bold text-2xl tracking-tight"
            >
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-md shadow-green-200">
                <FiShoppingBag className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="hidden sm:block">
                <span className="text-green-600">Fresh</span>
                <span className="text-gray-800">Mart</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5">
            <Link
              to="/products"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition font-medium text-sm ${isActive('/products')}`}
            >
              <FiGrid className="w-4 h-4" /> Products
            </Link>

            <Link
              to="/cart"
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition font-medium text-sm ${isActive('/cart')}`}
            >
              <FiShoppingCart className="w-4 h-4" /> Cart
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 font-bold shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition font-medium text-sm ${isActive('/wishlist')}`}
            >
              <FiHeart className="w-4 h-4" /> Wishlist
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 font-bold shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {user && (
              <Link
                to="/orders"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition font-medium text-sm ${isActive('/orders')}`}
              >
                <FiPackage className="w-4 h-4" /> Orders
              </Link>
            )}

            {user && (
              <Link
                to="/loyalty"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition font-medium text-sm ${isActive('/loyalty')}`}
              >
                <FiAward className="w-4 h-4" /> Loyalty
              </Link>
            )}

            {user && (
              <Link
                to="/returns"
                className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition font-medium text-sm"
              >
                <FiPackage className="w-4 h-4" />
                Returns
              </Link>
            )}

            {/* Admin Dropdown */}
            {isAdmin && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition font-medium text-sm ${
                    adminMenuOpen ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <FiLayout className="w-4 h-4" /> Admin <FiChevronDown className="w-4 h-4" />
                </button>
                {adminMenuOpen && (
                  <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
                    <Link to="/admin" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">Dashboard</Link>
                    <Link to="/admin/products" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">Products</Link>
                    <Link to="/admin/orders" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">Orders</Link>
                    <Link to="/admin/inventory" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">Inventory</Link>
                    <Link to="/admin/categories" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">Categories</Link>
                    <Link to="/admin/coupons" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">Coupons</Link>
                    <Link to="/admin/returns" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">Returns</Link>
                    <Link to="/admin/campaigns" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">Campaigns</Link>
                    <Link to="/admin/analytics" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">Analytics</Link>
                    <Link to="/admin/delivery-slots" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">Delivery Slots</Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition font-medium text-sm">
                  <FiUser className="w-4 h-4" /> Login
                </Link>
                <Link to="/register" className="px-5 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-md shadow-green-200 transition font-medium text-sm">
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium text-sm"
                  >
                    <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {avatarLetter}
                    </div>
                    <span className="hidden lg:inline text-gray-700 font-medium">{displayName}</span>
                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Account</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{displayName}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              {mobileOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link to="/products" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
              <FiGrid className="w-5 h-5" /> Products
            </Link>
            <Link to="/cart" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
              <FiShoppingCart className="w-5 h-5" /> Cart
              {cartCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}
            </Link>
            <Link to="/wishlist" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
              <FiHeart className="w-5 h-5" /> Wishlist
              {wishlistCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{wishlistCount}</span>}
            </Link>
            {user && (
              <Link to="/orders" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                <FiPackage className="w-5 h-5" /> Orders
              </Link>
            )}
            {user && (
              <Link to="/loyalty" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                <FiAward className="w-5 h-5" /> Loyalty
              </Link>
            )}
            {user && (
              <Link to="/returns" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                <FiPackage className="w-5 h-5" /> Returns
              </Link>
            )}
            {user && (
              <Link to="/notifications" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                <NotificationBell /> Notifications
              </Link>
            )}
            {isAdmin && (
              <>
                <div className="pt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Admin</div>
                <Link to="/admin" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  <FiLayout className="w-5 h-5" /> Dashboard
                </Link>
                <Link to="/admin/products" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  Products
                </Link>
                <Link to="/admin/orders" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  Orders
                </Link>
                <Link to="/admin/inventory" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  Inventory
                </Link>
                <Link to="/admin/categories" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  Categories
                </Link>
                <Link to="/admin/coupons" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  Coupons
                </Link>
                <Link to="/admin/returns" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  Returns
                </Link>
                <Link to="/admin/campaigns" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  Campaigns
                </Link>
                <Link to="/admin/analytics" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  Analytics
                </Link>
                <Link to="/admin/delivery-slots" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  <FiClock className="w-5 h-5" /> Delivery Slots
                </Link>
              </>
            )}
            <hr className="my-2 border-gray-100" />
            {!user ? (
              <>
                <Link to="/login" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                  <FiUser className="w-5 h-5" /> Login
                </Link>
                <Link to="/register" onClick={closeMobile} className="block text-center px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                  Register
                </Link>
              </>
            ) : (
              <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition">
                <FiLogOut className="w-5 h-5" /> Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}