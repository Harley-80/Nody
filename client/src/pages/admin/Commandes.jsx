import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useConfirmActions } from '../../hooks/useConfirmActions';
import { adminService } from '../../services/adminService';
import {
    formaterMontant,
    formaterDate,
    obtenirClasseStatut,
    obtenirTexteStatut,
} from '../../utils/formatage';
import './Commandes.scss';

const Commandes = () => {
    const { confirmCancelOrder } = useConfirmActions();

    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [filters, setFilters] = useState({
        statut: '',
        search: '',
        page: 1,
        limite: 10,
    });
    const [pagination, setPagination] = useState({});
    const [stats, setStats] = useState({});

    // Charger les commandes depuis le backend
    const chargerCommandes = async () => {
        try {
            setLoading(true);
            setErreur(null);

            console.log('[Commandes] Chargement avec filtres:', filters);

            const response = await adminService.getCommandes(filters);

            console.log('[Commandes] Réponse:', response);

            if (response.succes) {
                setCommandes(response.donnees || []);
                setPagination(response.pagination || {});
                setStats(response.stats || {});
            } else {
                setErreur('Erreur lors du chargement des commandes');
            }
        } catch (error) {
            console.error('[Commandes] Erreur:', error);
            setErreur(error.message || 'Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chargerCommandes();
    }, [filters]);

    // Annuler une commande
    const handleCancelOrder = async (id, numero) => {
        const confirmed = await confirmCancelOrder(numero);
        if (!confirmed) return;

        try {
            await adminService.annulerCommande(
                id,
                "Annulée par l'administrateur"
            );
            await chargerCommandes();
            alert('Commande annulée avec succès !');
        } catch (error) {
            console.error('Erreur annulation:', error);
            alert("Erreur lors de l'annulation");
        }
    };

    // Chargement
    if (loading) {
        return (
            // Classe admin-page conservée
            <div className="admin-page">
                <div className="page-loading">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p className="mt-3">Chargement des commandes...</p>
                </div>
            </div>
        );
    }

    // Erreur
    if (erreur) {
        return (
            <div className="admin-page">
                <div className="alert alert-danger">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {erreur}
                    <button
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={chargerCommandes}
                    >
                        <i className="fas fa-sync-alt me-1"></i>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        // 1. AJOUT DE LA CLASSE: 'fade-in' pour un effet de transition à l'arrivée
        <div className="admin-page fade-in">
            {/* En-tête */}
            <div className="page-header">
                <div className="header-content">
                    <h1>
                        <i className="fas fa-shopping-cart me-2"></i>
                        Gestion des Commandes
                    </h1>
                    <p>
                        Suivez et gérez toutes les commandes de votre plateforme
                    </p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-modern btn-primary"
                        onClick={chargerCommandes}
                        disabled={loading}
                    >
                        <i className="fas fa-sync-alt me-2"></i>
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="admin-card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Recherche</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="N° commande, client, email..."
                                value={filters.search}
                                onChange={e =>
                                    setFilters({
                                        ...filters,
                                        search: e.target.value,
                                        page: 1,
                                    })
                                }
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Statut</label>
                            <select
                                className="form-select"
                                value={filters.statut}
                                onChange={e =>
                                    setFilters({
                                        ...filters,
                                        statut: e.target.value,
                                        page: 1,
                                    })
                                }
                            >
                                <option value="">Tous les statuts</option>
                                <option value="en_attente">En attente</option>
                                <option value="confirme">Confirmé</option>
                                <option value="en_cours">En cours</option>
                                <option value="expédie">Expédié</option>
                                <option value="livré">Livré</option>
                                <option value="annulé">Annulé</option>
                                <option value="retourne">Retourné</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableau des commandes */}
            <div className="admin-card">
                <div className="card-header">
                    <h3>Liste des Commandes</h3>
                    <span className="text-muted">
                        {pagination.total || 0} commande(s)
                    </span>
                </div>
                <div className="card-body p-0">
                    {commandes.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <p className="text-muted">
                                Aucune commande trouvée
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            {/* 5. AJOUT DE LA CLASSE: 'table-modern' pour le tableau */}
                            <table className="table table-hover table-modern">
                                <thead>
                                    <tr>
                                        <th>N° Commande</th>
                                        <th>Client</th>
                                        <th className="text-end">Montant</th>
                                        <th>Articles</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commandes.map(commande => (
                                        <tr key={commande._id}>
                                            <td>
                                                <strong className="text-primary">
                                                    {commande.numeroCommande}
                                                </strong>
                                            </td>
                                            <td>
                                                <div>
                                                    <div className="fw-bold">
                                                        {commande.client
                                                            ?.prenom ||
                                                            'N/A'}{' '}
                                                        {commande.client?.nom ||
                                                            ''}
                                                    </div>
                                                    <small className="text-muted">
                                                        {commande.client
                                                            ?.email || 'N/A'}
                                                    </small>
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <span className="fw-bold text-success">
                                                    {formaterMontant(
                                                        commande.total
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark">
                                                    {commande.articles
                                                        ?.length || 0}{' '}
                                                    article(s)
                                                </span>
                                            </td>
                                            <td>
                                                {formaterDate(
                                                    commande.createdAt
                                                )}
                                            </td>
                                            <td>
                                                {/* 2. AJOUT DE LA CLASSE: 'badge-modern' pour les badges de statut */}
                                                <span
                                                    className={`badge badge-modern bg-${obtenirClasseStatut(commande.statut)}`}
                                                >
                                                    {obtenirTexteStatut(
                                                        commande.statut
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2 justify-content-center">
                                                    <Link
                                                        to={`/admin/commandes/${commande._id}`}
                                                        // 3. AJOUT DE LA CLASSE: 'btn-modern' pour le bouton Voir
                                                        className="btn btn-sm btn-outline-primary btn-modern"
                                                        title="Voir les détails"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </Link>

                                                    {![
                                                        'annulé',
                                                        'livré',
                                                        'retourne',
                                                    ].includes(
                                                        commande.statut
                                                    ) && (
                                                        <button
                                                            // 3. AJOUT DE LA CLASSE: 'btn-modern' pour le bouton Annuler
                                                            className="btn btn-sm btn-outline-warning btn-modern"
                                                            onClick={() =>
                                                                handleCancelOrder(
                                                                    commande._id,
                                                                    commande.numeroCommande
                                                                )
                                                            }
                                                            title="Annuler la commande"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    )}
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
                {pagination.pages > 1 && (
                    <div className="card-footer">
                        <div className="d-flex justify-content-between align-items-center">
                            <button
                                className="btn btn-outline-primary"
                                disabled={filters.page === 1}
                                onClick={() =>
                                    setFilters({
                                        ...filters,
                                        page: filters.page - 1,
                                    })
                                }
                            >
                                <i className="fas fa-chevron-left me-1"></i>
                                Précédent
                            </button>
                            <span>
                                Page {pagination.page} sur {pagination.pages}
                            </span>
                            <button
                                className="btn btn-outline-primary"
                                disabled={filters.page === pagination.pages}
                                onClick={() =>
                                    setFilters({
                                        ...filters,
                                        page: filters.page + 1,
                                    })
                                }
                            >
                                Suivant
                                <i className="fas fa-chevron-right ms-1"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Statistiques rapides */}
            <div className="row mt-4">
                <div className="col-md-3">
                    {/* 4. AJOUT DE LA CLASSE: 'hover-lift' */}
                    <div className="stat-card-mini bg-primary hover-lift">
                        <div className="stat-content">
                            <i className="fas fa-shopping-cart"></i>
                            <div>
                                <h4>{pagination.total || 0}</h4>
                                <span>Total Commandes</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    {/* 4. AJOUT DE LA CLASSE: 'hover-lift' */}
                    <div className="stat-card-mini bg-success hover-lift">
                        <div className="stat-content">
                            <i className="fas fa-check-circle"></i>
                            <div>
                                <h4>
                                    {
                                        commandes.filter(
                                            c => c.statut === 'livré'
                                        ).length
                                    }
                                </h4>
                                <span>Livrées</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    {/* 4. AJOUT DE LA CLASSE: 'hover-lift' */}
                    <div className="stat-card-mini bg-warning hover-lift">
                        <div className="stat-content">
                            <i className="fas fa-clock"></i>
                            <div>
                                <h4>
                                    {
                                        commandes.filter(
                                            c => c.statut === 'en_attente'
                                        ).length
                                    }
                                </h4>
                                <span>En Attente</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    {/* 4. AJOUT DE LA CLASSE: 'hover-lift' */}
                    <div className="stat-card-mini bg-info hover-lift">
                        <div className="stat-content">
                            <i className="fas fa-sync-alt"></i>
                            <div>
                                <h4>
                                    {
                                        commandes.filter(
                                            c => c.statut === 'en_cours'
                                        ).length
                                    }
                                </h4>
                                <span>En Cours</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistiques globales */}
            {stats && stats.totalCommandes > 0 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="admin-card">
                            <div className="card-header">
                                <h3>
                                    <i className="fas fa-chart-bar me-2"></i>
                                    Statistiques Globales
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="row text-center">
                                    <div className="col-md-4">
                                        <div className="stat-box">
                                            <h5 className="text-muted">
                                                Chiffre d'Affaires Total
                                            </h5>
                                            <h2 className="text-success">
                                                {formaterMontant(
                                                    stats.chiffreAffairesTotal ||
                                                        0
                                                )}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="stat-box">
                                            <h5 className="text-muted">
                                                Panier Moyen
                                            </h5>
                                            <h2 className="text-primary">
                                                {formaterMontant(
                                                    stats.moyenneCommande || 0
                                                )}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="stat-box">
                                            <h5 className="text-muted">
                                                Nombre de Commandes
                                            </h5>
                                            <h2 className="text-info">
                                                {stats.totalCommandes || 0}
                                            </h2>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Commandes;
