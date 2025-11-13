import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaGoogle,
    FaFacebookF,
    FaEnvelope,
    FaLock,
    FaEye,
    FaEyeSlash,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const Connexion = () => {
    const { login, user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [email, setEmail] = useState(
        () => localStorage.getItem('nodyRememberEmail') || ''
    );
    const [motDePasse, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [remember, setRemember] = useState(
        !!localStorage.getItem('nodyRememberEmail')
    );

    // Récupérer la page d'origine ou utiliser la page par défaut
    const from = location.state?.from?.pathname || '/';

    // Rediriger si déjà connecté
    useEffect(() => {
        if (user) {
            if (user.isAdmin) {
                navigate('/admin', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        }
    }, [user, navigate, from]);

    // Envoyer le formulaire
    const handleSubmit = async e => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await login(email, motDePasse);
            
            if (remember) {
                localStorage.setItem('nodyRememberEmail', email);
            } else {
                localStorage.removeItem('nodyRememberEmail');
            }
            
            addToast({
                type: 'success',
                title: 'Connexion réussie',
                message: 'Bienvenue sur Nody !',
            });

            // CORRECTION: Redirection intelligente basée sur le rôle
            const userData = response.userData || response.donnees || response;
            if (userData.isAdmin) {
                // Rediriger l'admin vers le dashboard admin
                setTimeout(() => {
                    navigate('/admin', { replace: true });
                }, 1000);
            } else {
                // Rediriger les autres utilisateurs vers la page d'origine ou le profil
                setTimeout(() => {
                    navigate(from, { replace: true });
                }, 1000);
            }
        } catch (err) {
            let msg = 'Connexion échouée. Veuillez vérifier vos informations.';
            if (err.response?.data?.message) {
                msg = err.response.data.message;
            } else if (err.message) {
                msg = err.message;
            }
            console.error('Erreur de connexion:', err);
            addToast({
                type: 'error',
                title: 'Erreur de connexion',
                message: msg,
            });
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Connexion avec un fournisseur
    const handleSocialLogin = provider => {
        console.log(`Connexion avec ${provider}`);
        addToast({
            type: 'info',
            title: 'Fonctionnalité à venir',
            message: `La connexion avec ${provider} sera bientôt disponible`,
        });
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div
                className="card p-4 shadow"
                style={{
                    maxWidth: '400px',
                    width: '100%',
                    borderRadius: '20px',
                }}
            >
                <h3 className="text-center mb-3">Se connecter</h3>
                <p className="text-center text-muted mb-4">
                    Bienvenue à nouveau !
                </p>

                <div className="d-flex justify-content-between mb-3">
                    <button
                        className="btn btn-outline-secondary w-50 me-2"
                        onClick={() => handleSocialLogin('Google')}
                    >
                        <FaGoogle className="me-2" /> Google
                    </button>
                    <button
                        className="btn btn-outline-secondary w-50"
                        onClick={() => handleSocialLogin('Facebook')}
                    >
                        <FaFacebookF className="me-2" /> Facebook
                    </button>
                </div>

                <div className="text-center mb-3 position-relative">
                    <hr className="my-0" />
                    <span
                        className="position-absolute bg-white px-2"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        ou
                    </span>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="mb-3">
                        <label className="form-label">
                            <FaEnvelope className="me-2" />
                            Votre e-mail
                        </label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            autoComplete="email"
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            <FaLock className="me-2" />
                            Votre mot de passe
                        </label>
                        <div className="input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-control"
                                value={motDePasse}
                                autoComplete="current-password"
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="remember"
                                checked={remember}
                                onChange={e => setRemember(e.target.checked)}
                            />
                            <label
                                className="form-check-label"
                                htmlFor="remember"
                            >
                                Se souvenir de moi
                            </label>
                        </div>
                        <Link
                            to="/auth/MotDePasseOublie"
                            className="text-decoration-none"
                        >
                            Mot de passe oublié ?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                ></span>
                                Connexion en cours...
                            </>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                <p className="text-center mt-3">
                    Vous n'avez pas de compte ?{' '}
                    <Link to="/inscription" className="text-primary">
                        Inscrivez-vous
                    </Link>
                </p>

                {/* Lien spécial pour les admins */}
                <div className="text-center mt-2">
                    <Link 
                        to="/admin-login" 
                        className="text-decoration-none text-muted small"
                    >
                        Accès administrateur
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Connexion;