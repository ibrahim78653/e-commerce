import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import { Navigate, Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, LogOut, LayoutDashboard, Eye } from 'lucide-react';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminUsers from './admin/AdminUsers';

const AdminDashboard = () => {
    const { user, isAuthenticated, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState('products');

    if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/admin/login" />;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md fixed h-full z-10 left-0 top-0 hidden md:flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h1 className="text-xl font-bold flex items-center gap-2 text-primary-600">
                        <LayoutDashboard size={24} />
                        Admin
                    </h1>
                    <Link to="/" className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="View Website">
                        <Eye size={20} />
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'products' ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Package size={20} /> Products
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <ShoppingCart size={20} /> Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Users size={20} /> Users
                    </button>
                </nav>

                <div className="p-4 border-t">
                    <div className="mb-4 px-4">
                        <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                {/* Mobile Header */}
                <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                    <h1 className="text-lg font-bold">Admin Portal</h1>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('products')} className={`p-2 rounded ${activeTab === 'products' ? 'bg-gray-100' : ''}`}><Package /></button>
                        <button onClick={() => setActiveTab('orders')} className={`p-2 rounded ${activeTab === 'orders' ? 'bg-gray-100' : ''}`}><ShoppingCart /></button>
                        <button onClick={() => setActiveTab('users')} className={`p-2 rounded ${activeTab === 'users' ? 'bg-gray-100' : ''}`}><Users /></button>
                    </div>
                </div>

                {activeTab === 'products' && <AdminProducts />}
                {activeTab === 'orders' && <AdminOrders />}
                {activeTab === 'users' && <AdminUsers />}
            </main>
        </div>
    );
};

export default AdminDashboard;
