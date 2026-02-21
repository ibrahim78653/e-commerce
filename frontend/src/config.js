/**
 * Application Configuration
 * Handles environment-specific variables
 */

const getApiUrl = () => {
    // 1. Always prefer the explicit env variable (set in .env or Vercel dashboard)
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    // 2. If running locally without VITE_API_BASE_URL, try local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }
    // 3. In production without env var, assume same-origin
    return window.location.origin;
};

export const CONFIG = {
    API_BASE_URL: getApiUrl(),
    IMAGE_BASE_URL: getApiUrl(),
    RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
};

export default CONFIG;
