import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getDeliverySlots, createDeliverySlot, deleteDeliverySlot } from '../services/api';
import { useToast } from '../context/ToastContext';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function AdminDeliverySlots() {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ slot_name: '', start_time: '', end_time: '', available_capacity: 10 });
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchSlots = async () => {
    try {
      const { data } = await getDeliverySlots();
      setSlots(data);
    } catch (err) {
      toast.error('Failed to load slots');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchSlots();
  }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createDeliverySlot({
        slot_name: form.slot_name,
        start_time: form.start_time,
        end_time: form.end_time,
        available_capacity: parseInt(form.available_capacity),
      });
      toast.success('Slot created');
      setForm({ slot_name: '', start_time: '', end_time: '', available_capacity: 10 });
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await deleteDeliverySlot(id);
      toast.success('Slot deleted');
      fetchSlots();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Delivery Slots</h1>

      {/* Create Form */}
      <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl shadow-card mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          placeholder="Slot name"
          value={form.slot_name}
          onChange={e => setForm({ ...form, slot_name: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="time"
          value={form.start_time}
          onChange={e => setForm({ ...form, start_time: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="time"
          value={form.end_time}
          onChange={e => setForm({ ...form, end_time: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Capacity"
            value={form.available_capacity}
            onChange={e => setForm({ ...form, available_capacity: e.target.value })}
            className="border p-2 rounded w-24"
            min="1"
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-1">
            <FiPlus /> Add
          </button>
        </div>
      </form>

      {/* Slot List */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Slot</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Capacity</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => (
              <tr key={slot.id} className="border-t">
                <td className="px-4 py-3 font-medium">{slot.slot_name}</td>
                <td className="px-4 py-3 text-gray-600">{slot.start_time} - {slot.end_time}</td>
                <td className="px-4 py-3">{slot.available_capacity}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(slot.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}