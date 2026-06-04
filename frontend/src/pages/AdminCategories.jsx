import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });
  const [deletingId, setDeletingId] = useState(null);

  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await getCategories();
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchCategories();
  }, [isAdmin]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createCategory({ category_name: newName.trim() });
      setNewName('');
      toast.success('Category added');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add');
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.category_name);
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      await updateCategory(id, { category_name: editName.trim() });
      setEditingId(null);
      toast.success('Category updated');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    }
  };

  const openDeleteModal = (cat) => {
    setDeleteModal({ open: true, category: cat });
  };

  const confirmDelete = async () => {
    const id = deleteModal.category?.id;
    if (!id) return;
    setDeletingId(id);
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed');
    } finally {
      setDeletingId(null);
      setDeleteModal({ open: false, category: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ open: false, category: null });
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-48 mb-6" />
        <div className="bg-white rounded-2xl shadow-card p-4 mb-8">
          <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
          <div className="flex gap-3">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
            <div className="w-20 h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-3 px-4 rounded-lg border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="flex gap-1">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Category Management</h1>

        {/* Add new category form */}
        <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-card p-4 mb-8">
          <h2 className="font-semibold mb-3">Add New Category</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name"
              className="flex-1 border p-2.5 rounded-lg focus:ring-2 focus:ring-green-300 outline-none"
              required
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition font-medium"
            >
              <FiPlus className="w-4 h-4" /> Add
            </button>
          </div>
        </form>

        {/* Category list */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <h2 className="font-semibold mb-4">Existing Categories</h2>
          {categories.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No categories yet.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-100 hover:border-gray-200 transition"
                >
                  {editingId === cat.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 border p-2 rounded-lg focus:ring-2 focus:ring-green-300 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdate(cat.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <FiCheck className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-700">{cat.category_name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(cat)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteModal.open}
        title="Delete category"
        message={`Are you sure you want to delete "${deleteModal.category?.category_name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deletingId === deleteModal.category?.id}
        confirmLabel="Delete"
      />
    </>
  );
}