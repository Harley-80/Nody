import { useAuth } from './AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({
    children,
    adminOnly = false,
    moderateurOnly = false,
    vendeurOnly = false,
    rolesAutorisés = [], // ['admin', 'moderateur', 'vendeur', 'client']
}) {
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

    // Si pas connecté, rediriger vers la connexion
    if (!user) {
        console.warn('Utilisateur non connecté, redirection vers /connexion');
        return <Navigate to="/connexion" state={{ from: location }} replace />;
    }

    // Vérification par rôles autorisés (méthode recommandée)
    if (rolesAutorisés.length > 0) {
        if (!rolesAutorisés.includes(user.role)) {
            console.warn(
                `Accès refusé pour ${user.email} (rôle: ${user.role}). Rôles requis:`,
                rolesAutorisés
            );

            // Redirection selon le rôle actuel
            if (user.role === 'admin') {
                return <Navigate to="/admin" replace />;
            } else if (user.role === 'moderateur') {
                return <Navigate to="/moderateur/dashboard" replace />;
            } else if (user.role === 'vendeur') {
                return <Navigate to="/vendeur/dashboard" replace />;
            } else {
                return <Navigate to="/" replace />;
            }
        }
    }

    // Vérification par flags (méthode legacy, maintenue pour compatibilité)
    if (adminOnly && user.role !== 'admin') {
        console.warn(
            "Accès admin refusé pour l'utilisateur:",
            user.email,
            'Rôle:',
            user.role
        );
        return <Navigate to="/" replace />;
    }

    if (moderateurOnly && user.role !== 'moderateur') {
        console.warn(
            "Accès modérateur refusé pour l'utilisateur:",
            user.email,
            'Rôle:',
            user.role
        );
        return <Navigate to="/" replace />;
    }

    if (vendeurOnly && user.role !== 'vendeur') {
        console.warn(
            "Accès vendeur refusé pour l'utilisateur:",
            user.email,
            'Rôle:',
            user.role
        );
        return <Navigate to="/" replace />;
    }

    console.log(`Accès autorisé pour ${user.email} (rôle: ${user.role})`);
    return children;
}
