import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faChevronRight,
    faChevronDown,
    faSearch,
    faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { useCategories } from '../../../contexts/CategoriesContext';
import './CategoriesSidebar.scss';

// Composant pour le menu latéral des catégories - REFONTE
export default function CategoriesSidebar({ isOpen, onClose, categorySlug }) {
    const navigate = useNavigate();
    const { categories, flatCategories, findCategoryBySlug, isLoading } =
        useCategories();

    const category = categorySlug ? findCategoryBySlug(categorySlug) : null;

    // Fermer avec la touche Escape
    useEffect(() => {
        const handleEscape = event => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Gérer le clic sur une catégorie
    const handleCategoryClick = slug => {
        navigate(`/categories/${slug}`);
        onClose();
    };

    // Fermer le menu en cliquant en dehors
    const handleBackdropClick = event => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    // Rendu du contenu principal
    const renderContent = () => {
        if (category) {
            return (
                <CategoryTree
                    category={category}
                    onCategoryClick={handleCategoryClick}
                    level={0}
                    allCategories={flatCategories}
                />
            );
        }

        return (
            <div className="all-categories-refonte">
                <div className="categories-header">
                    <h4>Toutes les catégories</h4>
                    <p className="categories-count">
                        {categories.length} catégories disponibles
                    </p>
                </div>
                <div className="categories-grid">
                    {categories.map(cat => (
                        <CategoryCard
                            key={cat._id}
                            category={cat}
                            onCategoryClick={handleCategoryClick}
                        />
                    ))}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    // Si chargement en cours
    if (isLoading) {
        return (
            <div
                className="categories-sidebar-overlay-refonte"
                onClick={handleBackdropClick}
            >
                <div className="categories-sidebar-refonte">
                    <div className="sidebar-header-refonte">
                        <div className="header-content">
                            <h3>Catégories</h3>
                            <button
                                className="close-btn-refonte"
                                onClick={onClose}
                                aria-label="Fermer le menu des catégories"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    </div>
                    <div className="loading-state-refonte">
                        <div className="spinner-refonte"></div>
                        <p>Chargement des catégories...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Rendu du composant
    return (
        <div
            className="categories-sidebar-overlay-refonte"
            onClick={handleBackdropClick}
        >
            <div className="categories-sidebar-refonte">
                {/* En-tête */}
                <div className="sidebar-header-refonte">
                    <div className="header-content">
                        <div className="title-section">
                            <h3>{category ? category.name : 'Catégories'}</h3>
                            <div className="breadcrumb">
                                {category && (
                                    <button
                                        className="breadcrumb-back"
                                        onClick={() => navigate('/categories')}
                                    >
                                        Toutes les catégories
                                    </button>
                                )}
                            </div>
                        </div>
                        <button
                            className="close-btn-refonte"
                            onClick={onClose}
                            aria-label="Fermer le menu des catégories"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Barre de recherche */}
                    <div className="search-section">
                        <div className="search-bar-wrapper">
                            <FontAwesomeIcon
                                icon={faSearch}
                                className="search-icon"
                            />
                            <input
                                type="text"
                                placeholder="Rechercher une catégorie..."
                                className="search-input-refonte"
                            />
                        </div>
                        <button className="filter-btn">
                            <FontAwesomeIcon icon={faFilter} />
                        </button>
                    </div>
                </div>

                {/* Contenu */}
                <div className="sidebar-content-refonte">{renderContent()}</div>

                {/* Pied de page */}
                <div className="sidebar-footer-refonte">
                    <div className="footer-stats">
                        <div className="stat-item">
                            <span className="stat-number">
                                {categories.length}
                            </span>
                            <span className="stat-label">Catégories</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">
                                {flatCategories.length}
                            </span>
                            <span className="stat-label">Sous-catégories</span>
                        </div>
                    </div>
                    <button
                        className="explore-all-btn"
                        onClick={() => {
                            navigate('/categories');
                            onClose();
                        }}
                    >
                        Explorer toutes les catégories
                    </button>
                </div>
            </div>
        </div>
    );
}

// Composant Carte de Catégorie
function CategoryCard({ category, onCategoryClick }) {
    const subcategories = category.sousCategories || [];
    const hasSubcategories = subcategories.length > 0;

    return (
        <div
            className="category-card-refonte"
            onClick={() => onCategoryClick(category.slug)}
        >
            <div className="card-header">
                <div className="card-icon">
                    {category.image ? (
                        <img
                            src={`http://localhost:5000${category.image}`}
                            alt={category.name || category.nom}
                            className="category-image"
                        />
                    ) : (
                        <div className="icon-placeholder">
                            {(category.name || category.nom).charAt(0)}
                        </div>
                    )}
                </div>
                <div className="card-info">
                    <h5 className="card-title">
                        {category.name || category.nom}
                    </h5>
                    {hasSubcategories && (
                        <span className="card-subcount">
                            {subcategories.length} sous-catégories
                        </span>
                    )}
                </div>
            </div>
            {hasSubcategories && (
                <button className="card-action">Voir →</button>
            )}
        </div>
    );
}

// Composant récursif pour l'arborescence des catégories
function CategoryTree({ category, onCategoryClick, level, allCategories }) {
    const [isExpanded, setIsExpanded] = React.useState(level < 2);

    // Trouver les sous-catégories dans les catégories aplaties
    const subcategories = allCategories.filter(cat => {
        if (!cat.parent) return false;

        // Vérifier si parent est un objet avec _id ou juste l'ID
        const parentId =
            typeof cat.parent === 'object' ? cat.parent._id : cat.parent;
        return parentId === category.id;
    });

    const hasSubcategories = subcategories.length > 0;

    return (
        <div className={`category-tree-refonte level-${level}`}>
            <div className="category-header-refonte">
                <button
                    className="category-main-btn-refonte"
                    onClick={() => onCategoryClick(category.slug)}
                >
                    <div className="category-icon">
                        {category.image ? (
                            <img
                                src={`http://localhost:5000${category.image}`}
                                alt={category.name || category.nom}
                                className="category-image"
                            />
                        ) : (
                            <div className="icon-placeholder">
                                {(category.name || category.nom).charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="category-content">
                        <span className="category-name-refonte">
                            {category.name || category.nom}
                        </span>
                        {category.description && (
                            <p className="category-description">
                                {category.description}
                            </p>
                        )}
                    </div>
                </button>

                {hasSubcategories && (
                    <button
                        className="expand-btn-refonte"
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-expanded={isExpanded}
                    >
                        <FontAwesomeIcon
                            icon={isExpanded ? faChevronDown : faChevronRight}
                        />
                    </button>
                )}
            </div>

            {hasSubcategories && isExpanded && (
                <div className="subcategories-refonte">
                    {subcategories.map(subCategory => (
                        <CategoryItem
                            key={subCategory.id || subCategory._id}
                            category={subCategory}
                            onCategoryClick={onCategoryClick}
                            level={level + 1}
                            allCategories={allCategories}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CategoryItem({ category, onCategoryClick, level, allCategories }) {
    const [isExpanded, setIsExpanded] = React.useState(level < 1);

    // Trouver les sous-catégories dans les catégories aplaties
    const subcategories = allCategories.filter(cat => {
        if (!cat.parent) return false;

        const parentId =
            typeof cat.parent === 'object' ? cat.parent._id : cat.parent;
        return parentId === (category.id || category._id);
    });

    const hasSubcategories = subcategories.length > 0;

    return (
        <div className={`category-item-refonte level-${level}`}>
            <div className="category-line-refonte">
                <button
                    className="category-btn-refonte"
                    onClick={() => onCategoryClick(category.slug)}
                >
                    <div className="item-content">
                        <span className="category-name">
                            {category.name || category.nom}
                        </span>
                        {hasSubcategories && (
                            <span className="subcount">
                                {subcategories.length}
                            </span>
                        )}
                    </div>
                </button>

                {hasSubcategories && (
                    <button
                        className="expand-btn-refonte"
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-expanded={isExpanded}
                    >
                        <FontAwesomeIcon
                            icon={isExpanded ? faChevronDown : faChevronRight}
                        />
                    </button>
                )}
            </div>

            {hasSubcategories && isExpanded && (
                <div className="subcategories-refonte">
                    {subcategories.map(subCategory => (
                        <CategoryItem
                            key={subCategory.id || subCategory._id}
                            category={subCategory}
                            onCategoryClick={onCategoryClick}
                            level={level + 1}
                            allCategories={allCategories}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
