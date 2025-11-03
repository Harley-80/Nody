import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { categoriesData } from '@/data/categories.data';
import './CategoriesMegaMenu.scss';

// Composant pour le menu mega de catégories
export default function CategoriesMegaMenu({ isOpen, onClose }) {
    const [activeCategory, setActiveCategory] = useState(null);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    // Fermer le menu en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = event => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
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

    // Rendu du composant
    return (
        <>
            <div className="mega-menu-overlay" onClick={onClose} />
            <div className="categories-mega-menu" ref={menuRef}>
                <div className="mega-menu-content">
                    {/* Colonne des catégories principales */}
                    <div className="categories-column">
                        <h3 className="categories-title">Catégories</h3>
                        <div className="categories-list">
                            {categoriesData.map(category => (
                                <div
                                    key={category.id}
                                    className={`category-item ${activeCategory?.id === category.id ? 'active' : ''}`}
                                    onMouseEnter={() =>
                                        setActiveCategory(category)
                                    }
                                    onClick={e =>
                                        handleCategoryClick(category, e)
                                    }
                                >
                                    <span className="category-icon">
                                        {category.icon}
                                    </span>
                                    <span className="category-name">
                                        {category.name}
                                    </span>
                                    <FontAwesomeIcon
                                        icon={faChevronRight}
                                        className="chevron-icon"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Colonne des sous-catégories */}
                    <div className="subcategories-column">
                        {activeCategory ? (
                            <>
                                <div className="subcategories-header">
                                    <h4>{activeCategory.name}</h4>
                                    <button
                                        className="view-all-btn"
                                        onClick={() =>
                                            handleViewAll(activeCategory.slug)
                                        }
                                    >
                                        Voir tout
                                    </button>
                                </div>
                                <div className="subcategories-grid">
                                    {activeCategory.subcategories?.map(
                                        subCategory => (
                                            <div
                                                key={subCategory.id}
                                                className="subcategory-group"
                                            >
                                                <h5
                                                    className="subcategory-title"
                                                    onClick={() =>
                                                        handleSubCategoryClick(
                                                            subCategory.slug
                                                        )
                                                    }
                                                >
                                                    {subCategory.name}
                                                </h5>
                                                <div className="subsubcategories-list">
                                                    {subCategory.subcategories
                                                        ?.slice(0, 5)
                                                        .map(subSubCategory => (
                                                            <Link
                                                                key={
                                                                    subSubCategory.id
                                                                }
                                                                to={`/categories/${subSubCategory.slug}`}
                                                                className="subsubcategory-link"
                                                                onClick={
                                                                    onClose
                                                                }
                                                            >
                                                                {
                                                                    subSubCategory.name
                                                                }
                                                            </Link>
                                                        ))}
                                                    {subCategory.subcategories &&
                                                        subCategory
                                                            .subcategories
                                                            .length > 5 && (
                                                            <button
                                                                className="more-items-btn"
                                                                onClick={() =>
                                                                    handleSubCategoryClick(
                                                                        subCategory.slug
                                                                    )
                                                                }
                                                            >
                                                                +{' '}
                                                                {subCategory
                                                                    .subcategories
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
                            <div className="no-category-selected">
                                <div className="placeholder-icon">👆</div>
                                <p>
                                    Sélectionnez une catégorie pour voir les
                                    sous-catégories
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
