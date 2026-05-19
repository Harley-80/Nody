import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendeurService } from '../../services/vendeurService';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmActions } from '../../hooks/useConfirmActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faSearch,
    faFilter,
    faSort,
    faEye,
    faEdit,
    faTrash,
    faCheckCircle,
    faClock,
    faTimesCircle,
    faBox,
    faTags,
    faChartLine,
    faStore,
    faUpload,
    faDownload,
    faCopy,
    faShare,
    faHeart,
    faStar,
    faEllipsisH,
    faArrowUp,
    faArrowDown,
    faSync,
    faLayerGroup,
    faPalette,
    faRulerCombined,
    faWeight,
    faBarcode,
    faQrcode,
    faImage,
    faCamera,
    faLink,
    faEuroSign,
    faPercent,
    faExclamationTriangle,
    faInfoCircle,
    faMagic,
    faRobot,
    faLightbulb,
    faRocket,
    faCrown,
} from '@fortawesome/free-solid-svg-icons';
import './MesProduits.scss';

const MesProduits = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { confirmAction } = useConfirmActions();

    // États
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        statut: 'tous',
        categorie: 'tous',
        prixMin: '',
        prixMax: '',
        recherche: '',
        tri: 'date_desc',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        pages: 1,
        limit: 12,
    });
    const [selectedProduits, setSelectedProduits] = useState(new Set());
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduit, setEditingProduit] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        actifs: 0,
        en_attente: 0,
        rejetes: 0,
        totalVues: 0,
        totalVentes: 0,
    });
    const [aiSuggestions, setAiSuggestions] = useState([]);

    // Fonction utilitaire pour obtenir l'URL de l'image
    const getProductImageUrl = produit => {
        // 1️⃣ Vérifier si le produit a des images
        if (!produit?.images || produit.images.length === 0) {
            return null; // ✅ Retourner null au lieu de forcer un placeholder
        }

        const firstImage = produit.images[0];

        // 2️⃣ Cas 1: L'image est déjà une URL complète (STRING)
        // L'API retourne maintenant: "http://localhost:5000/uploads/produits/xxx.jpg"
        if (typeof firstImage === 'string') {
            // Si c'est déjà une URL absolue (commence par http)
            if (
                firstImage.startsWith('http://') ||
                firstImage.startsWith('https://')
            ) {
                return firstImage; // ✅ Retourner directement l'URL complète
            }

            // Si c'est un chemin relatif (cas legacy: "uploads/produits/xxx.jpg")
            if (firstImage.startsWith('uploads/')) {
                return `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${firstImage}`;
            }

            // Si c'est un chemin absolu (/uploads/produits/xxx.jpg)
            if (firstImage.startsWith('/uploads/')) {
                return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${firstImage}`;
            }
        }

        // 3️⃣ Cas 2: Format ancien (OBJET avec propriété url)
        // Exemple: { url: "uploads/produits/xxx.jpg", alt: "...", estPrincipale: true }
        if (typeof firstImage === 'object' && firstImage.url) {
            const imageUrl = firstImage.url;

            // Si l'URL est déjà absolue
            if (
                imageUrl.startsWith('http://') ||
                imageUrl.startsWith('https://')
            ) {
                return imageUrl;
            }

            // Si c'est un chemin relatif
            if (imageUrl.startsWith('uploads/')) {
                return `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${imageUrl}`;
            }

            // Si c'est un chemin absolu
            if (imageUrl.startsWith('/uploads/')) {
                return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${imageUrl}`;
            }
        }

        // 4️⃣ Aucun format reconnu - retourner null
        console.warn("⚠️ Format d'image non reconnu:", firstImage);
        return null;
    };

    // Chargement initial
    useEffect(() => {
        fetchProduits();
        fetchStats();
    }, [filters, pagination.page, pagination.limit]);

    // Récupérer les produits
    const fetchProduits = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                statut: filters.statut !== 'tous' ? filters.statut : undefined,
                recherche: filters.recherche || undefined,
                tri: filters.tri,
            };

            const response = await vendeurService.obtenirMesProduits(params);

            if (response.succes) {
                setProduits(response.data.produits || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination?.total || 0,
                    pages: response.data.pagination?.pages || 1,
                }));
            }
        } catch (error) {
            console.error('Erreur chargement produits:', error);
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de charger les produits',
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

    // Gestion des filtres
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
        setSelectedProduits(new Set());
    };

    // Recherche avec debounce
    const handleSearch = useCallback(
        value => {
            const timeoutId = setTimeout(() => {
                handleFilterChange('recherche', value);
            }, 500);
            return () => clearTimeout(timeoutId);
        },
        [filters]
    );

    // Sélection multiple
    const toggleSelectProduit = id => {
        const newSelected = new Set(selectedProduits);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProduits(newSelected);
    };

    const selectAll = () => {
        if (selectedProduits.size === produits.length) {
            setSelectedProduits(new Set());
        } else {
            setSelectedProduits(new Set(produits.map(p => p._id)));
        }
    };

    // Actions batch
    const handleBatchAction = async action => {
        if (selectedProduits.size === 0) {
            addToast({
                type: 'warning',
                title: 'Aucune sélection',
                message: 'Veuillez sélectionner des produits',
            });
            return;
        }

        const confirmed = await confirmAction({
            title: `${action} ${selectedProduits.size} produit(s)`,
            message: `Cette action sera appliquée à ${selectedProduits.size} produit(s) sélectionné(s)`,
            variant: action === 'Supprimer' ? 'danger' : 'warning',
        });

        if (!confirmed) return;

        try {
            addToast({
                type: 'success',
                title: 'Action effectuée',
                message: `${action} appliqué à ${selectedProduits.size} produit(s)`,
            });
            setSelectedProduits(new Set());
            fetchProduits();
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Action impossible',
            });
        }
    };

    // Supprimer un produit
    const handleDeleteProduit = async produit => {
        const confirmed = await confirmAction({
            title: 'Supprimer ce produit ?',
            message: `Le produit "${produit.nom}" sera définitivement supprimé`,
            variant: 'danger',
        });

        if (!confirmed) return;

        try {
            await vendeurService.supprimerProduit(produit._id);
            addToast({
                type: 'success',
                title: 'Produit supprimé',
                message: 'Le produit a été supprimé avec succès',
            });
            fetchProduits();
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de supprimer le produit',
            });
        }
    };

    // Changer le statut d'un produit
    const handleChangeStatut = async (produit, nouveauStatut) => {
        try {
            await vendeurService.modifierProduit(produit._id, {
                statut: nouveauStatut,
            });
            addToast({
                type: 'success',
                title: 'Statut mis à jour',
                message: 'Le statut du produit a été modifié',
            });
            fetchProduits();
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de modifier le statut',
            });
        }
    };

    // Dupliquer un produit
    const handleDuplicateProduit = async produit => {
        try {
            const produitData = {
                ...produit,
                nom: `${produit.nom} (Copie)`,
                statut: 'en_attente',
            };
            delete produitData._id;
            delete produitData.createdAt;
            delete produitData.updatedAt;

            await vendeurService.creerProduit(produitData);
            addToast({
                type: 'success',
                title: 'Produit dupliqué',
                message: 'Une copie du produit a été créée',
            });
            fetchProduits();
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de dupliquer le produit',
            });
        }
    };

    // Exporter les produits
    const handleExport = format => {
        addToast({
            type: 'info',
            title: 'Export en cours',
            message: `Export ${format} démarré...`,
        });
        // Simulation d'export
        setTimeout(() => {
            addToast({
                type: 'success',
                title: 'Export terminé',
                message: `Les produits ont été exportés en ${format}`,
            });
        }, 1500);
    };

    // Formatage
    const formatCurrency = amount => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'CFA',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = date => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Obtenir la classe de statut
    const getStatutClass = statut => {
        switch (statut) {
            case 'actif':
                return 'success';
            case 'en_attente':
                return 'warning';
            case 'rejete':
                return 'danger';
            case 'approuve':
                return 'info';
            default:
                return 'secondary';
        }
    };

    // Obtenir l'icône de statut
    const getStatutIcon = statut => {
        switch (statut) {
            case 'actif':
                return faCheckCircle;
            case 'en_attente':
                return faClock;
            case 'rejete':
                return faTimesCircle;
            case 'approuve':
                return faCheckCircle;
            default:
                return faBox;
        }
    };

    // Calculer le pourcentage de réduction
    const calculateDiscount = (prix, prixComparaison) => {
        if (!prixComparaison || prixComparaison <= prix) return 0;
        return Math.round(((prixComparaison - prix) / prixComparaison) * 100);
    };

    // Rendu du loading
    if (loading && produits.length === 0) {
        return (
            <div className="produits-loading">
                <div className="loading-content">
                    <div className="spinner">
                        <div className="spinner-ring"></div>
                    </div>
                    <h3>Chargement de vos produits...</h3>
                    <p>Votre catalogue est en cours de chargement</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mes-produits">
            {/* HEADER AVANCÉ */}
            <header className="produits-header">
                <div className="header-main">
                    <div className="title-section">
                        <h1 className="page-title">
                            <FontAwesomeIcon
                                icon={faBox}
                                className="title-icon"
                            />
                            Mes Produits
                            <span className="title-badge">
                                {stats.total} produits
                            </span>
                        </h1>
                        <p className="page-subtitle">
                            Gérez votre catalogue, analysez les performances et
                            optimisez vos ventes
                        </p>
                    </div>

                    <div className="header-actions">
                        <button
                            className="btn-primary btn-add"
                            onClick={() => setShowAddModal(true)}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Nouveau produit</span>
                            <span className="action-hotkey">⌘N</span>
                        </button>

                        <div className="quick-stats">
                            <div className="quick-stat">
                                <FontAwesomeIcon
                                    icon={faCheckCircle}
                                    className="stat-icon active"
                                />
                                <span>{stats.actifs} actifs</span>
                            </div>
                            <div className="quick-stat">
                                <FontAwesomeIcon
                                    icon={faClock}
                                    className="stat-icon pending"
                                />
                                <span>{stats.en_attente} en attente</span>
                            </div>
                            <div className="quick-stat">
                                <FontAwesomeIcon
                                    icon={faChartLine}
                                    className="stat-icon sales"
                                />
                                <span>{stats.totalVentes} ventes</span>
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
                            placeholder="Rechercher un produit, une référence..."
                            className="search-input"
                            onChange={e => handleSearch(e.target.value)}
                        />
                        <div className="search-tools">
                            <button
                                className="search-tool"
                                title="Recherche avancée"
                            >
                                <FontAwesomeIcon icon={faRobot} />
                            </button>
                            <button
                                className="search-tool"
                                title="Filtrer par IA"
                            >
                                <FontAwesomeIcon icon={faMagic} />
                            </button>
                        </div>
                    </div>

                    <div className="filter-controls">
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

                        <div className="view-controls">
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Vue grille"
                            >
                                <div className="grid-icon"></div>
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="Vue liste"
                            >
                                <div className="list-icon"></div>
                            </button>
                        </div>

                        <button
                            className="btn-export"
                            onClick={() => handleExport('CSV')}
                            title="Exporter"
                        >
                            <FontAwesomeIcon icon={faDownload} />
                        </button>

                        <button
                            className="btn-refresh"
                            onClick={fetchProduits}
                            title="Actualiser"
                        >
                            <FontAwesomeIcon icon={faSync} />
                        </button>
                    </div>
                </div>

                {/* FILTRES AVANCÉS */}
                {showFilters && (
                    <div className="advanced-filters">
                        <div className="filters-grid">
                            <div className="filter-group">
                                <label>Statut</label>
                                <div className="filter-buttons">
                                    {[
                                        'tous',
                                        'actif',
                                        'en_attente',
                                        'rejete',
                                        'approuve',
                                    ].map(statut => (
                                        <button
                                            key={statut}
                                            className={`filter-btn ${filters.statut === statut ? 'active' : ''}`}
                                            onClick={() =>
                                                handleFilterChange(
                                                    'statut',
                                                    statut
                                                )
                                            }
                                        >
                                            {statut === 'tous'
                                                ? 'Tous'
                                                : statut === 'actif'
                                                  ? 'Actifs'
                                                  : statut === 'en_attente'
                                                    ? 'En attente'
                                                    : statut === 'rejete'
                                                      ? 'Rejetés'
                                                      : 'Approuvés'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Prix</label>
                                <div className="price-range">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.prixMin}
                                        onChange={e =>
                                            handleFilterChange(
                                                'prixMin',
                                                e.target.value
                                            )
                                        }
                                        className="price-input"
                                    />
                                    <span className="range-separator">—</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.prixMax}
                                        onChange={e =>
                                            handleFilterChange(
                                                'prixMax',
                                                e.target.value
                                            )
                                        }
                                        className="price-input"
                                    />
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Tri</label>
                                <select
                                    value={filters.tri}
                                    onChange={e =>
                                        handleFilterChange(
                                            'tri',
                                            e.target.value
                                        )
                                    }
                                    className="sort-select"
                                >
                                    <option value="date_desc">
                                        Plus récents
                                    </option>
                                    <option value="date_asc">
                                        Plus anciens
                                    </option>
                                    <option value="prix_desc">
                                        Prix décroissant
                                    </option>
                                    <option value="prix_asc">
                                        Prix croissant
                                    </option>
                                    <option value="nom_asc">Nom A-Z</option>
                                    <option value="nom_desc">Nom Z-A</option>
                                    <option value="ventes_desc">
                                        Plus vendus
                                    </option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Actions</label>
                                <div className="filter-actions">
                                    <button
                                        className="btn-clear"
                                        onClick={() =>
                                            setFilters({
                                                statut: 'tous',
                                                categorie: 'tous',
                                                prixMin: '',
                                                prixMax: '',
                                                recherche: '',
                                                tri: 'date_desc',
                                            })
                                        }
                                    >
                                        Réinitialiser
                                    </button>
                                    <button
                                        className="btn-apply"
                                        onClick={() => setShowFilters(false)}
                                    >
                                        Appliquer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* ACTIONS BATCH */}
            {selectedProduits.size > 0 && (
                <div className="batch-actions-bar">
                    <div className="batch-info">
                        <span className="selected-count">
                            {selectedProduits.size} produit(s) sélectionné(s)
                        </span>
                        <button
                            className="btn-clear-selection"
                            onClick={() => setSelectedProduits(new Set())}
                        >
                            Tout désélectionner
                        </button>
                    </div>
                    <div className="batch-buttons">
                        <button
                            className="batch-btn publish"
                            onClick={() => handleBatchAction('Publier')}
                        >
                            <FontAwesomeIcon icon={faCheckCircle} />
                            Publier
                        </button>
                        <button
                            className="batch-btn archive"
                            onClick={() => handleBatchAction('Archiver')}
                        >
                            <FontAwesomeIcon icon={faBox} />
                            Archiver
                        </button>
                        <button
                            className="batch-btn duplicate"
                            onClick={() => handleBatchAction('Dupliquer')}
                        >
                            <FontAwesomeIcon icon={faCopy} />
                            Dupliquer
                        </button>
                        <button
                            className="batch-btn delete"
                            onClick={() => handleBatchAction('Supprimer')}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                            Supprimer
                        </button>
                    </div>
                </div>
            )}

            {/* CONTENU PRINCIPAL */}
            <main className="produits-content">
                {/* VUE GRILLE */}
                {viewMode === 'grid' ? (
                    <div className="produits-grid">
                        {/* SELECT ALL CARD */}
                        <div className="produit-card select-all-card">
                            <div className="card-header">
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={
                                            selectedProduits.size ===
                                                produits.length &&
                                            produits.length > 0
                                        }
                                        onChange={selectAll}
                                        className="checkbox-input"
                                    />
                                    <span className="checkbox-custom"></span>
                                </label>
                            </div>
                            <div className="card-body">
                                <div className="add-product-placeholder">
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        className="add-icon"
                                    />
                                    <h3>Ajouter un produit</h3>
                                    <p>Créez une nouvelle fiche produit</p>
                                </div>
                            </div>
                            <button
                                className="card-action add"
                                onClick={() => setShowAddModal(true)}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Nouveau
                            </button>
                        </div>

                        {/* PRODUITS */}
                        {produits.map(produit => {
                            const imageUrl = getProductImageUrl(produit);

                            return (
                                <div
                                    key={produit._id}
                                    className={`produit-card ${selectedProduits.has(produit._id) ? 'selected' : ''}`}
                                    onClick={() =>
                                        toggleSelectProduit(produit._id)
                                    }
                                >
                                    {/* BADGE DE STATUT */}
                                    <div
                                        className={`status-badge ${getStatutClass(produit.statut)}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={getStatutIcon(produit.statut)}
                                        />
                                        <span>
                                            {produit.statut === 'actif'
                                                ? 'Actif'
                                                : produit.statut ===
                                                    'en_attente'
                                                  ? 'En attente'
                                                  : produit.statut === 'rejete'
                                                    ? 'Rejeté'
                                                    : 'Approuvé'}
                                        </span>
                                    </div>

                                    {/* CHECKBOX */}
                                    <div className="card-header">
                                        <label
                                            className="checkbox-container"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedProduits.has(
                                                    produit._id
                                                )}
                                                onChange={() =>
                                                    toggleSelectProduit(
                                                        produit._id
                                                    )
                                                }
                                                className="checkbox-input"
                                            />
                                            <span className="checkbox-custom"></span>
                                        </label>
                                    </div>

                                    {/* IMAGE */}
                                    <div className="card-image">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={produit.nom}
                                                className="product-image"
                                                onError={e => {
                                                    e.target.src =
                                                        '/images/default-product.jpg';
                                                    e.target.onerror = null;
                                                }}
                                            />
                                        ) : (
                                            <div className="image-placeholder">
                                                <FontAwesomeIcon
                                                    icon={faImage}
                                                />
                                            </div>
                                        )}

                                        {/* BADGE DISCOUNT */}
                                        {produit.prixComparaison &&
                                            produit.prixComparaison >
                                                produit.prix && (
                                                <div className="discount-badge">
                                                    -
                                                    {calculateDiscount(
                                                        produit.prix,
                                                        produit.prixComparaison
                                                    )}
                                                    %
                                                </div>
                                            )}

                                        {/* BADGE BEST SELLER */}
                                        {produit.estMeilleureVente && (
                                            <div className="best-seller-badge">
                                                <FontAwesomeIcon
                                                    icon={faCrown}
                                                />
                                                Best-seller
                                            </div>
                                        )}
                                    </div>

                                    {/* INFOS */}
                                    <div className="card-body">
                                        <div className="product-info">
                                            <h3 className="product-name">
                                                {produit.nom}
                                            </h3>
                                            <p className="product-description">
                                                {produit.description?.substring(
                                                    0,
                                                    80
                                                )}
                                                ...
                                            </p>

                                            <div className="product-meta">
                                                <div className="meta-item">
                                                    <FontAwesomeIcon
                                                        icon={faEuroSign}
                                                    />
                                                    <span className="meta-value">
                                                        {formatCurrency(
                                                            produit.prix
                                                        )}
                                                    </span>
                                                    {produit.prixComparaison &&
                                                        produit.prixComparaison >
                                                            produit.prix && (
                                                            <span className="meta-comparison">
                                                                {formatCurrency(
                                                                    produit.prixComparaison
                                                                )}
                                                            </span>
                                                        )}
                                                </div>

                                                <div className="meta-item">
                                                    <FontAwesomeIcon
                                                        icon={faBox}
                                                    />
                                                    <span className="meta-value">
                                                        {produit.quantite || 0}{' '}
                                                        en stock
                                                    </span>
                                                    {produit.quantite <=
                                                        (produit.seuilStockFaible ||
                                                            5) && (
                                                        <span className="stock-warning">
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faExclamationTriangle
                                                                }
                                                            />
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="meta-item">
                                                    <FontAwesomeIcon
                                                        icon={faTags}
                                                    />
                                                    <span className="meta-value">
                                                        {produit.categorie
                                                            ?.nom ||
                                                            'Non catégorisé'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* STATISTIQUES */}
                                            <div className="product-stats">
                                                <div className="stat">
                                                    <FontAwesomeIcon
                                                        icon={faEye}
                                                    />
                                                    <span>
                                                        {produit.nombreVues ||
                                                            0}{' '}
                                                        vues
                                                    </span>
                                                </div>
                                                <div className="stat">
                                                    <FontAwesomeIcon
                                                        icon={faChartLine}
                                                    />
                                                    <span>
                                                        {produit.nombreVentes ||
                                                            0}{' '}
                                                        ventes
                                                    </span>
                                                </div>
                                                <div className="stat">
                                                    <FontAwesomeIcon
                                                        icon={faStar}
                                                    />
                                                    <span>
                                                        {produit.evaluations
                                                            ?.moyenne || 0}
                                                        /5
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="card-actions">
                                        <button
                                            className="action-btn view"
                                            onClick={e => {
                                                e.stopPropagation();
                                                navigate(
                                                    `/produit/${produit._id}`
                                                );
                                            }}
                                            title="Voir"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>

                                        <button
                                            className="action-btn edit"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setEditingProduit(produit);
                                                setShowAddModal(true);
                                            }}
                                            title="Éditer"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>

                                        <button
                                            className="action-btn duplicate"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleDuplicateProduit(produit);
                                            }}
                                            title="Dupliquer"
                                        >
                                            <FontAwesomeIcon icon={faCopy} />
                                        </button>

                                        <button
                                            className="action-btn delete"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleDeleteProduit(produit);
                                            }}
                                            title="Supprimer"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
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
                                                        icon={faShare}
                                                    />
                                                    Partager
                                                </button>
                                                <button className="dropdown-item">
                                                    <FontAwesomeIcon
                                                        icon={faDownload}
                                                    />
                                                    Exporter
                                                </button>
                                                <button className="dropdown-item">
                                                    <FontAwesomeIcon
                                                        icon={faQrcode}
                                                    />
                                                    Générer QR Code
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* INDICATEUR DE PERFORMANCE */}
                                    <div className="performance-indicator">
                                        <div
                                            className="performance-bar"
                                            style={{
                                                width: `${Math.min(
                                                    ((produit.nombreVentes ||
                                                        0) /
                                                        100) *
                                                        100,
                                                    100
                                                )}%`,
                                                background:
                                                    produit.nombreVentes > 50
                                                        ? 'linear-gradient(90deg, #4CAF50, #8BC34A)'
                                                        : produit.nombreVentes >
                                                            20
                                                          ? 'linear-gradient(90deg, #FF9800, #FFC107)'
                                                          : 'linear-gradient(90deg, #f44336, #ff5252)',
                                            }}
                                        ></div>
                                        <span className="performance-text">
                                            {produit.nombreVentes || 0} ventes
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // VUE LISTE
                    <div className="produits-list">
                        <table className="produits-table">
                            <thead>
                                <tr>
                                    <th className="selection-column">
                                        <label className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedProduits.size ===
                                                        produits.length &&
                                                    produits.length > 0
                                                }
                                                onChange={selectAll}
                                                className="checkbox-input"
                                            />
                                            <span className="checkbox-custom"></span>
                                        </label>
                                    </th>
                                    <th className="product-column">Produit</th>
                                    <th className="price-column">Prix</th>
                                    <th className="stock-column">Stock</th>
                                    <th className="status-column">Statut</th>
                                    <th className="sales-column">Ventes</th>
                                    <th className="views-column">Vues</th>
                                    <th className="date-column">Date</th>
                                    <th className="actions-column">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produits.map(produit => {
                                    const imageUrl =
                                        getProductImageUrl(produit);

                                    return (
                                        <tr
                                            key={produit._id}
                                            className={
                                                selectedProduits.has(
                                                    produit._id
                                                )
                                                    ? 'selected'
                                                    : ''
                                            }
                                            onClick={() =>
                                                toggleSelectProduit(produit._id)
                                            }
                                        >
                                            <td className="selection-column">
                                                <label
                                                    className="checkbox-container"
                                                    onClick={e =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProduits.has(
                                                            produit._id
                                                        )}
                                                        onChange={() =>
                                                            toggleSelectProduit(
                                                                produit._id
                                                            )
                                                        }
                                                        className="checkbox-input"
                                                    />
                                                    <span className="checkbox-custom"></span>
                                                </label>
                                            </td>

                                            <td className="product-column">
                                                <div className="product-cell">
                                                    <div className="product-image">
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={
                                                                    produit.nom
                                                                }
                                                                onError={e => {
                                                                    e.target.src =
                                                                        '/images/default-product.jpg';
                                                                    e.target.onerror =
                                                                        null;
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="image-placeholder">
                                                                <FontAwesomeIcon
                                                                    icon={faBox}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="product-details">
                                                        <h4 className="product-name">
                                                            {produit.nom}
                                                        </h4>
                                                        <p className="product-sku">
                                                            SKU:{' '}
                                                            {produit.sku ||
                                                                'N/A'}
                                                        </p>
                                                        <div className="product-tags">
                                                            <span className="product-category">
                                                                {produit
                                                                    .categorie
                                                                    ?.nom ||
                                                                    'Non catégorisé'}
                                                            </span>
                                                            {produit.etiquettes
                                                                ?.slice(0, 2)
                                                                .map(tag => (
                                                                    <span
                                                                        key={
                                                                            tag
                                                                        }
                                                                        className="product-tag"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="price-column">
                                                <div className="price-cell">
                                                    <span className="current-price">
                                                        {formatCurrency(
                                                            produit.prix
                                                        )}
                                                    </span>
                                                    {produit.prixComparaison &&
                                                        produit.prixComparaison >
                                                            produit.prix && (
                                                            <span className="old-price">
                                                                {formatCurrency(
                                                                    produit.prixComparaison
                                                                )}
                                                            </span>
                                                        )}
                                                </div>
                                            </td>

                                            <td className="stock-column">
                                                <div className="stock-cell">
                                                    <span
                                                        className={`stock-value ${
                                                            produit.quantite <=
                                                            (produit.seuilStockFaible ||
                                                                5)
                                                                ? 'low'
                                                                : ''
                                                        }`}
                                                    >
                                                        {produit.quantite || 0}
                                                    </span>
                                                    {produit.quantite <=
                                                        (produit.seuilStockFaible ||
                                                            5) && (
                                                        <FontAwesomeIcon
                                                            icon={
                                                                faExclamationTriangle
                                                            }
                                                            className="stock-warning"
                                                        />
                                                    )}
                                                </div>
                                            </td>

                                            <td className="status-column">
                                                <div
                                                    className={`status-cell ${getStatutClass(produit.statut)}`}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={getStatutIcon(
                                                            produit.statut
                                                        )}
                                                    />
                                                    <span>
                                                        {produit.statut}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="sales-column">
                                                <div className="sales-cell">
                                                    <span className="sales-value">
                                                        {produit.nombreVentes ||
                                                            0}
                                                    </span>
                                                    <div className="sales-trend">
                                                        <FontAwesomeIcon
                                                            icon={faArrowUp}
                                                        />
                                                        <span>+12%</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="views-column">
                                                <div className="views-cell">
                                                    {produit.nombreVues || 0}
                                                </div>
                                            </td>

                                            <td className="date-column">
                                                <div className="date-cell">
                                                    {formatDate(
                                                        produit.createdAt
                                                    )}
                                                </div>
                                            </td>

                                            <td className="actions-column">
                                                <div
                                                    className="actions-cell"
                                                    onClick={e =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <button
                                                        className="table-action view"
                                                        onClick={() =>
                                                            navigate(
                                                                `/produit/${produit._id}`
                                                            )
                                                        }
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faEye}
                                                        />
                                                    </button>
                                                    <button
                                                        className="table-action edit"
                                                        onClick={() => {
                                                            setEditingProduit(
                                                                produit
                                                            );
                                                            setShowAddModal(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faEdit}
                                                        />
                                                    </button>
                                                    <button
                                                        className="table-action more"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            // Ouvrir menu contextuel
                                                        }}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faEllipsisH}
                                                        />
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
                            sur {pagination.total} produits
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

                                {pagination.pages > 5 &&
                                    pagination.page < pagination.pages - 2 && (
                                        <>
                                            <span className="page-dots">
                                                ...
                                            </span>
                                            <button
                                                className="page-btn"
                                                onClick={() =>
                                                    setPagination(prev => ({
                                                        ...prev,
                                                        page: pagination.pages,
                                                    }))
                                                }
                                            >
                                                {pagination.pages}
                                            </button>
                                        </>
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

                        <div className="page-size">
                            <label>Afficher</label>
                            <select
                                value={pagination.limit}
                                onChange={e =>
                                    setPagination(prev => ({
                                        ...prev,
                                        limit: parseInt(e.target.value),
                                        page: 1,
                                    }))
                                }
                                className="page-select"
                            >
                                <option value="12">12</option>
                                <option value="24">24</option>
                                <option value="48">48</option>
                                <option value="96">96</option>
                            </select>
                            <span>par page</span>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL AJOUT/ÉDITION PRODUIT */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2>
                                <FontAwesomeIcon
                                    icon={editingProduit ? faEdit : faPlus}
                                />
                                {editingProduit
                                    ? 'Éditer le produit'
                                    : 'Nouveau produit'}
                            </h2>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingProduit(null);
                                }}
                            >
                                <FontAwesomeIcon icon={faTimesCircle} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-tabs">
                                <button className="tab-btn active">
                                    Informations
                                </button>
                                <button className="tab-btn">Images</button>
                                <button className="tab-btn">Variantes</button>
                                <button className="tab-btn">SEO</button>
                                <button className="tab-btn">Livraison</button>
                            </div>

                            <div className="form-container">
                                {/* Formulaire simplifié pour la démo */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nom du produit *</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Smartphone Pro Max 2024"
                                            className="form-input"
                                            defaultValue={
                                                editingProduit?.nom || ''
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Catégorie *</label>
                                        <select className="form-select">
                                            <option>
                                                Sélectionner une catégorie
                                            </option>
                                            <option>Électronique</option>
                                            <option>Mode</option>
                                            <option>Maison</option>
                                            <option>Sport</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        placeholder="Décrivez votre produit..."
                                        className="form-textarea"
                                        rows={4}
                                        defaultValue={
                                            editingProduit?.description || ''
                                        }
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Prix (€) *</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className="form-input"
                                            defaultValue={
                                                editingProduit?.prix || ''
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Prix de comparaison</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className="form-input"
                                            defaultValue={
                                                editingProduit?.prixComparaison ||
                                                ''
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Quantité en stock</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="form-input"
                                            defaultValue={
                                                editingProduit?.quantite || ''
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        className="btn-cancel"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setEditingProduit(null);
                                        }}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        className="btn-save"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setEditingProduit(null);
                                            addToast({
                                                type: 'success',
                                                title: editingProduit
                                                    ? 'Produit mis à jour'
                                                    : 'Produit créé',
                                                message:
                                                    'Le produit a été enregistré avec succès',
                                            });
                                            fetchProduits();
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={
                                                editingProduit ? faEdit : faPlus
                                            }
                                        />
                                        {editingProduit
                                            ? 'Mettre à jour'
                                            : 'Créer le produit'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER STATISTIQUES */}
            <footer className="produits-footer">
                <div className="footer-stats">
                    <div className="footer-stat">
                        <FontAwesomeIcon icon={faBox} />
                        <div className="stat-content">
                            <span className="stat-value">{stats.total}</span>
                            <span className="stat-label">Produits total</span>
                        </div>
                    </div>
                    <div className="footer-stat">
                        <FontAwesomeIcon icon={faChartLine} />
                        <div className="stat-content">
                            <span className="stat-value">
                                {stats.totalVentes}
                            </span>
                            <span className="stat-label">Ventes totales</span>
                        </div>
                    </div>
                    <div className="footer-stat">
                        <FontAwesomeIcon icon={faEye} />
                        <div className="stat-content">
                            <span className="stat-value">
                                {stats.totalVues}
                            </span>
                            <span className="stat-label">Vues totales</span>
                        </div>
                    </div>
                    <div className="footer-stat">
                        <FontAwesomeIcon icon={faStore} />
                        <div className="stat-content">
                            <span className="stat-value">{stats.actifs}</span>
                            <span className="stat-label">Produits actifs</span>
                        </div>
                    </div>
                </div>
                <div className="footer-actions">
                    <button className="footer-btn help">
                        <FontAwesomeIcon icon={faInfoCircle} />
                        Aide
                    </button>
                    <button className="footer-btn feedback">
                        <FontAwesomeIcon icon={faLightbulb} />
                        Feedback
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MesProduits;
