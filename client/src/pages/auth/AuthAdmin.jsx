import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Page de connexion administrateur
 * - Permet une connexion rapide en mode développement
 * - Redirige automatiquement si déjà connecté en tant qu'admin
 */
export default function AuthAdmin() {
    // Récupération des méthodes d'authentification
    const { loginAsAdmin, user } = useAuth();
    const navigate = useNavigate();
    
    // Redirection si déjà admin
    useEffect(() => {
        if (user?.isAdmin) {
            navigate('/admin', { replace: true });
        }
    }, [user, navigate]);

    return (
        <div className="container py-5 text-center">
            <div className="card shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
                <div className="card-body p-5">
                    <h2 className="mb-4">Connexion Administrateur</h2>
                    <p className="mb-4 text-muted">
                        Accès au tableau de bord d'administration
                    </p>
                    
                    {/* Bouton de connexion mock */}
                    {process.env.NODE_ENV === 'development' && (
                        <>
                            <button 
                                className="btn btn-dark btn-lg w-100 mb-3"
                                onClick={loginAsAdmin}
                            >
                                <i className="fas fa-user-shield me-2"></i> 
                                Connexion Admin (Développement)
                            </button>
                            <p className="small text-muted">
                                Mode développement seulement - accès mock
                            </p>
                        </>
                    )}
                    
                    {/* À implémenter en production : */}
                    {process.env.NODE_ENV !== 'development' && (
                        <div className="alert alert-info">
                            Système d'authentification sécurisé à implémenter
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}