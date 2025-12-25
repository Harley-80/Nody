import { api } from './api';

/**
 * Service pour les opérations liées aux catégories
 */
export const categoriesService = {
    /**
     * Récupérer toutes les catégories (alias pour compatibilité)
     */
    async getCategories() {
        try {
            // Utilisez getCategoriesAvecHierarchie() car c'est ce dont votre code a besoin
            return await this.getCategoriesAvecHierarchie();
        } catch (error) {
            console.error('Erreur récupération catégories:', error);
            throw error;
        }
    },

    /**
     * Récupérer toutes les catégories
     */
    async getCategoriesAvecHierarchie() {
        const response = await api.get('/categories');
        // On retourne response.data car votre intercepteur api.js
        // renvoie l'objet response d'Axios complet.
        return response.data;
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

    /**
     * Récupérer les sous-catégories d'une catégorie parente
     */
    async getSousCategories(parentId) {
        try {
            const response = await api.get(
                `/categories/${parentId}/sous-categories`
            );
            return response.data;
        } catch (error) {
            console.error('Erreur récupération sous-catégories:', error);

            // Retourner un tableau vide si 404 (catégorie sans sous-catégories)
            if (error.response?.status === 404) {
                return { succes: true, donnees: [] };
            }

            throw error;
        }
    },

    /**
     * Récupérer les catégories racines (sans parent)
     */
    async getCategoriesRacines() {
        try {
            const response = await api.get('/categories/racines');
            return response.data;
        } catch (error) {
            console.error('Erreur récupération catégories racines:', error);
            throw error;
        }
    },

    /**
     * Récupérer le chemin (breadcrumb) d'une catégorie
     */
    async getBreadcrumb(categorieId) {
        try {
            const response = await api.get(
                `/categories/${categorieId}/breadcrumb`
            );
            return response.data;
        } catch (error) {
            console.error('Erreur récupération breadcrumb:', error);
            throw error;
        }
    },

    /**
     * Récupérer le chemin complet d'une catégorie
     */
    async getCheminCategorie(categorieId) {
        try {
            const response = await api.get(`/categories/${categorieId}/chemin`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération chemin catégorie:', error);
            throw error;
        }
    },

    /**
     * Récupérer les statistiques des catégories (admin)
     */
    async getStatistiques() {
        try {
            const response = await api.get('/categories/statistiques');
            return response.data;
        } catch (error) {
            console.error(
                'Erreur récupération statistiques catégories:',
                error
            );
            throw error;
        }
    },
};

export default categoriesService;