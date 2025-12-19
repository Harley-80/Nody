import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useConfirmActions } from '../../hooks/useConfirmActions';
import { useToast } from '../../contexts/ToastContext';
import './Moderateurs.scss';

const Moderateurs = () => {
    // Hooks
    const { confirmDelete, confirmAction } = useConfirmActions();
    const { addToast } = useToast();

    // États
    const [moderateurs, setModerateurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingModerateur, setEditingModerateur] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        motDePasse: '',
        photo: '',
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
        fetchModerateurs();
    }, [pagination.page]);

    // Récupération des modérateurs
    const fetchModerateurs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminService.getModerateurs({
                page: pagination.page,
                limite: pagination.limite,
            });

            const moderateursData =
                response.donnees?.moderateurs || response.donnees || [];
            const paginationData = response.donnees?.pagination || {
                page: 1,
                limite: 10,
                total: 0,
                pages: 1,
            };

            setModerateurs(moderateursData);
            setPagination(paginationData);
        } catch (err) {
            const errorMessage =
                err.message || 'Impossible de charger les modérateurs.';
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
    const openModal = (moderateur = null) => {
        setEditingModerateur(moderateur);
        setFormData(
            moderateur
                ? {
                      nom: moderateur.nom || '',
                      prenom: moderateur.prenom || '',
                      email: moderateur.email || '',
                      telephone: moderateur.telephone || '',
                      motDePasse: '',
                      photo: moderateur.photo || '',
                  }
                : {
                      nom: '',
                      prenom: '',
                      email: '',
                      telephone: '',
                      motDePasse: '',
                      photo: '',
                  }
        );
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingModerateur(null);
        setFormData({
            nom: '',
            prenom: '',
            email: '',
            telephone: '',
            motDePasse: '',
            photo: '',
        });
    };

    // Gestion du formulaire
    const handleInputChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();

        // Validation
        if (!formData.nom || !formData.prenom || !formData.email) {
            addToast({
                type: 'warning',
                title: 'Champs manquants',
                message: 'Veuillez remplir tous les champs obligatoires',
            });
            return;
        }

        if (!editingModerateur && !formData.motDePasse) {
            addToast({
                type: 'warning',
                title: 'Mot de passe requis',
                message:
                    'Le mot de passe est obligatoire pour un nouveau modérateur',
            });
            return;
        }

        try {
            setSubmitting(true);

            const dataToSend = { ...formData };
            if (editingModerateur && !dataToSend.motDePasse)
                delete dataToSend.motDePasse;

            if (editingModerateur) {
                await adminService.updateModerateur(
                    editingModerateur._id,
                    dataToSend
                );
                addToast({
                    type: 'success',
                    title: 'Modérateur modifié',
                    message: `${formData.prenom} ${formData.nom} a été modifié avec succès`,
                });
            } else {
                await adminService.createModerateur(dataToSend);
                addToast({
                    type: 'success',
                    title: 'Modérateur créé',
                    message: `${formData.prenom} ${formData.nom} a été créé avec succès`,
                });
            }

            closeModal();
            fetchModerateurs();
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message:
                    err.message || 'Erreur lors de la sauvegarde du modérateur',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Actions sur les modérateurs
    const handleDelete = async (moderateurId, nom, prenom) => {
        const confirmed = await confirmDelete('modérateur', `${prenom} ${nom}`);
        if (!confirmed) return;

        try {
            await adminService.deleteModerateur(moderateurId);
            setModerateurs(moderateurs.filter(m => m._id !== moderateurId));
            addToast({
                type: 'success',
                title: 'Modérateur supprimé',
                message: `${prenom} ${nom} a été supprimé avec succès`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message:
                    err.message ||
                    'Erreur lors de la suppression du modérateur',
            });
        }
    };

    const handleBlockModerateur = async (moderateurId, nom, prenom) => {
        const confirmed = await confirmAction({
            title: `Bloquer ${prenom} ${nom} ?`,
            message: 'Le modérateur ne pourra plus se connecter.',
            variant: 'warning',
        });

        if (!confirmed) return;

        try {
            await adminService.updateModerateurStatus(moderateurId, false);
            setModerateurs(
                moderateurs.map(m =>
                    m._id === moderateurId ? { ...m, estActif: false } : m
                )
            );
            addToast({
                type: 'warning',
                title: 'Modérateur bloqué',
                message: `${prenom} ${nom} a été bloqué avec succès`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors du blocage du modérateur',
            });
        }
    };

    const handleUnblockModerateur = async (moderateurId, nom, prenom) => {
        const confirmed = await confirmAction({
            title: `Débloquer ${prenom} ${nom} ?`,
            message: 'Le modérateur pourra à nouveau se connecter.',
            variant: 'info',
        });

        if (!confirmed) return;

        try {
            await adminService.updateModerateurStatus(moderateurId, true);
            setModerateurs(
                moderateurs.map(m =>
                    m._id === moderateurId ? { ...m, estActif: true } : m
                )
            );
            addToast({
                type: 'success',
                title: 'Modérateur débloqué',
                message: `${prenom} ${nom} a été débloqué avec succès`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message:
                    err.message || 'Erreur lors du déblocage du modérateur',
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

    const getBadgeClass = moderateur => {
        if (moderateur.estActif === false) return 'badge inactif';
        return `badge ${moderateur.estActif ? 'actif' : 'inactif'}`;
    };

    const getStatusText = moderateur => {
        if (moderateur.estActif === false) return 'Bloqué';
        return moderateur.estActif ? 'Actif' : 'Inactif';
    };

    // Statistiques
    const stats = {
        total: moderateurs.length,
        actifs: moderateurs.filter(m => m.estActif === true).length,
        inactifs: moderateurs.filter(m => m.estActif === false).length,
    };

    // États de chargement
    if (loading) {
        return (
            <div className="moderateurs-container">
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Chargement des modérateurs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="moderateurs-container">
                <div className="error-state">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={fetchModerateurs}>
                        <i className="fas fa-redo"></i>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="moderateurs-container">
            {/* En-tête */}
            <div className="page-header">
                <h1>
                    <i className="fas fa-user-shield"></i>
                    Gestion des Modérateurs
                </h1>
                <button className="btn-add" onClick={() => openModal()}>
                    <i className="fas fa-plus"></i>
                    Ajouter un modérateur
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
                        <p>Total modérateurs</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon actifs">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.actifs}</h3>
                        <p>Actifs</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon inactifs">
                        <i className="fas fa-ban"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.inactifs}</h3>
                        <p>Bloqués</p>
                    </div>
                </div>
            </div>

            {/* Tableau des modérateurs */}
            <div className="moderateurs-card">
                <div className="card-header">
                    <h2>
                        <i className="fas fa-list"></i>
                        Liste des modérateurs
                    </h2>
                </div>
                <div className="card-body">
                    {moderateurs.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-inbox"></i>
                            <p>Aucun modérateur trouvé</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Modérateur</th>
                                            <th>Téléphone</th>
                                            <th>Statut</th>
                                            <th>Date d'inscription</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {moderateurs.map(moderateur => (
                                            <tr key={moderateur._id}>
                                                <td>
                                                    <div className="moderateur-info">
                                                        {moderateur.photo ||
                                                        moderateur.avatar ? (
                                                            <img
                                                                src={
                                                                    moderateur.photo ||
                                                                    moderateur.avatar
                                                                }
                                                                alt={
                                                                    moderateur.nom
                                                                }
                                                                className="avatar"
                                                            />
                                                        ) : (
                                                            <div className="avatar-placeholder">
                                                                {getInitials(
                                                                    moderateur.nom,
                                                                    moderateur.prenom
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="info">
                                                            <div className="name">
                                                                {
                                                                    moderateur.prenom
                                                                }{' '}
                                                                {moderateur.nom}
                                                            </div>
                                                            <div className="email">
                                                                {
                                                                    moderateur.email
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {moderateur.telephone ||
                                                        'N/A'}
                                                </td>
                                                <td>
                                                    <span
                                                        className={getBadgeClass(
                                                            moderateur
                                                        )}
                                                    >
                                                        {getStatusText(
                                                            moderateur
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="date">
                                                    {formatDate(
                                                        moderateur.createdAt ||
                                                            moderateur.dateInscription
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="actions">
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() =>
                                                                openModal(
                                                                    moderateur
                                                                )
                                                            }
                                                            title="Modifier"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>

                                                        {moderateur.estActif ===
                                                        true ? (
                                                            <button
                                                                className="btn-warning"
                                                                onClick={() =>
                                                                    handleBlockModerateur(
                                                                        moderateur._id,
                                                                        moderateur.nom,
                                                                        moderateur.prenom
                                                                    )
                                                                }
                                                                title="Bloquer"
                                                            >
                                                                <i className="fas fa-pause"></i>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn-success"
                                                                onClick={() =>
                                                                    handleUnblockModerateur(
                                                                        moderateur._id,
                                                                        moderateur.nom,
                                                                        moderateur.prenom
                                                                    )
                                                                }
                                                                title="Débloquer"
                                                            >
                                                                <i className="fas fa-play"></i>
                                                            </button>
                                                        )}

                                                        <button
                                                            className="btn-delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    moderateur._id,
                                                                    moderateur.nom,
                                                                    moderateur.prenom
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
                                    className={`fas fa-${editingModerateur ? 'edit' : 'plus'}`}
                                ></i>
                                {editingModerateur
                                    ? 'Modifier le modérateur'
                                    : 'Ajouter un modérateur'}
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
                                        disabled={!!editingModerateur}
                                    />
                                </div>

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
                                    <label>
                                        Mot de passe {!editingModerateur && '*'}
                                        {editingModerateur && (
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
                                        required={!editingModerateur}
                                        placeholder="Entrez le mot de passe"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Photo (URL)</label>
                                    <input
                                        type="url"
                                        name="photo"
                                        value={formData.photo}
                                        onChange={handleInputChange}
                                        placeholder="https://exemple.com/photo.jpg"
                                    />
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
                                                {editingModerateur
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

export default Moderateurs;
