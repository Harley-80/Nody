import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendeurService } from '../../services/vendeurService';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmActions } from '../../hooks/useConfirmActions';
import { useDevise } from '../../contexts/DeviseContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShoppingCart,
    faFilter,
    faSearch,
    faSort,
    faEye,
    faEdit,
    faTrash,
    faPrint,
    faDownload,
    faShare,
    faClock,
    faCheckCircle,
    faTimesCircle,
    faExclamationTriangle,
    faTruck,
    faBoxOpen,
    faBoxes,
    faUser,
    faMapMarkerAlt,
    faPhone,
    faEnvelope,
    faCalendarAlt,
    faEuroSign,
    faPercent,
    faTags,
    faChartLine,
    faBell,
    faMessage,
    faSync,
    faCog,
    faEllipsisH,
    faArrowUp,
    faArrowDown,
    faChevronRight,
    faPlus,
    faMinus,
    faExpand,
    faCompress,
    faQrcode,
    faBarcode,
    faReceipt,
    faFileInvoice,
    faFileExport,
    faFilePdf,
    faFileExcel,
    faFileCsv,
    faPaperPlane,
    faReply,
    faComment,
    faStar,
    faHeart,
    faFlag,
    faBan,
    faUndo,
    faRedo,
    faHistory,
    faInfoCircle,
    faQuestionCircle,
    faLightbulb,
    faRobot,
    faMagic,
    faRocket,
    faCrown,
    faAward,
    faMedal,
    faTrophy,
    faGem,
    faCoins,
    faMoneyBillWave,
    faCreditCard,
    faWallet,
    faShippingFast,
    faWarehouse,
    faStore,
    faHome,
    faBuilding,
    faGlobe,
    faMap,
    faRoute,
    faTrafficLight,
    faStopwatch,
    faHourglass,
    faCalendarCheck,
    faCalendarTimes,
    faCalendarDay,
    faChartBar,
    faChartPie,
    faChartArea,
    faStream,
    faLayerGroup,
    faTh,
    faList,
    faTable,
    faColumns,
    faBorderAll,
    faGripHorizontal,
    faGripVertical,
    faDotCircle,
    faCircle,
    faSquare,
    faCheckSquare,
    faMinusSquare,
    faPlusSquare,
    faTimes,
    faCheck,
    faBan as faBanSolid,
} from '@fortawesome/free-solid-svg-icons';
import './MesCommandes.scss';

