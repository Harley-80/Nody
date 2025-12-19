import React, { useState } from 'react';
import profilService from '../../services/profilService';
import UploadAvatar from './UploadAvatar';
import './OngletInformations.scss';

const OngletInformations = ({ utilisateur, onUpdate }) => {
    // États pour le formulaire
    const [formData, setFormData] = useState({
        nom: utilisateur?.nom || '',
        prenom: utilisateur?.prenom || '',
        email: utilisateur?.email || '',
        telephone: utilisateur?.telephone || '',
        genre: utilisateur?.genre || 'Homme',
        dateNaissance: utilisateur?.dateNaissance
            ? new Date(utilisateur.dateNaissance).toISOString().split('T')[0]
            : '',
    });

    // États pour le mode édition
    const [modeEdition, setModeEdition] = useState(false);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [succes, setSucces] = useState(false);

    // Gérer les changements dans les champs du formulaire
    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Annuler les modifications
    const handleAnnuler = () => {
        // Réinitialiser le formulaire avec les données originales
        setFormData({
            nom: utilisateur?.nom || '',
            prenom: utilisateur?.prenom || '',
            email: utilisateur?.email || '',
            telephone: utilisateur?.telephone || '',
            genre: utilisateur?.genre || 'Homme',
            dateNaissance: utilisateur?.dateNaissance
                ? new Date(utilisateur.dateNaissance)
                      .toISOString()
                      .split('T')[0]
                : '',
        });
        setModeEdition(false);
        setErreur(null);
        setSucces(false);
    };

    // Soumettre les modifications
    const handleSubmit = async e => {
        e.preventDefault();

        try {
            setLoading(true);
            setErreur(null);
            setSucces(false);

            // Validation des champs
            if (!formData.nom || !formData.prenom || !formData.email) {
                setErreur('Le nom, prénom et email sont obligatoires');
                return;
            }

            // Validation de l'email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setErreur("Format d'email invalide");
                return;
            }

            // Appel API pour mettre à jour le profil
            const response = await profilService.mettreAJourInfos(formData);

            if (response.succes || response._id) {
                setSucces(true);
                setModeEdition(false);

                // Mettre à jour les données dans le composant parent
                onUpdate(response);

                // Afficher le message de succès pendant 3 secondes
                setTimeout(() => setSucces(false), 3000);
            }
        } catch (err) {
            console.error('Erreur modification profil:', err);
            setErreur(
                err.response?.data?.erreur ||
                    'Erreur lors de la modification du profil'
            );
        } finally {
            setLoading(false);
        }
    };

    // Callback pour la mise à jour de l'avatar
    const handleAvatarChange = nouvelAvatar => {
        // Mettre à jour l'utilisateur avec le nouvel avatar
        const utilisateurMisAJour = {
            ...utilisateur,
            avatar: nouvelAvatar,
        };
        onUpdate(utilisateurMisAJour);
    };

    return (
        <div className="onglet-informations">
            {/* Section Avatar */}
            <div className="section-avatar">
                <UploadAvatar
                    avatarActuel={utilisateur?.avatar}
                    onAvatarChange={handleAvatarChange}
                />
            </div>

            {/* Section Informations */}
            <div className="section-informations">
                <div className="section-header">
                    <h3>
                        <i className="fas fa-user"></i>
                        Informations personnelles
                    </h3>
                    {!modeEdition && (
                        <button
                            className="btn-modifier"
                            onClick={() => setModeEdition(true)}
                        >
                            <i className="fas fa-edit"></i>
                            Modifier
                        </button>
                    )}
                </div>

                {/* Messages de succès et d'erreur */}
                {succes && (
                    <div className="alert alert-success">
                        <i className="fas fa-check-circle"></i>
                        Profil mis à jour avec succès !
                    </div>
                )}

                {erreur && (
                    <div className="alert alert-danger">
                        <i className="fas fa-exclamation-circle"></i>
                        {erreur}
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit}>
                    <div className="info-grid">
                        {/* Nom */}
                        <div className="form-group">
                            <label htmlFor="nom">
                                Nom <span className="required">*</span>
                            </label>
                            {modeEdition ? (
                                <input
                                    type="text"
                                    id="nom"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    className="form-control"
                                    required
                                />
                            ) : (
                                <p className="info-value">
                                    {utilisateur?.nom || 'Non renseigné'}
                                </p>
                            )}
                        </div>

                        {/* Prénom */}
                        <div className="form-group">
                            <label htmlFor="prenom">
                                Prénom <span className="required">*</span>
                            </label>
                            {modeEdition ? (
                                <input
                                    type="text"
                                    id="prenom"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    className="form-control"
                                    required
                                />
                            ) : (
                                <p className="info-value">
                                    {utilisateur?.prenom || 'Non renseigné'}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label htmlFor="email">
                                Email <span className="required">*</span>
                            </label>
                            {modeEdition ? (
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-control"
                                    required
                                />
                            ) : (
                                <p className="info-value">
                                    {utilisateur?.email || 'Non renseigné'}
                                </p>
                            )}
                        </div>

                        {/* Téléphone */}
                        <div className="form-group">
                            <label htmlFor="telephone">Téléphone</label>
                            {modeEdition ? (
                                <input
                                    type="tel"
                                    id="telephone"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="+221 XX XXX XX XX"
                                />
                            ) : (
                                <p className="info-value">
                                    {utilisateur?.telephone || 'Non renseigné'}
                                </p>
                            )}
                        </div>

                        {/* Genre */}
                        <div className="form-group">
                            <label htmlFor="genre">Genre</label>
                            {modeEdition ? (
                                <select
                                    id="genre"
                                    name="genre"
                                    value={formData.genre}
                                    onChange={handleChange}
                                    className="form-control"
                                >
                                    <option value="Homme">Homme</option>
                                    <option value="Femme">Femme</option>
                                </select>
                            ) : (
                                <p className="info-value">
                                    {utilisateur?.genre || 'Non renseigné'}
                                </p>
                            )}
                        </div>

                        {/* Date de naissance */}
                        <div className="form-group">
                            <label htmlFor="dateNaissance">
                                Date de naissance
                            </label>
                            {modeEdition ? (
                                <input
                                    type="date"
                                    id="dateNaissance"
                                    name="dateNaissance"
                                    value={formData.dateNaissance}
                                    onChange={handleChange}
                                    className="form-control"
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            ) : (
                                <p className="info-value">
                                    {utilisateur?.dateNaissance
                                        ? new Date(
                                              utilisateur.dateNaissance
                                          ).toLocaleDateString('fr-FR')
                                        : 'Non renseigné'}
                                </p>
                            )}
                        </div>

                        {/* Rôle (lecture seule) */}
                        <div className="form-group">
                            <label>Rôle</label>
                            <p className="info-value">
                                <span
                                    className={`badge badge-${utilisateur?.role === 'admin' ? 'danger' : 'primary'}`}
                                >
                                    {utilisateur?.role || 'Client'}
                                </span>
                            </p>
                        </div>

                        {/* Statut de vérification (lecture seule) */}
                        <div className="form-group">
                            <label>Statut de vérification</label>
                            <p className="info-value">
                                <span
                                    className={`badge badge-${
                                        utilisateur?.statutVerification ===
                                        'verifie'
                                            ? 'success'
                                            : 'warning'
                                    }`}
                                >
                                    {utilisateur?.statutVerification ===
                                    'verifie'
                                        ? 'Vérifié'
                                        : 'En attente'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Boutons d'action en mode édition */}
                    {modeEdition && (
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleAnnuler}
                                disabled={loading}
                            >
                                <i className="fas fa-times"></i>
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
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
                                        Enregistrer
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default OngletInformations;
