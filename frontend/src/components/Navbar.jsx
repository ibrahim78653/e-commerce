import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, Package, UserCircle, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { useCart } from '../context/CartContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { getItemCount } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const itemCount = getItemCount();

    const handleLogout = async () => {
        await logout();
        setUserMenuOpen(false);
        navigate('/');
    };

    const categories = [
        { name: 'Ladies Wear', path: '/?category_id=1' },
        { name: 'Gents Wear', path: '/?category_id=2' },
        { name: 'Kids Wear', path: '/?category_id=3' },
    ];

    return (
        <nav className="glass shadow-sm sticky top-0 z-50">
            <div className="container">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">B</span>
                        </div>
                        <span className="text-xl font-display font-bold text-gray-900 hidden sm:block">
                            Burhani Collection
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        {categories.map((category) => (
                            <Link
                                key={category.path}
                                to={category.path}
                                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                            >
                                {category.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Cart */}
                        <Link to="/cart" className="relative">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <ShoppingCart size={24} className="text-gray-700" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {itemCount}
                                    </span>
                                )}
                            </button>
                        </Link>

                        {/* User Menu */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <UserCircle size={24} className="text-gray-700" />
                                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                                        {user?.full_name || user?.email || user?.phone}
                                    </span>
                                </button>

                                {/* Dropdown */}
                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200"
                                        >
                                            <Link
                                                to="/profile"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            >
                                                <User size={18} className="mr-2" />
                                                Profile
                                            </Link>
                                            {user?.role === 'admin' && (
                                                <Link
                                                    to="/admin"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center px-4 py-2 text-primary-600 font-bold hover:bg-primary-50"
                                                >
                                                    <LayoutDashboard size={18} className="mr-2" />
                                                    Admin Portal
                                                </Link>
                                            )}
                                            <Link
                                                to="/orders"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            >
                                                <Package size={18} className="mr-2" />
                                                My Orders
                                            </Link>
                                            <hr className="my-2" />
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                                            >
                                                <LogOut size={18} className="mr-2" />
                                                Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link to="/login">
                                <button className="btn btn-primary">
                                    Sign In
                                </button>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden border-t border-gray-200 overflow-hidden"
                        >
                            <div className="py-4 space-y-4">
                                {/* Mobile Navigation */}
                                <div className="space-y-2 px-4">
                                    {categories.map((category) => (
                                        <Link
                                            key={category.path}
                                            to={category.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                    {isAuthenticated && user?.role === 'admin' && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block py-2 text-primary-600 font-bold"
                                        >
                                            Admin Portal
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
};

export default Navbar;
