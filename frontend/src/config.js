/**
 * Application Configuration
 * Handles environment-specific variables
 */

const getApiUrl = () => {
    // If we're on localhost, use the local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }
    // In production, the backend is usually served from the same origin under /api
    // or from a specific environment variable
    return import.meta.env.VITE_API_BASE_URL || window.location.origin;
};

export const CONFIG = {
    API_BASE_URL: getApiUrl(),
    IMAGE_BASE_URL: getApiUrl(),
    RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
};

export default CONFIG;
