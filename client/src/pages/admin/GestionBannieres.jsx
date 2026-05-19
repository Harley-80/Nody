import React, { useState, useEffect } from 'react';
import {
    obtenirToutesBannieres,
    supprimerBanniere,
    approuverBanniere,
    rejeterBanniere,
    obtenirStatistiquesBannieres,
} from '../../services/banniereService';
import { useNavigate } from 'react-router-dom';
import './GestionBannieres.scss';

// Page de gestion des bannières pour les administrateurs - Affiche la liste des bannières avec options de filtrage, pagination, et actions d'approbation/rejet/suppression
const GestionBannieres = () => {
    const navigate = useNavigate();
    const [bannieres, setBannieres] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filtres, setFiltres] = useState({
        page: 1,
        limite: 10,
        type: '',
        statut: '',
        estActif: '',
        search: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
    });

    // Charger les bannières
    useEffect(() => {
        chargerBannieres();
        chargerStatistiques();
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
            alert('Erreur lors du chargement des bannières');
        } finally {
            setIsLoading(false);
        }
    };

    // Charger les statistiques
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

    // Gérer les filtres
    const handleFiltreChange = (key, value) => {
        setFiltres(prev => ({
            ...prev,
            [key]: value,
            page: 1, // Reset à la page 1 lors d'un changement de filtre
        }));
    };

    // Pagination
    const handlePageChange = newPage => {
        setFiltres(prev => ({
            ...prev,
            page: newPage,
        }));
    };

    // Supprimer une bannière
    const handleSupprimer = async id => {
        if (
            !window.confirm(
                'Êtes-vous sûr de vouloir supprimer cette bannière ?'
            )
        ) {
            return;
        }

        try {
            await supprimerBanniere(id);
            alert('Bannière supprimée avec succès');
            chargerBannieres();
            chargerStatistiques();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression de la bannière');
        }
    };

    // Approuver une bannière
    const handleApprouver = async id => {
        try {
            await approuverBanniere(id);
            alert('Bannière approuvée avec succès');
            chargerBannieres();
            chargerStatistiques();
        } catch (error) {
            console.error("Erreur lors de l'approbation:", error);
            alert("Erreur lors de l'approbation de la bannière");
        }
    };

    // Rejeter une bannière
    const handleRejeter = async id => {
        const raison = prompt('Raison du rejet :');
        if (!raison) return;

        try {
            await rejeterBanniere(id, raison);
            alert('Bannière rejetée avec succès');
            chargerBannieres();
            chargerStatistiques();
        } catch (error) {
            console.error('Erreur lors du rejet:', error);
            alert('Erreur lors du rejet de la bannière');
        }
    };

    // Rendu de la page
    return (
        <div className="gestion-bannieres">
            {/* En-tête */}
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <i className="fas fa-images me-3"></i>
                        Gestion des Bannières
                    </h1>
                    <p className="page-subtitle">
                        Gérez les bannières publicitaires et promotionnelles
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/admin/bannieres/creer')}
                >
                    <i className="fas fa-plus me-2"></i>
                    Créer une bannière
                </button>
            </div>

            {/* Statistiques */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card stat-card--primary">
                        <div className="stat-icon">
                            <i className="fas fa-images"></i>
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{stats.total}</h3>
                            <p className="stat-label">Total bannières</p>
                        </div>
                    </div>

                    <div className="stat-card stat-card--warning">
                        <div className="stat-icon">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{stats.enAttente}</h3>
                            <p className="stat-label">En attente</p>
                        </div>
                    </div>

                    <div className="stat-card stat-card--success">
                        <div className="stat-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{stats.approuvees}</h3>
                            <p className="stat-label">Approuvées</p>
                        </div>
                    </div>

                    <div className="stat-card stat-card--danger">
                        <div className="stat-icon">
                            <i className="fas fa-times-circle"></i>
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{stats.rejetees}</h3>
                            <p className="stat-label">Rejetées</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div className="filtres-section">
                <div className="row g-3">
                    <div className="col-md-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Rechercher..."
                            value={filtres.search}
                            onChange={e =>
                                handleFiltreChange('search', e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-2">
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
                    </div>

                    <div className="col-md-2">
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
                    </div>

                    <div className="col-md-2">
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
                    </div>

                    <div className="col-md-3">
                        <button
                            className="btn btn-outline-secondary w-100"
                            onClick={() =>
                                setFiltres({
                                    page: 1,
                                    limite: 10,
                                    type: '',
                                    statut: '',
                                    estActif: '',
                                    search: '',
                                })
                            }
                        >
                            <i className="fas fa-redo me-2"></i>
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste des bannières */}
            <div className="bannieres-liste">
                {isLoading ? (
                    <div className="loading-state">
                        <div
                            className="spinner-border text-primary"
                            role="status"
                        >
                            <span className="visually-hidden">
                                Chargement...
                            </span>
                        </div>
                    </div>
                ) : bannieres.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-images fa-3x text-muted mb-3"></i>
                        <h3>Aucune bannière trouvée</h3>
                        <p className="text-muted">
                            Créez votre première bannière pour commencer
                        </p>
                        <button
                            className="btn btn-primary mt-3"
                            onClick={() => navigate('/admin/bannieres/creer')}
                        >
                            <i className="fas fa-plus me-2"></i>
                            Créer une bannière
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Aperçu</th>
                                    <th>Titre</th>
                                    <th>Type</th>
                                    <th>Statut</th>
                                    <th>État</th>
                                    <th>Vues / Clics</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bannieres.map(banniere => (
                                    <tr key={banniere._id}>
                                        <td>
                                            <img
                                                src={banniere.image}
                                                alt={banniere.titre}
                                                className="banniere-thumbnail"
                                            />
                                        </td>
                                        <td>
                                            <strong>{banniere.titre}</strong>
                                            {banniere.sousTitre && (
                                                <small className="d-block text-muted">
                                                    {banniere.sousTitre}
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge badge-type badge-${banniere.type}`}
                                            >
                                                {banniere.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge badge-statut badge-${banniere.statut}`}
                                            >
                                                {banniere.statut ===
                                                    'en_attente' &&
                                                    'En attente'}
                                                {banniere.statut ===
                                                    'approuve' && 'Approuvée'}
                                                {banniere.statut === 'rejete' &&
                                                    'Rejetée'}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${banniere.estActif ? 'bg-success' : 'bg-secondary'}`}
                                            >
                                                {banniere.estActif
                                                    ? 'Actif'
                                                    : 'Inactif'}
                                            </span>
                                        </td>
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
                                                    {banniere.tauxClics || 0}%
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <small>
                                                {new Date(
                                                    banniere.createdAt
                                                ).toLocaleDateString('fr-FR')}
                                            </small>
                                        </td>
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
                                                            title="Approuver"
                                                        >
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() =>
                                                                handleRejeter(
                                                                    banniere._id
                                                                )
                                                            }
                                                            title="Rejeter"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/bannieres/${banniere._id}`
                                                        )
                                                    }
                                                    title="Modifier"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() =>
                                                        handleSupprimer(
                                                            banniere._id
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
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="pagination-section">
                    <button
                        className="btn btn-outline-primary"
                        disabled={pagination.page === 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                    >
                        <i className="fas fa-chevron-left"></i> Précédent
                    </button>

                    <span className="pagination-info">
                        Page {pagination.page} sur {pagination.totalPages}
                        <small className="text-muted ms-2">
                            ({pagination.total} résultats)
                        </small>
                    </span>

                    <button
                        className="btn btn-outline-primary"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                    >
                        Suivant <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default GestionBannieres;