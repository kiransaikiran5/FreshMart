import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiPackage,
  FiSearch,
  FiSliders,
} from 'react-icons/fi';
import { getInventory, getLowStockAlerts } from '../services/api';

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [threshold, setThreshold] = useState(10);
  const { isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      const [invRes, alertRes] = await Promise.all([
        getInventory(),
        getLowStockAlerts(threshold),
      ]);
      setInventory(invRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin, threshold]);

  // Filter inventory client‑side by search
  const filteredInventory = inventory.filter((inv) =>
    inv.product_name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Inventory Management
        </h1>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
            <FiAlertTriangle className="w-5 h-5" /> Low Stock Alerts
          </div>
          <div className="space-y-1">
            {alerts.map((alert) => (
              <div key={alert.product_id} className="text-sm text-red-600">
                {alert.product_name} – only {alert.available_stock} left
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar: Search + Threshold */}
      <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-300 outline-none text-sm"
          />
        </div>

        {/* Threshold Slider */}
        <div className="flex items-center gap-3">
          <FiSliders className="text-gray-400" />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            Low‑stock threshold:
          </span>
          <input
            type="range"
            min="0"
            max="50"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <span className="text-sm font-semibold text-green-600 w-8">
            {threshold}
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading inventory...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-600">Product</th>
                  <th className="px-6 py-3 font-medium text-gray-600">Stock</th>
                  <th className="px-6 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-600">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {inv.product_name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          inv.available_stock <= 0
                            ? 'bg-red-100 text-red-800'
                            : inv.available_stock < threshold
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        <FiPackage className="w-3 h-3" />
                        {inv.available_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {inv.available_stock <= 0 ? (
                        <span className="text-red-600 text-xs font-medium">
                          Out of stock
                        </span>
                      ) : inv.available_stock < threshold ? (
                        <span className="text-yellow-600 text-xs font-medium">
                          Low stock
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs font-medium">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(inv.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-400">
                      {search
                        ? 'No products match your search.'
                        : 'No inventory data.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}