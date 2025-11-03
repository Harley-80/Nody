import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    categoriesData,
    findCategoryBySlug,
    getCategoryPath,
    searchCategories,
} from '@/data/categories.data';

const CategoriesContext = createContext();

export const useCategories = () => {
    const context = useContext(CategoriesContext);
    if (!context) {
        throw new Error(
            'useCategories must be used within a CategoriesProvider'
        );
    }
    return context;
};

export const CategoriesProvider = ({ children }) => {
    const [categories] = useState(categoriesData);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Charger une catégorie par son slug
    const loadCategoryBySlug = slug => {
        setIsLoading(true);
        try {
            const category = findCategoryBySlug(slug);
            setCurrentCategory(category);
            return category;
        } catch (error) {
            console.error('Erreur lors du chargement de la catégorie:', error);
            setCurrentCategory(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Rechercher des catégories
    const handleSearch = searchTerm => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const results = searchCategories(searchTerm);
        setSearchResults(results);
    };

    // Obtenir le chemin de la catégorie actuelle
    const getCurrentCategoryPath = () => {
        if (!currentCategory) return [];
        return getCategoryPath(currentCategory.slug);
    };

    // Réinitialiser la recherche
    const clearSearch = () => {
        setSearchResults([]);
    };

    // Obtenir toutes les catégories racines
    const getRootCategories = () => {
        return categories;
    };

    // Obtenir les sous-catégories d'une catégorie
    const getSubcategories = categorySlug => {
        const category = findCategoryBySlug(categorySlug);
        return category?.subcategories || [];
    };

    const value = {
        // Données
        categories,
        currentCategory,
        searchResults,
        isLoading,

        // Actions
        loadCategoryBySlug,
        handleSearch,
        clearSearch,
        getCurrentCategoryPath,
        getRootCategories,
        getSubcategories,
        setCurrentCategory,
    };

    return (
        <CategoriesContext.Provider value={value}>
            {children}
        </CategoriesContext.Provider>
    );
};

export default CategoriesContext;
