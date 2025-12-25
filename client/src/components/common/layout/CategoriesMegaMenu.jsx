import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight,
    faSearch,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { useCategories } from '../../../contexts/CategoriesContext';
import './CategoriesMegaMenu.scss';

// Composant pour le menu mega de catégories
export default function CategoriesMegaMenu({ isOpen, onClose }) {
    const [activeCategory, setActiveCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const { categories, isLoading } = useCategories();

    // Filtrer les catégories par recherche
    const filteredCategories = (
        Array.isArray(categories) ? categories : []
    ).filter(
        category =>
            category.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.sousCategories?.some(sub =>
                sub.nom?.toLowerCase().includes(searchTerm.toLowerCase())
            )
    );

    // Fermer le menu en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = event => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscape = event => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Gérer le clic sur une catégorie
    const handleCategoryClick = (category, event) => {
        event.preventDefault();
        setActiveCategory(category);
    };

    // Gérer le clic sur une sous-catégorie
    const handleSubCategoryClick = categorySlug => {
        navigate(`/categories/${categorySlug}`);
        onClose();
    };

    // Gérer le clic sur "Voir tout"
    const handleViewAll = categorySlug => {
        navigate(`/categories/${categorySlug}`);
        onClose();
    };

    if (!isOpen) return null;

    // Si les catégories ne sont pas encore chargées
    if (isLoading) {
        return (
            <>
                <div className="mega-menu-overlay-refonte" onClick={onClose} />
                <div className="categories-mega-menu-refonte" ref={menuRef}>
                    <div className="loading-state-refonte">
                        <div className="spinner-refonte"></div>
                        <p className="loading-text">
                            Chargement des catégories...
                        </p>
                    </div>
                </div>
            </>
        );
    }

    // Rendu du composant
    return (
        <>
            <div className="mega-menu-overlay-refonte" onClick={onClose} />
            <div className="categories-mega-menu-refonte" ref={menuRef}>
                {/* Header du menu */}
                <div className="mega-menu-header-refonte">
                    <div className="header-content">
                        <h3 className="menu-title">Catégories</h3>
                        <button
                            className="close-btn-refonte"
                            onClick={onClose}
                            aria-label="Fermer"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Barre de recherche */}
                    <div className="search-bar-refonte">
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="search-icon"
                        />
                        <input
                            type="text"
                            placeholder="Rechercher une catégorie..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="search-input-refonte"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="mega-menu-content-refonte">
                    {/* Colonne des catégories principales */}
                    <div className="categories-column-refonte">
                        <div className="categories-list-refonte">
                            {filteredCategories.map(category => (
                                <div
                                    key={category._id}
                                    className={`category-item-refonte ${activeCategory?._id === category._id ? 'active' : ''}`}
                                    onMouseEnter={() =>
                                        setActiveCategory(category)
                                    }
                                    onClick={e =>
                                        handleCategoryClick(category, e)
                                    }
                                >
                                    <div className="category-content">
                                        <div className="category-icon-refonte">
                                            {category.image ? (
                                                <img
                                                    src={`http://localhost:5000${category.image}`}
                                                    alt={category.nom}
                                                    className="category-image-icon"
                                                />
                                            ) : (
                                                <div className="icon-placeholder">
                                                    {category.nom.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="category-info">
                                            <span className="category-name-refonte">
                                                {category.nom}
                                            </span>
                                            {category.sousCategories && (
                                                <span className="category-count">
                                                    {
                                                        category.sousCategories
                                                            .length
                                                    }{' '}
                                                    sous-catégories
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <FontAwesomeIcon
                                        icon={faChevronRight}
                                        className="chevron-icon"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Colonne des sous-catégories */}
                    <div className="subcategories-column-refonte">
                        {activeCategory ? (
                            <>
                                <div className="subcategories-header-refonte">
                                    <div className="selected-category">
                                        <h4 className="category-title">
                                            {activeCategory.nom}
                                        </h4>
                                        <p className="category-description">
                                            {activeCategory.description ||
                                                'Parcourez toutes les sous-catégories'}
                                        </p>
                                    </div>
                                    <button
                                        className="view-all-btn-refonte"
                                        onClick={() =>
                                            handleViewAll(activeCategory.slug)
                                        }
                                    >
                                        Voir toutes les catégories →
                                    </button>
                                </div>
                                <div className="subcategories-grid-refonte">
                                    {activeCategory.sousCategories?.map(
                                        subCategory => (
                                            <div
                                                key={subCategory._id}
                                                className="subcategory-group-refonte"
                                            >
                                                <h5
                                                    className="subcategory-title-refonte"
                                                    onClick={() =>
                                                        handleSubCategoryClick(
                                                            subCategory.slug
                                                        )
                                                    }
                                                >
                                                    {subCategory.nom}
                                                </h5>
                                                <div className="subsubcategories-list-refonte">
                                                    {subCategory.sousCategories
                                                        ?.slice(0, 5)
                                                        .map(subSubCategory => (
                                                            <Link
                                                                key={
                                                                    subSubCategory._id
                                                                }
                                                                to={`/categories/${subSubCategory.slug}`}
                                                                className="subsubcategory-link-refonte"
                                                                onClick={
                                                                    onClose
                                                                }
                                                            >
                                                                <span className="link-text">
                                                                    {
                                                                        subSubCategory.nom
                                                                    }
                                                                </span>
                                                                <span className="link-count">
                                                                    {subSubCategory.productCount ||
                                                                        '0'}{' '}
                                                                    produits
                                                                </span>
                                                            </Link>
                                                        ))}
                                                    {subCategory.sousCategories &&
                                                        subCategory
                                                            .sousCategories
                                                            .length > 5 && (
                                                            <button
                                                                className="more-items-btn-refonte"
                                                                onClick={() =>
                                                                    handleSubCategoryClick(
                                                                        subCategory.slug
                                                                    )
                                                                }
                                                            >
                                                                +{' '}
                                                                {subCategory
                                                                    .sousCategories
                                                                    .length -
                                                                    5}{' '}
                                                                autres
                                                            </button>
                                                        )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="no-category-selected-refonte">
                                <div className="placeholder-icon">👈</div>
                                <h4>Sélectionnez une catégorie</h4>
                                <p>
                                    Choisissez une catégorie à gauche pour voir
                                    ses sous-catégories
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer du menu */}
                <div className="mega-menu-footer-refonte">
                    <div className="stats-refonte">
                        <div className="stat-item">
                            <span className="stat-number">
                                {categories.length}
                            </span>
                            <span className="stat-label">Catégories</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">
                                {categories.reduce(
                                    (acc, cat) =>
                                        acc + (cat.sousCategories?.length || 0),
                                    0
                                )}
                            </span>
                            <span className="stat-label">Sous-catégories</span>
                        </div>
                    </div>
                    <button
                        className="browse-all-btn"
                        onClick={() => {
                            navigate('/categories');
                            onClose();
                        }}
                    >
                        Parcourir toutes les catégories
                    </button>
                </div>
            </div>
        </>
    );
}
