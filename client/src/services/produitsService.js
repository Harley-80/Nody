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

    /**
     * Récupérer les avis d'un produit
     * @param {string} produitId - ID du produit
     * @returns {Promise}
     */
    async getAvis(produitId) {
        try {
            const response = await api.get(`/produits/${produitId}/avis`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des avis:', error);
            throw error;
        }
    },

    /**
     * Poster un avis sur un produit
     * @param {string} produitId - ID du produit
     * @param {Object} avisData - { note, titre, commentaire }
     * @returns {Promise}
     */
    async posterAvis(produitId, avisData) {
        try {
            const response = await api.post(
                `/produits/${produitId}/avis`,
                avisData
            );
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création de l'avis:", error);
            throw error;
        }
    },

    /**
     * Récupérer les produits similaires
     * @param {string} produitId - ID du produit actuel
     * @param {string} categorieId - ID de la catégorie (optionnel)
     * @returns {Promise}
     */
    async getProduitsSimilaires(produitId, categorieId = null) {
        try {
            const params = {};
            if (categorieId) {
                params.categorie = categorieId;
            }

            const response = await api.get(
                `/produits/${produitId}/similaires`,
                { params }
            );
            return response.data;
        } catch (error) {
            console.error(
                'Erreur lors de la récupération des produits similaires:',
                error
            );
            throw error;
        }
    },

    /**
     * Ajouter un produit aux favoris
     * @param {string} produitId - ID du produit
     * @returns {Promise}
     */
    async ajouterAuxFavoris(produitId) {
        try {
            const response = await api.post(
                `/utilisateurs/favoris/${produitId}`
            );
            return response.data;
        } catch (error) {
            console.error("Erreur lors de l'ajout aux favoris:", error);
            throw error;
        }
    },

    /**
     * Retirer un produit des favoris
     * @param {string} produitId - ID du produit
     * @returns {Promise}
     */
    async retirerDesFavoris(produitId) {
        try {
            const response = await api.delete(
                `/utilisateurs/favoris/${produitId}`
            );
            return response.data;
        } catch (error) {
            console.error('Erreur lors du retrait des favoris:', error);
            throw error;
        }
    },

    /**
     * Vérifier si un produit est dans les favoris
     * @param {string} produitId - ID du produit
     * @returns {Promise<boolean>}
     */
    async estDansFavoris(produitId) {
        try {
            const response = await api.get(
                `/utilisateurs/favoris/${produitId}`
            );
            return response.data.isFavorite || false;
        } catch (error) {
            console.error('Erreur lors de la vérification des favoris:', error);
            return false;
        }
    },
};

export default produitsService;