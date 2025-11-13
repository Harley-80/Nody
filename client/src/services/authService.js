import { api } from './api.js';

/**
 * @function handleApiError
 * @description Fonction d'aide pour intercepter une erreur Axios, extraire le message
 * le plus pertinent du backend (si disponible) et le relancer comme une
 * nouvelle erreur JavaScript.
 */
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

            if (response.data.succes && response.data.donnees) {
                const userData = response.data.donnees;
                userData.isAdmin = userData.role === 'admin';
                localStorage.setItem('nodyUser', JSON.stringify(userData));
                localStorage.setItem('nodyToken', userData.token);
            }

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

            if (response.data.succes && response.data.donnees) {
                const userData = response.data.donnees;
                userData.isAdmin = userData.role === 'admin';
                localStorage.setItem('nodyUser', JSON.stringify(userData));
                localStorage.setItem('nodyToken', userData.token);
            }

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
            this.clearAuth();
            await api.post('/auth/deconnexion');
            return true;
        } catch (error) {
            console.error(
                'Erreur de déconnexion côté serveur, mais on procède à la déconnexion locale.',
                error
            );
            this.clearAuth();
            return false;
        }
    },

    /**
     * @async
     * @function getMe
     * @description Récupère les informations de l'utilisateur connecté via son token.
     */
    async getMe() {
        try {
            const response = await api.get('/auth/moi');

            if (response.data.succes && response.data.donnees) {
                const userData = response.data.donnees;
                userData.isAdmin = userData.role === 'admin';
                localStorage.setItem('nodyUser', JSON.stringify(userData));
            }

            return response.data;
        } catch (error) {
            this.clearAuth();
            throw error;
        }
    },

    /**
     * @function isAuthenticated
     * @description Vérifie la présence de données utilisateur dans le stockage local.
     */
    isAuthenticated() {
        const user = this.getCurrentUser();
        const token = localStorage.getItem('nodyToken');
        return !!(user && token);
    },

    /**
     * @function getCurrentUser
     * @description Lit et parse l'utilisateur à partir du stockage local.
     */
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('nodyUser');
            if (!userStr) return null;

            const user = JSON.parse(userStr);
            user.isAdmin = user.role === 'admin';
            return user;
        } catch {
            return null;
        }
    },

    /**
     * @function getToken
     * @description Récupère le token d'authentification
     */
    getToken() {
        return localStorage.getItem('nodyToken');
    },

    /**
     * @function clearAuth
     * @description Nettoie toutes les données d'authentification
     */
    clearAuth() {
        localStorage.removeItem('nodyUser');
        localStorage.removeItem('nodyToken');
    },

    /**
     * @function hasRole
     * @description Vérifie si l'utilisateur a un rôle spécifique
     */
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    },

    /**
     * @function isAdmin
     * @description Vérifie si l'utilisateur est administrateur
     */
    isAdmin() {
        return this.hasRole('admin');
    },
};
