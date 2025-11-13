import { useAuth } from './AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth();
    const location = useLocation();

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

    if (!user) {
        // Rediriger vers la page de connexion avec retour prévu
        return <Navigate to="/connexion" state={{ from: location }} replace />;
    }

    // CORRECTION: Vérification améliorée du rôle admin
    if (adminOnly && !user.isAdmin) {
        console.warn(
            "Accès admin refusé pour l'utilisateur:",
            user.email,
            'Rôle:',
            user.role
        );
        return <Navigate to="/profil" replace />;
    }

    return children;
}
