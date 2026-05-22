import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    obtenirToutesBannieres,
    supprimerBanniere,
    obtenirStatistiquesBannieres,
} from '../../services/banniereService';
import axios from 'axios';
import './MesBannieres.scss';

// Page de suivi des bannières pour les vendeurs 
const MesBannieres = () => {
    const navigate = useNavigate();
    
    // États
    const [bannieres, setBannieres] = useState([]);
    const [stats, setStats] = useState(null);
    const [credits, setCredits] = useState({
        solde: 0,
        coutBanniere: 2,
        bannieresCreables: 0,
        prochainBonus: {
            montant: 1,
            ventesRestantes: 10,
        },
        historiqueCredits: [],
        statistiquesBannieres: {},
        loading: true,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [actionEnCours, setActionEnCours] = useState(null);

    const [filtres, setFiltres] = useState({
        page: 1,
        limite: 10,
        type: 'pub', // Vendeur = pub uniquement
        statut: '',
        estActif: '',
        search: '',
    });

    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
    });

    const [showHistorique, setShowHistorique] = useState(false);
    
    // Chargement des données
    useEffect(() => {
        chargerDonnees();
    }, [filtres]);

    const chargerDonnees = useCallback(async () => {
        await Promise.all([
            chargerBannieres(),
            chargerStatistiques(),
            chargerCredits(),
        ]);
    }, [filtres]);

    const chargerBannieres = async () => {
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
            console.error('Erreur lors du chargement des bannières:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const chargerStatistiques = async () => {
        try {
            const response = await obtenirStatistiquesBannieres();
            if (response.succes) {
                setStats(response.donnees);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
        }
    };

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
    
    // Gestion des filtres
    const handleFiltreChange = useCallback((key, value) => {
        setFiltres(prev => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : value,
        }));
    }, []);

    const reinitialiserFiltres = useCallback(() => {
        setFiltres({
            page: 1,
            limite: 10,
            type: 'pub',
            statut: '',
            estActif: '',
            search: '',
        });
    }, []);
    
    // Pagination
    const handlePageChange = useCallback(
        newPage => {
            if (newPage >= 1 && newPage <= pagination.totalPages) {
                handleFiltreChange('page', newPage);
            }
        },
        [pagination.totalPages, handleFiltreChange]
    );
    
    // Actions 
    const handleSupprimer = useCallback(
        async (id, titre) => {
            if (
                !window.confirm(
                    `Êtes-vous sûr de vouloir supprimer la bannière "${titre}" ?`
                )
            ) {
                return;
            }

            try {
                setActionEnCours(id);
                await supprimerBanniere(id);

                alert('Bannière supprimée avec succès');

                await chargerDonnees();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert(
                    `Erreur : ${error.message || 'Impossible de supprimer la bannière'}`
                );
            } finally {
                setActionEnCours(null);
            }
        },
        [chargerDonnees]
    );

    const handleModifier = useCallback(
        id => {
            navigate(`/vendeur/bannieres/${id}/modifier`);
        },
        [navigate]
    );

    const handleCreer = useCallback(() => {
        navigate('/vendeur/bannieres/creer');
    }, [navigate]);
    
    // Calculs 
    const statsAffichees = useMemo(() => {
        if (!stats) return null;

        return {
            total: stats.total || 0,
            enAttente: stats.enAttente || 0,
            approuvees: stats.approuvees || 0,
            rejetees: stats.rejetees || 0,
        };
    }, [stats]);

    const statsVentes = useMemo(() => {
        if (!credits.statistiquesBannieres) return null;

        return {
            totalVentes:
                credits.statistiquesBannieres.totalVentesAttribuees || 0,
            montantTotal: credits.statistiquesBannieres.montantTotalVentes || 0,
        };
    }, [credits.statistiquesBannieres]);

    const peutCreer = useMemo(() => {
        return credits.solde >= credits.coutBanniere;
    }, [credits.solde, credits.coutBanniere]);
    
    // Les jours restants avant expiration
    const calculerJoursRestants = dateExpiration => {
        if (!dateExpiration) return null;

        const maintenant = new Date();
        const expiration = new Date(dateExpiration);
        const diffMs = expiration - maintenant;
        const diffJours = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        return diffJours > 0 ? diffJours : 0;
    };
    
    // Le rendu
    return (
        <div className="mes-bannieres">
            {/* L'en-tête  */}
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <i className="fas fa-ad"></i>
                        Mes Bannières Publicitaires
                    </h1>
                    <p className="page-subtitle">
                        Gérez vos bannières et suivez leurs performances
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleCreer}
                    disabled={!peutCreer}
                    title={
                        !peutCreer
                            ? `Crédits insuffisants (${credits.solde}/${credits.coutBanniere})`
                            : 'Créer une nouvelle bannière'
                    }
                >
                    <i className="fas fa-plus"></i>
                    Créer une bannière
                </button>
            </div>

            {/* Grille de stats et crédits */}
            <div className="stats-grid">
                {/* Carte de crédits */}
                <div className="credits-card">
                    <div className="card-header">
                        <div className="card-icon">
                            <i className="fas fa-coins"></i>
                        </div>
                        <div className="card-info">
                            <h3 className="card-label">Vos Crédits</h3>
                            <div className="card-value">
                                {credits.solde} points
                            </div>
                        </div>
                    </div>
                    <div className="card-details">
                        <div className="detail-item">
                            <span className="detail-label">
                                Bannières créables
                            </span>
                            <span className="detail-value">
                                {credits.bannieresCreables}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Coût création</span>
                            <span className="detail-value">
                                -{credits.coutBanniere} pts
                            </span>
                        </div>
                    </div>
                    <button
                        className="card-button"
                        onClick={() => setShowHistorique(!showHistorique)}
                    >
                        <i className="fas fa-history"></i>
                        Historique
                    </button>
                </div>

                {/* Stats de bannières */}
                {statsAffichees && (
                    <>
                        <div className="stat-card stat-card--primary">
                            <div className="stat-icon">
                                <i className="fas fa-ad"></i>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {statsAffichees.total}
                                </div>
                                <div className="stat-label">
                                    Total bannières
                                </div>
                            </div>
                        </div>

                        <div className="stat-card stat-card--warning">
                            <div className="stat-icon">
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {statsAffichees.enAttente}
                                </div>
                                <div className="stat-label">En validation</div>
                            </div>
                        </div>

                        <div className="stat-card stat-card--success">
                            <div className="stat-icon">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {statsAffichees.approuvees}
                                </div>
                                <div className="stat-label">Approuvées</div>
                            </div>
                        </div>
                    </>
                )}

                {/* Stats de ventes */}
                {statsVentes && (
                    <div className="stat-card stat-card--info">
                        <div className="stat-icon">
                            <i className="fas fa-shopping-cart"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {statsVentes.totalVentes}
                            </div>
                            <div className="stat-label">Ventes attribuées</div>
                            <div className="stat-detail">
                                {statsVentes.montantTotal.toLocaleString(
                                    'fr-FR'
                                )}{' '}
                                FCFA
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Historique des crédits (MODAL) */}
            {showHistorique && (
                <div className="historique-modal">
                    <div
                        className="modal-overlay"
                        onClick={() => setShowHistorique(false)}
                    />
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-history"></i>
                                Historique des crédits
                            </h3>
                            <button
                                className="btn-close"
                                onClick={() => setShowHistorique(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            {credits.historiqueCredits &&
                            credits.historiqueCredits.length > 0 ? (
                                <div className="historique-liste">
                                    {credits.historiqueCredits
                                        .slice(-10)
                                        .reverse()
                                        .map((item, index) => (
                                            <div
                                                key={index}
                                                className={`historique-item historique-item--${item.type}`}
                                            >
                                                <div className="item-icon">
                                                    {item.type === 'credit' && (
                                                        <i className="fas fa-plus-circle"></i>
                                                    )}
                                                    {item.type === 'debit' && (
                                                        <i className="fas fa-minus-circle"></i>
                                                    )}
                                                    {item.type === 'bonus' && (
                                                        <i className="fas fa-gift"></i>
                                                    )}
                                                </div>
                                                <div className="item-content">
                                                    <div className="item-raison">
                                                        {item.raison}
                                                    </div>
                                                    <div className="item-date">
                                                        {new Date(
                                                            item.date
                                                        ).toLocaleDateString(
                                                            'fr-FR',
                                                            {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="item-montant">
                                                    {item.montant > 0
                                                        ? '+'
                                                        : ''}
                                                    {item.montant} pts
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-inbox fa-3x"></i>
                                    <p>Aucun historique disponible</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                        value={filtres.statut}
                        onChange={e =>
                            handleFiltreChange('statut', e.target.value)
                        }
                    >
                        <option value="">Tous les statuts</option>
                        <option value="en_attente">En attente</option>
                        <option value="approuve">Approuvée</option>
                        <option value="rejete">Rejetée</option>
                    </select>

                    <select
                        className="form-select"
                        value={filtres.estActif}
                        onChange={e =>
                            handleFiltreChange('estActif', e.target.value)
                        }
                    >
                        <option value="">Tous les états</option>
                        <option value="true">Actif</option>
                        <option value="false">Inactif</option>
                    </select>

                    <button
                        className="btn btn-outline"
                        onClick={reinitialiserFiltres}
                    >
                        <i className="fas fa-redo"></i>
                        Réinitialiser
                    </button>
                </div>
            </div>

            {/* Liste des bannières */}
            <div className="bannieres-liste">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="spinner-border"></div>
                        <p>Chargement de vos bannières...</p>
                    </div>
                ) : bannieres.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-ad fa-3x"></i>
                        <h3>Aucune bannière</h3>
                        <p>
                            {filtres.search ||
                            filtres.statut ||
                            filtres.estActif
                                ? 'Aucune bannière ne correspond à vos critères'
                                : 'Créez votre première bannière pour promouvoir vos produits'}
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={handleCreer}
                            disabled={!peutCreer}
                        >
                            <i className="fas fa-plus"></i>
                            Créer ma première bannière
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Aperçu</th>
                                    <th>Titre</th>
                                    <th>Statut</th>
                                    <th>Performances</th>
                                    <th>Ventes</th>
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
                                        <tr key={banniere._id}>
                                            {/* Aperçu */}
                                            <td>
                                                <img
                                                    src={banniere.image}
                                                    alt={banniere.titre}
                                                    className="banniere-thumbnail"
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

                                            {/* Statut */}
                                            <td>
                                                <span
                                                    className={`badge badge-${banniere.statut}`}
                                                >
                                                    {banniere.statut ===
                                                        'en_attente' &&
                                                        'En attente'}
                                                    {banniere.statut ===
                                                        'approuve' &&
                                                        'Approuvée'}
                                                    {banniere.statut ===
                                                        'rejete' &&
                                                        'Rejetée'}
                                                </span>
                                                {banniere.statut === 'rejete' &&
                                                    banniere.raisonRejet && (
                                                        <div
                                                            className="rejection-reason"
                                                            title={
                                                                banniere.raisonRejet
                                                            }
                                                        >
                                                            <i className="fas fa-info-circle"></i>
                                                            {banniere.raisonRejet.substring(
                                                                0,
                                                                40
                                                            )}
                                                            {banniere
                                                                .raisonRejet
                                                                .length > 40 &&
                                                                '...'}
                                                        </div>
                                                    )}
                                                <div
                                                    className={`badge badge-state ${banniere.estActif ? 'active' : 'inactive'}`}
                                                >
                                                    {banniere.estActif
                                                        ? 'Actif'
                                                        : 'Inactif'}
                                                </div>
                                            </td>

                                            {/* Performances */}
                                            <td>
                                                <div className="stats-cell">
                                                    <div className="stat-item">
                                                        <i className="fas fa-eye"></i>
                                                        {banniere.nombreVues.toLocaleString(
                                                            'fr-FR'
                                                        )}{' '}
                                                        vues
                                                    </div>
                                                    <div className="stat-item">
                                                        <i className="fas fa-mouse-pointer"></i>
                                                        {banniere.nombreClics.toLocaleString(
                                                            'fr-FR'
                                                        )}{' '}
                                                        clics
                                                    </div>
                                                    <div className="stat-item">
                                                        <strong>
                                                            Taux:{' '}
                                                            {banniere.tauxClics ||
                                                                0}
                                                            %
                                                        </strong>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Ventes */}
                                            <td>
                                                <div className="ventes-cell">
                                                    <div className="ventes-count">
                                                        {banniere.nombreVentesAttribuees ||
                                                            0}{' '}
                                                        vente
                                                        {(banniere.nombreVentesAttribuees ||
                                                            0) > 1
                                                            ? 's'
                                                            : ''}
                                                    </div>
                                                    {banniere.montantTotalVentes >
                                                        0 && (
                                                        <div className="ventes-montant">
                                                            {banniere.montantTotalVentes.toLocaleString(
                                                                'fr-FR'
                                                            )}{' '}
                                                            FCFA
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Expirations */}
                                            <td>
                                                {joursRestants !== null ? (
                                                    <div
                                                        className={`expiration-cell ${joursRestants <= 7 ? 'warning' : ''}`}
                                                    >
                                                        <i className="fas fa-clock"></i>
                                                        {joursRestants === 0 ? (
                                                            <span className="text-danger">
                                                                Expiré
                                                            </span>
                                                        ) : (
                                                            <span>
                                                                {joursRestants}{' '}
                                                                jour
                                                                {joursRestants >
                                                                1
                                                                    ? 's'
                                                                    : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <div className="actions-cell">
                                                    {banniere.statut ===
                                                        'rejete' && (
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() =>
                                                                handleModifier(
                                                                    banniere._id
                                                                )
                                                            }
                                                            title="Corriger et resoumettre"
                                                            disabled={
                                                                actionEnCours ===
                                                                banniere._id
                                                            }
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() =>
                                                            handleSupprimer(
                                                                banniere._id,
                                                                banniere.titre
                                                            )
                                                        }
                                                        title="Supprimer"
                                                        disabled={
                                                            actionEnCours ===
                                                            banniere._id
                                                        }
                                                    >
                                                        <i className="fas fa-trash"></i>
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
                            <small>
                                ({pagination.total} résultat
                                {pagination.total > 1 ? 's' : ''})
                            </small>
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
        </div>
    );
};

export default MesBannieres;