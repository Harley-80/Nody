import { api } from './api';

/**
 * Service pour les opérations liées aux catégories
 */
export const categoriesService = {
    /**
     * Récupérer toutes les catégories
     */
    async getCategories() {
        try {
            const response = await api.get('/categories');
            return response.data;
        } catch (error) {
            console.error(
                'Erreur lors de la récupération des catégories:',
                error
            );
            throw error;
        }
    },

    /**
     * Récupérer une catégorie par son ID ou slug
     */
    async getCategoryById(id) {
        try {
            const response = await api.get(`/categories/${id}`);
            return response.data;
        } catch (error) {
            console.error(
                'Erreur lors de la récupération de la catégorie:',
                error
            );
            throw error;
        }
    },

    /**
     * Récupérer les catégories en vedette
     */
    async getFeaturedCategories() {
        try {
            const response = await api.get('/categories/en-vedette');
            return response.data;
        } catch (error) {
            console.error(
                'Erreur lors de la récupération des catégories en vedette:',
                error
            );
            throw error;
        }
    },

    /**
     * Créer une nouvelle catégorie (admin)
     */
    async createCategory(categoryData) {
        try {
            const response = await api.post('/categories', categoryData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création de la catégorie:', error);
            throw error;
        }
    },

    /**
     * Mettre à jour une catégorie (admin)
     */
    async updateCategory(id, categoryData) {
        try {
            const response = await api.put(`/categories/${id}`, categoryData);
            return response.data;
        } catch (error) {
            console.error(
                'Erreur lors de la mise à jour de la catégorie:',
                error
            );
            throw error;
        }
    },

    /**
     * Supprimer une catégorie (admin)
     */
    async deleteCategory(id) {
        try {
            const response = await api.delete(`/categories/${id}`);
            return response.data;
        } catch (error) {
            console.error(
                'Erreur lors de la suppression de la catégorie:',
                error
            );
            throw error;
        }
    },

    /**
     * Rechercher des catégories par terme
     */
    async searchCategories(searchTerm) {
        try {
            const response = await api.get('/categories/search', {
                params: { q: searchTerm },
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la recherche de catégories:', error);
            throw error;
        }
    },
};

export default categoriesService;
