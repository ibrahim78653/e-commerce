import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, isAuthenticated, user } = useAuthStore();
    const navigate = useNavigate();

    if (isAuthenticated && user?.role === 'admin') return <Navigate to="/admin" />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login({ identifier: username, password });
        if (success) {
            toast.success("Login Successful");
            navigate('/admin');
        } else {
            toast.error("Invalid Credentials");
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF3F3] flex items-center justify-center p-4">
            <div className="glass rounded-3xl shadow-2xl p-10 border border-white/50 w-full max-w-md bg-white">
                <div className="text-center mb-8">
                    <img src="/logo.jpeg" alt="Burhani Collection" className="w-20 h-20 object-cover rounded-full mx-auto mb-4 border-2 border-[#D4AF37] shadow-md" />
                    <h2 className="text-3xl font-display font-bold text-[#4A4A4A]">Admin Login</h2>
                    <p className="text-gray-500 mt-2 italic font-light">"Where Style Meets Tradition"</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full py-4 bg-gradient-to-r from-[#8B7355] to-[#D4AF37] text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Access Admin Portal
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
