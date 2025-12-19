import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight,
    faHome,
    faSearch,
    faSpinner,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import categoriesService from '@/services/categoriesService';
import './Categories.scss';

// Composant pour la page des catégories
export default function Categories() {
    const { categorySlug } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Récupérer les catégories depuis l'API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const data = await categoriesService.getAllCategories();
                setCategories(data);

                // Filtrer les catégories au chargement initial
                let displayCategories = data;
                if (categorySlug) {
                    const currentCategory = findCategoryBySlug(
                        categorySlug,
                        data
                    );
                    if (currentCategory?.subcategories) {
                        displayCategories = currentCategory.subcategories;
                    }
                }
                setFilteredCategories(displayCategories);
            } catch (err) {
                setError(
                    err.message || 'Erreur lors du chargement des catégories'
                );
                console.error('Erreur:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [categorySlug]);

    // Fonction pour trouver une catégorie par son slug
    const findCategoryBySlug = (slug, categoryList = categories) => {
        for (const category of categoryList) {
            if (category.slug === slug) {
                return category;
            }
            if (category.subcategories) {
                const found = findCategoryBySlug(slug, category.subcategories);
                if (found) return found;
            }
        }
        return null;
    };

    // Fonction pour obtenir le chemin d'une catégorie
    const getCategoryPath = (slug, categoryList = categories, path = []) => {
        for (const category of categoryList) {
            if (category.slug === slug) {
                return [...path, { slug: category.slug, name: category.name }];
            }
            if (category.subcategories) {
                const foundPath = getCategoryPath(
                    slug,
                    category.subcategories,
                    [...path, { slug: category.slug, name: category.name }]
                );
                if (foundPath.length > 0) {
                    return foundPath;
                }
            }
        }
        return [];
    };

    // Filtrage des catégories
    useEffect(() => {
        if (!searchTerm.trim()) {
            let displayCategories = categories;
            if (categorySlug) {
                const currentCategory = findCategoryBySlug(categorySlug);
                if (currentCategory?.subcategories) {
                    displayCategories = currentCategory.subcategories;
                }
            }
            setFilteredCategories(displayCategories);
            return;
        }

        const searchLower = searchTerm.toLowerCase();

        const filterCategories = categoryList => {
            return categoryList.filter(category => {
                const nameMatch = category.name
                    ?.toLowerCase()
                    .includes(searchLower);
                const subMatch = category.subcategories?.some(
                    sub =>
                        sub.name?.toLowerCase().includes(searchLower) ||
                        sub.subcategories?.some(subSub =>
                            subSub.name?.toLowerCase().includes(searchLower)
                        )
                );
                return nameMatch || subMatch;
            });
        };

        let categoriesToFilter = categories;
        if (categorySlug) {
            const currentCategory = findCategoryBySlug(categorySlug);
            if (currentCategory?.subcategories) {
                categoriesToFilter = currentCategory.subcategories;
            }
        }

        setFilteredCategories(filterCategories(categoriesToFilter));
    }, [searchTerm, categories, categorySlug]);

    // Données du composant
    const currentCategory = categorySlug
        ? findCategoryBySlug(categorySlug)
        : null;
    const categoryPath = categorySlug ? getCategoryPath(categorySlug) : [];

    // Gérer le clic sur une catégorie
    const handleCategoryClick = slug => {
        navigate(`/categories/${slug}`);
    };

    // Gérer le clic sur un élément du fil d'Ariane
    const handleBreadcrumbClick = (slug, index) => {
        if (index === categoryPath.length - 1) return;
        navigate(`/categories/${slug}`);
    };

    // Rendu en cas d'erreur
    if (error) {
        return (
            <div className="categories-page">
                <div className="container">
                    <div className="error-state">
                        <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="error-icon"
                        />
                        <h2>Erreur de chargement</h2>
                        <p>{error}</p>
                        <button
                            className="retry-btn"
                            onClick={() => window.location.reload()}
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Rendu en cas de chargement
    if (loading) {
        return (
            <div className="categories-page">
                <div className="container">
                    <div className="loading-state">
                        <FontAwesomeIcon
                            icon={faSpinner}
                            className="loading-spinner"
                            spin
                        />
                        <p>Chargement des catégories...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Rendu du composant
    return (
        <div className="categories-page">
            {/* En-tête avec fil d'Ariane */}
            <div className="categories-header">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Fil d'Ariane">
                        <Link to="/" className="breadcrumb-item">
                            <FontAwesomeIcon icon={faHome} />
                            Accueil
                        </Link>
                        <FontAwesomeIcon
                            icon={faChevronRight}
                            className="breadcrumb-separator"
                        />
                        <Link to="/categories" className="breadcrumb-item">
                            Catégories
                        </Link>
                        {categoryPath.map((category, index) => (
                            <React.Fragment key={category.slug}>
                                <FontAwesomeIcon
                                    icon={faChevronRight}
                                    className="breadcrumb-separator"
                                />
                                <button
                                    className={`breadcrumb-item ${index === categoryPath.length - 1 ? 'active' : ''}`}
                                    onClick={() =>
                                        handleBreadcrumbClick(
                                            category.slug,
                                            index
                                        )
                                    }
                                    disabled={index === categoryPath.length - 1}
                                >
                                    {category.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </nav>

                    <div className="page-header">
                        <h1>
                            {currentCategory
                                ? currentCategory.name
                                : 'Toutes les catégories'}
                        </h1>
                        <p className="page-subtitle">
                            {currentCategory
                                ? `Explorez notre sélection de ${currentCategory.name.toLowerCase()}`
                                : 'Découvrez notre gamme complète de produits'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Barre de recherche */}
            <div className="categories-search">
                <div className="container">
                    <div className="search-container">
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="search-icon"
                        />
                        <input
                            type="text"
                            placeholder="Rechercher une catégorie..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                                aria-label="Effacer la recherche"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="categories-content">
                <div className="container">
                    {filteredCategories.length === 0 ? (
                        <div className="no-results">
                            <div className="no-results-icon">🔍</div>
                            <h3>Aucune catégorie trouvée</h3>
                            <p>
                                Aucune catégorie ne correspond à votre recherche
                                "{searchTerm}"
                            </p>
                            <button
                                className="reset-search-btn"
                                onClick={() => setSearchTerm('')}
                            >
                                Réinitialiser la recherche
                            </button>
                        </div>
                    ) : (
                        <div className="categories-grid">
                            {filteredCategories.map(category => (
                                <CategoryCard
                                    key={category._id || category.id}
                                    category={category}
                                    onCategoryClick={handleCategoryClick}
                                    level={0}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Composant Carte de Catégorie (inchangé)
function CategoryCard({ category, onCategoryClick, level }) {
    const [isExpanded, setIsExpanded] = useState(level < 1);
    const hasSubcategories =
        category.subcategories && category.subcategories.length > 0;

    return (
        <div className={`category-card level-${level}`}>
            <div className="card-header">
                <button
                    className="category-main"
                    onClick={() => onCategoryClick(category.slug)}
                >
                    <span className="category-icon">
                        {category.icon || '📁'}
                    </span>
                    <div className="category-info">
                        <h3 className="category-name">{category.name}</h3>
                        {hasSubcategories && (
                            <span className="subcategories-count">
                                {category.subcategories.length} sous-catégorie
                                {category.subcategories.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </button>

                {hasSubcategories && (
                    <button
                        className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-expanded={isExpanded}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M4 6L8 10L12 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {hasSubcategories && isExpanded && (
                <div className="subcategories-list">
                    {category.subcategories.map(subCategory => (
                        <SubCategoryItem
                            key={subCategory._id || subCategory.id}
                            category={subCategory}
                            onCategoryClick={onCategoryClick}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Composant Sous-catégorie (inchangé)
function SubCategoryItem({ category, onCategoryClick, level }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasSubcategories =
        category.subcategories && category.subcategories.length > 0;

    return (
        <div className={`subcategory-item level-${level}`}>
            <div className="subcategory-line">
                <button
                    className="subcategory-btn"
                    onClick={() => onCategoryClick(category.slug)}
                >
                    <span className="subcategory-name">{category.name}</span>
                    {hasSubcategories && (
                        <span className="items-count">
                            {category.subcategories.length}
                        </span>
                    )}
                </button>

                {hasSubcategories && (
                    <button
                        className={`expand-btn small ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-expanded={isExpanded}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                        >
                            <path
                                d="M4 5L7 8L10 5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {hasSubcategories && isExpanded && (
                <div className="subsubcategories-list">
                    {category.subcategories.map(subSubCategory => (
                        <button
                            key={subSubCategory._id || subSubCategory.id}
                            className="subsubcategory-btn"
                            onClick={() => onCategoryClick(subSubCategory.slug)}
                        >
                            {subSubCategory.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
