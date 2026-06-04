import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { placeOrder, validateCoupon, getLoyaltyBalance, getDeliverySlots } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  FiTag,
  FiCheckCircle,
  FiX,
  FiMapPin,
  FiShoppingBag,
  FiCreditCard,
  FiTruck,
  FiChevronRight,
  FiAward,
  FiClock,
} from 'react-icons/fi';

export default function Checkout() {
  const [address, setAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Loyalty state
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [usePoints, setUsePoints] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  // Delivery slot state
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const { cartItems, cartTotal, fetchCart } = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  // Fetch loyalty balance
  useEffect(() => {
    getLoyaltyBalance()
      .then((res) => setLoyaltyBalance(res.data.points_balance))
      .catch(() => {});
  }, []);

  // Fetch delivery slots
  useEffect(() => {
    getDeliverySlots()
      .then((res) => setSlots(res.data))
      .catch(() => {});
  }, []);

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidating(true);
    setCouponMsg('');
    try {
      const { data } = await validateCoupon(couponCode.trim(), cartTotal);
      if (data.valid) {
        setCouponDiscount(data.discount_amount);
        setCouponMsg(data.message || 'Coupon applied!');
        setCouponApplied(true);
        toast.success(data.message || 'Coupon applied!');
      } else {
        setCouponDiscount(0);
        setCouponMsg(data.message || 'Invalid coupon');
        setCouponApplied(false);
        toast.error(data.message || 'Invalid coupon');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to validate coupon';
      setCouponMsg(msg);
      toast.error(msg);
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponMsg('');
    setCouponApplied(false);
  };

  // Loyalty handlers
  const handleApplyPoints = () => {
    if (usePoints <= 0) {
      toast.error('Enter valid points');
      return;
    }
    if (usePoints > loyaltyBalance) {
      toast.error('Insufficient points');
      return;
    }
    const maxRedeem = Math.min(usePoints, cartTotal - couponDiscount);
    setPointsDiscount(maxRedeem);
    toast.success(`Redeemed ${maxRedeem} points`);
  };

  const handleRemovePoints = () => {
    setUsePoints(0);
    setPointsDiscount(0);
  };

  // Place order – now includes slotId
  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.warning('Please enter a delivery address');
      return;
    }
    setLoading(true);
    try {
      const coupon = couponApplied ? couponCode : null;
      const pointsToUse = pointsDiscount > 0 ? pointsDiscount : 0;
      const { data } = await placeOrder(address, coupon, pointsToUse, selectedSlot);
      toast.success(`Order #${data.order_id} placed!`);
      fetchCart();
      navigate(`/payment/${data.order_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const finalTotal = cartTotal - couponDiscount - pointsDiscount;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header with step indicator */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <FiShoppingBag className="w-4 h-4" /> Cart
          </span>
          <FiChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1 font-medium text-green-600">
            <FiMapPin className="w-4 h-4" /> Address
          </span>
          <FiChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1">
            <FiCreditCard className="w-4 h-4" /> Payment
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left Column – Address, Coupon, Loyalty */}
        <div className="lg:col-span-3 space-y-6">
          {/* Delivery Address Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FiTruck className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Delivery Address</h2>
            </div>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full address (street, city, pincode)..."
              className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none resize-none transition"
              rows="4"
            />

            {/* Delivery Slot Selection */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <FiClock className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">Select Delivery Slot</h3>
              </div>
              {slots.length === 0 ? (
                <p className="text-xs text-gray-400">No delivery slots available</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`p-2 rounded-lg border text-xs font-medium transition ${
                        selectedSlot === slot.id
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {slot.slot_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coupon Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiTag className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Coupon Code</h2>
            </div>
            {!couponApplied ? (
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponMsg('');
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validating || !couponCode.trim()}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {validating ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : null}
                    Apply
                  </button>
                </div>
                {couponMsg && !couponApplied && (
                  <p className="text-xs text-red-500 mt-2">{couponMsg}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-700">{couponCode}</p>
                    <p className="text-xs text-green-600">Coupon applied successfully</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-gray-500 hover:text-red-500 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Loyalty Points Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiAward className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Loyalty Points</h2>
            </div>
            {pointsDiscount === 0 ? (
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiAward className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      placeholder="Points to redeem"
                      value={usePoints}
                      onChange={(e) => setUsePoints(Number(e.target.value))}
                      min="0"
                      max={loyaltyBalance}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <button
                    onClick={handleApplyPoints}
                    disabled={usePoints <= 0}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    Redeem
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Balance: <span className="font-semibold text-yellow-600">{loyaltyBalance}</span> pts (1 pt = ₹1)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FiCheckCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-700">{pointsDiscount} pts redeemed</p>
                    <p className="text-xs text-yellow-600">-₹{pointsDiscount} discount</p>
                  </div>
                </div>
                <button
                  onClick={handleRemovePoints}
                  className="text-gray-500 hover:text-red-500 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column – Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>

            {/* Items List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FiShoppingBag className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-yellow-600">
                  <span>Points Redeemed</span>
                  <span>-₹{pointsDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-3 mt-3">
                <span>Total</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading || cartItems.length === 0}
              className="mt-6 w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Placing Order...
                </>
              ) : (
                <>
                  <FiCreditCard className="w-5 h-5" />
                  Proceed to Payment
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}