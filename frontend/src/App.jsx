/**
 * Main App Component
 * Routes and context providers
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';

// Lazy-loaded Pages
const Home = lazy(() => import('./pages/Home'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const CartPage = lazy(() => import('./pages/CartPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));

import { useState, useEffect } from 'react';
import useAuthStore from './store/authStore';
import SplashScreen from './components/SplashScreen';

// Scroll to top on route change
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

function App() {
    const { loadUser } = useAuthStore();
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    return (
        <BrowserRouter>
            <ScrollToTop />
            <CartProvider>
                <div className="min-h-screen bg-[#FDFBF7]">
                    <SplashScreen onComplete={() => setShowSplash(false)} />
                    
                    {!showSplash && (
                        <>
                            <Navbar />
                            <PageTransition>
                                    <Suspense fallback={<div className="min-h-[50vh] flex flex-col items-center justify-center gap-4"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div><p className="text-sm font-medium text-gray-500 tracking-widest uppercase">Loading Burhani Collection</p></div>}>
                                        <Routes>
                                            <Route path="/" element={<Home />} />
                                            <Route path="/product/:id" element={<ProductDetail />} />
                                            <Route path="/cart" element={<CartPage />} />
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/register" element={<Register />} />

                                            {/* Protected Routes */}
                                            <Route path="/checkout" element={<Checkout />} />
                                            <Route path="/orders" element={
                                                <ProtectedRoute>
                                                    <OrdersPage />
                                                </ProtectedRoute>
                                            } />
                                            <Route path="/orders/:id" element={
                                                <ProtectedRoute>
                                                    <OrderDetail />
                                                </ProtectedRoute>
                                            } />
                                            <Route path="/profile" element={
                                                <ProtectedRoute>
                                                    <ProfilePage />
                                                </ProtectedRoute>
                                            } />
                                            <Route path="/wishlist" element={
                                                <ProtectedRoute>
                                                    <WishlistPage />
                                                </ProtectedRoute>
                                            } />

                                            {/* Admin Routes */}
                                            <Route path="/admin/login" element={<AdminLogin />} />
                                            <Route path="/admin" element={
                                                <ProtectedRoute adminOnly>
                                                    <AdminDashboard />
                                                </ProtectedRoute>
                                            } />
                                            <Route path="/admin/orders/:id" element={
                                                <ProtectedRoute adminOnly>
                                                    <AdminOrderDetail />
                                                </ProtectedRoute>
                                            } />
                                        </Routes>
                                    </Suspense>
                            </PageTransition>
                            <Footer />
                        </>
                    )}

                    {/* Toast Notifications */}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3000,
                            style: {
                                background: '#fff',
                                color: '#363636',
                                padding: '16px',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </div>
            </CartProvider>
        </BrowserRouter >
    );
}

export default App;
