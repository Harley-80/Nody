import api from './api';

const vendeurService = {
    //  STATISTIQUES 
    getStatistiques: () => api.get('/vendeur/statistiques'),

    //  PRODUITS 
    // Liste des produits du vendeur
    getMesProduits: params => api.get('/vendeur/produits', { params }),

    // Récupérer un produit spécifique (NOUVEAU)
    getProduit: id => api.get(`/vendeur/produits/${id}`),

    // Ajouter un nouveau produit avec images (NOUVEAU/MODIFIÉ)
    ajouterProduit: formData =>
        api.post('/vendeur/produits', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // Modifier un produit existant avec images 
    modifierProduit: (id, formData) =>
        api.put(`/vendeur/produits/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // Supprimer un produit
    supprimerProduit: id => api.delete(`/vendeur/produits/${id}`),

    // Mettre à jour le statut d'un produit (actif/inactif)
    mettreAJourStatutProduit: (id, statut) =>
        api.patch(`/vendeur/produits/${id}/statut`, { statut }),

    //  CATÉGORIES (PUBLIC) 
    // Récupérer la liste des catégories (NOUVEAU)
    getCategories: () => api.get('/categories'),

    //  COMMANDES 
    // Liste des commandes du vendeur
    getMesCommandes: params => api.get('/vendeur/commandes', { params }),

    // Mettre à jour le statut d'un produit dans une commande
    mettreAJourStatutCommandeProduit: (commandeId, produitId, statut) =>
        api.put(`/vendeur/commandes/${commandeId}/produits/${produitId}`, {
            statut,
        }),

    //  BOUTIQUE 
    // Récupérer les informations de la boutique 
    getBoutique: () => api.get('/vendeur/boutique'),

    // Mettre à jour les informations de la boutique avec logo/bannière 
    modifierBoutique: formData =>
        api.put('/vendeur/boutique', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // AUTRES MÉTHODES UTILES 

    // Récupérer les statistiques détaillées d'un produit
    getStatistiquesProduit: id =>
        api.get(`/vendeur/produits/${id}/statistiques`),

    // Récupérer l'historique des commandes d'un produit
    getHistoriqueCommandesProduit: id =>
        api.get(`/vendeur/produits/${id}/commandes`),

    // Récupérer les avis clients
    getAvisClients: params => api.get('/vendeur/avis', { params }),

    // Répondre à un avis client
    repondreAvis: (avisId, reponse) =>
        api.post(`/vendeur/avis/${avisId}/repondre`, { reponse }),
};

export default vendeurService;