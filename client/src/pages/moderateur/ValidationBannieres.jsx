import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    obtenirToutesBannieres,
    approuverBanniere,
    rejeterBanniere,
} from '../../services/banniereService';
import './ValidationBannieres.scss';

/**
 * Page de validation des bannières pour les modérateurs
 * Affiche les bannières en attente d'approbation avec actions d'approbation/rejet
 */
const ValidationBannieres = () => {
    const navigate = useNavigate();

    // États
    const [bannieres, setBannieres] = useState([]);
    const [filtres, setFiltres] = useState({
        page: 1,
        limite: 10,
        statut: 'en_attente', // Par défaut : seulement les en attente
        type: '',
        search: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [actionEnCours, setActionEnCours] = useState(null);
    const [rejetModal, setRejetModal] = useState({
        ouvert: false,
        banniereId: null,
        raison: '',
        conseils: '',
    });

    // Chargement des bannières
    useEffect(() => {
        chargerBannieres();
    }, [filtres]);

    const chargerBannieres = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await obtenirToutesBannieres(filtres);
            if (response.succes) {
                setBannieres(response.donnees);
                setPagination({
                    page: response.page,
                    totalPages: response.totalPages,
                    total: response.total,
                });
            }
        } catch (error) {
            console.error('Erreur chargement bannières:', error);
            alert('Erreur lors du chargement des bannières');
        } finally {
            setIsLoading(false);
        }
    }, [filtres]);

    // Gestion des filtres
    const handleFiltreChange = (key, value) => {
        setFiltres(prev => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : value,
        }));
    };

    // Pagination
    const handlePageChange = newPage => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            handleFiltreChange('page', newPage);
        }
    };

    // Approuver une bannière
    const handleApprouver = async id => {
        if (
            !window.confirm(
                'Approuver cette bannière ? Elle sera visible immédiatement.'
            )
        ) {
            return;
        }

        try {
            setActionEnCours(id);
            await approuverBanniere(id);
            alert('Bannière approuvée avec succès');
            chargerBannieres();
        } catch (error) {
            console.error('Erreur approbation:', error);
            alert(`Erreur : ${error.message || "Impossible d'approuver"}`);
        } finally {
            setActionEnCours(null);
        }
    };

    // Ouvrir modale de rejet
    const ouvrirRejetModal = id => {
        setRejetModal({
            ouvert: true,
            banniereId: id,
            raison: '',
            conseils: '',
        });
    };

    // Fermer modale de rejet
    const fermerRejetModal = () => {
        setRejetModal({
            ouvert: false,
            banniereId: null,
            raison: '',
            conseils: '',
        });
    };

    // Rejeter une bannière
    const handleRejeter = async () => {
        if (!rejetModal.raison.trim()) {
            alert('Veuillez indiquer une raison de rejet');
            return;
        }

        try {
            setActionEnCours(rejetModal.banniereId);
            const messageRejet = rejetModal.conseils
                ? `${rejetModal.raison}\n\n Conseils : ${rejetModal.conseils}`
                : rejetModal.raison;

            await rejeterBanniere(rejetModal.banniereId, messageRejet);
            alert('Bannière rejetée avec succès');
            chargerBannieres();
            fermerRejetModal();
        } catch (error) {
            console.error('Erreur rejet:', error);
            alert(`Erreur : ${error.message || 'Impossible de rejeter'}`);
        } finally {
            setActionEnCours(null);
        }
    };

    // Badge de statut
    const renderStatutBadge = statut => {
        const badges = {
            en_attente: <span className="badge badge-warning">En attente</span>,
            approuve: <span className="badge badge-success">Approuvée</span>,
            rejete: <span className="badge badge-danger">Rejetée</span>,
            expire: <span className="badge badge-secondary">Expirée</span>,
        };
        return badges[statut] || <span className="badge">{statut}</span>;
    };

    // Calcul jours restants
    const calculerJoursRestants = dateExpiration => {
        if (!dateExpiration) return null;
        const diff = new Date(dateExpiration) - new Date();
        const jours = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return jours > 0 ? jours : 0;
    };

    // Rendu
    return (
        <div className="validation-bannieres">
            {/* En-tête */}
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <i className="fas fa-clipboard-check"></i>
                        Validation des Bannières
                    </h1>
                    <p className="page-subtitle">
                        Approuvez ou rejetez les bannières soumises par les
                        vendeurs
                    </p>
                </div>
                <div className="header-stats">
                    <span className="stat-item">
                        <i className="fas fa-clock"></i>
                        {pagination.total} en attente
                    </span>
                </div>
            </div>

            {/* Filtres */}
            <div className="filtres-section">
                <div className="filtres-row">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher par titre..."
                        value={filtres.search}
                        onChange={e =>
                            handleFiltreChange('search', e.target.value)
                        }
                    />
                    <select
                        className="form-select"
                        value={filtres.type}
                        onChange={e =>
                            handleFiltreChange('type', e.target.value)
                        }
                    >
                        <option value="">Tous les types</option>
                        <option value="hero">Hero</option>
                        <option value="promo">Promo</option>
                        <option value="pub">Publicité</option>
                    </select>
                    <select
                        className="form-select"
                        value={filtres.statut}
                        onChange={e =>
                            handleFiltreChange('statut', e.target.value)
                        }
                    >
                        <option value="en_attente">En attente</option>
                        <option value="approuve">Approuvées</option>
                        <option value="rejete">Rejetées</option>
                        <option value="">Tous les statuts</option>
                    </select>
                    <button
                        className="btn btn-outline"
                        onClick={() =>
                            setFiltres({
                                page: 1,
                                limite: 10,
                                statut: 'en_attente',
                                type: '',
                                search: '',
                            })
                        }
                    >
                        <i className="fas fa-redo"></i> Réinitialiser
                    </button>
                </div>
            </div>

            {/* Liste des bannières */}
            <div className="bannieres-liste">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="spinner-border"></div>
                        <p>Chargement des bannières en attente...</p>
                    </div>
                ) : bannieres.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-clipboard-check fa-3x"></i>
                        <h3>Aucune bannière en attente</h3>
                        <p>Toutes les bannières ont été traitées</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Aperçu</th>
                                    <th>Titre</th>
                                    <th>Vendeur</th>
                                    <th>Statut</th>
                                    <th>Performances</th>
                                    <th>Expiration</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bannieres.map(banniere => {
                                    const joursRestants = calculerJoursRestants(
                                        banniere.dateExpiration
                                    );
                                    return (
                                        <tr
                                            key={banniere._id}
                                            className={
                                                banniere.statut === 'en_attente'
                                                    ? 'row-pending'
                                                    : ''
                                            }
                                        >
                                            {/* Aperçu */}
                                            <td>
                                                <img
                                                    src={banniere.image}
                                                    alt={banniere.titre}
                                                    className="banniere-thumbnail"
                                                    onError={e =>
                                                        (e.target.src =
                                                            '/images/placeholder.jpg')
                                                    }
                                                />
                                            </td>

                                            {/* Titre */}
                                            <td>
                                                <strong>
                                                    {banniere.titre}
                                                </strong>
                                                {banniere.sousTitre && (
                                                    <small className="d-block text-muted">
                                                        {banniere.sousTitre}
                                                    </small>
                                                )}
                                            </td>

                                            {/* Vendeur */}
                                            <td>
                                                {banniere.creePar ? (
                                                    <>
                                                        <div>
                                                            {
                                                                banniere.creePar
                                                                    .nom
                                                            }{' '}
                                                            {
                                                                banniere.creePar
                                                                    .prenom
                                                            }
                                                        </div>
                                                        {banniere.creePar
                                                            .boutique
                                                            ?.nomBoutique && (
                                                            <small className="text-muted">
                                                                {
                                                                    banniere
                                                                        .creePar
                                                                        .boutique
                                                                        .nomBoutique
                                                                }
                                                            </small>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-muted">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            {/* Statut */}
                                            <td>
                                                {renderStatutBadge(
                                                    banniere.statut
                                                )}
                                            </td>

                                            {/* Performances */}
                                            <td>
                                                <div className="stats-cell">
                                                    <span>
                                                        <i className="fas fa-eye"></i>{' '}
                                                        {banniere.nombreVues}
                                                    </span>
                                                    <span>
                                                        <i className="fas fa-mouse-pointer"></i>{' '}
                                                        {banniere.nombreClics}
                                                    </span>
                                                    <small className="text-muted">
                                                        Taux:{' '}
                                                        {banniere.tauxClics ||
                                                            0}
                                                        %
                                                    </small>
                                                </div>
                                            </td>

                                            {/* Expiration */}
                                            <td>
                                                {joursRestants !== null ? (
                                                    <span
                                                        className={
                                                            joursRestants <= 7
                                                                ? 'text-warning'
                                                                : ''
                                                        }
                                                    >
                                                        {joursRestants}j
                                                        restants
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">
                                                        ∞
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <div className="actions-cell">
                                                    {banniere.statut ===
                                                        'en_attente' && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() =>
                                                                    handleApprouver(
                                                                        banniere._id
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionEnCours ===
                                                                    banniere._id
                                                                }
                                                                title="Approuver"
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() =>
                                                                    ouvrirRejetModal(
                                                                        banniere._id
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionEnCours ===
                                                                    banniere._id
                                                                }
                                                                title="Rejeter"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() =>
                                                            navigate(
                                                                `/admin/bannieres/${banniere._id}`
                                                            )
                                                        }
                                                        title="Voir les détails"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 &&
                !isLoading &&
                bannieres.length > 0 && (
                    <div className="pagination-section">
                        <button
                            className="btn btn-outline"
                            disabled={pagination.page === 1}
                            onClick={() =>
                                handlePageChange(pagination.page - 1)
                            }
                        >
                            <i className="fas fa-chevron-left"></i> Précédent
                        </button>
                        <span className="pagination-info">
                            Page <strong>{pagination.page}</strong> sur{' '}
                            <strong>{pagination.totalPages}</strong>
                        </span>
                        <button
                            className="btn btn-outline"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() =>
                                handlePageChange(pagination.page + 1)
                            }
                        >
                            Suivant <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                )}

            {/* Modale de rejet */}
            {rejetModal.ouvert && (
                <div className="modal-overlay">
                    <div className="modal-content modal-rejet">
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-times-circle"></i> Rejeter
                                la bannière
                            </h3>
                            <button
                                className="btn-close"
                                onClick={fermerRejetModal}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">
                                    Raison du rejet *
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder="Expliquez pourquoi cette bannière ne peut pas être approuvée..."
                                    value={rejetModal.raison}
                                    onChange={e =>
                                        setRejetModal(prev => ({
                                            ...prev,
                                            raison: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Conseils pour le vendeur (optionnel)
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    placeholder="Suggestions d'amélioration pour la prochaine soumission..."
                                    value={rejetModal.conseils}
                                    onChange={e =>
                                        setRejetModal(prev => ({
                                            ...prev,
                                            conseils: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={fermerRejetModal}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleRejeter}
                            >
                                <i className="fas fa-times"></i> Rejeter la
                                bannière
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValidationBannieres;