/**
 * API service layer
 * Centralized axios instance with authentication and error handling
 */
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });
                    const { access_token } = response.data;
                    localStorage.setItem('access_token', access_token);
                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                    // CRITICAL FIX: Update the original request's header before retrying
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    console.error("Refresh failed", refreshError);
                }
            }

            // If we reach here, either no refresh token or refresh failed
            localStorage.clear();
            if (window.location.pathname.startsWith('/admin')) {
                window.location.href = '/admin/login';
            }
        }

        const message = error.response?.data?.detail;
        const errorMsg = Array.isArray(message) ? message[0].msg : (message || 'An error occurred');

        // Don't show toast for 401s that we might be refreshing
        if (error.response?.status !== 401) {
            toast.error(errorMsg);
        }

        return Promise.reject(error);
    }
);

// ==================== AUTH APIs ====================
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: (refreshToken) => api.post('/auth/logout', { refresh_token: refreshToken }),
    getProfile: () => api.get('/auth/me'),
    changePassword: (data) => api.put('/auth/me/password', data),
};

// ==================== PRODUCTS APIs ====================
export const productsAPI = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    uploadImage: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// ==================== CATEGORIES APIs ====================
export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
};

// ==================== ORDERS APIs ====================
export const ordersAPI = {
    create: (data) => api.post('/orders', data),
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    createRazorpayOrder: (data) => api.post('/orders/razorpay/create', data),
    verifyRazorpayPayment: (data) => api.post('/orders/razorpay/verify', data),
    createWhatsAppOrder: (data) => api.post('/orders/whatsapp', data),
    getAllAdmin: (params) => api.get('/admin/orders', { params }),
    updateStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
};

// ==================== ADMIN USERS APIs ====================
export const usersAPI = {
    getAll: (params) => api.get('/admin/users', { params }),
    toggleBlock: (id, blockStatus) => api.put(`/admin/users/${id}/block`, null, { params: { block_status: blockStatus } }),
};

export default api;
