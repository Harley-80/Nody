import { api } from './api';

// Service de gestion du dashboard vendeur
export const vendeurService = {
    // STATISTIQUES
    /**
     * Récupère les statistiques du dashboard vendeur
     * GET /api/vendeur/statistiques
     */
    obtenirStatistiques: async () => {
        try {
            const response = await api.get('/vendeur/statistiques');
            return response.data;
        } catch (error) {
            console.error('Erreur statistiques vendeur:', error);
            throw error;
        }
    },

    /**
     * Récupère les statistiques détaillées du vendeur avec filtres
     * GET /api/vendeur/statistiques?periode=mois&dateDebut=...&dateFin=...
     */
    obtenirStatistiquesDetaillees: async (params = {}) => {
        try {
            const response = await api.get('/vendeur/statistiques', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur statistiques détaillées vendeur:', error);
            throw error;
        }
    },

    /**
     * Récupère l'évolution des ventes pour graphiques
     * GET /api/vendeur/statistiques/evolution?periode=7j
     */
    obtenirEvolutionVentes: async (params = {}) => {
        try {
            const response = await api.get('/vendeur/statistiques/evolution', {
                params,
            });
            return response.data;
        } catch (error) {
            console.error('Erreur évolution ventes:', error);
            throw error;
        }
    },

    // GESTION PRODUITS
    /**
     * Récupère les produits du vendeur avec pagination
     * GET /api/vendeur/produits
     */
    obtenirMesProduits: async (params = {}) => {
        const { page = 1, limit = 12, statut } = params;

        try {
            const response = await api.get('/vendeur/produits', {
                params: { page, limit, statut },
            });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération produits:', error);
            throw error;
        }
    },

    /**
     * Récupère les produits populaires du vendeur
     * GET /api/vendeur/produits/populaires
     */
    obtenirProduitsPopulaires: async (params = {}) => {
        try {
            const response = await api.get('/vendeur/produits/populaires', {
                params,
            });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération produits populaires:', error);
            throw error;
        }
    },

    /**
     * Récupère un produit spécifique
     * GET /api/vendeur/produits/:id
     */
    obtenirProduit: async id => {
        try {
            const response = await api.get(`/vendeur/produits/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération produit:', error);
            throw error;
        }
    },

    /**
     * Créer un nouveau produit
     * POST /api/vendeur/produits
     */
    creerProduit: async produitData => {
        try {
            const response = await api.post('/vendeur/produits', produitData);
            return response.data;
        } catch (error) {
            console.error('Erreur création produit:', error);
            throw error;
        }
    },

    /**
     * Modifier un produit existant
     * PUT /api/vendeur/produits/:id
     */
    modifierProduit: async (id, produitData) => {
        try {
            const response = await api.put(
                `/vendeur/produits/${id}`,
                produitData
            );
            return response.data;
        } catch (error) {
            console.error('Erreur modification produit:', error);
            throw error;
        }
    },

    /**
     * Supprimer un produit
     * DELETE /api/vendeur/produits/:id
     */
    supprimerProduit: async id => {
        try {
            const response = await api.delete(`/vendeur/produits/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur suppression produit:', error);
            throw error;
        }
    },

    // GESTION COMMANDES
    /**
     * Récupère les commandes du vendeur
     * GET /api/vendeur/commandes
     */
    obtenirMesCommandes: async (params = {}) => {
        const { page = 1, limit = 10, statut } = params;

        try {
            const response = await api.get('/vendeur/commandes', {
                params: { page, limit, statut },
            });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération commandes:', error);
            throw error;
        }
    },

    /**
     * Mettre à jour le statut d'un produit dans une commande
     * PUT /api/vendeur/commandes/:commandeId/produits/:produitId
     */
    mettreAJourStatutProduit: async (commandeId, produitId, statut) => {
        try {
            const response = await api.put(
                `/vendeur/commandes/${commandeId}/produits/${produitId}`,
                { statut }
            );
            return response.data;
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            throw error;
        }
    },

    // GESTION BOUTIQUE
    /**
     * Récupère les informations de la boutique
     * GET /api/vendeur/boutique
     */
    obtenirMaBoutique: async () => {
        try {
            const response = await api.get('/vendeur/boutique');
            return response.data;
        } catch (error) {
            console.error('Erreur récupération boutique:', error);
            throw error;
        }
    },

    /**
     * Mettre à jour les informations de la boutique
     * PUT /api/vendeur/boutique
     */
    mettreAJourBoutique: async boutiqueData => {
        try {
            const response = await api.put('/vendeur/boutique', boutiqueData);
            return response.data;
        } catch (error) {
            console.error('Erreur mise à jour boutique:', error);
            throw error;
        }
    },

    // CATÉGORIES (Service transversal)
    /**
     * Récupère les catégories
     * GET /api/categories
     */
    obtenirCategories: async () => {
        try {
            const response = await api.get('/categories');
            return response.data;
        } catch (error) {
            console.error('Erreur récupération catégories:', error);
            throw error;
        }
    },

    // RAPPORTS & ANALYTIQUES
    /**
     * Générer un rapport de ventes
     * GET /api/vendeur/rapports/ventes
     */
    genererRapportVentes: async periode => {
        try {
            const response = await api.get('/vendeur/rapports/ventes', {
                params: { periode },
            });
            return response.data;
        } catch (error) {
            console.error('Erreur génération rapport:', error);
            throw error;
        }
    },

    /**
     * Récupère les données de performance (graphiques)
     * GET /api/vendeur/statistiques/performance
     */
    obtenirDonneesPerformance: async (params = {}) => {
        try {
            const response = await api.get(
                '/vendeur/statistiques/performance',
                { params }
            );
            return response.data;
        } catch (error) {
            console.error('Erreur données performance:', error);
            throw error;
        }
    },
};

export default vendeurService;