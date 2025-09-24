import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaFacebookF, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const Connexion = () => {
    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            await login(email, password);
            addToast({
                type: 'success',
                title: 'Connexion réussie',
                message: 'Bienvenue sur Nody !'
            });
            navigate('/profil');
        } catch (err) {
            console.error("Erreur de connexion:", err);
            addToast({
                type: 'error',
                title: 'Erreur de connexion',
                message: err.response?.data?.message || 'Vérifiez vos identifiants ou réessayez plus tard.'
            });
            setError(err.response?.data?.message || "Connexion échouée. Veuillez vérifier vos informations.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        // À implémenter selon votre solution d'authentification sociale
        console.log(`Connexion avec ${provider}`);
        addToast({
            type: 'info',
            title: 'Fonctionnalité à venir',
            message: `La connexion avec ${provider} sera bientôt disponible`
        });
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4 shadow" style={{ maxWidth: '400px', width: '100%', borderRadius: '20px' }}>
                <h3 className="text-center mb-3">Se connecter</h3>
                <p className="text-center text-muted mb-4">Bienvenue à nouveau !</p>

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
                    <span className="position-absolute bg-white px-2" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        ou
                    </span>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="mb-3">
                        <label className="form-label">
                            <FaEnvelope className="me-2" />Votre e-mail
                        </label>
                        <input 
                            type="email" 
                            className="form-control" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div className="mb-3">
                        <label className="form-label">
                            <FaLock className="me-2" />Votre mot de passe
                        </label>
                        <div className="input-group">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="form-control" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
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
                            <input type="checkbox" className="form-check-input" id="remember" />
                            <label className="form-check-label" htmlFor="remember">Se souvenir de moi</label>
                        </div>
                        <Link to="/mot-de-passe-oublie" className="text-decoration-none">Mot de passe oublié ?</Link>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary w-100 py-2"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>

                <p className="text-center mt-3">
                    Vous n'avez pas de compte ? <Link to="/inscription" className="text-primary">Inscrivez-vous</Link>
                </p>
            </div>
        </div>
    );
};

export default Connexion;