import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const ProtectedRoute = ({ children, requireAdmin, requireSupplier }) => {
    const { user, loading } = useUser();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requireAdmin && user.userType !== 'admin') {
        return <Navigate to="/" />;
    }

    if (requireSupplier && user.userType !== 'supplier') {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute; 