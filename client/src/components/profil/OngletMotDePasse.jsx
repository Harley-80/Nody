import React, { useState } from 'react';
import profilService from '../../services/profilService';
import './OngletMotDePasse.scss';

const OngletMotDePasse = () => {
    // États pour le formulaire
    const [formData, setFormData] = useState({
        motDePasseActuel: '',
        nouveauMotDePasse: '',
        confirmationMotDePasse: '',
    });

    // États pour l'affichage des mots de passe
    const [showPasswords, setShowPasswords] = useState({
        actuel: false,
        nouveau: false,
        confirmation: false,
    });

    // États pour les messages
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [succes, setSucces] = useState(false);

    // Gérer les changements dans les champs
    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Réinitialiser les messages d'erreur lors de la saisie
        setErreur(null);
    };

    // Basculer l'affichage d'un mot de passe
    const togglePasswordVisibility = field => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    // Valider la force du mot de passe
    const validatePasswordStrength = password => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return {
                valid: false,
                message: 'Le mot de passe doit contenir au moins 8 caractères',
            };
        }
        if (!hasUpperCase) {
            return {
                valid: false,
                message: 'Le mot de passe doit contenir au moins une majuscule',
            };
        }
        if (!hasLowerCase) {
            return {
                valid: false,
                message: 'Le mot de passe doit contenir au moins une minuscule',
            };
        }
        if (!hasNumbers) {
            return {
                valid: false,
                message: 'Le mot de passe doit contenir au moins un chiffre',
            };
        }
        if (!hasSpecialChar) {
            return {
                valid: false,
                message:
                    'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)',
            };
        }

        return { valid: true, message: 'Mot de passe fort' };
    };

    // Calculer la force du mot de passe (pour la barre de progression)
    const getPasswordStrength = password => {
        let strength = 0;
        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/[a-z]/.test(password)) strength += 20;
        if (/\d/.test(password)) strength += 10;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 10;
        return strength;
    };

    // Obtenir la couleur de la barre de force
    const getStrengthColor = strength => {
        if (strength < 40) return '#e74c3c'; // Rouge
        if (strength < 70) return '#f39c12'; // Orange
        return '#27ae60'; // Vert
    };

    // Obtenir le label de la force
    const getStrengthLabel = strength => {
        if (strength < 40) return 'Faible';
        if (strength < 70) return 'Moyen';
        return 'Fort';
    };

    // Soumettre le formulaire
    const handleSubmit = async e => {
        e.preventDefault();

        try {
            setLoading(true);
            setErreur(null);
            setSucces(false);

            // Validation des champs
            if (
                !formData.motDePasseActuel ||
                !formData.nouveauMotDePasse ||
                !formData.confirmationMotDePasse
            ) {
                setErreur('Tous les champs sont obligatoires');
                return;
            }

            // Vérifier que les nouveaux mots de passe correspondent
            if (
                formData.nouveauMotDePasse !== formData.confirmationMotDePasse
            ) {
                setErreur('Les nouveaux mots de passe ne correspondent pas');
                return;
            }

            // Vérifier que le nouveau mot de passe est différent de l'ancien
            if (formData.motDePasseActuel === formData.nouveauMotDePasse) {
                setErreur(
                    "Le nouveau mot de passe doit être différent de l'ancien"
                );
                return;
            }

            // Valider la force du nouveau mot de passe
            const validation = validatePasswordStrength(
                formData.nouveauMotDePasse
            );
            if (!validation.valid) {
                setErreur(validation.message);
                return;
            }

            // Appel API pour changer le mot de passe
            const response = await profilService.changerMotDePasse({
                motDePasseActuel: formData.motDePasseActuel,
                nouveauMotDePasse: formData.nouveauMotDePasse,
            });

            if (response.succes) {
                setSucces(true);
                // Réinitialiser le formulaire
                setFormData({
                    motDePasseActuel: '',
                    nouveauMotDePasse: '',
                    confirmationMotDePasse: '',
                });
                // Cacher les mots de passe
                setShowPasswords({
                    actuel: false,
                    nouveau: false,
                    confirmation: false,
                });

                // Masquer le message de succès après 5 secondes
                setTimeout(() => setSucces(false), 5000);
            }
        } catch (err) {
            console.error('Erreur changement mot de passe:', err);
            setErreur(
                err.response?.data?.erreur ||
                    'Erreur lors du changement de mot de passe'
            );
        } finally {
            setLoading(false);
        }
    };

    // Calculer la force du nouveau mot de passe
    const passwordStrength = getPasswordStrength(formData.nouveauMotDePasse);

    return (
        <div className="onglet-mot-de-passe">
            <div className="section-header">
                <h3>
                    <i className="fas fa-lock"></i>
                    Changer le mot de passe
                </h3>
                <p className="section-description">
                    Pour votre sécurité, assurez-vous de choisir un mot de passe
                    fort et unique.
                </p>
            </div>

            {/* Messages de succès et d'erreur */}
            {succes && (
                <div className="alert alert-success">
                    <i className="fas fa-check-circle"></i>
                    <div>
                        <strong>Mot de passe modifié avec succès !</strong>
                        <p>
                            Votre mot de passe a été mis à jour. Utilisez-le
                            lors de votre prochaine connexion.
                        </p>
                    </div>
                </div>
            )}

            {erreur && (
                <div className="alert alert-danger">
                    <i className="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Erreur</strong>
                        <p>{erreur}</p>
                    </div>
                </div>
            )}

            {/* Conseils de sécurité */}
            <div className="security-tips">
                <h4>
                    <i className="fas fa-shield-alt"></i>
                    Conseils de sécurité
                </h4>
                <ul>
                    <li>
                        <i className="fas fa-check"></i>
                        Utilisez au moins 8 caractères
                    </li>
                    <li>
                        <i className="fas fa-check"></i>
                        Mélangez majuscules, minuscules, chiffres et symboles
                    </li>
                    <li>
                        <i className="fas fa-check"></i>
                        N'utilisez pas d'informations personnelles
                    </li>
                    <li>
                        <i className="fas fa-check"></i>
                        Évitez les mots de passe déjà utilisés sur d'autres
                        sites
                    </li>
                </ul>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="password-form">
                {/* Mot de passe actuel */}
                <div className="form-group">
                    <label htmlFor="motDePasseActuel">
                        Mot de passe actuel <span className="required">*</span>
                    </label>
                    <div className="input-with-icon">
                        <input
                            type={showPasswords.actuel ? 'text' : 'password'}
                            id="motDePasseActuel"
                            name="motDePasseActuel"
                            value={formData.motDePasseActuel}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Entrez votre mot de passe actuel"
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => togglePasswordVisibility('actuel')}
                            tabIndex="-1"
                        >
                            <i
                                className={`fas fa-eye${showPasswords.actuel ? '-slash' : ''}`}
                            ></i>
                        </button>
                    </div>
                </div>

                {/* Nouveau mot de passe */}
                <div className="form-group">
                    <label htmlFor="nouveauMotDePasse">
                        Nouveau mot de passe <span className="required">*</span>
                    </label>
                    <div className="input-with-icon">
                        <input
                            type={showPasswords.nouveau ? 'text' : 'password'}
                            id="nouveauMotDePasse"
                            name="nouveauMotDePasse"
                            value={formData.nouveauMotDePasse}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Entrez un nouveau mot de passe"
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => togglePasswordVisibility('nouveau')}
                            tabIndex="-1"
                        >
                            <i
                                className={`fas fa-eye${showPasswords.nouveau ? '-slash' : ''}`}
                            ></i>
                        </button>
                    </div>

                    {/* Barre de force du mot de passe */}
                    {formData.nouveauMotDePasse && (
                        <div className="password-strength">
                            <div className="strength-bar">
                                <div
                                    className="strength-fill"
                                    style={{
                                        width: `${passwordStrength}%`,
                                        backgroundColor:
                                            getStrengthColor(passwordStrength),
                                    }}
                                ></div>
                            </div>
                            <span
                                className="strength-label"
                                style={{
                                    color: getStrengthColor(passwordStrength),
                                }}
                            >
                                {getStrengthLabel(passwordStrength)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Confirmation du nouveau mot de passe */}
                <div className="form-group">
                    <label htmlFor="confirmationMotDePasse">
                        Confirmer le nouveau mot de passe{' '}
                        <span className="required">*</span>
                    </label>
                    <div className="input-with-icon">
                        <input
                            type={
                                showPasswords.confirmation ? 'text' : 'password'
                            }
                            id="confirmationMotDePasse"
                            name="confirmationMotDePasse"
                            value={formData.confirmationMotDePasse}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Confirmez votre nouveau mot de passe"
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() =>
                                togglePasswordVisibility('confirmation')
                            }
                            tabIndex="-1"
                        >
                            <i
                                className={`fas fa-eye${showPasswords.confirmation ? '-slash' : ''}`}
                            ></i>
                        </button>
                    </div>

                    {/* Indicateur de correspondance */}
                    {formData.nouveauMotDePasse &&
                        formData.confirmationMotDePasse && (
                            <div
                                className={`password-match ${
                                    formData.nouveauMotDePasse ===
                                    formData.confirmationMotDePasse
                                        ? 'match'
                                        : 'no-match'
                                }`}
                            >
                                <i
                                    className={`fas fa-${
                                        formData.nouveauMotDePasse ===
                                        formData.confirmationMotDePasse
                                            ? 'check-circle'
                                            : 'times-circle'
                                    }`}
                                ></i>
                                {formData.nouveauMotDePasse ===
                                formData.confirmationMotDePasse
                                    ? 'Les mots de passe correspondent'
                                    : 'Les mots de passe ne correspondent pas'}
                            </div>
                        )}
                </div>

                {/* Bouton de soumission */}
                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-small"></span>
                                Modification en cours...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-key"></i>
                                Changer le mot de passe
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OngletMotDePasse;
