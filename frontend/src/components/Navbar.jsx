import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, Package, UserCircle, LayoutDashboard, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { useCart } from '../context/CartContext';
import GlobalSearch from './GlobalSearch';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { getItemCount } = useCart();
    
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const itemCount = getItemCount();
    const isHomePage = location.pathname === '/';

    // Handle scroll event for sticky navbar style changes
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        setUserMenuOpen(false);
        navigate('/');
    };

    const categories = [
        { name: "Ladies' Wear", path: '/?category_id=1', id: '1' },
        { name: "Gents' Wear", path: '/?category_id=2', id: '2' },
        { name: "Kids' Wear", path: '/?category_id=3', id: '3' },
    ];

    // Determine current category active state
    const params = new URLSearchParams(location.search);
    const activeCategoryId = params.get('category_id');

    // Dynamic styles based on scroll and page
    const isTransparent = isHomePage && !isScrolled;
    
    const navBgClass = isTransparent
        ? 'bg-[#FDFBF7]/75 backdrop-blur-md text-gray-900 border-b border-[#D4AF37]/10'
        : 'bg-[#FDFBF7]/85 backdrop-blur-lg text-gray-900 border-b border-[#D4AF37]/20 shadow-md shadow-[#1a0a00]/5';

    const textLinkClass = 'text-gray-700 hover:text-[#A94A4A]';

    const iconButtonClass = 'text-gray-700 hover:text-[#A94A4A] hover:bg-[#1a0a00]/5';

    const logoTextClass = 'text-[#A94A4A]';

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-500 ease-out ${navBgClass}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    
                    {/* Brand Logo & Name */}
                    <Link to="/" className="flex items-center space-x-3 group flex-shrink-0">
                        <div className="relative shrink-0">
                            <img 
                                src="/logo-best.jpeg" 
                                alt="Burhani Collection" 
                                className="w-12 h-12 object-cover rounded-full border border-[#D4AF37] transition-all duration-500 group-hover:scale-105 group-hover:border-[#D4AF37] group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] shrink-0"
                            />
                            <div className="absolute inset-0 rounded-full border border-white/10 scale-90 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex flex-col">
                            <span 
                                className={`text-xl font-bold tracking-widest leading-none transition-colors duration-500 italic ${logoTextClass}`}
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            >
                                Burhani
                            </span>
                            <span className="text-[9px] tracking-[0.4em] uppercase text-[#D4AF37] mt-1 font-bold">
                                Collection
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {categories.map((category) => {
                            const isActive = activeCategoryId === category.id && isHomePage;
                            return (
                                <Link
                                    key={category.path}
                                    to={category.path}
                                    className={`relative py-2 text-sm font-medium tracking-wide uppercase transition-colors duration-300 ${textLinkClass} ${isActive ? 'font-semibold' : ''}`}
                                >
                                    {category.name}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNavLine"
                                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4AF37]"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Action Icons */}
                    <div className="flex items-center space-x-1 sm:space-x-3">
                        
                        {/* Global Search Bar */}
                        <GlobalSearch isTransparent={isTransparent} />

                        {/* Wishlist Link */}
                        <Link 
                            to="/wishlist" 
                            className={`hidden sm:flex p-2 rounded-full transition-all duration-300 relative ${iconButtonClass}`}
                            title="My Wishlist"
                        >
                            <Heart size={20} className="stroke-[1.75]" />
                        </Link>
                        
                        {/* Cart Link */}
                        <Link to="/cart" className="relative group">
                            <button className={`p-2 rounded-full transition-all duration-300 relative ${iconButtonClass}`}>
                                <ShoppingCart size={20} className="stroke-[1.75]" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-[#A94A4A] text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#FDFBF7] shadow-sm shadow-[#1a0a00]/25 transform transition-transform group-hover:scale-110">
                                        {itemCount}
                                    </span>
                                )}
                            </button>
                        </Link>

                        {/* User Menu Actions */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-transparent transition-all duration-300 bg-[#1a0a00]/5 hover:bg-[#1a0a00]/10"
                                >
                                    <UserCircle size={20} className="text-gray-700" />
                                    <span className="hidden sm:block text-xs font-semibold uppercase tracking-wider text-gray-700">
                                        {user?.full_name?.split(' ')[0] || 'Account'}
                                    </span>
                                </button>

                                {/* Dropdown Menu (Glassmorphism & Gold Theme) */}
                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 15 }}
                                            transition={{ duration: 0.25, ease: 'easeOut' }}
                                            className="absolute right-0 mt-3 w-52 bg-[#FDFBF7]/95 backdrop-blur-xl rounded-xl shadow-xl py-3 border border-[#D4AF37]/30 z-50 overflow-hidden"
                                        >
                                            <div className="px-4 py-2 border-b border-gray-100 mb-2">
                                                <p className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">Logged In As</p>
                                                <p className="text-xs font-semibold text-gray-800 truncate">{user?.email}</p>
                                            </div>

                                            <Link
                                                to="/profile"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-[#1a0a00]/5 hover:text-[#A94A4A] transition-colors"
                                            >
                                                <User size={16} className="mr-3 text-gray-400 group-hover:text-[#A94A4A]" />
                                                Profile Details
                                            </Link>
                                            
                                            {user?.role === 'admin' && (
                                                <Link
                                                    to="/admin"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center px-4 py-2.5 text-sm font-bold text-[#A94A4A] hover:bg-[#A94A4A]/5 transition-colors"
                                                >
                                                    <LayoutDashboard size={16} className="mr-3 text-[#A94A4A]" />
                                                    Admin Portal
                                                </Link>
                                            )}

                                            <Link
                                                to="/orders"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-[#1a0a00]/5 hover:text-[#A94A4A] transition-colors"
                                            >
                                                <Package size={16} className="mr-3 text-gray-400" />
                                                My Orders
                                            </Link>

                                            <Link
                                                to="/wishlist"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-[#1a0a00]/5 hover:text-[#A94A4A] transition-colors sm:hidden"
                                            >
                                                <Heart size={16} className="mr-3 text-gray-400" />
                                                My Wishlist
                                            </Link>

                                            <div className="border-t border-gray-100 my-2" />
                                            
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                            >
                                                <LogOut size={16} className="mr-3" />
                                                Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link to="/login">
                                <button className="px-5 py-2 rounded-full font-bold uppercase tracking-wider text-xs border border-[#A94A4A] text-[#A94A4A] hover:bg-[#A94A4A] hover:text-white shadow-md shadow-[#A94A4A]/10 transition-all duration-300">
                                    Sign In
                                </button>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`md:hidden p-2 rounded-full transition-colors ${iconButtonClass}`}
                        >
                            {mobileMenuOpen ? <X size={20} className="stroke-[2]" /> : <Menu size={20} className="stroke-[2]" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer Menu (Sliding Glassmorphic Box) */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="md:hidden border-t border-[#D4AF37]/15 overflow-hidden bg-[#FDFBF7] text-gray-900"
                        >
                            <div className="py-4 space-y-3 px-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] mb-2 pl-2">Categories</p>
                                    {categories.map((category) => (
                                        <Link
                                            key={category.path}
                                            to={category.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-[#1a0a00]/5 hover:text-[#A94A4A]"
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                    {isAuthenticated && user?.role === 'admin' && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block py-2.5 px-3 rounded-lg text-sm font-black text-[#A94A4A] hover:bg-[#A94A4A]/5"
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

