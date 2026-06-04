import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ChatWidget from './components/ChatWidget';

import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import PaymentResult from './pages/PaymentResult';
import OrderHistory from './pages/OrderHistory';
import DeliveryTracking from './pages/DeliveryTracking';
import NotificationsPage from './pages/NotificationsPage';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminInventory from './pages/AdminInventory';
import AdminCategories from './pages/AdminCategories';
import AdminCoupons from './pages/AdminCoupons';
import NotFound from './pages/NotFound';

import Loyalty from './pages/Loyalty';
import AdminReturns from './pages/AdminReturns';
import Returns from './pages/Returns';
import AdminDeliverySlots from './pages/AdminDeliverySlots';
import AdminCampaigns from './pages/AdminCampaigns';
import AdminAnalytics from './pages/AdminAnalytics';
import AuthCallback from './pages/AuthCallback';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <ToastProvider>
            <WishlistProvider>
              <BrowserRouter>
                <div className="min-h-screen bg-surface">
                  <Navbar />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Products />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    {/* Protected customer routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/payment/:orderId" element={<Payment />} />
                      <Route path="/payment-result" element={<PaymentResult />} />
                      <Route path="/orders" element={<OrderHistory />} />
                      <Route path="/delivery/:orderId" element={<DeliveryTracking />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/loyalty" element={<Loyalty />} />
                      <Route path="/returns" element={<Returns />} />
                    </Route>

                    {/* Protected admin routes */}
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/products" element={<AdminProducts />} />
                      <Route path="/admin/orders" element={<AdminOrders />} />
                      <Route path="/admin/inventory" element={<AdminInventory />} />
                      <Route path="/admin/categories" element={<AdminCategories />} />
                      <Route path="/admin/coupons" element={<AdminCoupons />} />
                      <Route path="/admin/returns" element={<AdminReturns />} />
                      <Route path="/admin/delivery-slots" element={<AdminDeliverySlots />} />
                      <Route path="/admin/campaigns" element={<AdminCampaigns />} />
                      <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <ChatWidget />
                </div>
              </BrowserRouter>
            </WishlistProvider>
          </ToastProvider>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}