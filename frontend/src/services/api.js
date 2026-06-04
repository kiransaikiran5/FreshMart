import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000/api/v1' });

// -------------------------------------------------------
// REQUEST INTERCEPTOR – attach access token
// -------------------------------------------------------
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// -------------------------------------------------------
// AUTH
// -------------------------------------------------------
export const registerUser = (data) => API.post('/auth/register', data);

export const loginUser = (email, password) => {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);
  return API.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

export const refreshToken = (refresh_token) =>
  API.post('/auth/refresh', { refresh_token });

// -------------------------------------------------------
// CATEGORIES (admin)
// -------------------------------------------------------
export const getCategories = () => API.get('/categories/');
export const createCategory = (data) => API.post('/categories/', data);
export const updateCategory = (id, data) => API.put(`/categories/${id}`, data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// -------------------------------------------------------
// PRODUCTS
// -------------------------------------------------------
export const getProducts = (params) => API.get('/products/', { params });
export const getProduct = (id) => API.get(`/products/${id}`);

export const createProduct = (formData) =>
  API.post('/products/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateProduct = (id, data) => API.put(`/products/${id}`, data);

export const uploadProductImage = (id, file) => {
  const formData = new FormData();
  formData.append('image', file);
  return API.put(`/products/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteProduct = (id) => API.delete(`/products/${id}`);

// -------------------------------------------------------
// RECOMMENDATIONS
// -------------------------------------------------------
export const getRecommendations = () => API.get('/recommendations/');
export const getFrequentlyBoughtTogether = (productId) =>
  API.get(`/recommendations/frequently-bought-together/${productId}`);

// -------------------------------------------------------
// CART
// -------------------------------------------------------
export const getCart = () => API.get('/cart/');
export const addToCart = (product_id, quantity = 1) =>
  API.post('/cart/add', { product_id, quantity });
export const updateCartItem = (itemId, quantity) =>
  API.put(`/cart/items/${itemId}?quantity=${quantity}`);
export const removeCartItem = (itemId) =>
  API.delete(`/cart/items/${itemId}`);

// -------------------------------------------------------
// ORDERS
// -------------------------------------------------------
export const placeOrder = (address, couponCode = null, usePoints = 0, slotId = null) => {
  let url = `/orders/place?delivery_address=${encodeURIComponent(address)}`;
  if (couponCode) url += `&coupon_code=${encodeURIComponent(couponCode)}`;
  if (usePoints > 0) url += `&use_points=${usePoints}`;
  if (slotId) url += `&slot_id=${slotId}`;
  return API.post(url);
};

export const getOrders = () => API.get('/orders/');
export const cancelOrder = (orderId) => API.put(`/orders/${orderId}/cancel`);

// Delivery Slots
export const getDeliverySlots = () => API.get('/delivery-slots/');
export const createDeliverySlot = (data) => API.post('/delivery-slots/', data);
export const deleteDeliverySlot = (id) => API.delete(`/delivery-slots/${id}`);

// -------------------------------------------------------
// PAYMENTS (Cashfree)
// -------------------------------------------------------
// ❌ OLD simulated payment – REMOVED
// export const processPayment = ...

// ✅ NEW Cashfree functions
export const createCashfreeOrder = (orderId) =>
  API.post(`/payments/create-order?order_id=${orderId}`);

export const verifyPayment = (cfOrderId, paymentStatus) =>
  API.post('/payments/verify', {
    order_id: cfOrderId,
    payment_status: paymentStatus,
  });

// -------------------------------------------------------
// DELIVERIES
// -------------------------------------------------------
export const getDelivery = (orderId) => API.get(`/deliveries/${orderId}`);
export const updateDelivery = (orderId, data) =>
  API.put(`/deliveries/${orderId}`, null, { params: data });

// -------------------------------------------------------
// REVIEWS
// -------------------------------------------------------
export const submitReview = (data) => API.post('/reviews/', data);
export const getProductReviews = (productId) =>
  API.get(`/reviews/product/${productId}`);
export const getAverageRating = (productId) =>
  API.get(`/reviews/product/${productId}/average`);

// -------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------
export const getNotifications = () => API.get('/notifications/');
export const markNotificationRead = (id) =>
  API.put(`/notifications/${id}/read`);

// -------------------------------------------------------
// ADMIN
// -------------------------------------------------------
export const getAdminStats = () => API.get('/admin/stats');
export const getTopProducts = () => API.get('/admin/top-products');
export const getAdminOrders = () => API.get('/admin/orders');
export const updateOrderStatus = (orderId, status) =>
  API.put(`/orders/${orderId}/status?status=${status}`);

// -------------------------------------------------------
// INVENTORY (admin)
// -------------------------------------------------------
export const getInventory = () => API.get('/inventory/');
export const getLowStockAlerts = (threshold = 10) =>
  API.get(`/inventory/alerts/low-stock?threshold=${threshold}`);

// -------------------------------------------------------
// COUPONS
// -------------------------------------------------------
export const validateCoupon = (couponCode, cartTotal) =>
  API.post('/coupons/validate', { coupon_code: couponCode, cart_total: cartTotal });

export const getCoupons = () => API.get('/coupons/');
export const createCoupon = (data) => API.post('/coupons/', data);
export const deleteCoupon = (id) => API.delete(`/coupons/${id}`);

// -------------------------------------------------------
// WISHLIST
// -------------------------------------------------------
export const getWishlist = () => API.get('/wishlist/');
export const addToWishlist = (productId) =>
  API.post('/wishlist/add', { product_id: productId });
export const removeFromWishlist = (productId) =>
  API.delete(`/wishlist/${productId}`);
export const moveWishlistToCart = (productId) =>
  API.post(`/wishlist/move-to-cart/${productId}`);

// -------------------------------------------------------
// LOYALTY
// -------------------------------------------------------
export const getLoyaltyBalance = () => API.get('/loyalty/balance');
export const getLoyaltyTransactions = () => API.get('/loyalty/transactions');

// -------------------------------------------------------
// RETURNS
// -------------------------------------------------------
export const requestReturn = (data) => API.post('/returns/', data);
export const getMyReturns = () => API.get('/returns/');
export const getAllReturns = () => API.get('/returns/admin');
export const updateReturnStatus = (id, status) =>
  API.put(`/returns/${id}/status?status=${status}`);

// Campaigns (admin)
export const getCampaigns = () => API.get('/admin/campaigns/');
export const createCampaign = (data) => API.post('/admin/campaigns/', data);
export const updateCampaign = (id, data) => API.put(`/admin/campaigns/${id}`, data);
export const deleteCampaign = (id) => API.delete(`/admin/campaigns/${id}`);
export const getCampaignPerformance = (id) => API.get(`/admin/campaigns/${id}/performance`);
export const getTopCampaigns = () => API.get('/admin/campaigns/top');

// Analytics (admin)
export const getDailySales = (days = 7) => API.get(`/admin/analytics/daily-sales?days=${days}`);
export const getMonthlyRevenue = (year) => API.get(`/admin/analytics/monthly-revenue?year=${year}`);
export const getAnalyticsTopProducts = (limit = 10) => API.get(`/admin/analytics/top-products?limit=${limit}`);
export const getCustomerTrends = () => API.get('/admin/analytics/customer-trends');
export const getInventoryMovement = () => API.get('/admin/analytics/inventory-movement');

// -------------------------------------------------------
// AI CHAT
// -------------------------------------------------------
export const chatWithAI = (message) => API.post('/chat/', { message });

// -------------------------------------------------------
// RESPONSE INTERCEPTOR – auto refresh on 401
// -------------------------------------------------------
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) {
          const { data } = await refreshToken(refresh);
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return API(originalRequest);
        }
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Default export for direct use (e.g., in AuthContext)
export default API;