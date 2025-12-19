import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moderateurService } from '../../services/moderateurService';
import { useToast } from '../../contexts/ToastContext';
import './DashboardModerateur.scss';

const DashboardModerateur = () => {
    // Hooks
    const { addToast } = useToast();

    // États
    const [stats, setStats] = useState({
        moderateur: {
            nom: '',
            prenom: '',
            email: '',
        },
        produitsEnAttente: 0,
        vendeursEnAttente: 0,
        utilisateursActifs: 0,
        actionsRecentes: 0,
        totalProduits: 0,
        totalVendeurs: 0,
        totalUtilisateurs: 0,
        revenusMois: 0,
        demandesEnAttente: 0,
        nouveauxUtilisateursJour: 0,
        nouveauxProduitsJour: 0,
        commandesJour: 0,
        tauxValidation: '0%',
        validationsMois: 0,
        evolutionValidations: 0,
        tempsMoyenTraitement: '0',
        evolutionTemps: 0,
        scoreSatisfaction: '0',
        nombreAvis: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recentActions, setRecentActions] = useState([]);
    const [topVendeurs, setTopVendeurs] = useState([]);

    // Chargement initial
    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Récupération des données du dashboard
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Chargement du dashboard modérateur...');

            // Récupérer les statistiques principales
            const statsResponse =
                await moderateurService.obtenirStatistiquesDashboard();

            if (statsResponse.succes) {
                console.log('Statistiques chargées:', statsResponse.donnees);

                // Fusionner les données avec calcul des demandes totales
                const nouvellesStats = {
                    ...statsResponse.donnees,
                    demandesEnAttente:
                        (statsResponse.donnees.produitsEnAttente || 0) +
                        (statsResponse.donnees.vendeursEnAttente || 0),
                };

                setStats(prev => ({
                    ...prev,
                    ...nouvellesStats,
                }));
            } else {
                throw new Error(
                    statsResponse.message ||
                        'Erreur lors du chargement des statistiques'
                );
            }
        } catch (err) {
            console.error('Erreur chargement dashboard:', err);
            const errorMessage =
                err.message ||
                'Impossible de charger les données du tableau de bord.';
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

    // Fonctions utilitaires
    const formatNumber = num => {
        return new Intl.NumberFormat('fr-FR').format(num);
    };

    const formatCurrency = amount => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getInitials = (nom, prenom) => {
        const n = nom ? nom.charAt(0).toUpperCase() : '';
        const p = prenom ? prenom.charAt(0).toUpperCase() : '';
        return n + p || '?';
    };

    const formatDate = date => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // États de chargement
    if (loading) {
        return (
            <div className="dashboard-moderateur-container">
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-moderateur-container">
                <div className="error-state">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={fetchDashboardData}>
                        <i className="fas fa-redo"></i>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-moderateur-container">
            {/* En-tête avec message de bienvenue */}
            <div className="page-header">
                <h1>
                    <i className="fas fa-tachometer-alt"></i>
                    Tableau de Bord Modérateur
                </h1>
                <div className="user-welcome">
                    <span className="welcome-text">
                        Bonjour,{' '}
                        <strong>
                            {stats.moderateur?.prenom ||
                                stats.moderateur?.nom ||
                                'Modérateur'}
                        </strong>
                    </span>
                    <span className="user-role">
                        <i className="fas fa-user-shield"></i>
                        Modérateur
                    </span>
                </div>
            </div>

            {/* Statistiques principales */}
            <div className="stats-cards">
                {/* Demandes urgentes */}
                <Link
                    to="/moderateur/demandes?type=produit&statut=en_attente"
                    className="stat-card urgent"
                >
                    <div className="stat-icon urgent">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.produitsEnAttente || 0}</h3>
                        <p>Produits en attente</p>
                        <span className="stat-badge">Validation requise</span>
                    </div>
                </Link>

                <Link
                    to="/moderateur/demandes?type=vendeur&statut=en_attente"
                    className="stat-card urgent"
                >
                    <div className="stat-icon urgent">
                        <i className="fas fa-store"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.vendeursEnAttente || 0}</h3>
                        <p>Vendeurs en attente</p>
                        <span className="stat-badge">Dossiers à vérifier</span>
                    </div>
                </Link>

                {/* Utilisateurs actifs */}
                <Link to="/moderateur/utilisateurs" className="stat-card info">
                    <div className="stat-icon info">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{formatNumber(stats.utilisateursActifs || 0)}</h3>
                        <p>Utilisateurs actifs</p>
                        <span className="stat-badge">Clients et vendeurs</span>
                    </div>
                </Link>

                {/* Actions récentes */}
                <Link to="/moderateur/historique" className="stat-card success">
                    <div className="stat-icon success">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{formatNumber(stats.actionsRecentes || 0)}</h3>
                        <p>Mes actions (30j)</p>
                        <span className="stat-badge">
                            Validations effectuées
                        </span>
                    </div>
                </Link>

                {/* Statistiques additionnelles */}
                {stats.totalProduits > 0 && (
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-boxes"></i>
                        </div>
                        <div className="stat-info">
                            <h3>{formatNumber(stats.totalProduits)}</h3>
                            <p>Total produits</p>
                            <span className="stat-badge">Catalogues</span>
                        </div>
                    </div>
                )}

                {stats.totalVendeurs > 0 && (
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-user-tie"></i>
                        </div>
                        <div className="stat-info">
                            <h3>{formatNumber(stats.totalVendeurs)}</h3>
                            <p>Total vendeurs</p>
                            <span className="stat-badge">Partenaires</span>
                        </div>
                    </div>
                )}

                {stats.revenusMois > 0 && (
                    <div className="stat-card revenue">
                        <div className="stat-icon revenue">
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <div className="stat-info">
                            <h3>{formatCurrency(stats.revenusMois)}</h3>
                            <p>Revenus ce mois</p>
                            <span className="stat-badge">
                                Chiffre d'affaires
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Sections principales */}
            <div className="dashboard-sections">
                {/* Section gauche - Actions rapides */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>
                            <i className="fas fa-bolt"></i>
                            Actions rapides
                        </h2>
                    </div>
                    <div className="section-body">
                        <div className="quick-actions-grid">
                            <Link
                                to="/moderateur/demandes?type=produit&statut=en_attente"
                                className="quick-action-card urgent"
                            >
                                <div className="action-icon">
                                    <i className="fas fa-search"></i>
                                </div>
                                <div className="action-content">
                                    <h3>Valider produits</h3>
                                    <p>Examiner les nouveaux produits soumis</p>
                                    <span className="action-badge">
                                        <i className="fas fa-arrow-right"></i>
                                        Accéder
                                    </span>
                                </div>
                            </Link>

                            <Link
                                to="/moderateur/demandes?type=vendeur&statut=en_attente"
                                className="quick-action-card urgent"
                            >
                                <div className="action-icon">
                                    <i className="fas fa-file-contract"></i>
                                </div>
                                <div className="action-content">
                                    <h3>Vérifier vendeurs</h3>
                                    <p>Contrôler les documents KBIS/identité</p>
                                    <span className="action-badge">
                                        <i className="fas fa-arrow-right"></i>
                                        Accéder
                                    </span>
                                </div>
                            </Link>

                            <Link
                                to="/moderateur/utilisateurs"
                                className="quick-action-card"
                            >
                                <div className="action-icon">
                                    <i className="fas fa-user-cog"></i>
                                </div>
                                <div className="action-content">
                                    <h3>Gérer utilisateurs</h3>
                                    <p>Bloquer/débloquer des comptes</p>
                                    <span className="action-badge">
                                        <i className="fas fa-arrow-right"></i>
                                        Accéder
                                    </span>
                                </div>
                            </Link>

                            <Link
                                to="/moderateur/historique"
                                className="quick-action-card"
                            >
                                <div className="action-icon">
                                    <i className="fas fa-history"></i>
                                </div>
                                <div className="action-content">
                                    <h3>Mon historique</h3>
                                    <p>Consulter mes actions récentes</p>
                                    <span className="action-badge">
                                        <i className="fas fa-arrow-right"></i>
                                        Accéder
                                    </span>
                                </div>
                            </Link>

                            <Link
                                to="/moderateur/signalements"
                                className="quick-action-card danger"
                            >
                                <div className="action-icon">
                                    <i className="fas fa-flag"></i>
                                </div>
                                <div className="action-content">
                                    <h3>Signalements</h3>
                                    <p>Traiter les signalements utilisateurs</p>
                                    <span className="action-badge">
                                        <i className="fas fa-arrow-right"></i>
                                        Accéder
                                    </span>
                                </div>
                            </Link>

                            <Link
                                to="/moderateur/analytics"
                                className="quick-action-card info"
                            >
                                <div className="action-icon">
                                    <i className="fas fa-chart-bar"></i>
                                </div>
                                <div className="action-content">
                                    <h3>Analytics</h3>
                                    <p>Statistiques et rapports détaillés</p>
                                    <span className="action-badge">
                                        <i className="fas fa-arrow-right"></i>
                                        Accéder
                                    </span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Section droite - Résumé */}
                <div className="dashboard-sidebar">
                    {/* Alerte demandes en attente */}
                    {stats.demandesEnAttente > 0 && (
                        <div className="alert-card urgent">
                            <div className="alert-icon">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <div className="alert-content">
                                <h4>Attention requise</h4>
                                <p>
                                    <strong>
                                        {stats.demandesEnAttente} demande(s)
                                    </strong>{' '}
                                    nécessitent votre attention immédiate
                                </p>
                                <Link
                                    to="/moderateur/demandes"
                                    className="alert-action"
                                >
                                    <i className="fas fa-play"></i>
                                    Traiter maintenant
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Statistiques quotidiennes */}
                    <div className="sidebar-card">
                        <div className="card-header">
                            <h3>
                                <i className="fas fa-chart-pie"></i>
                                Résumé du jour
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="daily-stats">
                                <div className="daily-stat">
                                    <span className="stat-label">
                                        Nouveaux utilisateurs
                                    </span>
                                    <span className="stat-value">
                                        +{stats.nouveauxUtilisateursJour || 0}
                                    </span>
                                </div>
                                <div className="daily-stat">
                                    <span className="stat-label">
                                        Produits ajoutés
                                    </span>
                                    <span className="stat-value">
                                        +{stats.nouveauxProduitsJour || 0}
                                    </span>
                                </div>
                                <div className="daily-stat">
                                    <span className="stat-label">
                                        Commandes
                                    </span>
                                    <span className="stat-value">
                                        {stats.commandesJour || 0}
                                    </span>
                                </div>
                                <div className="daily-stat">
                                    <span className="stat-label">
                                        Taux de validation
                                    </span>
                                    <span className="stat-value success">
                                        {stats.tauxValidation || '0%'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section performance */}
            <div className="performance-section">
                <div className="section-header">
                    <h2>
                        <i className="fas fa-chart-line"></i>
                        Performance mensuelle
                    </h2>
                </div>
                <div className="performance-cards">
                    <div className="performance-card">
                        <div className="performance-icon success">
                            <i className="fas fa-check-double"></i>
                        </div>
                        <div className="performance-content">
                            <h3>Validations</h3>
                            <p className="performance-value">
                                {formatNumber(stats.validationsMois || 0)}
                            </p>
                            <span className="performance-trend">
                                <i className="fas fa-arrow-up"></i>+
                                {stats.evolutionValidations || 0}% ce mois
                            </span>
                        </div>
                    </div>

                    <div className="performance-card">
                        <div className="performance-icon warning">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="performance-content">
                            <h3>Temps moyen</h3>
                            <p className="performance-value">
                                {stats.tempsMoyenTraitement || '0'}h
                            </p>
                            <span className="performance-trend">
                                <i className="fas fa-arrow-down"></i>-
                                {stats.evolutionTemps || 0}% plus rapide
                            </span>
                        </div>
                    </div>

                    <div className="performance-card">
                        <div className="performance-icon info">
                            <i className="fas fa-user-check"></i>
                        </div>
                        <div className="performance-content">
                            <h3>Satisfaction</h3>
                            <p className="performance-value">
                                {stats.scoreSatisfaction || '0'}/10
                            </p>
                            <span className="performance-trend">
                                <i className="fas fa-star"></i>
                                Basé sur {stats.nombreAvis || 0} avis
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardModerateur;//