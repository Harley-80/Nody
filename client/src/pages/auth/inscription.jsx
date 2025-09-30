import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaGoogle,
    FaFacebookF,
    FaEnvelope,
    FaLock,
    FaUser,
    FaEye,
    FaEyeSlash,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const Inscription = () => {
    const { register } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        motDePasse: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await register(form);
            addToast({
                type: 'success',
                title: 'Inscription réussie',
                message: 'Bienvenue chez Nody !',
            });
            navigate('/profil');
        } catch (err) {
            console.error("Erreur d'inscription:", err);
            addToast({
                type: 'error',
                title: "Erreur d'inscription",
                message:
                    err.response?.data?.message ||
                    'Impossible de créer le compte. Veuillez vérifier vos informations.',
            });
            setError(
                err.response?.data?.message ||
                    'Inscription échouée. Veuillez réessayer.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialRegister = provider => {
        console.log(`Inscription avec ${provider}`);
        addToast({
            type: 'info',
            title: 'Fonctionnalité à venir',
            message: `L'inscription avec ${provider} sera bientôt disponible`,
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
                <h3 className="text-center mb-3">S'inscrire</h3>
                <p className="text-center text-muted mb-4">
                    Rejoignez notre communauté
                </p>

                <div className="d-flex justify-content-between mb-3">
                    <button
                        className="btn btn-outline-secondary w-50 me-2"
                        onClick={() => handleSocialRegister('Google')}
                    >
                        <FaGoogle className="me-2" /> Google
                    </button>
                    <button
                        className="btn btn-outline-secondary w-50"
                        onClick={() => handleSocialRegister('Facebook')}
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
                        <div className="row">
                            <div className="col">
                                <label className="form-label">
                                    <FaUser className="me-2" />
                                    Prénom
                                </label>
                                <input
                                    type="text"
                                    name="prenom"
                                    className="form-control"
                                    value={form.prenom}
                                    autoComplete="given-name"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col">
                                <label className="form-label">Nom</label>
                                <input
                                    type="text"
                                    name="nom"
                                    className="form-control"
                                    value={form.nom}
                                    autoComplete="family-name"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            <FaEnvelope className="me-2" />
                            Votre e-mail
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                                autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
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
                                name="motDePasse"
                                className="form-control"
                                autoComplete="new-password"
                                value={form.motDePasse}
                                onChange={handleChange}
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

                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-2"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Inscription en cours...' : "S'inscrire"}
                    </button>
                </form>

                <p className="text-center mt-3">
                    Vous avez déjà un compte ?{' '}
                    <Link to="/connexion" className="text-primary">
                        Se connecter
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Inscription;
