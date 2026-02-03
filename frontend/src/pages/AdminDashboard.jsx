import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import { Navigate } from 'react-router-dom';
import { productsAPI, categoriesAPI, ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash, Edit, Package, ShoppingCart, X } from 'lucide-react';

const AdminDashboard = () => {
    const { user, isAuthenticated } = useAuthStore();
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Add Product State
    const [showAddModal, setShowAddModal] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', original_price: '', discounted_price: '',
        stock: '', category_id: '', subcategory: '', sizes: '', colors: '',
        material: ''
    });

    // Fetch Data dependent on tab
    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') return;

        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'products') {
                    const [resProd, resCat] = await Promise.all([
                        productsAPI.getAll(),
                        categoriesAPI.getAll()
                    ]);
                    // Centralized API response has data property
                    setProducts(resProd.data);
                    setCategories(resCat.data);
                } else {
                    const res = await ordersAPI.getAllAdmin();
                    setOrders(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
                // toast.error is handled in interceptor but we can add manual too
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab, isAuthenticated, user]);

    if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/admin/login" />;

    // --- Product Handlers ---
    const handleDeleteProduct = async (id) => {
        if (window.confirm("Are you sure?")) {
            try {
                await productsAPI.delete(id);
                setProducts(products.filter(p => p.id !== id));
                toast.success("Product Deleted");
            } catch (err) {
                // error toast is already shown by interceptor
            }
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            let imageUrl = '';
            if (imageFile) {
                const uploadRes = await productsAPI.uploadImage(imageFile);
                imageUrl = uploadRes.data.image_url; // services/api.js returns image_url usually
            }

            const payload = {
                ...newProduct,
                original_price: parseFloat(newProduct.original_price),
                discounted_price: parseFloat(newProduct.discounted_price) || 0,
                stock: parseInt(newProduct.stock),
                category_id: parseInt(newProduct.category_id),
                sizes: newProduct.sizes.split(',').map(s => s.trim()).filter(s => s),
                colors: newProduct.colors.split(',').map(c => c.trim()).filter(c => c),
                image_urls: imageUrl ? [imageUrl] : []
            };

            const res = await productsAPI.create(payload);
            setProducts([...products, res.data]);
            setShowAddModal(false);
            setNewProduct({
                name: '', description: '', original_price: '', discounted_price: '',
                stock: '', category_id: '', subcategory: '', sizes: '', colors: '',
                material: ''
            });
            setImageFile(null);
            toast.success("Product Added Successfully");
        } catch (err) {
            console.error(err);
        }
    };

    // --- Order Handlers ---
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await ordersAPI.updateStatus(id, { status: newStatus });
            setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
            toast.success("Status Updated");
        } catch (err) {
            // handled by interceptor
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', position: 'relative' }}>
            <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('products')}
                >
                    <Package size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Products
                </button>
                <button
                    className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <ShoppingCart size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Orders
                </button>
            </div>

            {loading ? <div>Loading...</div> : (
                <>
                    {activeTab === 'products' ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                    <Plus size={18} /> Add New Product
                                </button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ background: '#f0f0f0', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem' }}>ID</th>
                                            <th style={{ padding: '0.75rem' }}>Image</th>
                                            <th style={{ padding: '0.75rem' }}>Name</th>
                                            <th style={{ padding: '0.75rem' }}>Price</th>
                                            <th style={{ padding: '0.75rem' }}>Stock</th>
                                            <th style={{ padding: '0.75rem' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '0.75rem' }}>{p.id}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {p.images && p.images.length > 0 && (
                                                        <img src={p.images[0].image_url.startsWith('http') ? p.images[0].image_url : `http://127.0.0.1:8000${p.images[0].image_url}`} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{p.name}</td>
                                                <td style={{ padding: '0.75rem' }}>₹{p.discounted_price || p.original_price}</td>
                                                <td style={{ padding: '0.75rem' }}>{p.stock}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <button onClick={() => handleDeleteProduct(p.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}><Trash size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ background: '#f0f0f0', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem' }}>ID</th>
                                            <th style={{ padding: '0.75rem' }}>Customer</th>
                                            <th style={{ padding: '0.75rem' }}>Total</th>
                                            <th style={{ padding: '0.75rem' }}>Status</th>
                                            <th style={{ padding: '0.75rem' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '0.75rem' }}>{o.id}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {o.customer_name}<br />
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{o.customer_phone}</span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>₹{o.final_amount}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        background: o.status === 'delivered' ? '#d4edda' : o.status === 'shipped' ? '#fff3cd' : '#f8d7da',
                                                        color: o.status === 'delivered' ? '#155724' : o.status === 'shipped' ? '#856404' : '#721c24',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {o.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <select
                                                        value={o.status}
                                                        onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                                                        style={{ padding: '0.25rem' }}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="confirmed">Confirmed</option>
                                                        <option value="shipped">Shipped</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h2>Add New Product</h2>
                            <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                        </div>
                        <form onSubmit={handleAddProduct} style={{ display: 'grid', gap: '1rem' }}>
                            <input
                                type="text" placeholder="Product Name" required className="input"
                                value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                            />
                            <textarea
                                placeholder="Description" required className="input" rows="3"
                                value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input
                                    type="number" placeholder="Original Price" required className="input"
                                    value={newProduct.original_price} onChange={e => setNewProduct({ ...newProduct, original_price: e.target.value })}
                                />
                                <input
                                    type="number" placeholder="Discounted Price" className="input"
                                    value={newProduct.discounted_price} onChange={e => setNewProduct({ ...newProduct, discounted_price: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input
                                    type="number" placeholder="Stock" required className="input"
                                    value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                                />
                                <select
                                    className="input" required
                                    value={newProduct.category_id} onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                    ))}
                                </select>
                            </div>
                            <input
                                type="text" placeholder="Subcategory (e.g., Casual, Party)" className="input"
                                value={newProduct.subcategory} onChange={e => setNewProduct({ ...newProduct, subcategory: e.target.value })}
                            />
                            <input
                                type="text" placeholder="Sizes (comma separated: S, M, L)" className="input"
                                value={newProduct.sizes} onChange={e => setNewProduct({ ...newProduct, sizes: e.target.value })}
                            />
                            <input
                                type="text" placeholder="Colors (comma separated: Red, Blue)" className="input"
                                value={newProduct.colors} onChange={e => setNewProduct({ ...newProduct, colors: e.target.value })}
                            />
                            <input
                                type="text" placeholder="Material" className="input"
                                value={newProduct.material} onChange={e => setNewProduct({ ...newProduct, material: e.target.value })}
                            />
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Product Image</label>
                                <input
                                    type="file" accept="image/*"
                                    onChange={e => setImageFile(e.target.files[0])}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add Product</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
