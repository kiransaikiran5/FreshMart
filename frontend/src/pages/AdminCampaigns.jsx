import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getTopCampaigns, getCampaignPerformance
} from '../services/api';
import {
  FiPlus, FiEdit2, FiTrash2, FiBarChart2, FiRefreshCw, FiX, FiAlertTriangle
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-green-600 font-bold text-lg">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

// Gradient for bar fill
const renderGradient = () => (
  <defs>
    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
    </linearGradient>
  </defs>
);

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', discount_type: 'PERCENTAGE',
    discount_value: '', minimum_order_amount: '',
    start_date: '', end_date: '', is_active: true
  });
  const [viewPerformance, setViewPerformance] = useState(null);
  const [perfData, setPerfData] = useState(null);

  // For the custom delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState(null);   // stores campaign id to delete

  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const [campRes, topRes] = await Promise.all([getCampaigns(), getTopCampaigns()]);
      setCampaigns(campRes.data);
      setTopCampaigns(topRes.data);
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin]);

  // ---------- Submit (create or update) ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      discount_value: parseFloat(form.discount_value),
      minimum_order_amount: parseFloat(form.minimum_order_amount),
    };
    try {
      if (editing) {
        await updateCampaign(editing, data);
        toast.success('Campaign updated');
      } else {
        await createCampaign(data);
        toast.success('Campaign created');
      }
      setEditing(null);
      setForm({
        name: '', description: '', discount_type: 'PERCENTAGE',
        discount_value: '', minimum_order_amount: '',
        start_date: '', end_date: '', is_active: true
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  // ---------- Edit ----------
  const handleEdit = (campaign) => {
    setEditing(campaign.id);
    setForm({
      name: campaign.name,
      description: campaign.description || '',
      discount_type: campaign.discount_type,
      discount_value: campaign.discount_value,
      minimum_order_amount: campaign.minimum_order_amount,
      start_date: campaign.start_date.slice(0, 16),
      end_date: campaign.end_date.slice(0, 16),
      is_active: campaign.is_active,
    });
  };

  // ---------- Delete (using custom modal) ----------
  const handleDeleteClick = (id) => {
    setDeleteConfirm(id);   // open confirmation modal
  };

  const confirmDelete = async () => {
    try {
      await deleteCampaign(deleteConfirm);
      toast.success('Campaign deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => setDeleteConfirm(null);

  // ---------- View Performance ----------
  const handleViewPerformance = async (campaignId) => {
    try {
      const { data } = await getCampaignPerformance(campaignId);
      setPerfData(data);
      setViewPerformance(campaignId);
    } catch (err) {
      toast.error('Failed to load performance');
    }
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Promotions & Campaigns</h1>

      {/* ================================================================ */}
      {/* TOP CAMPAIGNS CHART */}
      {/* ================================================================ */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Top Campaigns by Revenue</h2>
          <button onClick={() => fetchData()} className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {topCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FiBarChart2 className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">No campaign data yet</p>
            <p className="text-sm mt-1">Revenue will appear here once campaigns are linked to orders.</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCampaigns} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="campaign_name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                <Tooltip content={<CustomTooltip />} />
                {renderGradient()}
                <Bar dataKey="total_revenue" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]} barSize={50} animationDuration={800}>
                  <LabelList dataKey="total_revenue" position="top" formatter={(val) => `₹${val.toLocaleString('en-IN')}`} style={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* CREATE / EDIT FORM */}
      {/* ================================================================ */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Campaign' : 'Create New Campaign'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Campaign Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-green-300" required />
          <input type="text" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-green-300" />
          <select value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})} className="border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-green-300">
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
          </select>
          <input type="number" step="0.01" placeholder="Discount Value" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} className="border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-green-300" required />
          <input type="number" step="0.01" placeholder="Minimum Order Amount" value={form.minimum_order_amount} onChange={e => setForm({...form, minimum_order_amount: e.target.value})} className="border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-green-300" />
          <input type="datetime-local" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-green-300" required />
          <input type="datetime-local" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-green-300" required />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 text-green-600 rounded focus:ring-green-300" />
            Active
          </label>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium transition">
              <FiPlus /> {editing ? 'Update Campaign' : 'Create Campaign'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '', discount_type: 'PERCENTAGE', discount_value: '', minimum_order_amount: '', start_date: '', end_date: '', is_active: true }); }} className="bg-gray-200 px-6 py-2.5 rounded-lg hover:bg-gray-300 font-medium transition">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ================================================================ */}
      {/* CAMPAIGNS TABLE */}
      {/* ================================================================ */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">All Campaigns</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-gray-500">No campaigns yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Discount</th>
                  <th className="px-4 py-2 text-left">Period</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(camp => (
                  <tr key={camp.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-2 font-medium">{camp.name}</td>
                    <td className="px-4 py-2">
                      {camp.discount_type === 'PERCENTAGE' ? `${camp.discount_value}%` : `₹${camp.discount_value}`}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(camp.start_date).toLocaleDateString()} - {new Date(camp.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${camp.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {camp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-2 justify-center">
                      <button onClick={() => handleViewPerformance(camp.id)} className="text-blue-600 hover:bg-blue-50 p-1 rounded transition" title="View Performance">
                        <FiBarChart2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(camp)} className="text-green-600 hover:bg-green-50 p-1 rounded transition" title="Edit">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteClick(camp.id)} className="text-red-600 hover:bg-red-50 p-1 rounded transition" title="Delete">
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

      {/* ================================================================ */}
      {/* PERFORMANCE MODAL */}
      {/* ================================================================ */}
      {viewPerformance && perfData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Campaign Performance: {perfData.campaign_name}</h3>
              <button onClick={() => { setViewPerformance(null); setPerfData(null); }} className="text-gray-500 hover:text-gray-700">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">{perfData.total_orders}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold">₹{perfData.total_revenue.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500">Discount Given</p>
                <p className="text-2xl font-bold">₹{perfData.total_discount.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500">Coupons Used</p>
                <p className="text-2xl font-bold">{perfData.coupon_usage_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {/* ================================================================ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Campaign?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This campaign and all its linked data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}