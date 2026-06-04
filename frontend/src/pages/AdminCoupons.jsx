import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  FiPlus,
  FiTrash2,
  FiTag,
  FiPercent,
  FiDollarSign,
  FiCalendar,
  FiHash,
} from 'react-icons/fi';
import { getCoupons, createCoupon, deleteCoupon } from '../services/api';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    coupon_code: '',
    discount_type: 'PERCENTAGE',
    discount_value: '',
    minimum_order_amount: '',
    expiry_date: '',
    usage_limit: '',
    is_active: true,
  });
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchCoupons = async () => {
    try {
      const { data } = await getCoupons();
      setCoupons(data);
    } catch (err) {
      toast.error('Failed to load coupons');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchCoupons();
  }, [isAdmin]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.coupon_code.trim() || !form.discount_value) {
      toast.error('Coupon code and discount value are required');
      return;
    }
    const couponData = {
      coupon_code: form.coupon_code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      minimum_order_amount: parseFloat(form.minimum_order_amount) || 0,
      expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      is_active: form.is_active,
    };
    try {
      await createCoupon(couponData);
      toast.success('Coupon created!');
      setForm({
        coupon_code: '',
        discount_type: 'PERCENTAGE',
        discount_value: '',
        minimum_order_amount: '',
        expiry_date: '',
        usage_limit: '',
        is_active: true,
      });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Coupon Management</h1>

      {/* Create Coupon Form */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiPlus className="w-5 h-5 text-green-600" /> Add New Coupon
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
              <div className="relative">
                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="coupon_code"
                  value={form.coupon_code}
                  onChange={handleChange}
                  placeholder="e.g., FRESH10"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-300 outline-none text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                name="discount_type"
                value={form.discount_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-300 outline-none text-sm"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value {form.discount_type === 'PERCENTAGE' ? '(%)' : '(₹)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {form.discount_type === 'PERCENTAGE' ? <FiPercent className="w-4 h-4" /> : <FiDollarSign className="w-4 h-4" />}
                </span>
                <input
                  name="discount_value"
                  type="number"
                  step="0.01"
                  value={form.discount_value}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-300 outline-none text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Order Amount (₹)</label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="minimum_order_amount"
                  type="number"
                  step="0.01"
                  value={form.minimum_order_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-300 outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="expiry_date"
                  type="datetime-local"
                  value={form.expiry_date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-300 outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
              <div className="relative">
                <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="usage_limit"
                  type="number"
                  value={form.usage_limit}
                  onChange={handleChange}
                  placeholder="Unlimited if empty"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-300 outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  name="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-300"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition font-medium text-sm"
          >
            <FiPlus className="w-4 h-4" /> Create Coupon
          </button>
        </form>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <h2 className="text-lg font-semibold mb-4">Existing Coupons</h2>
        {coupons.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No coupons created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Code</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Discount</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Min. Order</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Expiry</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Used / Limit</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-700">{c.coupon_code}</td>
                    <td className="px-4 py-3">
                      {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                    </td>
                    <td className="px-4 py-3">₹{c.minimum_order_amount}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="px-4 py-3">
                      {c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ' / ∞'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded-lg transition"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}