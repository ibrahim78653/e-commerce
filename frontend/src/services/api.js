/**
 * API service layer
 * Centralized axios instance with authentication and error handling
 */
import axios from 'axios';
import toast from 'react-hot-toast';
import CONFIG from '../config';

// Ensure the URL ends with /api if it's not already there for relative paths
const API_BASE_URL = CONFIG.API_BASE_URL.endsWith('/api')
    ? CONFIG.API_BASE_URL
    : (CONFIG.API_BASE_URL.startsWith('http') ? `${CONFIG.API_BASE_URL}/api` : '/api');

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60s timeout for Render free-tier cold starts
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

        // Check if this is a login/register attempt (should NOT trigger token refresh)
        const isAuthRequest = originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/register');

        // Only attempt token refresh for 401s that are NOT login/register requests
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
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
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (window.location.pathname.startsWith('/admin')) {
                window.location.href = '/admin/login';
            }
        }

        // Show error toast for ALL failed requests
        if (error.response) {
            // Server responded with an error status
            const message = error.response.data?.detail;
            const errorMsg = Array.isArray(message) ? message[0].msg : (message || 'An error occurred');

            // Show toast for login/register failures and non-401 errors
            if (isAuthRequest || error.response.status !== 401) {
                toast.error(errorMsg);
            }
        } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            toast.error('Server is waking up... Please try again in a few seconds.');
        } else {
            toast.error('Network error. Please check your connection.');
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
    // Color Variants
    addColorVariant: (productId, data) => api.post(`/products/${productId}/variants`, data),
    updateColorVariant: (productId, variantId, data) => api.put(`/products/${productId}/variants/${variantId}`, data),
    deleteColorVariant: (productId, variantId) => api.delete(`/products/${productId}/variants/${variantId}`),
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
