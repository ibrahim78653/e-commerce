import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI } from '../../services/api';
import { Plus, Trash, Edit, Search, Filter, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ProductDetailModal from '../../components/ProductDetailModal';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', original_price: '', discounted_price: '',
        stock: '', category_id: '', sizes: '', colors: '', image_urls: [], images: []
    });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const [resProd, resCat] = await Promise.all([
                productsAPI.getAll({ page, search, page_size: 10, admin_view: true }),
                categoriesAPI.getAll()
            ]);
            setProducts(resProd.data.items);
            setTotalPages(resProd.data.pages);
            setCategories(resCat.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [page, search]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this product?")) return;
        try {
            await productsAPI.delete(id);
            toast.success("Product deactivated");
            fetchProducts();
        } catch (error) {
            toast.error("Failed to delete product");
        }
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setLoading(true);
        try {
            const uploadedUrls = [];
            for (const file of files) {
                const uploadRes = await productsAPI.uploadImage(file);
                uploadedUrls.push(uploadRes.data.image_url);
            }

            setFormData(prev => ({
                ...prev,
                image_urls: [...prev.image_urls, ...uploadedUrls]
            }));
            toast.success(`${files.length} images uploaded`);
        } catch (error) {
            toast.error("Failed to upload some images");
        } finally {
            setLoading(false);
        }
    };

    const removeImage = (url) => {
        setFormData(prev => ({
            ...prev,
            image_urls: prev.image_urls.filter(u => u !== url)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let imageUrls = editingProduct ? editingProduct.images.map(i => i.image_url) : [];

            if (imageFile) {
                const uploadRes = await productsAPI.uploadImage(imageFile);
                imageUrls = [uploadRes.data.image_url];
            }

            // Create a clean slug from name (backend requirement)
            const generatedSlug = formData.name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // remove spec chars
                .replace(/[\s_-]+/g, '-') // convert spaces to hyph
                .replace(/^-+|-+$/g, ''); // trim hyph

            const payload = {
                ...formData,
                name: formData.name.trim(),
                slug: generatedSlug,
                original_price: parseFloat(formData.original_price) || 0,
                discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
                stock: parseInt(formData.stock) || 0,
                category_id: formData.category_id ? parseInt(formData.category_id) : null,
                image_urls: formData.image_urls,
                is_active: true
            };

            if (editingProduct) {
                await productsAPI.update(editingProduct.id, payload);
                toast.success("Product updated successfully 🚀");
            } else {
                await productsAPI.create(payload);
                toast.success("Product created successfully ✨");
            }
            setShowModal(false);
            setEditingProduct(null);
            setImageFile(null);
            setImagePreview(null);
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error("DEBUG: Submit Error", error);
            // Catch error message if interceptor didn't show it or for extra info
            if (error.response?.status === 401) {
                toast.error("Session expired. Please log in again.");
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', description: '', original_price: '', discounted_price: '',
            stock: '', category_id: '', sizes: '', colors: '', image_urls: []
        });
        setImagePreview(null);
        setImageFile(null);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            original_price: product.original_price,
            discounted_price: product.discounted_price || '',
            stock: product.stock,
            category_id: product.category_id,
            sizes: product.sizes || '',
            colors: product.colors || '',
            image_urls: product.images?.filter(img => !img.color_variant_id).map(img => img.image_url) || []
        });

        if (product.images && product.images.length > 0) {
            const img = product.images[0].image_url;
            setImagePreview(img.startsWith('http') ? img : `http://localhost:8000${img}`);
        } else {
            setImagePreview(null);
        }

        setShowModal(true);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Product Inventory</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search active products..."
                            className="pl-10 pr-4 py-2 border rounded-lg"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setEditingProduct(null); setShowModal(true); }}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Product</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Category</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Price</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Stock</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            {p.images?.[0] ? (
                                                <img className="h-10 w-10 rounded-full object-cover" src={p.images[0].image_url} alt="" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{p.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{p.category?.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">₹{p.original_price}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {p.stock} in stock
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {p.is_active ? 'Active' : 'Inactive'}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                    <button
                                        onClick={() => { setSelectedProduct(p); setShowDetailModal(true); }}
                                        className="text-green-600 hover:text-green-900 mr-4"
                                        title="View Details & Manage Variants"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button onClick={() => openEditModal(p)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900">
                                        <Trash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls could go here */}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ y: 20 }} animate={{ y: 0 }}
                            className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
                        >
                            <h3 className="text-lg font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input type="text" required className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description <span className="text-gray-400 font-normal">(Emojis supported 🎨)</span></label>
                                    <textarea className="input" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Price</label>
                                        <input type="number" required className="input" value={formData.original_price} onChange={e => setFormData({ ...formData, original_price: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Discounted Price</label>
                                        <input type="number" className="input" value={formData.discounted_price} onChange={e => setFormData({ ...formData, discounted_price: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Stock</label>
                                        <input type="number" required className="input" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Category</label>
                                        <select required className="input" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sizes (comma separated)</label>
                                    <input type="text" className="input" value={formData.sizes} onChange={e => setFormData({ ...formData, sizes: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Colors (comma separated)</label>
                                    <input type="text" className="input" value={formData.colors} onChange={e => setFormData({ ...formData, colors: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Product Images</label>
                                    <input type="file" accept="image/*" multiple onChange={handleFileChange} className="input" />
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {formData.image_urls.map((url, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={url.startsWith('http') ? url : `http://localhost:8000${url}`}
                                                    alt="Preview"
                                                    className="h-20 w-20 object-cover rounded shadow border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(url)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">{editingProduct ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Product Detail Modal with Color Variants */}
            {showDetailModal && selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={() => { setShowDetailModal(false); setSelectedProduct(null); }}
                    onUpdate={fetchProducts}
                />
            )}
        </div>
    );
};

export default AdminProducts;