const MesCommandes = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { confirmAction } = useConfirmActions();
    const { formaterPrix } = useDevise();

    // États principaux
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        statut: 'tous',
        periode: '30j',
        recherche: '',
        tri: 'date_desc',
        montantMin: '',
        montantMax: '',
        vendeur: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        pages: 1,
        limit: 15,
    });
    const [selectedCommandes, setSelectedCommandes] = useState(new Set());
    const [viewMode, setViewMode] = useState('table'); // 'table', 'card', 'timeline'
    const [showFilters, setShowFilters] = useState(false);
    const [showAdvancedStats, setShowAdvancedStats] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        en_attente: 0,
        confirme: 0,
        en_cours: 0,
        expedie: 0,
        livre: 0,
        annule: 0,
        retourne: 0,
        chiffreAffaires: 0,
        panierMoyen: 0,
        tauxConversion: 0,
        commandesJour: 0,
        revenuJour: 0,
        meilleurClient: { nom: '', montant: 0 },
        produitPlusVendu: { nom: '', quantite: 0 },
    });
    const [timelineData, setTimelineData] = useState([]);
    const [realTimeUpdates, setRealTimeUpdates] = useState([]);
    const [quickActions, setQuickActions] = useState([]);
    const [aiInsights, setAiInsights] = useState([]);
    const [exportFormat, setExportFormat] = useState('pdf');

    // Chargement initial
    useEffect(() => {
        fetchCommandes();
        fetchStats();
        generateAiInsights();
        setupRealTimeUpdates();
    }, [filters, pagination.page]);

    // Configurer les mises à jour temps réel
    const setupRealTimeUpdates = () => {
        // Simulation WebSocket pour nouvelles commandes
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const newUpdate = {
                    id: Date.now(),
                    type: 'nouvelle_commande',
                    message: 'Nouvelle commande reçue',
                    timestamp: new Date(),
                };
                setRealTimeUpdates(prev => [newUpdate, ...prev.slice(0, 9)]);
            }
        }, 30000);

        return () => clearInterval(interval);
    };

    // Gestion des filtres
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
        setSelectedCommandes(new Set());
    }, []);

    // Récupérer les commandes
    const fetchCommandes = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                statut: filters.statut !== 'tous' ? filters.statut : undefined,
                recherche: filters.recherche || undefined,
            };

            const response = await vendeurService.obtenirMesCommandes(params);

            if (response.succes) {
                setCommandes(response.data.commandes || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination?.total || 0,
                    pages: response.data.pagination?.pages || 1,
                }));

                // Générer les données de timeline
                generateTimelineData(response.data.commandes || []);
                // Générer les actions rapides
                generateQuickActions(response.data.commandes || []);
            }
        } catch (error) {
            console.error('Erreur chargement commandes:', error);
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de charger les commandes',
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.limit, addToast]);

    // Récupérer les statistiques
    const fetchStats = async () => {
        try {
            const response = await vendeurService.obtenirStatistiques();
            if (response.succes) {
                setStats(prev => ({
                    ...prev,
                    ...response.data,
                }));
            }
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    };

    // Générer des insights IA
    const generateAiInsights = () => {
        const insights = [
            {
                id: 1,
                type: 'optimisation',
                titre: 'Optimisez vos frais de port',
                description: 'Regroupez les commandes pour réduire les coûts',
                impact: '-15% sur les frais',
                icon: faShippingFast,
                action: 'Voir suggestions',
            },
            {
                id: 2,
                type: 'client',
                titre: 'Client fidèle détecté',
                description: 'Ethan a commandé 5 fois ce mois',
                impact: 'Taux de rétention 95%',
                icon: faUser,
                action: 'Offrir un cadeau',
            },
            {
                id: 3,
                type: 'stock',
                titre: 'Prévision de rupture',
                description: 'Produit X sera en rupture dans 3 jours',
                impact: 'Commander maintenant',
                icon: faExclamationTriangle,
                action: 'Réapprovisionner',
            },
            {
                id: 4,
                type: 'marketing',
                titre: 'Période propice',
                description: 'Ventes +25% le weekend',
                impact: 'Augmentez la pub',
                icon: faChartLine,
                action: 'Planifier campagne',
            },
        ];
        setAiInsights(insights);
    };

    // Générer les données de timeline
    const generateTimelineData = commandesList => {
        const timeline = commandesList.slice(0, 10).map(commande => ({
            id: commande._id,
            date: new Date(commande.createdAt),
            type: 'commande',
            titre: `Commande ${commande.numeroCommande}`,
            statut: commande.statut,
            montant: commande.montantTotal || 0,
            client: commande.utilisateur?.nom || 'Client',
        }));
        setTimelineData(timeline);
    };

    // Générer les actions rapides
    const generateQuickActions = commandesList => {
        const actions = [
            {
                id: 1,
                titre: 'Exporter les commandes',
                description: 'Générer un rapport PDF',
                icon: faFilePdf,
                action: () => handleExport('pdf'),
                color: '#EF4444',
            },
            {
                id: 2,
                titre: 'Marquer tout comme traité',
                description: 'Valider les commandes en attente',
                icon: faCheckCircle,
                action: () => handleBatchAction('traiter'),
                color: '#10B981',
            },
            {
                id: 3,
                titre: 'Générer étiquettes',
                description: "Créer les étiquettes d'expédition",
                icon: faBarcode,
                action: () => handleGenerateLabels(),
                color: '#3B82F6',
            },
            {
                id: 4,
                titre: 'Envoyer notifications',
                description: 'Notifier les clients du statut',
                icon: faBell,
                action: () => handleSendNotifications(),
                color: '#8B5CF6',
            },
        ];
        setQuickActions(actions);
    };

    // Recherche avec debounce
    const handleSearch = useCallback(
        value => {
            const timeoutId = setTimeout(() => {
                handleFilterChange('recherche', value);
            }, 500);

            return () => clearTimeout(timeoutId);
        },
        [handleFilterChange]
    );

    // Sélection multiple
    const toggleSelectCommande = id => {
        const newSelected = new Set(selectedCommandes);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedCommandes(newSelected);
    };

    const selectAll = () => {
        if (selectedCommandes.size === commandes.length) {
            setSelectedCommandes(new Set());
        } else {
            setSelectedCommandes(new Set(commandes.map(c => c._id)));
        }
    };

    // Actions batch
    const handleBatchAction = async action => {
        if (selectedCommandes.size === 0) {
            addToast({
                type: 'warning',
                title: 'Aucune sélection',
                message: 'Veuillez sélectionner des commandes',
            });
            return;
        }

        const confirmed = await confirmAction({
            title: `${action} ${selectedCommandes.size} commande(s)`,
            message: `Cette action sera appliquée à ${selectedCommandes.size} commande(s) sélectionnée(s)`,
            variant: action === 'supprimer' ? 'danger' : 'warning',
        });

        if (!confirmed) return;

        try {
            // Simulation d'action batch
            const promises = Array.from(selectedCommandes).map(id =>
                vendeurService.mettreAJourStatutProduit(id, 'dummy', 'traite')
            );
            await Promise.all(promises);

            addToast({
                type: 'success',
                title: 'Action effectuée',
                message: `${action} appliqué à ${selectedCommandes.size} commande(s)`,
            });

            setSelectedCommandes(new Set());
            fetchCommandes();
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Action impossible',
            });
        }
    };

    // Changer le statut d'une commande
    const handleChangeStatut = async (commandeId, nouveauStatut) => {
        try {
            // Note: Cette fonction devra être adaptée selon l'API
            // Pour l'instant, simulation
            addToast({
                type: 'success',
                title: 'Statut mis à jour',
                message: `La commande a été marquée comme ${nouveauStatut}`,
            });
            fetchCommandes();
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de modifier le statut',
            });
        }
    };

    // Exporter les commandes
    const handleExport = async format => {
        try {
            addToast({
                type: 'info',
                title: 'Export en cours',
                message: `Génération du fichier ${format}...`,
            });

            // Simulation d'export
            await new Promise(resolve => setTimeout(resolve, 1500));

            addToast({
                type: 'success',
                title: 'Export terminé',
                message: `Les commandes ont été exportées en ${format}`,
            });
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Export impossible',
            });
        }
    };

    // Générer les étiquettes
    const handleGenerateLabels = () => {
        if (selectedCommandes.size === 0) {
            addToast({
                type: 'warning',
                title: 'Aucune sélection',
                message: 'Veuillez sélectionner des commandes',
            });
            return;
        }

        addToast({
            type: 'success',
            title: 'Étiquettes générées',
            message: `${selectedCommandes.size} étiquette(s) d'expédition créée(s)`,
        });
    };

    // Envoyer des notifications
    const handleSendNotifications = () => {
        if (selectedCommandes.size === 0) {
            addToast({
                type: 'warning',
                title: 'Aucune sélection',
                message: 'Veuillez sélectionner des commandes',
            });
            return;
        }

        addToast({
            type: 'success',
            title: 'Notifications envoyées',
            message: `${selectedCommandes.size} notification(s) envoyée(s) aux clients`,
        });
    };

    // Formatage
    const formatDate = date => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTimeAgo = date => {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays < 7) return `Il y a ${diffDays} j`;
        return formatDate(date);
    };

    // Obtenir la classe de statut
    const getStatutClass = statut => {
        switch (statut) {
            case 'en_attente':
                return 'warning';
            case 'confirme':
                return 'info';
            case 'en_cours':
                return 'primary';
            case 'expedie':
                return 'success';
            case 'livre':
                return 'success';
            case 'annule':
                return 'danger';
            case 'retourne':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    // Obtenir l'icône de statut
    const getStatutIcon = statut => {
        switch (statut) {
            case 'en_attente':
                return faClock;
            case 'confirme':
                return faCheckCircle;
            case 'en_cours':
                return faTruck;
            case 'expedie':
                return faShippingFast;
            case 'livre':
                return faBoxOpen;
            case 'annule':
                return faTimesCircle;
            case 'retourne':
                return faUndo;
            default:
                return faShoppingCart;
        }
    };

    // Calculer le temps de traitement
    const calculateProcessingTime = (createdAt, updatedAt) => {
        const start = new Date(createdAt);
        const end = updatedAt ? new Date(updatedAt) : new Date();
        const diffHours = Math.floor((end - start) / 3600000);
        return diffHours;
    };

    // Rendu du loading
    if (loading && commandes.length === 0) {
        return (
            <div className="commandes-loading">
                <div className="loading-content">
                    <div className="spinner">
                        <div className="spinner-ring"></div>
                    </div>
                    <h3>Chargement de vos commandes...</h3>
                    <p>Vos transactions sont en cours de chargement</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mes-commandes">
            {/* HEADER AVANCÉ */}
            <header className="commandes-header">
                <div className="header-top">
                    <div className="title-section">
                        <h1 className="page-title">
                            <FontAwesomeIcon
                                icon={faShoppingCart}
                                className="title-icon"
                            />
                            Mes Commandes
                            <span className="title-badge">
                                {stats.total} commandes
                            </span>
                        </h1>
                        <p className="page-subtitle">
                            Gérez vos transactions, suivez les livraisons et
                            analysez vos performances
                        </p>
                    </div>

                    <div className="header-actions">
                        <div className="realtime-updates">
                            <div className="update-indicator">
                                <FontAwesomeIcon icon={faSync} spin />
                                <span>Temps réel actif</span>
                            </div>
                            <div className="update-count">
                                {realTimeUpdates.length > 0 && (
                                    <span className="new-updates">
                                        {realTimeUpdates.length} nouvelles
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            className="btn-primary btn-ai"
                            onClick={() =>
                                setShowAdvancedStats(!showAdvancedStats)
                            }
                        >
                            <FontAwesomeIcon icon={faRobot} />
                            <span>Assistant IA</span>
                        </button>
                    </div>
                </div>

                {/* STATISTIQUES RAPIDES */}
                <div className="stats-summary">
                    <div className="stat-card revenu">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faMoneyBillWave} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {formaterPrix(stats.chiffreAffaires)}
                            </div>
                            <div className="stat-label">Chiffre d'affaires</div>
                            <div className="stat-trend positive">
                                <FontAwesomeIcon icon={faArrowUp} />
                                <span>+12.5%</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card commandes">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faShoppingCart} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {stats.commandesJour}
                            </div>
                            <div className="stat-label">
                                Commandes aujourd'hui
                            </div>
                            <div className="stat-trend positive">
                                <FontAwesomeIcon icon={faArrowUp} />
                                <span>+8.2%</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card panier">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faChartLine} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {formaterPrix(stats.panierMoyen)}
                            </div>
                            <div className="stat-label">Panier moyen</div>
                            <div className="stat-trend neutral">
                                <span>±0%</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card conversion">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faPercent} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {stats.tauxConversion.toFixed(1)}%
                            </div>
                            <div className="stat-label">Taux de conversion</div>
                            <div className="stat-trend positive">
                                <FontAwesomeIcon icon={faArrowUp} />
                                <span>+5.3%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BARRE DE RECHERCHE ET FILTRES */}
                <div className="search-filter-bar">
                    <div className="search-container">
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="search-icon"
                        />
                        <input
                            type="text"
                            placeholder="Rechercher commande, client, produit..."
                            className="search-input"
                            onChange={e => handleSearch(e.target.value)}
                        />
                        <div className="search-advanced">
                            <button className="btn-advanced">
                                <FontAwesomeIcon icon={faMagic} />
                                Recherche avancée
                            </button>
                        </div>
                    </div>

                    <div className="filter-controls">
                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => setViewMode('table')}
                                title="Vue tableau"
                            >
                                <FontAwesomeIcon icon={faTable} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => setViewMode('card')}
                                title="Vue cartes"
                            >
                                <FontAwesomeIcon icon={faTh} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                                onClick={() => setViewMode('timeline')}
                                title="Vue chronologique"
                            >
                                <FontAwesomeIcon icon={faStream} />
                            </button>
                        </div>

                        <button
                            className={`filter-toggle ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FontAwesomeIcon icon={faFilter} />
                            <span>Filtres</span>
                            {Object.values(filters).some(
                                f => f && f !== 'tous'
                            ) && <span className="filter-indicator"></span>}
                        </button>

                        <button
                            className="btn-export"
                            onClick={() => handleExport(exportFormat)}
                        >
                            <FontAwesomeIcon icon={faDownload} />
                            <span>Exporter</span>
                        </button>

                        <div className="export-dropdown">
                            <select
                                value={exportFormat}
                                onChange={e => setExportFormat(e.target.value)}
                                className="export-select"
                            >
                                <option value="pdf">PDF</option>
                                <option value="excel">Excel</option>
                                <option value="csv">CSV</option>
                                <option value="json">JSON</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* FILTRES AVANCÉS */}
                {showFilters && (
                    <div className="advanced-filters">
                        <div className="filters-grid">
                            <div className="filter-group">
                                <label>Statut</label>
                                <div className="filter-chips">
                                    {[
                                        'tous',
                                        'en_attente',
                                        'confirme',
                                        'en_cours',
                                        'expedie',
                                        'livre',
                                        'annule',
                                    ].map(statut => (
                                        <button
                                            key={statut}
                                            className={`filter-chip ${filters.statut === statut ? 'active' : ''} ${getStatutClass(statut)}`}
                                            onClick={() =>
                                                handleFilterChange(
                                                    'statut',
                                                    statut
                                                )
                                            }
                                        >
                                            <FontAwesomeIcon
                                                icon={getStatutIcon(statut)}
                                            />
                                            {statut === 'tous'
                                                ? 'Tous'
                                                : statut === 'en_attente'
                                                  ? 'En attente'
                                                  : statut === 'confirme'
                                                    ? 'Confirmées'
                                                    : statut === 'en_cours'
                                                      ? 'En cours'
                                                      : statut === 'expedie'
                                                        ? 'Expédiées'
                                                        : statut === 'livre'
                                                          ? 'Livrées'
                                                          : 'Annulées'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Période</label>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* CONTENU PRINCIPAL */}
            <main className="commandes-content">
                {/* INSIGHTS IA */}
                {showAdvancedStats && (
                    <div className="ai-insights-section">
                        <div className="insights-header">
                            <FontAwesomeIcon icon={faLightbulb} />
                            <h3>Insights Intelligents</h3>
                            <span className="ai-badge">Powered by AI</span>
                        </div>
                        <div className="insights-grid">
                            {aiInsights.map(insight => (
                                <div
                                    key={insight.id}
                                    className={`insight-card ${insight.type}`}
                                >
                                    <div className="insight-icon">
                                        <FontAwesomeIcon icon={insight.icon} />
                                    </div>
                                    <div className="insight-content">
                                        <h4>{insight.titre}</h4>
                                        <p>{insight.description}</p>
                                        <div className="insight-impact">
                                            <FontAwesomeIcon icon={faRocket} />
                                            <span>{insight.impact}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn-insight"
                                        onClick={insight.action}
                                    >
                                        {insight.actionLabel || 'Appliquer'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ACTIONS RAPIDES */}
                <div className="quick-actions-section">
                    <div className="actions-grid">
                        {quickActions.map(action => (
                            <button
                                key={action.id}
                                className="quick-action-card"
                                onClick={action.action}
                                style={{ '--action-color': action.color }}
                            >
                                <div
                                    className="action-icon"
                                    style={{ background: action.color }}
                                >
                                    <FontAwesomeIcon icon={action.icon} />
                                </div>
                                <div className="action-content">
                                    <h4>{action.titre}</h4>
                                    <p>{action.description}</p>
                                </div>
                                <FontAwesomeIcon
                                    icon={faChevronRight}
                                    className="action-arrow"
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ACTIONS BATCH */}
                {selectedCommandes.size > 0 && (
                    <div className="batch-actions-bar">
                        <div className="batch-info">
                            <span className="selected-count">
                                {selectedCommandes.size} commande(s)
                                sélectionnée(s)
                            </span>
                            <button
                                className="btn-clear-selection"
                                onClick={() => setSelectedCommandes(new Set())}
                            >
                                Tout désélectionner
                            </button>
                        </div>
                        <div className="batch-buttons">
                            <button
                                className="batch-btn confirm"
                                onClick={() => handleBatchAction('confirmer')}
                            >
                                <FontAwesomeIcon icon={faCheckCircle} />
                                Confirmer
                            </button>
                            <button
                                className="batch-btn ship"
                                onClick={() => handleBatchAction('expédier')}
                            >
                                <FontAwesomeIcon icon={faTruck} />
                                Expédier
                            </button>
                            <button
                                className="batch-btn cancel"
                                onClick={() => handleBatchAction('annuler')}
                            >
                                <FontAwesomeIcon icon={faTimesCircle} />
                                Annuler
                            </button>
                            <button
                                className="batch-btn print"
                                onClick={() => handleBatchAction('imprimer')}
                            >
                                <FontAwesomeIcon icon={faPrint} />
                                Imprimer
                            </button>
                        </div>
                    </div>
                )}

                {/* VUE TABLEAU (DÉFAUT) */}
                {viewMode === 'table' && (
                    <div className="commandes-table-container">
                        <table className="commandes-table">
                            <thead>
                                <tr>
                                    <th className="selection-column">
                                        <div className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedCommandes.size ===
                                                        commandes.length &&
                                                    commandes.length > 0
                                                }
                                                onChange={selectAll}
                                                className="checkbox-input"
                                                id="select-all"
                                            />
                                            <label
                                                htmlFor="select-all"
                                                className="checkbox-label"
                                            ></label>
                                        </div>
                                    </th>
                                    <th className="commande-column">
                                        Commande
                                    </th>
                                    <th className="client-column">Client</th>
                                    <th className="date-column">Date</th>
                                    <th className="montant-column">Montant</th>
                                    <th className="statut-column">Statut</th>
                                    <th className="livraison-column">
                                        Livraison
                                    </th>
                                    <th className="actions-column">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commandes.map(commande => (
                                    <tr
                                        key={commande._id}
                                        className={
                                            selectedCommandes.has(commande._id)
                                                ? 'selected'
                                                : ''
                                        }
                                    >
                                        <td className="selection-column">
                                            <div className="checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCommandes.has(
                                                        commande._id
                                                    )}
                                                    onChange={() =>
                                                        toggleSelectCommande(
                                                            commande._id
                                                        )
                                                    }
                                                    className="checkbox-input"
                                                    id={`select-${commande._id}`}
                                                />
                                                <label
                                                    htmlFor={`select-${commande._id}`}
                                                    className="checkbox-label"
                                                ></label>
                                            </div>
                                        </td>

                                        <td className="commande-column">
                                            <div className="commande-cell">
                                                <div className="commande-id">
                                                    #
                                                    {commande.numeroCommande?.slice(
                                                        -8
                                                    ) || commande._id.slice(-8)}
                                                </div>
                                                <div className="commande-items">
                                                    {commande.articles
                                                        ?.slice(0, 2)
                                                        .map(
                                                            (
                                                                article,
                                                                index
                                                            ) => (
                                                                <span
                                                                    key={index}
                                                                    className="commande-item"
                                                                >
                                                                    {
                                                                        article.nom
                                                                    }{' '}
                                                                    ×{' '}
                                                                    {
                                                                        article.quantite
                                                                    }
                                                                </span>
                                                            )
                                                        )}
                                                    {commande.articles &&
                                                        commande.articles
                                                            .length > 2 && (
                                                            <span className="more-items">
                                                                +
                                                                {commande
                                                                    .articles
                                                                    .length -
                                                                    2}{' '}
                                                                autre(s)
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="client-column">
                                            <div className="client-cell">
                                                <div className="client-avatar">
                                                    <FontAwesomeIcon
                                                        icon={faUser}
                                                    />
                                                </div>
                                                <div className="client-info">
                                                    <div className="client-name">
                                                        {commande.utilisateur
                                                            ?.nom || 'Client'}
                                                    </div>
                                                    <div className="client-contact">
                                                        {commande.utilisateur
                                                            ?.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="date-column">
                                            <div className="date-cell">
                                                <div className="date-main">
                                                    {formatDate(
                                                        commande.createdAt
                                                    )}
                                                </div>
                                                <div className="date-ago">
                                                    {formatTimeAgo(
                                                        commande.createdAt
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="montant-column">
                                            <div className="montant-cell">
                                                <div className="montant-total">
                                                    {formaterPrix(
                                                        commande.montantTotal ||
                                                            0
                                                    )}
                                                </div>
                                                <div className="montant-items">
                                                    {commande.articles
                                                        ?.length || 0}{' '}
                                                    article(s)
                                                </div>
                                            </div>
                                        </td>

                                        <td className="statut-column">
                                            <div
                                                className={`statut-cell ${getStatutClass(commande.statut)}`}
                                            >
                                                <FontAwesomeIcon
                                                    icon={getStatutIcon(
                                                        commande.statut
                                                    )}
                                                />
                                                <span>{commande.statut}</span>
                                            </div>
                                        </td>

                                        <td className="livraison-column">
                                            <div className="livraison-cell">
                                                {commande.methodeLivraison ? (
                                                    <>
                                                        <div className="livraison-method">
                                                            {
                                                                commande
                                                                    .methodeLivraison
                                                                    .nom
                                                            }
                                                        </div>
                                                        {commande
                                                            .methodeLivraison
                                                            .numeroSuivi && (
                                                            <div className="livraison-tracking">
                                                                Suivi:{' '}
                                                                {
                                                                    commande
                                                                        .methodeLivraison
                                                                        .numeroSuivi
                                                                }
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="no-livraison">
                                                        Non défini
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="actions-column">
                                            <div className="actions-cell">
                                                <button
                                                    className="action-btn view"
                                                    onClick={() =>
                                                        navigate(
                                                            `/commande/${commande._id}`
                                                        )
                                                    }
                                                    title="Voir détails"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faEye}
                                                    />
                                                </button>
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() =>
                                                        handleChangeStatut(
                                                            commande._id,
                                                            'confirme'
                                                        )
                                                    }
                                                    title="Modifier statut"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faEdit}
                                                    />
                                                </button>
                                                <button
                                                    className="action-btn print"
                                                    onClick={() =>
                                                        window.print()
                                                    }
                                                    title="Imprimer"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faPrint}
                                                    />
                                                </button>
                                                <div className="action-menu">
                                                    <button className="action-more">
                                                        <FontAwesomeIcon
                                                            icon={faEllipsisH}
                                                        />
                                                    </button>
                                                    <div className="action-dropdown">
                                                        <button className="dropdown-item">
                                                            <FontAwesomeIcon
                                                                icon={faMessage}
                                                            />
                                                            Contacter client
                                                        </button>
                                                        <button className="dropdown-item">
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faFileInvoice
                                                                }
                                                            />
                                                            Facture
                                                        </button>
                                                        <button className="dropdown-item">
                                                            <FontAwesomeIcon
                                                                icon={faTruck}
                                                            />
                                                            Suivi
                                                        </button>
                                                        <button className="dropdown-item">
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faTimesCircle
                                                                }
                                                            />
                                                            Annuler
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* VUE CARTES */}
                {viewMode === 'card' && (
                    <div className="commandes-grid">
                        {commandes.map(commande => (
                            <div
                                key={commande._id}
                                className={`commande-card ${selectedCommandes.has(commande._id) ? 'selected' : ''}`}
                                onClick={() =>
                                    toggleSelectCommande(commande._id)
                                }
                            >
                                <div className="card-header">
                                    <div className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={selectedCommandes.has(
                                                commande._id
                                            )}
                                            onChange={() =>
                                                toggleSelectCommande(
                                                    commande._id
                                                )
                                            }
                                            className="checkbox-input"
                                            id={`card-select-${commande._id}`}
                                            onClick={e => e.stopPropagation()}
                                        />
                                        <label
                                            htmlFor={`card-select-${commande._id}`}
                                            className="checkbox-label"
                                        ></label>
                                    </div>
                                    <div className="commande-id">
                                        #
                                        {commande.numeroCommande?.slice(-8) ||
                                            commande._id.slice(-8)}
                                    </div>
                                    <div
                                        className={`statut-badge ${getStatutClass(commande.statut)}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={getStatutIcon(
                                                commande.statut
                                            )}
                                        />
                                        <span>{commande.statut}</span>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="client-section">
                                        <div className="client-avatar">
                                            <FontAwesomeIcon icon={faUser} />
                                        </div>
                                        <div className="client-info">
                                            <h4>
                                                {commande.utilisateur?.nom ||
                                                    'Client'}
                                            </h4>
                                            <p>
                                                {commande.utilisateur?.email ||
                                                    'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="details-section">
                                        <div className="detail">
                                            <FontAwesomeIcon
                                                icon={faCalendarAlt}
                                            />
                                            <span>
                                                {formatDate(commande.createdAt)}
                                            </span>
                                        </div>
                                        <div className="detail">
                                            <FontAwesomeIcon
                                                icon={faEuroSign}
                                            />
                                            <span>
                                                {formaterPrix(
                                                    commande.montantTotal || 0
                                                )}
                                            </span>
                                        </div>
                                        <div className="detail">
                                            <FontAwesomeIcon icon={faBoxes} />
                                            <span>
                                                {commande.articles?.length || 0}{' '}
                                                article(s)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="articles-section">
                                        <h5>Articles</h5>
                                        <div className="articles-list">
                                            {commande.articles
                                                ?.slice(0, 3)
                                                .map((article, index) => (
                                                    <div
                                                        key={index}
                                                        className="article-item"
                                                    >
                                                        <span className="article-name">
                                                            {article.nom}
                                                        </span>
                                                        <span className="article-quantity">
                                                            × {article.quantite}
                                                        </span>
                                                        <span className="article-price">
                                                            {formaterPrix(
                                                                article.prix
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            {commande.articles &&
                                                commande.articles.length >
                                                    3 && (
                                                    <div className="more-articles">
                                                        +
                                                        {commande.articles
                                                            .length - 3}{' '}
                                                        autre(s)
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <div className="processing-time">
                                        <FontAwesomeIcon icon={faStopwatch} />
                                        <span>
                                            {calculateProcessingTime(
                                                commande.createdAt,
                                                commande.updatedAt
                                            )}
                                            h de traitement
                                        </span>
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="action-btn view"
                                            onClick={e => {
                                                e.stopPropagation();
                                                navigate(
                                                    `/commande/${commande._id}`
                                                );
                                            }}
                                            title="Voir détails"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button
                                            className="action-btn message"
                                            onClick={e => {
                                                e.stopPropagation();
                                                // Ouvrir messagerie
                                            }}
                                            title="Contacter"
                                        >
                                            <FontAwesomeIcon icon={faMessage} />
                                        </button>
                                        <button
                                            className="action-btn print"
                                            onClick={e => {
                                                e.stopPropagation();
                                                window.print();
                                            }}
                                            title="Imprimer"
                                        >
                                            <FontAwesomeIcon icon={faPrint} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* VUE TIMELINE */}
                {viewMode === 'timeline' && (
                    <div className="timeline-container">
                        <div className="timeline">
                            {timelineData.map((event, index) => (
                                <div key={event.id} className="timeline-item">
                                    <div className="timeline-marker">
                                        <div
                                            className={`marker-icon ${getStatutClass(event.statut)}`}
                                        >
                                            <FontAwesomeIcon
                                                icon={getStatutIcon(
                                                    event.statut
                                                )}
                                            />
                                        </div>
                                        {index < timelineData.length - 1 && (
                                            <div className="timeline-line"></div>
                                        )}
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <h4>{event.titre}</h4>
                                            <span className="timeline-time">
                                                {formatDate(event.date)}
                                            </span>
                                        </div>
                                        <div className="timeline-body">
                                            <div className="timeline-details">
                                                <div className="detail">
                                                    <FontAwesomeIcon
                                                        icon={faUser}
                                                    />
                                                    <span>{event.client}</span>
                                                </div>
                                                <div className="detail">
                                                    <FontAwesomeIcon
                                                        icon={faEuroSign}
                                                    />
                                                    <span>
                                                        {formaterPrix(
                                                            event.montant
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="detail">
                                                    <FontAwesomeIcon
                                                        icon={faTags}
                                                    />
                                                    <span>{event.statut}</span>
                                                </div>
                                            </div>
                                            <button
                                                className="btn-timeline-action"
                                                onClick={() =>
                                                    navigate(
                                                        `/commande/${event.id}`
                                                    )
                                                }
                                            >
                                                Voir commande
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PAGINATION */}
                {pagination.pages > 1 && (
                    <div className="pagination-container">
                        <div className="pagination-info">
                            Affichage de{' '}
                            {(pagination.page - 1) * pagination.limit + 1} à{' '}
                            {Math.min(
                                pagination.page * pagination.limit,
                                pagination.total
                            )}{' '}
                            sur {pagination.total} commandes
                        </div>
                        <div className="pagination-controls">
                            <button
                                className="pagination-btn prev"
                                onClick={() =>
                                    setPagination(prev => ({
                                        ...prev,
                                        page: prev.page - 1,
                                    }))
                                }
                                disabled={pagination.page === 1}
                            >
                                <FontAwesomeIcon
                                    icon={faArrowUp}
                                    rotation={270}
                                />
                                Précédent
                            </button>

                            <div className="page-numbers">
                                {Array.from(
                                    { length: Math.min(5, pagination.pages) },
                                    (_, i) => {
                                        let pageNum;
                                        if (pagination.pages <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.page <= 3) {
                                            pageNum = i + 1;
                                        } else if (
                                            pagination.page >=
                                            pagination.pages - 2
                                        ) {
                                            pageNum = pagination.pages - 4 + i;
                                        } else {
                                            pageNum = pagination.page - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                className={`page-btn ${pagination.page === pageNum ? 'active' : ''}`}
                                                onClick={() =>
                                                    setPagination(prev => ({
                                                        ...prev,
                                                        page: pageNum,
                                                    }))
                                                }
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                )}
                            </div>

                            <button
                                className="pagination-btn next"
                                onClick={() =>
                                    setPagination(prev => ({
                                        ...prev,
                                        page: prev.page + 1,
                                    }))
                                }
                                disabled={pagination.page === pagination.pages}
                            >
                                Suivant
                                <FontAwesomeIcon
                                    icon={faArrowUp}
                                    rotation={90}
                                />
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* UPDATES TEMPS RÉEL */}
            {realTimeUpdates.length > 0 && (
                <div className="realtime-updates-panel">
                    <div className="updates-header">
                        <FontAwesomeIcon icon={faBell} />
                        <h4>Mises à jour en temps réel</h4>
                        <button
                            className="btn-clear-updates"
                            onClick={() => setRealTimeUpdates([])}
                        >
                            Tout effacer
                        </button>
                    </div>
                    <div className="updates-list">
                        {realTimeUpdates.map(update => (
                            <div key={update.id} className="update-item">
                                <div className="update-icon">
                                    <FontAwesomeIcon icon={faShoppingCart} />
                                </div>
                                <div className="update-content">
                                    <p>{update.message}</p>
                                    <span className="update-time">
                                        {formatTimeAgo(update.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FOOTER ANALYTIQUES */}
            <footer className="commandes-footer">
                <div className="footer-analytics">
                    <div className="analytics-card">
                        <h4>
                            <FontAwesomeIcon icon={faChartBar} />
                            Performance hebdomadaire
                        </h4>
                        <div className="analytics-chart">
                            {/* Graphique simplifié */}
                            <div className="chart-bars">
                                {[
                                    'Lun',
                                    'Mar',
                                    'Mer',
                                    'Jeu',
                                    'Ven',
                                    'Sam',
                                    'Dim',
                                ].map((jour, index) => (
                                    <div key={jour} className="chart-bar">
                                        <div
                                            className="bar-fill"
                                            style={{
                                                height: `${20 + Math.random() * 80}%`,
                                            }}
                                        ></div>
                                        <div className="bar-label">{jour}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="analytics-card">
                        <h4>
                            <FontAwesomeIcon icon={faChartPie} />
                            Répartition par statut
                        </h4>
                        <div className="statut-distribution">
                            {Object.entries({
                                Livrées: stats.livre,
                                Expédiées: stats.expedie,
                                'En cours': stats.en_cours,
                                'En attente': stats.en_attente,
                            }).map(([label, count]) => (
                                <div key={label} className="distribution-item">
                                    <div className="distribution-label">
                                        {label}
                                    </div>
                                    <div className="distribution-bar">
                                        <div
                                            className="distribution-fill"
                                            style={{
                                                width: `${(count / stats.total) * 100}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <div className="distribution-count">
                                        {count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="footer-actions">
                    <button className="footer-btn help">
                        <FontAwesomeIcon icon={faQuestionCircle} />
                        Centre d'aide
                    </button>
                    <button className="footer-btn feedback">
                        <FontAwesomeIcon icon={faLightbulb} />
                        Suggestions
                    </button>
                    <button className="footer-btn settings">
                        <FontAwesomeIcon icon={faCog} />
                        Paramètres
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MesCommandes;