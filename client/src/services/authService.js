import { api } from './api.js';

/**
 * @function handleApiError
 * @description Fonction d'aide pour intercepter une erreur Axios, extraire le message
 * le plus pertinent du backend (si disponible) et le relancer comme une
 * nouvelle erreur JavaScript.
 * @param {object} error - L'objet erreur capturé par le bloc catch (généralement une erreur Axios).
 * @param {string} defaultMessage - Le message générique à utiliser si aucun message spécifique n'est trouvé.
 */
const handleApiError = (error, defaultMessage) => {
    // 1. Tenter d'extraire le message d'erreur du corps de la réponse du serveur (ex: 400 Bad Request)
    if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
    }
    // 2. Si c'est une erreur réseau ou une autre erreur locale (ex: timeout, pas d'internet)
    else if (error.message) {
        throw new Error(error.message);
    }
    // 3. Message d'erreur générique si rien n'est trouvé
    else {
        throw new Error(defaultMessage);
    }
};

export const authService = {
    /**
     * @async
     * @function login
     * @description Envoie les identifiants de connexion au backend.
     */
    async login(email, motDePasse) {
        try {
            const response = await api.post('/auth/connexion', {
                email,
                motDePasse,
            });
            return response.data;
        } catch (error) {
            handleApiError(
                error,
                'Erreur lors de la connexion. Veuillez vérifier vos identifiants.'
            );
        }
    },

    /**
     * @async
     * @function register
     * @description Enregistre un nouvel utilisateur.
     */
    async register(userData) {
        try {
            const response = await api.post('/auth/inscription', userData);
            return response.data;
        } catch (error) {
            handleApiError(
                error,
                "Erreur lors de l'inscription. Veuillez réessayer."
            );
        }
    },

    /**
     * @async
     * @function logout
     * @description Informe le backend de la déconnexion et ignore la plupart des erreurs.
     */
    async logout() {
        try {
            // Requête pour nettoyer la session côté serveur (si applicable)
            await api.post('/auth/deconnexion');
            return true;
        } catch (error) {
            // On log l'erreur mais on ne la propage pas : l'essentiel est de nettoyer le client (fait dans AuthContext)
            console.error(
                'Erreur de déconnexion côté serveur, mais on procède à la déconnexion locale.',
                error
            );
            return false;
        }
    },

    /**
     * @async
     * @function getMe
     * @description Récupère les informations de l'utilisateur connecté via son token.
     */
    async getMe() {
        // Le try/catch est souvent géré dans l'useEffect de AuthContext pour gérer le nettoyage du token
        const response = await api.get('/auth/moi');
        return response.data;
    },

    /**
     * @function isAuthenticated
     * @description Vérifie la présence de données utilisateur dans le stockage local.
     */
    isAuthenticated() {
        const user = localStorage.getItem('nodyUser');
        return !!user;
    },

    /**
     * @function getCurrentUser
     * @description Lit et parse l'utilisateur à partir du stockage local.
     */
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('nodyUser') || 'null');
        } catch {
            return null;
        }
    },
};
