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
        <div className="container" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Login</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
