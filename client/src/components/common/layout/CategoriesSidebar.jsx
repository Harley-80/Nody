import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faChevronRight,
    faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { categoriesData, findCategoryBySlug } from '@/data/categories.data';
import './CategoriesSidebar.scss';

// Composant pour le menu latéral des catégories
export default function CategoriesSidebar({ isOpen, onClose, categorySlug }) {
    const navigate = useNavigate();
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

    if (!isOpen) return null;

    // Rendu du composant
    return (
        <div
            className="categories-sidebar-overlay"
            onClick={handleBackdropClick}
        >
            <div className="categories-sidebar">
                {/* En-tête */}
                <div className="sidebar-header">
                    <h3>{category ? category.name : 'Catégories'}</h3>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Fermer le menu des catégories"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Contenu */}
                <div className="sidebar-content">
                    {category ? (
                        <CategoryTree
                            category={category}
                            onCategoryClick={handleCategoryClick}
                            level={0}
                        />
                    ) : (
                        <div className="all-categories">
                            {categoriesData.map(cat => (
                                <CategoryItem
                                    key={cat.id}
                                    category={cat}
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

// Composant récursif pour l'arborescence des catégories
function CategoryTree({ category, onCategoryClick, level }) {
    const [isExpanded, setIsExpanded] = React.useState(level < 2); // Montre les 2 premiers niveaux par défaut

    const hasSubcategories =
        category.subcategories && category.subcategories.length > 0;

    return (
        <div className={`category-tree level-${level}`}>
            <div className="category-header">
                <button
                    className="category-main-btn"
                    onClick={() => onCategoryClick(category.slug)}
                >
                    {/* <span className="category-icon">{category.icon}</span> */}
                    <span className="category-name">{category.name}</span>
                </button>

                {hasSubcategories && (
                    <button
                        className="expand-btn"
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
                <div className="subcategories">
                    {category.subcategories.map(subCategory => (
                        <CategoryItem
                            key={subCategory.id}
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

function CategoryItem({ category, onCategoryClick, level }) {
    const [isExpanded, setIsExpanded] = React.useState(level < 1);

    const hasSubcategories =
        category.subcategories && category.subcategories.length > 0;

    return (
        <div className={`category-item level-${level}`}>
            <div className="category-line">
                <button
                    className="category-btn"
                    onClick={() => onCategoryClick(category.slug)}
                >
                    <span className="category-name">{category.name}</span>
                </button>

                {hasSubcategories && (
                    <button
                        className="expand-btn"
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
                <div className="subcategories">
                    {category.subcategories.map(subCategory => (
                        <CategoryItem
                            key={subCategory.id}
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
