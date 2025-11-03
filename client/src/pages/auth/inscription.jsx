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
import ChampTelephone from '../../components/common/ChampTelephone';

// Page d'inscription
const Inscription = () => {
    const { register } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        motDePasse: '',
        confirmerMotDePasse: '',
        telephone: '',
        genre: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [telephoneValide, setTelephoneValide] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleTelephoneChange = telephone => {
        setForm(prev => ({ ...prev, telephone }));
    };

    // Valider le formulaire
    const validerFormulaire = () => {
        // Validation des champs obligatoires
        if (!form.nom.trim()) {
            setError('Le nom est obligatoire');
            return false;
        }
        if (!form.prenom.trim()) {
            setError('Le prénom est obligatoire');
            return false;
        }
        if (!form.email.trim()) {
            setError("L'email est obligatoire");
            return false;
        }
        if (!form.telephone) {
            setError('Le téléphone est obligatoire');
            return false;
        }
        if (!telephoneValide) {
            setError('Le numéro de téléphone est invalide');
            return false;
        }
        if (!form.genre) {
            setError('Le genre est obligatoire');
            return false;
        }
        if (!form.motDePasse) {
            setError('Le mot de passe est obligatoire');
            return false;
        }
        if (form.motDePasse.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }
        if (form.motDePasse !== form.confirmerMotDePasse) {
            setError('Les mots de passe ne correspondent pas');
            return false;
        }
        return true;
    };

    // Envoyer le formulaire
    const handleSubmit = async e => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (!validerFormulaire()) {
            setIsLoading(false);
            return;
        }

        // Envoyer le formulaire
        try {
            await register({
                nom: form.nom.trim(),
                prenom: form.prenom.trim(),
                email: form.email.trim(),
                telephone: form.telephone,
                genre: form.genre,
                motDePasse: form.motDePasse,
            });
            addToast({
                type: 'success',
                title: 'Inscription réussie',
                message: 'Bienvenue chez Nody !',
            });
            navigate('/profil');
        } catch (err) {
            let msg = 'Inscription échouée. Veuillez réessayer.';
            if (err.response?.data?.message) {
                msg = err.response.data.message;
            } else if (err.message) {
                msg = err.message;
            }
            console.error("Erreur d'inscription:", err);
            addToast({
                type: 'error',
                title: "Erreur d'inscription",
                message: msg,
            });
            setError(msg);
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

    // Affichage de la page d'inscription
    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div
                className="card p-4 shadow"
                style={{
                    maxWidth: '500px',
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
                                    Nom
                                </label>
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
                            <div className="col">
                                <label className="form-label">Prénom</label>
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
                        <ChampTelephone
                            value={form.telephone}
                            onChange={handleTelephoneChange}
                            onValidation={setTelephoneValide}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Genre *</label>
                        <div className="d-flex gap-3">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="genre"
                                    id="homme"
                                    value="Homme"
                                    checked={form.genre === 'Homme'}
                                    onChange={handleChange}
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor="homme"
                                >
                                    Homme
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="genre"
                                    id="femme"
                                    value="Femme"
                                    checked={form.genre === 'Femme'}
                                    onChange={handleChange}
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor="femme"
                                >
                                    Femme
                                </label>
                            </div>
                        </div>
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
                                minLength="6"
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        <small className="text-muted">
                            Minimum 6 caractères
                        </small>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            <FaLock className="me-2" />
                            Confirmer le mot de passe
                        </label>
                        <div className="input-group">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmerMotDePasse"
                                className="form-control"
                                autoComplete="new-password"
                                value={form.confirmerMotDePasse}
                                onChange={handleChange}
                                required
                                minLength="6"
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                            >
                                {showConfirmPassword ? (
                                    <FaEyeSlash />
                                ) : (
                                    <FaEye />
                                )}
                            </button>
                        </div>
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
                                Inscription en cours...
                            </>
                        ) : (
                            "S'inscrire"
                        )}
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
