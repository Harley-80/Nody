import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import {
    useVendeurDashboardData,
    useVendeurDonneesSupplementaires,
} from '../../hooks/useVendeurDashboardData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faBox,
    faShoppingCart,
    faStore,
    faUsers,
    faClock,
    faCheckCircle,
    faExclamationTriangle,
    faArrowUp,
    faArrowDown,
    faBolt,
    faCalendarAlt,
    faMoneyBillWave,
    faTags,
    faEye,
    faEdit,
    faTrash,
    faPlus,
    faFilter,
    faSearch,
    faBell,
    faMessage,
    faCog,
    faChartPie,
    faTruck,
    faStar,
    faHeart,
    faShare,
    faDownload,
    faUpload,
    faSync,
    faQuestionCircle,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import './DashboardVendeur.scss';

const DashboardVendeur = () => {
    const { addToast } = useToast();
    const { user } = useAuth();

    // Utiliser les hooks personnalisés
    const {
        donnees: statsVendeur,
        chargement: statsChargement,
        erreur: statsErreur,
        actualiser: actualiserStats,
    } = useVendeurDashboardData('mois');

    const {
        commandesRecentes,
        produitsPopulaires,
        chargement: suppChargement,
    } = useVendeurDonneesSupplementaires();

    // États locaux
    const [activeTab, setActiveTab] = useState('overview');
    const [performanceData, setPerformanceData] = useState({
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        ventes: [120, 190, 300, 500, 200, 300, 450],
        revenus: [1200, 1900, 3000, 5000, 2000, 3000, 4500],
    });

    // Gestion des erreurs et chargement
    useEffect(() => {
        if (statsErreur) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message:
                    statsErreur.message ||
                    'Impossible de charger les données du dashboard',
            });
        }
    }, [statsErreur, addToast]);

    // Simulation mises à jour temps réel
    useEffect(() => {
        const cleanup = simulateRealTimeUpdates();
        return cleanup;
    }, []);

    const simulateRealTimeUpdates = () => {
        const interval = setInterval(() => {
            // Mise à jour simulée (optionnel, à adapter selon vos besoins)
        }, 30000);

        return () => clearInterval(interval);
    };

    // Formatage des nombres
    const formatNumber = num => new Intl.NumberFormat('fr-FR').format(num);
    const formatCurrency = amount =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
        }).format(amount);

    // Couleurs pour les cartes
    const cardColors = [
        'linear-gradient(135deg, #16213e 0%, #2d3a8c 100%)',
        'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
        'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)',
        'linear-gradient(135deg, #01579b 0%, #0288d1 100%)',
        'linear-gradient(135deg, #006064 0%, #0097a7 100%)',
        'linear-gradient(135deg, #004d40 0%, #00796b 100%)',
    ];

    // Vérification du chargement
    if (statsChargement || suppChargement) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-text">
                        Chargement du dashboard...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-vendeur">
            {/* HEADER MODERNE */}
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="welcome-section">
                        <h1 className="welcome-title">
                            <span className="greeting">Bonjour</span>
                            <span className="user-name">
                                <strong
                                    style={{
                                        fontSize: '1.5em',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {user?.prenom || 'Vendeur'}
                                </strong>{' '}
                                👋
                            </span>
                        </h1>
                        <p className="welcome-subtitle">
                            Voici votre tableau de bord personnel.{' '}
                            <span className="highlight">+12%</span> de ventes
                            cette semaine.
                        </p>
                    </div>

                    <div className="quick-stats">
                        <div className="quick-stat">
                            <FontAwesomeIcon
                                icon={faBolt}
                                className="stat-icon"
                            />
                            <span>
                                Performance: <strong>Élevée</strong>
                            </span>
                        </div>
                        <div className="quick-stat">
                            <FontAwesomeIcon
                                icon={faCalendarAlt}
                                className="stat-icon"
                            />
                            <span>
                                {new Date().toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="header-right">
                    <Link
                        to="/vendeur/produits/nouveau"
                        className="btn-action btn-new-order"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Nouveau Produit</span>
                    </Link>
                    <button
                        className="btn-action btn-refresh"
                        onClick={actualiserStats}
                    >
                        <FontAwesomeIcon icon={faSync} />
                    </button>
                    <button className="btn-action btn-notifications">
                        <FontAwesomeIcon icon={faBell} />
                        <span className="notification-badge">3</span>
                    </button>
                </div>
            </header>

            {/* STATS PRINCIPALES - CARDS MODERNES */}
            <div className="stats-grid">
                {/* Carte 1 : Chiffre d'affaires */}
                <div
                    className="stat-card"
                    style={{ background: cardColors[0] }}
                >
                    <div className="card-decoration">
                        <div className="decoration-circle"></div>
                        <div className="decoration-wave"></div>
                    </div>
                    <div className="stat-content">
                        <div className="stat-header">
                            <FontAwesomeIcon
                                icon={faMoneyBillWave}
                                className="stat-icon"
                            />
                            <div className="stat-trend positive">
                                <FontAwesomeIcon icon={faArrowUp} />
                                <span>+12.5%</span>
                            </div>
                        </div>
                        <div className="stat-value">
                            {formatCurrency(statsVendeur?.chiffreAffaires || 0)}
                        </div>
                        <div className="stat-label">
                            Chiffre d'affaires total
                        </div>
                        <div className="stat-details">
                            <span>
                                Ce mois:{' '}
                                {formatCurrency(
                                    (statsVendeur?.chiffreAffaires || 0) * 0.3
                                )}
                            </span>
                            <FontAwesomeIcon icon={faChartLine} />
                        </div>
                    </div>
                </div>

                {/* Carte 2 : Commandes */}
                <div
                    className="stat-card"
                    style={{ background: cardColors[1] }}
                >
                    <div className="card-decoration">
                        <div className="decoration-circle"></div>
                        <div className="decoration-dots"></div>
                    </div>
                    <div className="stat-content">
                        <div className="stat-header">
                            <FontAwesomeIcon
                                icon={faShoppingCart}
                                className="stat-icon"
                            />
                            <div className="stat-trend positive">
                                <FontAwesomeIcon icon={faArrowUp} />
                                <span>+8.2%</span>
                            </div>
                        </div>
                        <div className="stat-value">
                            {formatNumber(statsVendeur?.totalCommandes || 0)}
                        </div>
                        <div className="stat-label">Commandes totales</div>
                        <div className="stat-details">
                            <span className="badge pending">
                                {statsVendeur?.commandesEnAttente || 0} en
                                attente
                            </span>
                            <span className="badge delivered">
                                {statsVendeur?.commandesLivrees || 0} livrées
                            </span>
                        </div>
                    </div>
                </div>

                {/* Carte 3 : Produits */}
                <div
                    className="stat-card"
                    style={{ background: cardColors[2] }}
                >
                    <div className="card-decoration">
                        <div className="decoration-triangle"></div>
                        <div className="decoration-lines"></div>
                    </div>
                    <div className="stat-content">
                        <div className="stat-header">
                            <FontAwesomeIcon
                                icon={faBox}
                                className="stat-icon"
                            />
                            <div className="stat-trend neutral">
                                <span>±0%</span>
                            </div>
                        </div>
                        <div className="stat-value">
                            {formatNumber(statsVendeur?.totalProduits || 0)}
                        </div>
                        <div className="stat-label">Produits en boutique</div>
                        <div className="stat-details">
                            <div className="product-status">
                                <span className="status active">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    {statsVendeur?.produitsActifs || 0} actifs
                                </span>
                                <span className="status pending">
                                    <FontAwesomeIcon icon={faClock} />
                                    {statsVendeur?.produitsEnAttente || 0} en
                                    attente
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carte 4 : Performance */}
                <div
                    className="stat-card"
                    style={{ background: cardColors[3] }}
                >
                    <div className="card-decoration">
                        <div className="decoration-squares"></div>
                    </div>
                    <div className="stat-content">
                        <div className="stat-header">
                            <FontAwesomeIcon
                                icon={faChartPie}
                                className="stat-icon"
                            />
                            <div className="stat-trend positive">
                                <FontAwesomeIcon icon={faArrowUp} />
                                <span>+5.3%</span>
                            </div>
                        </div>
                        <div className="stat-value">
                            {(statsVendeur?.tauxConversion || 0).toFixed(1)}%
                        </div>
                        <div className="stat-label">Taux de conversion</div>
                        <div className="stat-details">
                            <div className="performance-metrics">
                                <div className="metric">
                                    <span className="metric-label">
                                        Panier moyen
                                    </span>
                                    <span className="metric-value">
                                        {formatCurrency(
                                            statsVendeur?.panierMoyen || 0
                                        )}
                                    </span>
                                </div>
                                <div className="metric">
                                    <span className="metric-label">
                                        Nouveaux clients
                                    </span>
                                    <span className="metric-value">
                                        +{statsVendeur?.nouveauxClients || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENU PRINCIPAL - 2 COLONNES */}
            <div className="dashboard-content">
                {/* COLONNE GAUCHE */}
                <div className="content-left">
                    {/* GRAPHIQUE PERFORMANCE */}
                    <div className="chart-section">
                        <div className="section-header">
                            <h3>
                                <FontAwesomeIcon icon={faChartLine} />
                                Performance des ventes
                            </h3>
                            <div className="chart-controls">
                                <button
                                    className={`time-filter ${activeTab === 'day' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('day')}
                                >
                                    Jour
                                </button>
                                <button
                                    className={`time-filter ${activeTab === 'week' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('week')}
                                >
                                    Semaine
                                </button>
                                <button
                                    className={`time-filter ${activeTab === 'month' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('month')}
                                >
                                    Mois
                                </button>
                            </div>
                        </div>
                        <div className="chart-container">
                            <div className="chart-placeholder">
                                <div className="chart-bars">
                                    {performanceData.ventes.map(
                                        (vente, index) => (
                                            <div
                                                key={index}
                                                className="chart-bar-container"
                                            >
                                                <div
                                                    className="chart-bar"
                                                    style={{
                                                        height: `${(vente / 600) * 100}%`,
                                                    }}
                                                    data-value={formatCurrency(
                                                        performanceData.revenus[
                                                            index
                                                        ]
                                                    )}
                                                >
                                                    <div className="bar-tooltip">
                                                        {
                                                            performanceData
                                                                .labels[index]
                                                        }
                                                        :{' '}
                                                        {formatCurrency(
                                                            performanceData
                                                                .revenus[index]
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="chart-label">
                                                    {
                                                        performanceData.labels[
                                                            index
                                                        ]
                                                    }
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                                <div className="chart-legend">
                                    <div className="legend-item">
                                        <div className="legend-color sales"></div>
                                        <span>Ventes (unités)</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-color revenue"></div>
                                        <span>Revenus (XOF)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRODUITS POPULAIRES */}
                    <div className="products-section">
                        <div className="section-header">
                            <h3>
                                <FontAwesomeIcon icon={faStar} />
                                Produits populaires
                            </h3>
                            <Link to="/vendeur/produits" className="view-all">
                                Voir tout{' '}
                                <FontAwesomeIcon
                                    icon={faArrowUp}
                                    rotation={90}
                                />
                            </Link>
                        </div>
                        <div className="products-grid">
                            {produitsPopulaires?.map(produit => (
                                <div key={produit.id} className="product-card">
                                    <div className="product-rank">
                                        <div className="rank-badge">
                                            #{produit.id}
                                        </div>
                                        <div className="trend-indicator positive">
                                            <FontAwesomeIcon icon={faArrowUp} />
                                        </div>
                                    </div>
                                    <div className="product-info">
                                        <h4 className="product-name">
                                            {produit.nom}
                                        </h4>
                                        <div className="product-stats">
                                            <div className="stat">
                                                <FontAwesomeIcon
                                                    icon={faShoppingCart}
                                                />
                                                <span>
                                                    {produit.ventes || 0} ventes
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <FontAwesomeIcon
                                                    icon={faMoneyBillWave}
                                                />
                                                <span>
                                                    {formatCurrency(
                                                        produit.revenu || 0
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="product-actions">
                                        <button
                                            className="btn-icon"
                                            title="Voir détails"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button
                                            className="btn-icon"
                                            title="Éditer"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE */}
                <div className="content-right">
                    {/* COMMANDES RÉCENTES */}
                    <div className="orders-section">
                        <div className="section-header">
                            <h3>
                                <FontAwesomeIcon icon={faClock} />
                                Commandes récentes
                            </h3>
                            <Link to="/vendeur/commandes" className="view-all">
                                <FontAwesomeIcon icon={faFilter} />
                                Filtrer
                            </Link>
                        </div>
                        <div className="orders-list">
                            {commandesRecentes?.length === 0 ? (
                                <div className="empty-state">
                                    <FontAwesomeIcon
                                        icon={faShoppingCart}
                                        size="3x"
                                    />
                                    <p>Aucune commande récente</p>
                                </div>
                            ) : (
                                commandesRecentes?.slice(0, 6).map(commande => (
                                    <div
                                        key={commande._id}
                                        className="order-card"
                                    >
                                        <div className="order-header">
                                            <div className="order-id">
                                                #
                                                {commande.numeroCommande?.slice(
                                                    -6
                                                ) || commande._id.slice(-6)}
                                            </div>
                                            <div
                                                className={`order-status ${commande.statut}`}
                                            >
                                                {commande.statut ||
                                                    'En attente'}
                                            </div>
                                        </div>
                                        <div className="order-details">
                                            <div className="detail">
                                                <FontAwesomeIcon
                                                    icon={faCalendarAlt}
                                                />
                                                <span>
                                                    {new Date(
                                                        commande.createdAt
                                                    ).toLocaleDateString(
                                                        'fr-FR'
                                                    )}
                                                </span>
                                            </div>
                                            <div className="detail">
                                                <FontAwesomeIcon
                                                    icon={faMoneyBillWave}
                                                />
                                                <span>
                                                    {formatCurrency(
                                                        commande.montantTotal ||
                                                            0
                                                    )}
                                                </span>
                                            </div>
                                            <div className="detail">
                                                <FontAwesomeIcon icon={faBox} />
                                                <span>
                                                    {commande.articles
                                                        ?.length || 0}{' '}
                                                    articles
                                                </span>
                                            </div>
                                        </div>
                                        <div className="order-actions">
                                            <Link
                                                to={`/vendeur/commandes/${commande._id}`}
                                                className="btn-view"
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                                Voir
                                            </Link>
                                            <button className="btn-track">
                                                <FontAwesomeIcon
                                                    icon={faTruck}
                                                />
                                                Suivre
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ACTIONS RAPIDES */}
                    <div className="quick-actions-section">
                        <div className="section-header">
                            <h3>
                                <FontAwesomeIcon icon={faBolt} />
                                Actions rapides
                            </h3>
                        </div>
                        <div className="actions-grid">
                            <Link
                                to="/vendeur/produits/nouveau"
                                className="action-card"
                            >
                                <div className="action-icon add">
                                    <FontAwesomeIcon icon={faPlus} />
                                </div>
                                <div className="action-content">
                                    <h4>Ajouter un produit</h4>
                                    <p>Créer une nouvelle fiche produit</p>
                                </div>
                            </Link>

                            <Link
                                to="/vendeur/statistiques"
                                className="action-card"
                            >
                                <div className="action-icon stats">
                                    <FontAwesomeIcon icon={faChartPie} />
                                </div>
                                <div className="action-content">
                                    <h4>Voir les rapports</h4>
                                    <p>Analyser vos performances</p>
                                </div>
                            </Link>

                            <Link
                                to="/vendeur/messages"
                                className="action-card"
                            >
                                <div className="action-icon messages">
                                    <FontAwesomeIcon icon={faMessage} />
                                </div>
                                <div className="action-content">
                                    <h4>Messages</h4>
                                    <p>3 messages non lus</p>
                                </div>
                            </Link>

                            <Link
                                to="/vendeur/boutique"
                                className="action-card"
                            >
                                <div className="action-icon settings">
                                    <FontAwesomeIcon icon={faCog} />
                                </div>
                                <div className="action-content">
                                    <h4>Ma Boutique</h4>
                                    <p>Configurer votre boutique</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* NOTIFICATIONS */}
                    <div className="notifications-section">
                        <div className="section-header">
                            <h3>
                                <FontAwesomeIcon icon={faBell} />
                                Alertes importantes
                            </h3>
                            <span className="badge-count">3</span>
                        </div>
                        <div className="notifications-list">
                            <div className="notification-item urgent">
                                <div className="notification-icon">
                                    <FontAwesomeIcon
                                        icon={faExclamationTriangle}
                                    />
                                </div>
                                <div className="notification-content">
                                    <h5>Stock faible</h5>
                                    <p>2 produits en rupture de stock</p>
                                    <span className="notification-time">
                                        Il y a 2h
                                    </span>
                                </div>
                            </div>

                            <div className="notification-item info">
                                <div className="notification-icon">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                </div>
                                <div className="notification-content">
                                    <h5>Produit approuvé</h5>
                                    <p>
                                        "Ensemble sport" validé par le
                                        modérateur
                                    </p>
                                    <span className="notification-time">
                                        Il y a 5h
                                    </span>
                                </div>
                            </div>

                            <div className="notification-item warning">
                                <div className="notification-icon">
                                    <FontAwesomeIcon icon={faClock} />
                                </div>
                                <div className="notification-content">
                                    <h5>Commande en retard</h5>
                                    <p>
                                        Commande #ORD-789456 en attente
                                        d'expédition
                                    </p>
                                    <span className="notification-time">
                                        Hier
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER DASHBOARD */}
            <footer className="dashboard-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>
                            <FontAwesomeIcon icon={faInfoCircle} />
                            Aide & Support
                        </h4>
                        <p>
                            Besoin d'aide ? Consultez notre centre d'aide ou
                            contactez le support.
                        </p>
                        <button className="btn-help">
                            <FontAwesomeIcon icon={faQuestionCircle} />
                            Centre d'aide
                        </button>
                    </div>

                    <div className="footer-section">
                        <h4>
                            <FontAwesomeIcon icon={faDownload} />
                            Exporter les données
                        </h4>
                        <p>
                            Téléchargez vos rapports de vente et statistiques.
                        </p>
                        <div className="export-buttons">
                            <button className="btn-export">
                                <FontAwesomeIcon icon={faDownload} />
                                PDF
                            </button>
                            <button className="btn-export">
                                <FontAwesomeIcon icon={faDownload} />
                                CSV
                            </button>
                            <button className="btn-export">
                                <FontAwesomeIcon icon={faDownload} />
                                Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="copyright">
                        © {new Date().getFullYear()} Plateforme Vendeur. Tous
                        droits réservés.
                    </p>
                    <div className="footer-links">
                        <Link to="/confidentialite">Confidentialité</Link>
                        <Link to="/conditions">Conditions</Link>
                        <Link to="/aide">Aide</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DashboardVendeur;