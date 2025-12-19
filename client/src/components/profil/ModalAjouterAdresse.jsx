import React, { useState, useEffect } from 'react';
import profilService from '../../services/profilService';
import './ModalAjouterAdresse.scss';

const ModalAjouterAdresse = ({ adresse, onFermer, onSauvegarder }) => {
    // Déterminer si c'est une modification ou un ajout
    const modeEdition = !!adresse;

    // États pour le formulaire
    const [formData, setFormData] = useState({
        type: adresse?.type || 'domicile',
        nomComplet: adresse?.nomComplet || '',
        telephone: adresse?.telephone || '',
        adresse: adresse?.adresse || '',
        ville: adresse?.ville || '',
        codePostal: adresse?.codePostal || '',
        pays: adresse?.pays || 'Sénégal',
        instructions: adresse?.instructions || '',
        parDefaut: adresse?.parDefaut || false,
    });

    // États pour les messages
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);

    // Gérer les changements dans les champs
    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Réinitialiser l'erreur lors de la saisie
        setErreur(null);
    };

    // Soumettre le formulaire
    const handleSubmit = async e => {
        e.preventDefault();

        try {
            setLoading(true);
            setErreur(null);

            // Validation des champs obligatoires
            if (
                !formData.nomComplet ||
                !formData.telephone ||
                !formData.adresse ||
                !formData.ville ||
                !formData.pays
            ) {
                setErreur('Veuillez remplir tous les champs obligatoires');
                return;
            }

            // Validation du téléphone (format basique)
            const phoneRegex =
                /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
            if (!phoneRegex.test(formData.telephone)) {
                setErreur('Format de téléphone invalide');
                return;
            }

            let response;

            if (modeEdition) {
                // Modification d'une adresse existante
                response = await profilService.modifierAdresse(
                    adresse._id,
                    formData
                );
            } else {
                // Ajout d'une nouvelle adresse
                response = await profilService.ajouterAdresse(formData);
            }

            if (response.succes) {
                // Notifier le parent et fermer le modal
                onSauvegarder();
            }
        } catch (err) {
            console.error('Erreur sauvegarde adresse:', err);
            setErreur(
                err.response?.data?.erreur ||
                    "Erreur lors de la sauvegarde de l'adresse"
            );
        } finally {
            setLoading(false);
        }
    };

    // Fermer le modal en cliquant sur l'overlay
    const handleOverlayClick = e => {
        if (e.target === e.currentTarget) {
            onFermer();
        }
    };

    // Empêcher la fermeture par Escape si en cours de chargement
    useEffect(() => {
        const handleEscape = e => {
            if (e.key === 'Escape' && !loading) {
                onFermer();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [loading, onFermer]);

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content modal-adresse">
                {/* En-tête du modal */}
                <div className="modal-header">
                    <h3>
                        <i
                            className={`fas fa-${modeEdition ? 'edit' : 'plus-circle'}`}
                        ></i>
                        {modeEdition
                            ? "Modifier l'adresse"
                            : 'Ajouter une adresse'}
                    </h3>
                    <button
                        className="btn-close"
                        onClick={onFermer}
                        disabled={loading}
                        type="button"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Corps du modal */}
                <div className="modal-body">
                    {/* Message d'erreur */}
                    {erreur && (
                        <div className="alert alert-danger">
                            <i className="fas fa-exclamation-circle"></i>
                            {erreur}
                        </div>
                    )}

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit}>
                        {/* Type d'adresse */}
                        <div className="form-group">
                            <label htmlFor="type">
                                Type d'adresse{' '}
                                <span className="required">*</span>
                            </label>
                            <div className="type-selector">
                                {['domicile', 'travail', 'autre'].map(type => (
                                    <label key={type} className="type-option">
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type}
                                            checked={formData.type === type}
                                            onChange={handleChange}
                                        />
                                        <span className="type-label">
                                            <i
                                                className={`fas fa-${
                                                    type === 'domicile'
                                                        ? 'home'
                                                        : type === 'travail'
                                                          ? 'briefcase'
                                                          : 'map-marker-alt'
                                                }`}
                                            ></i>
                                            {type.charAt(0).toUpperCase() +
                                                type.slice(1)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Nom complet */}
                        <div className="form-group">
                            <label htmlFor="nomComplet">
                                Nom complet <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="nomComplet"
                                name="nomComplet"
                                value={formData.nomComplet}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Ex: nom Prénom"
                                required
                            />
                        </div>

                        {/* Téléphone */}
                        <div className="form-group">
                            <label htmlFor="telephone">
                                Téléphone <span className="required">*</span>
                            </label>
                            <input
                                type="tel"
                                id="telephone"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Ex: +221 77 123 45 67"
                                required
                            />
                        </div>

                        {/* Adresse */}
                        <div className="form-group">
                            <label htmlFor="adresse">
                                Adresse complète{' '}
                                <span className="required">*</span>
                            </label>
                            <textarea
                                id="adresse"
                                name="adresse"
                                value={formData.adresse}
                                onChange={handleChange}
                                className="form-control"
                                rows="3"
                                placeholder="Ex: 123 Rue de la République, Appartement 4B"
                                required
                            ></textarea>
                        </div>

                        {/* Ville et Code postal */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="ville">
                                    Ville <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ville"
                                    name="ville"
                                    value={formData.ville}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Ex: Dakar"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="codePostal">Code postal</label>
                                <input
                                    type="text"
                                    id="codePostal"
                                    name="codePostal"
                                    value={formData.codePostal}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Ex: 10200"
                                />
                            </div>
                        </div>

                        {/* Pays */}
                        <div className="form-group">
                            <label htmlFor="pays">
                                Pays <span className="required">*</span>
                            </label>
                            <select
                                id="pays"
                                name="pays"
                                value={formData.pays}
                                onChange={handleChange}
                                className="form-control"
                                required
                            >
                                <option value="Sénégal">Sénégal</option>
                                <option value="Gabon">Gabon</option>
                                <option value="Côte d'Ivoire">
                                    Côte d'Ivoire
                                </option>
                                <option value="Congo">Congo</option>
                                <option value="France">France</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>

                        {/* Instructions de livraison */}
                        <div className="form-group">
                            <label htmlFor="instructions">
                                Instructions de livraison (optionnel)
                            </label>
                            <textarea
                                id="instructions"
                                name="instructions"
                                value={formData.instructions}
                                onChange={handleChange}
                                className="form-control"
                                rows="2"
                                placeholder="Ex: Sonner à l'interphone, laisser au gardien..."
                            ></textarea>
                        </div>

                        {/* Définir par défaut */}
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="parDefaut"
                                    checked={formData.parDefaut}
                                    onChange={handleChange}
                                />
                                <span>Définir comme adresse par défaut</span>
                            </label>
                        </div>
                    </form>
                </div>

                {/* Pied du modal */}
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onFermer}
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-small"></span>
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i>
                                {modeEdition ? 'Modifier' : 'Ajouter'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalAjouterAdresse;
