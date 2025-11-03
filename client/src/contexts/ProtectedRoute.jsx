import { useAuth } from './AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth();

    // Afficher un loading pendant la vérification
    if (loading) {
        return (
            <div className="container text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2">Vérification de l'authentification...</p>
            </div>
        );
    }

    if (!user) return <Navigate to="/connexion" replace />;
    if (adminOnly && !user?.isAdmin) return <Navigate to="/" replace />;

    return children;
}
