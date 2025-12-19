import { api } from './api';

/**
 * Service pour les opérations liées aux produits
 */
export const produitsService = {
    /**
     * Récupérer tous les produits
     */
    async getProduits(params = {}) {
        try {
            const response = await api.get('/produits', { params });
            return response.data;
        } catch (error) {
            console.error(
                'Erreur lors de la récupération des produits:',
                error
            );
            throw error;
        }
    },

    /**
     * Récupérer un produit par son ID ou slug
     */
    async getProduitById(id) {
        try {
            const response = await api.get(`/produits/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération du produit:', error);
            throw error;
        }
    },

    /**
     * Récupérer les nouveaux produits
     */
    async getNouveauxProduits() {
        try {
            const response = await api.get('/produits/nouveaux');
            return response.data;
        } catch (error) {
            console.error(
                'Erreur lors de la récupération des nouveaux produits:',
                error
            );
            throw error;
        }
    },

    /**
     * Récupérer les produits par catégorie
     */
    async getProduitsByCategory(categoryId, params = {}) {
        try {
            const response = await api.get(
                `/produits/categorie/${categoryId}`,
                { params }
            );
            return response.data;
        } catch (error) {
            console.error(
                'Erreur lors de la récupération des produits par catégorie:',
                error
            );
            throw error;
        }
    },

    /**
     * Rechercher des produits
     */
    async searchProduits(searchTerm, params = {}) {
        try {
            const response = await api.get('/produits/search', {
                params: { q: searchTerm, ...params },
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la recherche de produits:', error);
            throw error;
        }
    },

    /**
     * Créer un nouveau produit (admin)
     */
    async createProduit(produitData) {
        try {
            const response = await api.post('/produits', produitData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création du produit:', error);
            throw error;
        }
    },

    /**
     * Mettre à jour un produit (admin)
     */
    async updateProduit(id, produitData) {
        try {
            const response = await api.put(`/produits/${id}`, produitData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du produit:', error);
            throw error;
        }
    },

    /**
     * Supprimer un produit (admin)
     */
    async deleteProduit(id) {
        try {
            const response = await api.delete(`/produits/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la suppression du produit:', error);
            throw error;
        }
    },

    /**
     * Obtenir les produits en vedette
     */
    async getFeaturedProduits() {
        try {
            const response = await api.get('/produits/featured');
            return response.data;
        } catch (error) {
            console.error(
                'Erreur lors de la récupération des produits en vedette:',
                error
            );
            throw error;
        }
    },
};

export default produitsService;
