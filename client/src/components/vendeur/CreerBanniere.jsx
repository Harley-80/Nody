import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { creerBanniere } from '../../services/banniereService';
import axios from 'axios';
import './CreerBanniere.scss';

// Formulaire de création de bannière pour le vendeur
const CreerBanniere = () => {
    const navigate = useNavigate();

    // États
    // Crédits vendeur
    const [credits, setCredits] = useState({
        solde: 0,
        coutBanniere: 2,
        bannieresCreables: 0,
        prochainBonus: {
            montant: 1,
            ventesRestantes: 10,
        },
        loading: true,
    });

    // Formulaire
    const [formData, setFormData] = useState({
        titre: '',
        sousTitre: '',
        description: '',
        lien: '',
        texteBouton: 'Découvrir',
        position: 'haut',
        ordre: 0,
        dateDebut: '',
        dateFin: '',
    });

    // Image
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // États de l'UI
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Chargement des crédits
    useEffect(() => {
        chargerCredits();
    }, []);

    const chargerCredits = async () => {
        try {
            const response = await axios.get('/api/vendeur/credits/solde');
            if (response.data.succes) {
                setCredits({
                    ...response.data.donnees,
                    loading: false,
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des crédits:', error);
            setCredits(prev => ({ ...prev, loading: false }));
        }
    };

    // Gestion du formulaire
    const handleChange = useCallback(
        e => {
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));

            // Effacer l'erreur du champ modifié
            if (errors[name]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: '',
                }));
            }
        },
        [errors]
    );

    // Gestion de l'image
    const handleImageChange = useCallback(file => {
        if (!file) return;

        // Validation du type
        const validTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
        ];
        if (!validTypes.includes(file.type)) {
            setErrors(prev => ({
                ...prev,
                image: 'Seuls les fichiers JPEG, PNG, WEBP et GIF sont acceptés',
            }));
            return;
        }

        // Validation de la taille (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setErrors(prev => ({
                ...prev,
                image: 'La taille du fichier ne doit pas dépasser 5MB',
            }));
            return;
        }

        setImageFile(file);
        setErrors(prev => ({ ...prev, image: '' }));

        // Créer la preview
        const reader = new FileReader();
        reader.onload = e => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleFileInput = e => {
        const file = e.target.files[0];
        handleImageChange(file);
    };

    // Glisser et déposer
    const handleDragEnter = e => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = e => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = e => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = e => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        handleImageChange(file);
    };

    const supprimerImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    // Validation
    const validerFormulaire = () => {
        const newErrors = {};

        // Titre requis
        if (!formData.titre.trim()) {
            newErrors.titre = 'Le titre est requis';
        } else if (formData.titre.length > 100) {
            newErrors.titre = 'Le titre ne peut pas dépasser 100 caractères';
        }

        // Sous-titre
        if (formData.sousTitre && formData.sousTitre.length > 150) {
            newErrors.sousTitre =
                'Le sous-titre ne peut pas dépasser 150 caractères';
        }

        // Description
        if (formData.description && formData.description.length > 500) {
            newErrors.description =
                'La description ne peut pas dépasser 500 caractères';
        }

        // Lien (URL valide)
        if (formData.lien) {
            try {
                new URL(formData.lien);
            } catch {
                // Vérifier si c'est un chemin relatif valide
                if (!formData.lien.startsWith('/')) {
                    newErrors.lien =
                        'Le lien doit être une URL valide (ex: https://... ou /boutique)';
                }
            }
        }

        // Image requise
        if (!imageFile && !imagePreview) {
            newErrors.image = 'Une image est requise';
        }

        // Dates
        if (formData.dateDebut && formData.dateFin) {
            const debut = new Date(formData.dateDebut);
            const fin = new Date(formData.dateFin);
            if (fin <= debut) {
                newErrors.dateFin =
                    'La date de fin doit être après la date de début';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Soumission
    const handleSubmit = async e => {
        e.preventDefault();

        // Validation
        if (!validerFormulaire()) {
            return;
        }

        // Vérifier les crédits
        if (credits.solde < credits.coutBanniere) {
            alert(
                `Crédits insuffisants. Vous avez ${credits.solde} point(s), ${credits.coutBanniere} requis.`
            );
            return;
        }

        try {
            setIsSubmitting(true);

            // Créer FormData
            const formDataToSend = new FormData();
            formDataToSend.append('titre', formData.titre);
            formDataToSend.append('sousTitre', formData.sousTitre);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('lien', formData.lien);
            formDataToSend.append('texteBouton', formData.texteBouton);
            formDataToSend.append('type', 'pub'); // Vendeur = pub uniquement
            formDataToSend.append('position', formData.position);
            formDataToSend.append('ordre', formData.ordre);

            if (formData.dateDebut) {
                formDataToSend.append('dateDebut', formData.dateDebut);
            }
            if (formData.dateFin) {
                formDataToSend.append('dateFin', formData.dateFin);
            }

            formDataToSend.append('image', imageFile);

            // Envoyer
            const response = await creerBanniere(formDataToSend);
            if (response.succes) {
                alert(
                    `Bannière créée avec succès ! Elle sera visible après validation par un modérateur.\n\nCrédits restants : ${credits.solde - credits.coutBanniere} points`
                );
                navigate('/vendeur/mes-bannieres');
            }
        } catch (error) {
            console.error('Erreur lors de la création:', error);

            let errorMessage = 'Erreur lors de la création de la bannière';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(`${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Compteurs de caractères
    const compteurTitre = useMemo(() => {
        return `${formData.titre.length}/100`;
    }, [formData.titre]);

    const compteurSousTitre = useMemo(() => {
        return `${formData.sousTitre.length}/150`;
    }, [formData.sousTitre]);

    const compteurDescription = useMemo(() => {
        return `${formData.description.length}/500`;
    }, [formData.description]);

    // Vérifications des crédits
    const peutCreer = useMemo(() => {
        return credits.solde >= credits.coutBanniere;
    }, [credits.solde, credits.coutBanniere]);

    // Le rendu
    return (
        <div className="creer-banniere">
            {/* L'en-tête */}
            <div className="page-header">
                <div className="header-left">
                    <button
                        className="btn-back"
                        onClick={() => navigate('/vendeur/mes-bannieres')}
                        title="Retour à mes bannières"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 className="page-title">
                            <i className="fas fa-plus-circle"></i>
                            Créer une bannière publicitaire
                        </h1>
                        <p className="page-subtitle">
                            Créez une bannière pour promouvoir vos produits
                        </p>
                    </div>
                </div>
            </div>

            {/* Carte de crédits  */}
            <div className="credits-card">
                <div className="credits-header">
                    <div className="credits-icon">
                        <i className="fas fa-coins"></i>
                    </div>
                    <div className="credits-info">
                        <h3 className="credits-label">Vos crédits</h3>
                        <div className="credits-details">
                            <span className="credits-solde">
                                {credits.solde} points
                            </span>
                            <span className="credits-separator">•</span>
                            <span className="credits-creables">
                                {credits.bannieresCreables} bannière
                                {credits.bannieresCreables > 1 ? 's' : ''}{' '}
                                possible
                                {credits.bannieresCreables > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="credits-cost">
                    <div className="cost-label">Coût de création :</div>
                    <div className="cost-value">
                        -{credits.coutBanniere} points
                    </div>
                </div>

                {!peutCreer && (
                    <div className="credits-warning">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>
                            Il vous manque{' '}
                            {credits.coutBanniere - credits.solde} point(s) pour
                            créer une bannière. Gagnez +1 point tous les{' '}
                            {credits.prochainBonus?.montant || 10} ventes
                            validées !
                        </span>
                    </div>
                )}

                <div className="credits-bonus">
                    <i className="fas fa-gift"></i>
                    <span>
                        Prochaine récompense : +
                        {credits.prochainBonus?.montant || 1} point dans{' '}
                        {credits.prochainBonus?.ventesRestantes || 10} vente(s)
                    </span>
                </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="banniere-form">
                <div className="form-grid">
                    {/* Colonne de Gauche : Formulaire */}
                    <div className="form-column">
                        <div className="form-section">
                            <h2 className="section-title">
                                <i className="fas fa-info-circle"></i>
                                Informations principales
                            </h2>

                            {/* Titre */}
                            <div className="form-group">
                                <label
                                    htmlFor="titre"
                                    className="form-label required"
                                >
                                    Titre de la bannière
                                </label>
                                <input
                                    type="text"
                                    id="titre"
                                    name="titre"
                                    className={`form-control ${errors.titre ? 'is-invalid' : ''}`}
                                    placeholder="Ex: Promotion exclusive -50%"
                                    value={formData.titre}
                                    onChange={handleChange}
                                    maxLength={100}
                                />
                                <div className="form-help">
                                    <span className="char-count">
                                        {compteurTitre}
                                    </span>
                                    {errors.titre && (
                                        <span className="error-message">
                                            {errors.titre}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Sous-titre */}
                            <div className="form-group">
                                <label
                                    htmlFor="sousTitre"
                                    className="form-label"
                                >
                                    Sous-titre (optionnel)
                                </label>
                                <input
                                    type="text"
                                    id="sousTitre"
                                    name="sousTitre"
                                    className={`form-control ${errors.sousTitre ? 'is-invalid' : ''}`}
                                    placeholder="Ex: Sur une sélection de produits"
                                    value={formData.sousTitre}
                                    onChange={handleChange}
                                    maxLength={150}
                                />
                                <div className="form-help">
                                    <span className="char-count">
                                        {compteurSousTitre}
                                    </span>
                                    {errors.sousTitre && (
                                        <span className="error-message">
                                            {errors.sousTitre}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label
                                    htmlFor="description"
                                    className="form-label"
                                >
                                    Description (optionnel)
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                    placeholder="Décrivez votre offre en quelques mots..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    maxLength={500}
                                />
                                <div className="form-help">
                                    <span className="char-count">
                                        {compteurDescription}
                                    </span>
                                    {errors.description && (
                                        <span className="error-message">
                                            {errors.description}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h2 className="section-title">
                                <i className="fas fa-link"></i>
                                Lien et bouton
                            </h2>

                            {/* Lien */}
                            <div className="form-group">
                                <label htmlFor="lien" className="form-label">
                                    Lien de destination
                                </label>
                                <input
                                    type="text"
                                    id="lien"
                                    name="lien"
                                    className={`form-control ${errors.lien ? 'is-invalid' : ''}`}
                                    placeholder="Ex: /boutique ou https://..."
                                    value={formData.lien}
                                    onChange={handleChange}
                                />
                                {errors.lien && (
                                    <span className="error-message">
                                        {errors.lien}
                                    </span>
                                )}
                            </div>

                            {/* Texte bouton */}
                            <div className="form-group">
                                <label
                                    htmlFor="texteBouton"
                                    className="form-label"
                                >
                                    Texte du bouton
                                </label>
                                <input
                                    type="text"
                                    id="texteBouton"
                                    name="texteBouton"
                                    className="form-control"
                                    placeholder="Ex: Découvrir, Acheter maintenant"
                                    value={formData.texteBouton}
                                    onChange={handleChange}
                                    maxLength={30}
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h2 className="section-title">
                                <i className="fas fa-cog"></i>
                                Configuration
                            </h2>

                            <div className="form-row">
                                {/* Position */}
                                <div className="form-group">
                                    <label
                                        htmlFor="position"
                                        className="form-label"
                                    >
                                        Position
                                    </label>
                                    <select
                                        id="position"
                                        name="position"
                                        className="form-control"
                                        value={formData.position}
                                        onChange={handleChange}
                                    >
                                        <option value="haut">
                                            Haut de page
                                        </option>
                                        <option value="milieu">
                                            Milieu de page
                                        </option>
                                        <option value="bas">Bas de page</option>
                                    </select>
                                </div>

                                {/* Ordre */}
                                <div className="form-group">
                                    <label
                                        htmlFor="ordre"
                                        className="form-label"
                                    >
                                        Priorité
                                    </label>
                                    <input
                                        type="number"
                                        id="ordre"
                                        name="ordre"
                                        className="form-control"
                                        value={formData.ordre}
                                        onChange={handleChange}
                                        min={0}
                                        max={100}
                                    />
                                    <small className="form-text">
                                        Plus le chiffre est élevé, plus la
                                        priorité est haute
                                    </small>
                                </div>
                            </div>

                            <div className="form-row">
                                {/* Date début */}
                                <div className="form-group">
                                    <label
                                        htmlFor="dateDebut"
                                        className="form-label"
                                    >
                                        Date de début (optionnel)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="dateDebut"
                                        name="dateDebut"
                                        className="form-control"
                                        value={formData.dateDebut}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Date fin */}
                                <div className="form-group">
                                    <label
                                        htmlFor="dateFin"
                                        className="form-label"
                                    >
                                        Date de fin (optionnel)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="dateFin"
                                        name="dateFin"
                                        className={`form-control ${errors.dateFin ? 'is-invalid' : ''}`}
                                        value={formData.dateFin}
                                        onChange={handleChange}
                                    />
                                    {errors.dateFin && (
                                        <span className="error-message">
                                            {errors.dateFin}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colonne de Droite : Image et Preview */}
                    <div className="preview-column">
                        {/* Upload Image */}
                        <div className="form-section">
                            <h2 className="section-title required">
                                <i className="fas fa-image"></i>
                                Image de la bannière
                            </h2>

                            {!imagePreview ? (
                                <div
                                    className={`upload-zone ${isDragging ? 'dragging' : ''} ${errors.image ? 'has-error' : ''}`}
                                    onDragEnter={handleDragEnter}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        id="imageInput"
                                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                        onChange={handleFileInput}
                                        className="file-input"
                                    />
                                    <label
                                        htmlFor="imageInput"
                                        className="upload-label"
                                    >
                                        <i className="fas fa-cloud-upload-alt"></i>
                                        <span className="upload-text">
                                            Glissez une image ici
                                            <br />
                                            ou cliquez pour parcourir
                                        </span>
                                        <span className="upload-hint">
                                            JPEG, PNG, WEBP, GIF • Max 5MB
                                        </span>
                                    </label>
                                </div>
                            ) : (
                                <div className="image-preview-container">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="image-preview"
                                    />
                                    <button
                                        type="button"
                                        className="btn-remove-image"
                                        onClick={supprimerImage}
                                        title="Supprimer l'image"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            )}

                            {errors.image && (
                                <div className="error-message mt-2">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {errors.image}
                                </div>
                            )}
                        </div>

                        {/* Preview Bannière */}
                        {imagePreview && formData.titre && (
                            <div className="form-section">
                                <h2 className="section-title">
                                    <i className="fas fa-eye"></i>
                                    Aperçu
                                </h2>
                                <div className="banniere-preview">
                                    <div className="preview-container">
                                        <img
                                            src={imagePreview}
                                            alt="Preview bannière"
                                            className="preview-image"
                                        />
                                        <div className="preview-overlay">
                                            <h3 className="preview-title">
                                                {formData.titre}
                                            </h3>
                                            {formData.sousTitre && (
                                                <p className="preview-subtitle">
                                                    {formData.sousTitre}
                                                </p>
                                            )}
                                            {formData.texteBouton && (
                                                <button className="preview-button">
                                                    {formData.texteBouton}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Boutons d'action  */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/vendeur/mes-bannieres')}
                        disabled={isSubmitting}
                    >
                        <i className="fas fa-times"></i>
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting || !peutCreer}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Création en cours...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check"></i>
                                Créer la bannière ({credits.coutBanniere}{' '}
                                points)
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreerBanniere;