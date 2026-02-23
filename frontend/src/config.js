/**
 * Application Configuration
 * Handles environment-specific variables
 */

const getApiUrl = () => {
    // 1. Priority: Explicit environment variable set in Vercel/Netlify/Local .env
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }

    // 2. Development: If running on localhost, default to local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }

    // 3. Problem: In production, we MUST have VITE_API_BASE_URL set.
    // If it's missing, we log a warning but don't fallback to the frontend URL.
    console.warn("VITE_API_BASE_URL is not defined! API calls will likely fail. Please set this in your deployment dashboard (e.g., Vercel).");

    // Return an empty string or a placeholder to avoid hitting the frontend server with API requests
    return '';
};

export const CONFIG = {
    API_BASE_URL: getApiUrl(),
    IMAGE_BASE_URL: getApiUrl(), // Images are served by the backend static route
    RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
};

export default CONFIG;
