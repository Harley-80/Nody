import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useConfirmActions } from '../../hooks/useConfirmActions';
import { useToast } from '../../contexts/ToastContext';
import './Vendeurs.scss';

const Vendeurs = () => {
    // Hooks
    const { confirmDelete, confirmAction } = useConfirmActions();
    const { addToast } = useToast();

    // États
    const [vendeurs, setVendeurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingVendeur, setEditingVendeur] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        motDePasse: '',
        genre: 'Homme',
        boutique: {
            nomBoutique: '',
            descriptionBoutique: '',
            siteWeb: '',
        },
    });
    const [submitting, setSubmitting] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limite: 10,
        total: 0,
        pages: 1,
    });

    // Chargement initial
    useEffect(() => {
        fetchVendeurs();
    }, [pagination.page]);

    // Récupération des vendeurs
    const fetchVendeurs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminService.getVendeurs({
                page: pagination.page,
                limite: pagination.limite,
            });

            const vendeursData =
                response.donnees?.utilisateurs || response.donnees || [];
            const paginationData = response.donnees?.pagination || {
                page: 1,
                limite: 10,
                total: 0,
                pages: 1,
            };

            setVendeurs(vendeursData);
            setPagination(paginationData);
        } catch (err) {
            const errorMessage =
                err.message || 'Impossible de charger les vendeurs.';
            setError(errorMessage);
            addToast({
                type: 'error',
                title: 'Erreur',
                message: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    // Gestion du modal
    const openModal = (vendeur = null) => {
        setEditingVendeur(vendeur);
        setFormData(
            vendeur
                ? {
                      nom: vendeur.nom || '',
                      prenom: vendeur.prenom || '',
                      email: vendeur.email || '',
                      telephone: vendeur.telephone || '',
                      motDePasse: '',
                      genre: vendeur.genre || 'Homme',
                      boutique: {
                          nomBoutique: vendeur.boutique?.nomBoutique || '',
                          descriptionBoutique:
                              vendeur.boutique?.descriptionBoutique || '',
                          siteWeb: vendeur.boutique?.siteWeb || '',
                      },
                  }
                : {
                      nom: '',
                      prenom: '',
                      email: '',
                      telephone: '',
                      motDePasse: '',
                      genre: 'Homme',
                      boutique: {
                          nomBoutique: '',
                          descriptionBoutique: '',
                          siteWeb: '',
                      },
                  }
        );
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingVendeur(null);
        setFormData({
            nom: '',
            prenom: '',
            email: '',
            telephone: '',
            motDePasse: '',
            genre: 'Homme',
            boutique: {
                nomBoutique: '',
                descriptionBoutique: '',
                siteWeb: '',
            },
        });
    };

    // Gestion du formulaire
    const handleInputChange = e => {
        const { name, value } = e.target;

        if (name.startsWith('boutique.')) {
            const boutiqueField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                boutique: {
                    ...prev.boutique,
                    [boutiqueField]: value,
                },
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        // Validation
        if (
            !formData.nom ||
            !formData.prenom ||
            !formData.email ||
            !formData.genre
        ) {
            addToast({
                type: 'warning',
                title: 'Champs manquants',
                message: 'Veuillez remplir tous les champs obligatoires',
            });
            return;
        }

        if (!editingVendeur && !formData.motDePasse) {
            addToast({
                type: 'warning',
                title: 'Mot de passe requis',
                message:
                    'Le mot de passe est obligatoire pour un nouveau vendeur',
            });
            return;
        }

        try {
            setSubmitting(true);

            if (editingVendeur) {
                const dataToSend = { ...formData };
                if (!dataToSend.motDePasse) delete dataToSend.motDePasse;
                await adminService.updateVendeur(
                    editingVendeur._id,
                    dataToSend
                );
                addToast({
                    type: 'success',
                    title: 'Vendeur modifié',
                    message: `${formData.prenom} ${formData.nom} a été modifié avec succès`,
                });
            } else {
                await adminService.createVendeur(formData);
                addToast({
                    type: 'success',
                    title: 'Vendeur créé',
                    message: `${formData.prenom} ${formData.nom} a été créé avec succès`,
                });
            }

            closeModal();
            fetchVendeurs();
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message:
                    err.message || 'Erreur lors de la sauvegarde du vendeur',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Actions sur les vendeurs
    const handleDelete = async (vendeurId, nom, prenom) => {
        const confirmed = await confirmDelete('vendeur', `${prenom} ${nom}`);
        if (!confirmed) return;

        try {
            await adminService.deleteVendeur(vendeurId);
            setVendeurs(vendeurs.filter(v => v._id !== vendeurId));
            addToast({
                type: 'success',
                title: 'Vendeur supprimé',
                message: `${prenom} ${nom} a été supprimé avec succès`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message:
                    err.message || 'Erreur lors de la suppression du vendeur',
            });
        }
    };

    const handleChangeStatus = async (
        vendeurId,
        nouveauStatut,
        nom,
        prenom
    ) => {
        const statutMapping = {
            verifie: {
                action: 'vérifier',
                message: 'vérifié',
                variant: 'info',
            },
            en_attente: {
                action: 'mettre en attente',
                message: 'mis en attente',
                variant: 'default',
            },
            rejete: {
                action: 'rejeter',
                message: 'rejeté',
                variant: 'warning',
            },
        };

        const config = statutMapping[nouveauStatut];
        if (!config) return;

        const confirmed = await confirmAction({
            title: `${config.action.charAt(0).toUpperCase() + config.action.slice(1)} ${prenom} ${nom} ?`,
            message: `Le vendeur sera ${config.message}.`,
            variant: config.variant,
        });

        if (!confirmed) return;

        try {
            await adminService.updateVendeurVerification(
                vendeurId,
                nouveauStatut
            );
            setVendeurs(
                vendeurs.map(v =>
                    v._id === vendeurId
                        ? { ...v, statutVerification: nouveauStatut }
                        : v
                )
            );
            addToast({
                type: nouveauStatut === 'verifie' ? 'success' : 'warning',
                title: `Vendeur ${config.message}`,
                message: `${prenom} ${nom} a été ${config.message} avec succès`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors du changement de statut',
            });
        }
    };

    const handleBlockVendeur = async (vendeurId, nom, prenom) => {
        const confirmed = await confirmAction({
            title: `Bloquer ${prenom} ${nom} ?`,
            message: 'Le vendeur ne pourra plus se connecter.',
            variant: 'warning',
        });

        if (!confirmed) return;

        try {
            await adminService.updateVendeurStatus(vendeurId, false);
            setVendeurs(
                vendeurs.map(v =>
                    v._id === vendeurId ? { ...v, estActif: false } : v
                )
            );
            addToast({
                type: 'warning',
                title: 'Vendeur bloqué',
                message: `${prenom} ${nom} a été bloqué avec succès`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors du blocage du vendeur',
            });
        }
    };

    const handleUnblockVendeur = async (vendeurId, nom, prenom) => {
        const confirmed = await confirmAction({
            title: `Débloquer ${prenom} ${nom} ?`,
            message: 'Le vendeur pourra à nouveau se connecter.',
            variant: 'info',
        });

        if (!confirmed) return;

        try {
            await adminService.updateVendeurStatus(vendeurId, true);
            setVendeurs(
                vendeurs.map(v =>
                    v._id === vendeurId ? { ...v, estActif: true } : v
                )
            );
            addToast({
                type: 'success',
                title: 'Vendeur débloqué',
                message: `${prenom} ${nom} a été débloqué avec succès`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors du déblocage du vendeur',
            });
        }
    };

    // Pagination
    const handlePageChange = newPage => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    // Fonctions utilitaires
    const formatDate = date => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getInitials = (nom, prenom) => {
        const n = nom ? nom.charAt(0).toUpperCase() : '';
        const p = prenom ? prenom.charAt(0).toUpperCase() : '';
        return n + p || '?';
    };

    const getBadgeClass = vendeur => {
        if (vendeur.estActif === false) return 'badge inactif';
        return `badge ${
            vendeur.statutVerification === 'verifie'
                ? 'actif'
                : vendeur.statutVerification === 'rejete'
                  ? 'inactif'
                  : 'en-attente'
        }`;
    };

    const getStatusText = vendeur => {
        if (vendeur.estActif === false) return 'Bloqué';
        switch (vendeur.statutVerification) {
            case 'verifie':
                return 'Vérifié';
            case 'en_attente':
                return 'En attente';
            case 'rejete':
                return 'Rejeté';
            default:
                return 'Inconnu';
        }
    };

    // Statistiques
    const stats = {
        total: vendeurs.length,
        verifies: vendeurs.filter(
            v => v.statutVerification === 'verifie' && v.estActif !== false
        ).length,
        enAttente: vendeurs.filter(v => v.statutVerification === 'en_attente')
            .length,
        bloques: vendeurs.filter(v => v.estActif === false).length,
    };

    // États de chargement
    if (loading) {
        return (
            <div className="vendeurs-container">
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Chargement des vendeurs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vendeurs-container">
                <div className="error-state">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={fetchVendeurs}>
                        <i className="fas fa-redo"></i>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="vendeurs-container">
            {/* En-tête */}
            <div className="page-header">
                <h1>
                    <i className="fas fa-store"></i>
                    Gestion des Vendeurs
                </h1>
                <button className="btn-add" onClick={() => openModal()}>
                    <i className="fas fa-plus"></i>
                    Ajouter un vendeur
                </button>
            </div>

            {/* Statistiques */}
            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.total}</h3>
                        <p>Total vendeurs</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon actifs">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.verifies}</h3>
                        <p>Vérifiés</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon en-attente">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.enAttente}</h3>
                        <p>En attente</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon inactifs">
                        <i className="fas fa-ban"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.bloques}</h3>
                        <p>Bloqués</p>
                    </div>
                </div>
            </div>

            {/* Tableau des vendeurs */}
            <div className="vendeurs-card">
                <div className="card-header">
                    <h2>
                        <i className="fas fa-list"></i>
                        Liste des vendeurs
                    </h2>
                </div>
                <div className="card-body">
                    {vendeurs.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-inbox"></i>
                            <p>Aucun vendeur trouvé</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Vendeur</th>
                                            <th>Téléphone</th>
                                            <th>Boutique</th>
                                            <th>Statut</th>
                                            <th>Date d'inscription</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendeurs.map(vendeur => (
                                            <tr key={vendeur._id}>
                                                <td>
                                                    <div className="vendeur-info">
                                                        {vendeur.avatar ? (
                                                            <img
                                                                src={
                                                                    vendeur.avatar
                                                                }
                                                                alt={
                                                                    vendeur.nom
                                                                }
                                                                className="avatar"
                                                            />
                                                        ) : (
                                                            <div className="avatar-placeholder">
                                                                {getInitials(
                                                                    vendeur.nom,
                                                                    vendeur.prenom
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="info">
                                                            <div className="name">
                                                                {vendeur.prenom}{' '}
                                                                {vendeur.nom}
                                                            </div>
                                                            <div className="email">
                                                                {vendeur.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {vendeur.telephone || 'N/A'}
                                                </td>
                                                <td>
                                                    {vendeur.boutique
                                                        ?.nomBoutique ||
                                                        'Non renseigné'}
                                                </td>
                                                <td>
                                                    <span
                                                        className={getBadgeClass(
                                                            vendeur
                                                        )}
                                                    >
                                                        {getStatusText(vendeur)}
                                                    </span>
                                                </td>
                                                <td className="date">
                                                    {formatDate(
                                                        vendeur.createdAt ||
                                                            vendeur.dateInscription
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="actions">
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() =>
                                                                openModal(
                                                                    vendeur
                                                                )
                                                            }
                                                            title="Modifier"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>

                                                        {vendeur.statutVerification ===
                                                            'en_attente' && (
                                                            <button
                                                                className="btn-success"
                                                                onClick={() =>
                                                                    handleChangeStatus(
                                                                        vendeur._id,
                                                                        'verifie',
                                                                        vendeur.nom,
                                                                        vendeur.prenom
                                                                    )
                                                                }
                                                                title="Vérifier"
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                        )}

                                                        {vendeur.statutVerification ===
                                                            'verifie' &&
                                                        vendeur.estActif !==
                                                            false ? (
                                                            <button
                                                                className="btn-warning"
                                                                onClick={() =>
                                                                    handleBlockVendeur(
                                                                        vendeur._id,
                                                                        vendeur.nom,
                                                                        vendeur.prenom
                                                                    )
                                                                }
                                                                title="Bloquer"
                                                            >
                                                                <i className="fas fa-pause"></i>
                                                            </button>
                                                        ) : (
                                                            vendeur.estActif ===
                                                                false && (
                                                                <button
                                                                    className="btn-success"
                                                                    onClick={() =>
                                                                        handleUnblockVendeur(
                                                                            vendeur._id,
                                                                            vendeur.nom,
                                                                            vendeur.prenom
                                                                        )
                                                                    }
                                                                    title="Débloquer"
                                                                >
                                                                    <i className="fas fa-play"></i>
                                                                </button>
                                                            )
                                                        )}

                                                        <button
                                                            className="btn-delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    vendeur._id,
                                                                    vendeur.nom,
                                                                    vendeur.prenom
                                                                )
                                                            }
                                                            title="Supprimer"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="pagination">
                                <button
                                    onClick={() =>
                                        handlePageChange(pagination.page - 1)
                                    }
                                    disabled={pagination.page === 1}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <span>
                                    Page {pagination.page} sur{' '}
                                    {pagination.pages}
                                </span>
                                <button
                                    onClick={() =>
                                        handlePageChange(pagination.page + 1)
                                    }
                                    disabled={
                                        pagination.page === pagination.pages
                                    }
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal Ajouter/Modifier */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>
                                <i
                                    className={`fas fa-${editingVendeur ? 'edit' : 'plus'}`}
                                ></i>
                                {editingVendeur
                                    ? 'Modifier le vendeur'
                                    : 'Ajouter un vendeur'}
                            </h2>
                            <button className="close-btn" onClick={closeModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nom *</label>
                                        <input
                                            type="text"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Entrez le nom"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Prénom *</label>
                                        <input
                                            type="text"
                                            name="prenom"
                                            value={formData.prenom}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Entrez le prénom"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Entrez l'email"
                                        disabled={!!editingVendeur}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Téléphone</label>
                                        <input
                                            type="tel"
                                            name="telephone"
                                            value={formData.telephone}
                                            onChange={handleInputChange}
                                            placeholder="Entrez le téléphone"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Genre *</label>
                                        <select
                                            name="genre"
                                            value={formData.genre}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="Homme">Homme</option>
                                            <option value="Femme">Femme</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Mot de passe {!editingVendeur && '*'}
                                        {editingVendeur && (
                                            <small>
                                                {' '}
                                                (laisser vide pour ne pas
                                                changer)
                                            </small>
                                        )}
                                    </label>
                                    <input
                                        type="password"
                                        name="motDePasse"
                                        value={formData.motDePasse}
                                        onChange={handleInputChange}
                                        required={!editingVendeur}
                                        placeholder="Entrez le mot de passe"
                                    />
                                </div>

                                <div className="form-section">
                                    <h3>Informations boutique</h3>

                                    <div className="form-group">
                                        <label>Nom de la boutique</label>
                                        <input
                                            type="text"
                                            name="boutique.nomBoutique"
                                            value={
                                                formData.boutique.nomBoutique
                                            }
                                            onChange={handleInputChange}
                                            placeholder="Nom de la boutique"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Description de la boutique
                                        </label>
                                        <textarea
                                            name="boutique.descriptionBoutique"
                                            value={
                                                formData.boutique
                                                    .descriptionBoutique
                                            }
                                            onChange={handleInputChange}
                                            placeholder="Description de la boutique"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Site web</label>
                                        <input
                                            type="url"
                                            name="boutique.siteWeb"
                                            value={formData.boutique.siteWeb}
                                            onChange={handleInputChange}
                                            placeholder="https://exemple.com"
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn-submit"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i>
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-check"></i>
                                                {editingVendeur
                                                    ? 'Modifier'
                                                    : 'Créer'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={closeModal}
                                        disabled={submitting}
                                    >
                                        <i className="fas fa-times"></i>
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendeurs;
