import { useState, useEffect } from 'react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getCategories,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FiEdit2, FiTrash2, FiPlus, FiUpload, FiX } from 'react-icons/fi';
import ImageWithFallback from '../components/ImageWithFallback';
import ConfirmationModal from '../components/ConfirmationModal';

/**
 * Build full image URL from backend response.
 * If it's just a filename, prepend /static/images/.
 */
const getImageSrc = (img) => {
  if (!img) return null;
  if (img.startsWith('http') || img.startsWith('/static/')) return img;
  return `/static/images/${img}`;
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    stock_quantity: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [deletingId, setDeletingId] = useState(null);
  const { isAdmin } = useAuth();
  const toast = useToast();

  // Fetch categories on mount
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await getProducts();
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchProducts();
  }, [isAdmin]);

  // Open modal for adding
  const handleAddNew = () => {
    setEditingProduct(null);
    setForm({ name: '', description: '', category_id: '', price: '', stock_quantity: '', image: null });
    setImagePreview(null);
    setModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id,
      price: product.price,
      stock_quantity: product.stock_quantity,
      image: null,
    });
    setImagePreview(null);
    setModalOpen(true);
  };

  // Close the form modal
  const handleClose = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setImagePreview(null);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      if (file) {
        setForm({ ...form, image: file });
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Submit form (add or update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.category_id || !form.price || !form.stock_quantity) {
      toast.warning('Please fill all required fields');
      return;
    }

    const productData = {
      name: form.name,
      description: form.description,
      category_id: Number(form.category_id),
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
    };

    try {
      if (editingProduct) {
        // Update existing product
        await updateProduct(editingProduct.id, productData);
        if (form.image) {
          await uploadProductImage(editingProduct.id, form.image);
        }
        toast.success('Product updated successfully');
      } else {
        // Create new product – use FormData for file upload
        const fd = new FormData();
        fd.append('name', productData.name);
        fd.append('description', productData.description);
        fd.append('category_id', productData.category_id);
        fd.append('price', productData.price);
        fd.append('stock_quantity', productData.stock_quantity);
        if (form.image) fd.append('image', form.image);
        await createProduct(fd);
        toast.success('Product added successfully');
      }
      handleClose();
      fetchProducts();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg || 'Validation error'
          : 'Operation failed';
      toast.error(message);
    }
  };

  // Open delete confirmation
  const handleDeleteClick = (product) => {
    setDeleteModal({ open: true, product });
  };

  const confirmDelete = async () => {
    const id = deleteModal.product?.id;
    if (!id) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
      toast.success('Product deleted Successfully');
      fetchProducts();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
      setDeleteModal({ open: false, product: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ open: false, product: null });
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition shadow-sm"
        >
          <FiPlus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
              <div className="flex gap-2">
                <div className="w-16 h-8 bg-gray-200 rounded-lg" />
                <div className="w-16 h-8 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {products.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No products found.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 transition gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border">
                      <ImageWithFallback
                        src={getImageSrc(p.image)}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-sm text-gray-500">
                        ₹{p.price} · Stock: {p.stock_quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleEdit(p)}
                      className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition text-sm"
                    >
                      <FiEdit2 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(p)}
                      className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition text-sm"
                    >
                      <FiTrash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 pb-2">
              <h2 className="text-xl font-bold">
                {editingProduct ? `Edit Product #${editingProduct.id}` : 'Add New Product'}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    name="stock_quantity"
                    type="number"
                    value={form.stock_quantity}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingProduct ? 'New Image (optional)' : 'Image'}
                  </label>
                  <input
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full text-sm"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-2 w-16 h-16 object-cover rounded-lg border"
                    />
                  )}
                  {editingProduct && !form.image && editingProduct.image && (
                    <p className="text-xs text-gray-400 mt-1">Current image will be kept</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <FiUpload className="w-4 h-4" />
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.open}
        title="Delete product"
        message={`Are you sure you want to delete "${deleteModal.product?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deletingId === deleteModal.product?.id}
        confirmLabel="Delete"
      />
    </div>
  );
}