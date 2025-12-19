import { api } from './api.js';

// Fonction utilitaire pour gérer les erreurs d'API de manière cohérente
const handleApiError = (error, defaultMessage) => {
    if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
    } else if (error.response?.data?.erreur) {
        throw new Error(error.response.data.erreur);
    } else if (error.message) {
        throw new Error(error.message);
    } else {
        throw new Error(defaultMessage);
    }
};

export const adminService = {
    // SECTION 1: GESTION DES CLIENTS
    /**
     * Obtenir tous les clients avec pagination
     * @param {Object} params - { page, limite, recherche }
     * @returns {Promise} { succes, donnees: { utilisateurs, pagination } }
     */
    async getClients(params = {}) {
        try {
            const response = await api.get('/admin/clients', { params });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement des clients');
        }
    },

    /**
     * Obtenir un client par ID
     * @param {string} id - ID du client
     * @returns {Promise} Détails du client
     */
    async getClient(id) {
        try {
            const response = await api.get(`/admin/utilisateurs/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement du client');
        }
    },

    /**
     * Créer un nouveau client
     * @param {Object} clientData - { nom, prenom, email, motDePasse, telephone, genre }
     * @returns {Promise} Client créé
     */
    async createClient(clientData) {
        try {
            const response = await api.post('/admin/utilisateurs', {
                ...clientData,
                role: 'client', // Forcer le rôle client
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la création du client');
        }
    },

    /**
     * Mettre à jour un client
     * @param {string} id - ID du client
     * @param {Object} clientData - Données à mettre à jour
     * @returns {Promise} Client mis à jour
     */
    async updateClient(id, clientData) {
        try {
            const response = await api.put(`/utilisateurs/${id}`, clientData);
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la mise à jour du client');
        }
    },

    /**
     * Supprimer un client
     * @param {string} id - ID du client
     * @returns {Promise} Confirmation de suppression
     */
    async deleteClient(id) {
        try {
            const response = await api.delete(`/admin/utilisateurs/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la suppression du client');
        }
    },

    /**
     * Bloquer/Débloquer un client
     * @param {string} id - ID du client
     * @param {boolean} estActif - true = actif, false = bloqué
     * @returns {Promise} Client mis à jour
     */
    async updateClientStatus(id, estActif) {
        try {
            const response = await api.put(`/admin/utilisateurs/${id}/statut`, {
                estActif,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la modification du statut');
        }
    },

    // SECTION 2: GESTION DES VENDEURS
    /**
     * Obtenir tous les vendeurs avec pagination
     * @param {Object} params - { page, limite, recherche }
     * @returns {Promise} { succes, donnees: { utilisateurs, pagination } }
     */
    async getVendeurs(params = {}) {
        try {
            const response = await api.get('/admin/vendeurs', { params });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement des vendeurs');
        }
    },

    /**
     * Obtenir un vendeur par ID
     * @param {string} id - ID du vendeur
     * @returns {Promise} Détails du vendeur
     */
    async getVendeur(id) {
        try {
            const response = await api.get(`/admin/utilisateurs/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement du vendeur');
        }
    },

    /**
     * Créer un nouveau vendeur
     * @param {Object} vendeurData - { nom, prenom, email, motDePasse, telephone, genre, boutique }
     * @returns {Promise} Vendeur créé
     */
    async createVendeur(vendeurData) {
        try {
            const response = await api.post('/admin/utilisateurs', {
                ...vendeurData,
                role: 'vendeur', // Forcer le rôle vendeur
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la création du vendeur');
        }
    },

    /**
     * Mettre à jour un vendeur
     * @param {string} id - ID du vendeur
     * @param {Object} vendeurData - Données à mettre à jour
     * @returns {Promise} Vendeur mis à jour
     */
    async updateVendeur(id, vendeurData) {
        try {
            const response = await api.put(`/utilisateurs/${id}`, vendeurData);
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la mise à jour du vendeur');
        }
    },

    /**
     * Supprimer un vendeur
     * @param {string} id - ID du vendeur
     * @returns {Promise} Confirmation de suppression
     */
    async deleteVendeur(id) {
        try {
            const response = await api.delete(`/admin/utilisateurs/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la suppression du vendeur');
        }
    },

    /**
     * Mettre à jour le statut de vérification d'un vendeur
     * @param {string} id - ID du vendeur
     * @param {string} statutVerification - 'en_attente' | 'verifie' | 'rejete'
     * @param {string} raisonRejet - Raison si rejet
     * @returns {Promise} Vendeur mis à jour
     */
    async updateVendeurVerification(id, statutVerification, raisonRejet = '') {
        try {
            const response = await api.put(
                `/admin/utilisateurs/${id}/verification`,
                {
                    statutVerification,
                    raisonRejet,
                }
            );
            return response.data;
        } catch (error) {
            handleApiError(
                error,
                'Erreur lors de la modification du statut de vérification'
            );
        }
    },

    /**
     * Bloquer/Débloquer un vendeur
     * @param {string} id - ID du vendeur
     * @param {boolean} estActif - true = actif, false = bloqué
     * @returns {Promise} Vendeur mis à jour
     */
    async updateVendeurStatus(id, estActif) {
        try {
            const response = await api.put(`/admin/utilisateurs/${id}/statut`, {
                estActif,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la modification du statut');
        }
    },
    // SECTION 3: GESTION DES MODÉRATEURS
    /**
     * Obtenir tous les modérateurs
     * @returns {Promise} { succes, donnees: { moderateurs, total } }
     */
    async getModerateurs() {
        try {
            const response = await api.get('/admin/moderateurs');
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement des modérateurs');
        }
    },

    /**
     * Obtenir un modérateur par ID
     * @param {string} id - ID du modérateur
     * @returns {Promise} Détails du modérateur
     */
    async getModerateur(id) {
        try {
            const response = await api.get(`/admin/utilisateurs/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement du modérateur');
        }
    },

    /**
     * Créer un nouveau modérateur
     * @param {Object} moderateurData - { nom, prenom, email, motDePasse, telephone, genre }
     * @returns {Promise} Modérateur créé
     */
    async createModerateur(moderateurData) {
        try {
            const response = await api.post('/admin/utilisateurs', {
                ...moderateurData,
                role: 'moderateur', // Forcer le rôle modérateur
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la création du modérateur');
        }
    },

    /**
     * Mettre à jour un modérateur
     * @param {string} id - ID du modérateur
     * @param {Object} moderateurData - Données à mettre à jour
     * @returns {Promise} Modérateur mis à jour
     */
    async updateModerateur(id, moderateurData) {
        try {
            const response = await api.put(
                `/admin/moderateurs/${id}`,
                moderateurData
            );
            return response.data;
        } catch (error) {
            handleApiError(
                error,
                'Erreur lors de la mise à jour du modérateur'
            );
        }
    },

    /**
     * Supprimer un modérateur
     * @param {string} id - ID du modérateur
     * @returns {Promise} Confirmation de suppression
     */
    async deleteModerateur(id) {
        try {
            const response = await api.delete(`/admin/moderateurs/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(
                error,
                'Erreur lors de la suppression du modérateur'
            );
        }
    },

    /**
     * Bloquer/Débloquer un modérateur
     * @param {string} id - ID du modérateur
     * @param {boolean} estActif - true = actif, false = bloqué
     * @returns {Promise} Modérateur mis à jour
     */
    async updateModerateurStatus(id, estActif) {
        try {
            const response = await api.patch(
                `/admin/moderateurs/${id}/statut`,
                {
                    estActif,
                }
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la modification du statut');
        }
    },

    /**
     * Mettre à jour le rôle d'un modérateur
     * @param {string} id - ID du modérateur
     * @param {string} role - Nouveau rôle
     * @returns {Promise} Modérateur mis à jour
     */
    async updateModerateurRole(id, role) {
        try {
            const response = await api.put(`/admin/utilisateurs/${id}/role`, {
                role,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la modification du rôle');
        }
    },

    // SECTION 4: GESTION DES DEMANDES DE VÉRIFICATION
    async getDemandes(params = {}) {
        try {
            // Transformer 'approuve' en 'verifie' pour correspondre a la base de donnees
            const transformedParams = { ...params };
            if (transformedParams.statut === 'approuve') {
                transformedParams.statut = 'verifie';
            }

            const response = await api.get('/admin/demandes', {
                params: transformedParams,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement des demandes');
        }
    },

    async getStatistiquesDemandes() {
        try {
            const response = await api.get('/admin/demandes/statistiques');
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement des statistiques');
        }
    },

    async approuverDemande(demandeId) {
        try {
            const response = await api.put(
                `/admin/demandes/${demandeId}/approuver`
            );
            return response.data;
        } catch (error) {
            handleApiError(error, "Erreur lors de l'approbation de la demande");
        }
    },

    async rejeterDemande(demandeId, raison) {
        try {
            const response = await api.put(
                `/admin/demandes/${demandeId}/rejeter`,
                { raison }
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du rejet de la demande');
        }
    },

    async reapprouverDemande(demandeId) {
        try {
            const response = await api.put(
                `/admin/demandes/${demandeId}/reapprouver`
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la réapprobation');
        }
    },

    async reactiverUtilisateur(utilisateurId) {
        try {
            const response = await api.put(
                `/admin/utilisateurs/${utilisateurId}/reactiver`
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la réactivation');
        }
    },

    // SECTION 5: GESTION GÉNÉRALE DES UTILISATEURS
    async getUtilisateurs(params = {}) {
        try {
            const response = await api.get('/admin/utilisateurs', { params });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement des utilisateurs');
        }
    },

    async getUtilisateur(id) {
        try {
            const response = await api.get(`/admin/utilisateurs/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error, "Erreur lors du chargement de l'utilisateur");
        }
    },

    async updateRoleUtilisateur(id, role) {
        try {
            const response = await api.put(`/admin/utilisateurs/${id}/role`, {
                role,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la modification du rôle');
        }
    },

    async updateStatutUtilisateur(id, estActif) {
        try {
            const response = await api.put(`/admin/utilisateurs/${id}/statut`, {
                estActif,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la modification du statut');
        }
    },

    async deleteUtilisateur(id) {
        try {
            const response = await api.delete(`/admin/utilisateurs/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(
                error,
                "Erreur lors de la suppression de l'utilisateur"
            );
        }
    },

    async getStatistiquesUtilisateurs() {
        try {
            const response = await api.get('/admin/statistiques/utilisateurs');
            return response.data;
        } catch (error) {
            handleApiError(
                error,
                'Erreur lors du chargement des statistiques utilisateurs'
            );
        }
    },

    // SECTION 6: HISTORIQUE ET AUDIT
    async getHistoriqueDecisions(params = {}) {
        try {
            const response = await api.get('/admin/historique-decisions', {
                params,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, "Erreur lors du chargement de l'historique");
        }
    },

    async getHistoriqueUtilisateur(utilisateurId) {
        try {
            const response = await api.get(
                `/admin/utilisateurs/${utilisateurId}/historique`
            );
            return response.data;
        } catch (error) {
            handleApiError(
                error,
                "Erreur lors du chargement de l'historique utilisateur"
            );
        }
    },

    // SECTION 7: GESTION DES PRODUITS
    async getProduits(params = {}) {
        try {
            const response = await api.get('/produits', { params });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement des produits');
        }
    },

    async getProduit(id) {
        try {
            const response = await api.get(`/produits/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement du produit');
        }
    },

    async creerProduit(formData) {
        try {
            const response = await api.post('/produits', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la création du produit');
        }
    },

    async modifierProduit(id, formData) {
        try {
            const response = await api.put(`/produits/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la modification du produit');
        }
    },

    async supprimerProduit(id) {
        try {
            const response = await api.delete(`/produits/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la suppression du produit');
        }
    },

    async getStatistiquesProduits() {
        try {
            const response = await api.get('/produits/stats');
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement des statistiques');
        }
    },

    // SECTION 8: STATISTIQUES DASHBOARD
    /**
     * Obtenir toutes les statistiques du dashboard
     * @param {Object} params - Paramètres optionnels { periode, dateDebut, dateFin }
     * @returns {Promise} Données du dashboard
     */
    async getStatistiquesDashboard(params = {}) {
        try {
            const response = await api.get('/admin/statistiques/dashboard', {
                params,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement des statistiques');
        }
    },

    /**
     * Obtenir les commandes récentes
     * @param {number} limite - Nombre de commandes à récupérer
     * @returns {Promise} Liste des commandes récentes
     */
    async getCommandesRecentes(limite = 10) {
        try {
            const response = await api.get('/statistiques/commandes-recentes', {
                params: { limite },
            });
            return response.data;
        } catch (error) {
            handleApiError(
                error,
                'Erreur lors du chargement des commandes récentes'
            );
        }
    },

    // SECTION 9: GESTION DES COMMANDES
    /**
     * Obtenir toutes les commandes (admin)
     * @param {Object} params - Filtres { page, limite, statut, client, dateDebut, dateFin }
     * @returns {Promise} Liste des commandes avec pagination
     */
    async getCommandes(params = {}) {
        try {
            const response = await api.get('/commandes/admin/toutes', {
                params,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement des commandes');
        }
    },

    /**
     * Obtenir une commande par ID
     * @param {string} id - ID de la commande
     * @returns {Promise} Détails de la commande
     */
    async getCommande(id) {
        try {
            const response = await api.get(`/commandes/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors du chargement de la commande');
        }
    },

    /**
     * Mettre à jour le statut d'une commande
     * @param {string} id - ID de la commande
     * @param {string} statut - Nouveau statut
     * @param {string} note - Note optionnelle
     * @returns {Promise} Commande mise à jour
     */
    async updateStatutCommande(id, statut, note = '') {
        try {
            const response = await api.put(`/commandes/admin/${id}/statut`, {
                statut,
                note,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, 'Erreur lors de la mise à jour du statut');
        }
    },

    /**
     * Annuler une commande
     * @param {string} id - ID de la commande
     * @param {string} raison - Raison de l'annulation
     * @returns {Promise} Commande annulée
     */
    async annulerCommande(id, raison) {
        try {
            const response = await api.put(`/commandes/${id}/annuler`, {
                raison,
            });
            return response.data;
        } catch (error) {
            handleApiError(error, "Erreur lors de l'annulation de la commande");
        }
    },

    // SECTION 10: EXPORT ET RAPPORTS
    /**
     * Exporter les statistiques en PDF
     * @param {string} dateDebut - Date de début (format ISO)
     * @param {string} dateFin - Date de fin (format ISO)
     * @returns {Promise<Blob>} Fichier PDF
     */
    async exporterStatistiquesPDF(dateDebut, dateFin) {
        try {
            const response = await api.post(
                '/statistiques/exporter-pdf',
                { dateDebut, dateFin },
                { responseType: 'blob' }
            );
            return response.data;
        } catch (error) {
            handleApiError(error, "Erreur lors de l'export PDF");
        }
    },
};

export default adminService;
