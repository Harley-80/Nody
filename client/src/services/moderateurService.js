import { api } from './api';

// DASHBOARD & STATISTIQUES
/**
 * Récupère les statistiques du dashboard modérateur
 * GET /api/moderateur/dashboard
 */
const obtenirStatistiquesDashboard = async () => {
    try {
        const response = await api.get('/moderateur/dashboard');
        return response.data;
    } catch (error) {
        console.error(' Erreur stats dashboard modérateur:', error);
        throw error;
    }
};

// DEMANDES DE VALIDATION
/**
 * Récupère les demandes de validation (produits ou vendeurs)
 * GET /api/moderateur/demandes?type=produit|vendeur&statut=en_attente&page=1&limite=20
 */
const obtenirDemandes = async (params = {}) => {
    const {
        type = 'produit',
        statut = 'en_attente',
        page = 1,
        limite = 20,
    } = params;

    try {
        const response = await api.get('/moderateur/demandes', {
            params: { type, statut, page, limite },
        });
        return response.data;
    } catch (error) {
        console.error(' Erreur récupération demandes:', error);
        throw error;
    }
};

// VALIDATION PRODUITS
/**
 * Valide ou rejette un produit
 * PUT /api/moderateur/produits/:id/valider
 * @param {string} id - ID du produit
 * @param {string} decision - 'approuve' ou 'rejete'
 * @param {string} motif - Motif de rejet (optionnel)
 */
const validerProduit = async (id, decision, motif = null) => {
    try {
        const response = await api.put(`/moderateur/produits/${id}/valider`, {
            decision,
            motif,
        });
        return response.data;
    } catch (error) {
        console.error(' Erreur validation produit:', error);
        throw error;
    }
};

// VALIDATION VENDEURS
/**
 * Valide ou rejette un vendeur
 * PUT /api/moderateur/vendeurs/:id/valider
 * @param {string} id - ID du vendeur
 * @param {string} decision - 'approuve' ou 'rejete'
 * @param {string} motif - Motif de rejet (optionnel)
 */
const validerVendeur = async (id, decision, motif = null) => {
    try {
        const response = await api.put(`/moderateur/vendeurs/${id}/valider`, {
            decision,
            motif,
        });
        return response.data;
    } catch (error) {
        console.error(' Erreur validation vendeur:', error);
        throw error;
    }
};

// GESTION UTILISATEURS
/**
 * Récupère la liste des utilisateurs (clients et vendeurs)
 * GET /api/moderateur/utilisateurs?role=client|vendeur&page=1&limite=20&recherche=
 */
const obtenirUtilisateurs = async (params = {}) => {
    const { role, page = 1, limite = 20, recherche = '' } = params;

    try {
        const response = await api.get('/moderateur/utilisateurs', {
            params: { role, page, limite, recherche },
        });
        return response.data;
    } catch (error) {
        console.error(' Erreur récupération utilisateurs:', error);
        throw error;
    }
};

/**
 * Active ou désactive un utilisateur
 * PATCH /api/moderateur/utilisateurs/:id/statut
 * @param {string} id - ID de l'utilisateur
 * @param {boolean} estActif - Nouveau statut
 */
const modifierStatutUtilisateur = async (id, estActif) => {
    try {
        const response = await api.patch(
            `/moderateur/utilisateurs/${id}/statut`,
            {
                estActif,
            }
        );
        return response.data;
    } catch (error) {
        console.error(' Erreur modification statut utilisateur:', error);
        throw error;
    }
};

// HISTORIQUE DES ACTIONS
/**
 * Récupère l'historique des actions du modérateur
 * GET /api/moderateur/historique?page=1&limite=20
 */
const obtenirHistorique = async (params = {}) => {
    const { page = 1, limite = 20 } = params;

    try {
        const response = await api.get('/moderateur/historique', {
            params: { page, limite },
        });
        return response.data;
    } catch (error) {
        console.error('Erreur récupération historique:', error);
        throw error;
    }
};

// EXPORT
export const moderateurService = {
    // Dashboard
    obtenirStatistiquesDashboard,

    // Demandes
    obtenirDemandes,

    // Validation
    validerProduit,
    validerVendeur,

    // Utilisateurs
    obtenirUtilisateurs,
    modifierStatutUtilisateur,

    // Historique
    obtenirHistorique,
};

export default moderateurService;