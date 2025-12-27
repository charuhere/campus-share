// ProtectedRoute - Blocks access if not logged in
// Redirects to login page if user is not authenticated

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
    const { user, profile, loading } = useAuth();

    // Still checking auth state - show loading
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Not logged in - redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Logged in but no profile - redirect to complete profile
    if (!profile) {
        return <Navigate to="/complete-profile" replace />;
    }

    // All good - show the protected content
    return children;
}

export default ProtectedRoute;
