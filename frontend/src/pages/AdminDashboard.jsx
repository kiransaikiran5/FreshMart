import { useState, useEffect } from 'react';
import { getAdminStats, getTopProducts } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, topRes] = await Promise.all([
          getAdminStats(),
          getTopProducts(),
        ]);
        setStats(statsRes.data);
        setTopProducts(topRes.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <p className="text-red-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-brand hover:underline">
          Retry
        </button>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Total Orders',
      value: stats?.total_orders ?? 0,
      gradient: 'from-blue-500 to-blue-600',
      icon: '📦',
    },
    {
      label: 'Revenue',
      value: `₹${(stats?.total_revenue ?? 0).toLocaleString()}`,
      gradient: 'from-green-500 to-green-600',
      icon: '💰',
    },
    {
      label: 'Products',
      value: stats?.products_count ?? 0,
      gradient: 'from-purple-500 to-purple-600',
      icon: '🛍️',
    },
    {
      label: 'Low Stock',
      value: stats?.low_stock_items ?? 0,
      gradient: 'from-red-500 to-red-600',
      icon: '⚠️',
    },
    {
      label: 'Customers',
      value: stats?.users_count ?? 0,
      gradient: 'from-orange-500 to-orange-600',
      icon: '👥',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your grocery business</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {kpiCards.map(card => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.gradient} text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm opacity-80">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top Products Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-gray-100">
        <h2 className="text-xl font-semibold mb-6">Top Selling Products</h2>
        {topProducts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No sales data yet.</p>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="total_sold" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}