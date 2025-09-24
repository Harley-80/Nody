import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/connexion" replace />;
    if (adminOnly && !user?.isAdmin) return <Navigate to="/" replace />;

    return children;
}
