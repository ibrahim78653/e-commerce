/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && user?.role !== 'admin') {
        // Not authorized for admin area - send to home
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
