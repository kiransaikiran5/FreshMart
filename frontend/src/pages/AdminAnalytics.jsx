import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  getDailySales, getMonthlyRevenue, getAnalyticsTopProducts,
  getCustomerTrends, getInventoryMovement
} from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Area, AreaChart
} from 'recharts';
import { FiRefreshCw, FiTrendingUp, FiUsers, FiPackage, FiAlertTriangle } from 'react-icons/fi';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalytics() {
  const [dailySales, setDailySales] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customerTrends, setCustomerTrends] = useState(null);
  const [inventoryMovement, setInventoryMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const [dailyRes, monthlyRes, topRes, trendsRes, invRes] = await Promise.all([
        getDailySales(days),
        getMonthlyRevenue(new Date().getFullYear()),
        getAnalyticsTopProducts(5),
        getCustomerTrends(),
        getInventoryMovement()
      ]);
      setDailySales(dailyRes.data);
      setMonthlyRevenue(monthlyRes.data);
      setTopProducts(topRes.data);
      setCustomerTrends(trendsRes.data);
      setInventoryMovement(invRes.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin, days]);

  if (!isAdmin) return <Navigate to="/" replace />;
  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Sales Analytics & Business Reports</h1>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700">
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-sm text-gray-500">Daily Avg Revenue</p>
          <p className="text-2xl font-bold mt-1">
            ₹{dailySales.length ? (dailySales.reduce((sum, d) => sum + d.revenue, 0) / dailySales.length).toFixed(0) : 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-sm text-gray-500">Monthly Revenue</p>
          <p className="text-2xl font-bold mt-1">
            ₹{monthlyRevenue.length ? monthlyRevenue[monthlyRevenue.length-1].revenue.toFixed(0) : 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-sm text-gray-500">Total Customers</p>
          <p className="text-2xl font-bold mt-1">{customerTrends?.total_customers || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-sm text-gray-500">Repeat Purchase Rate</p>
          <p className="text-2xl font-bold mt-1">{customerTrends?.repeat_purchase_rate || 0}%</p>
        </div>
      </div>

      {/* Daily Sales Chart */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Daily Sales (Last {days} Days)</h2>
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="border rounded-lg px-3 py-1 text-sm">
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySales}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Revenue + Top Products */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Revenue (this year)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => `₹${val}`} />
                <Bar dataKey="revenue" fill="#16a34a" radius={[8, 8, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total_sold" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Customer Trends & Inventory Movement */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Trends</h2>
          {customerTrends && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>New Customers (last 30 days)</span>
                <span className="font-bold">{customerTrends.new_customers_last_30_days}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Customers</span>
                <span className="font-bold">{customerTrends.total_customers}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Orders per Customer</span>
                <span className="font-bold">{customerTrends.avg_orders_per_customer}</span>
              </div>
              <div className="flex justify-between">
                <span>Repeat Purchase Rate</span>
                <span className="font-bold">{customerTrends.repeat_purchase_rate}%</span>
              </div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Inventory Movement</h2>
          {inventoryMovement && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Top Moving Items</h3>
                {inventoryMovement.top_movement.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.total_sold} sold</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-500 mb-2">Low Stock Alerts</h3>
                {inventoryMovement.low_stock.length === 0 ? (
                  <p className="text-sm text-gray-400">No low stock items</p>
                ) : (
                  inventoryMovement.low_stock.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 text-red-600">
                      <span>{item.name}</span>
                      <span className="font-medium">{item.stock} left</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}