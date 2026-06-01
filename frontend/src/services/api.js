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
            localStorage.removeItem('user');
            localStorage.removeItem('auth-storage'); // CRITICAL: Clear Zustand state so it doesn't redirect back

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
    updateProfile: (data) => api.put('/auth/me', data),
    changePassword: (data) => api.put('/auth/me/password', data),
};

// ==================== PRODUCTS APIs ====================
export const productsAPI = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getRelated: (id, limit = 8) => api.get(`/products/${id}/related`, { params: { limit } }),
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
    exportOrders: ({ filterBy = 'all', sortBy = 'newest', startDate = null, endDate = null, format = 'xlsx' } = {}) => {
        const token = localStorage.getItem('access_token');
        const params = new URLSearchParams({
            filter_by: filterBy,
            sort_by: sortBy,
            export_format: format,
            token: token || '',
        });
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        // Return direct download URL using absolute API_BASE_URL to prevent Vite proxy from stripping headers
        return Promise.resolve({ downloadUrl: `${API_BASE_URL}/admin/orders/export?${params.toString()}` });
    },
};

// ==================== ADMIN USERS APIs ====================
export const usersAPI = {
    getAll: (params) => api.get('/admin/users', { params }),
    toggleBlock: (id, blockStatus) => api.put(`/admin/users/${id}/block`, null, { params: { block_status: blockStatus } }),
    getStats: () => api.get('/admin/stats'),
};

// ==================== WISHLIST APIs ====================
export const wishlistAPI = {
    get: () => api.get('/wishlist'),
    add: (productId) => api.post(`/wishlist/${productId}`),
    remove: (productId) => api.delete(`/wishlist/${productId}`),
};

// ==================== REVIEWS APIs ====================
export const reviewsAPI = {
    getByProduct: (productId) => api.get(`/products/${productId}/reviews`),
    create: (productId, data) => api.post(`/products/${productId}/reviews`, data),
};

// ==================== PROMOS APIs ====================
export const promosAPI = {
    validate: (data) => api.post('/promos/validate', data),
    // Admin
    getAll: () => api.get('/admin/promos'),
    create: (data) => api.post('/admin/promos', data),
    update: (id, data) => api.put(`/admin/promos/${id}`, data),
    delete: (id) => api.delete(`/admin/promos/${id}`),
};

// ==================== ADDRESSES APIs ====================
export const addressesAPI = {
    getAll: () => api.get('/users/addresses'),
    create: (data) => api.post('/users/addresses', data),
    update: (id, data) => api.put(`/users/addresses/${id}`, data),
    delete: (id) => api.delete(`/users/addresses/${id}`),
    setDefault: (id) => api.patch(`/users/addresses/${id}/set-default`),
};

// ==================== NEWSLETTER APIs ====================
export const newsletterAPI = {
    subscribe: (data) => api.post('/newsletter/subscribe', data),
    unsubscribe: (data) => api.post('/newsletter/unsubscribe', data),
    // Admin
    getSubscribers: () => api.get('/admin/newsletter'),
};

// ==================== EXCEL IMPORT/EXPORT APIs ====================
export const excelAPI = {
    /**
     * Upload an .xlsx file to import products.
     * @param {File} file - The xlsx file
     * @param {boolean} partial - Allow partial success (default false = full rollback on error)
     */
    importExcel: (file, partial = false) => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post(`/admin/products/import-excel?partial=${partial}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000, // large files may take longer
        });
    },

    /**
     * Export all products to .xlsx.
     * Returns a Blob response for download.
     */
    exportExcel: (isActive = null) => {
        const params = {};
        if (isActive !== null) params.is_active = isActive;
        return api.get('/admin/products/export-excel', {
            params,
            responseType: 'blob',
        });
    },

    /** Download a pre-filled template .xlsx */
    downloadTemplate: () =>
        api.get('/admin/products/excel-template', { responseType: 'blob' }),

    /** Get recent import audit logs */
    getLogs: (limit = 20) =>
        api.get('/admin/products/import-logs', { params: { limit } }),

    /** List excel-imported products with optional filter */
    listProducts: (params) =>
        api.get('/admin/products/excel-products', { params }),

    /** Toggle is_active for a single excel product */
    toggleProduct: (productId) =>
        api.patch(`/admin/products/excel-products/${productId}/toggle`),
};

// ==================== BULK IMAGE IMPORT APIs ====================
export const bulkImageAPI = {
    /**
     * Upload a ZIP file containing product images.
     * @param {File} file - The ZIP file
     */
    startImport: (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post('/admin/bulk-image-import', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000, // large ZIP files might take a while to upload
        });
    },

    /**
     * Get the status of an ongoing or completed import job.
     * @param {string} jobId - The job ID
     */
    getJobStatus: (jobId) => api.get(`/admin/bulk-image-import/status/${jobId}`),

    /**
     * Get recent import jobs.
     */
    getJobs: () => api.get('/admin/bulk-image-import/jobs'),

    /**
     * Download the error report for a job.
     * Returns a Blob.
     */
    downloadReport: (jobId) =>
        api.get(`/admin/bulk-image-import/report/${jobId}`, { responseType: 'blob' }),
};

export default api;
