import React, { createContext, useContext, useState, useEffect } from 'react';
import { categoriesService } from '@/services/categoriesService';

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
    const [categories, setCategories] = useState([]);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Charger toutes les catégories au démarrage
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await categoriesService.getCategories();
            const data = response.donnees || response.data || response;
            setCategories(data);
        } catch (err) {
            console.error('Erreur lors du chargement des catégories:', err);
            setError(err.message || 'Erreur de chargement');
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction utilitaire pour trouver une catégorie par slug
    const findCategoryBySlug = (slug, categoriesList = categories) => {
        for (const category of categoriesList) {
            if (category.slug === slug) return category;
            if (category.sousCategories && category.sousCategories.length > 0) {
                const found = findCategoryBySlug(slug, category.sousCategories);
                if (found) return found;
            }
        }
        return null;
    };

    // Fonction pour obtenir le chemin d'une catégorie
    const getCategoryPath = slug => {
        const path = [];

        const findPath = (
            currentSlug,
            categoriesList = categories,
            currentPath = []
        ) => {
            for (const category of categoriesList) {
                const newPath = [...currentPath, category];
                if (category.slug === currentSlug) {
                    path.push(...newPath);
                    return true;
                }
                if (
                    category.sousCategories &&
                    findPath(currentSlug, category.sousCategories, newPath)
                ) {
                    return true;
                }
            }
            return false;
        };

        findPath(slug);
        return path;
    };

    // Charger une catégorie par son slug
    const loadCategoryBySlug = async slug => {
        setIsLoading(true);
        setError(null);
        try {
            // D'abord chercher localement
            const localCategory = findCategoryBySlug(slug);
            if (localCategory) {
                setCurrentCategory(localCategory);
                return localCategory;
            }

            // Sinon chercher via API
            const response = await categoriesService.getCategoryById(slug);
            const category = response.donnees || response.data || response;
            setCurrentCategory(category);
            return category;
        } catch (err) {
            console.error('Erreur lors du chargement de la catégorie:', err);
            setError(err.message || 'Erreur de chargement');
            setCurrentCategory(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Rechercher des catégories
    const handleSearch = async searchTerm => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response =
                await categoriesService.searchCategories(searchTerm);
            const results = response.donnees || response.data || response;
            setSearchResults(results);
        } catch (err) {
            console.error('Erreur lors de la recherche:', err);
            setSearchResults([]);
        }
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
        return categories.filter(cat => !cat.parent || cat.parent === null);
    };

    // Obtenir les sous-catégories d'une catégorie
    const getSubcategories = categorySlug => {
        const category = findCategoryBySlug(categorySlug);
        return category?.sousCategories || [];
    };

    // Fonction pour obtenir toutes les catégories aplaties
    const getAllCategoriesFlat = () => {
        const flatCategories = [];

        const flattenCategories = (categoriesList, level = 0) => {
            categoriesList.forEach(category => {
                flatCategories.push({
                    ...category,
                    level,
                });
                if (
                    category.sousCategories &&
                    category.sousCategories.length > 0
                ) {
                    flattenCategories(category.sousCategories, level + 1);
                }
            });
        };

        flattenCategories(categories);
        return flatCategories;
    };

    const value = {
        // Données
        categories,
        currentCategory,
        searchResults,
        isLoading,
        error,

        // Fonctions utilitaires
        findCategoryBySlug,
        getCategoryPath,
        getAllCategoriesFlat,

        // Actions
        loadCategoryBySlug,
        handleSearch,
        clearSearch,
        getCurrentCategoryPath,
        getRootCategories,
        getSubcategories,
        setCurrentCategory,
        refreshCategories: fetchCategories,
    };

    return (
        <CategoriesContext.Provider value={value}>
            {children}
        </CategoriesContext.Provider>
    );
};

export default CategoriesContext; // super
