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
            console.log('[authService] Tentative de connexion:', email);

            const response = await api.post('/auth/connexion', {
                email,
                motDePasse,
            });

            console.log('[authService] Réponse backend:', response.data);

            if (response.data.succes && response.data.donnees) {
                const userData = response.data.donnees;
                userData.isAdmin = userData.role === 'admin';

                // Utiliser "token" au lieu de "nodyToken"
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', userData.token);

                console.log(
                    '[authService] Token sauvegardé:',
                    userData.token.substring(0, 50) + '...'
                );
                console.log('[authService] User sauvegardé:', userData);
            }

            return response.data;
        } catch (error) {
            console.error('[authService] Erreur connexion:', error);
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
                
                // Le backend retourne : nom: "Diop" (nom de famille), prenom: "Vendeur" (prénom)
                // Mais mon frontend attend nomComplet
                userData.nomComplet = `${userData.prenom} ${userData.nom}`;

                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', userData.token);
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
                
                userData.nomComplet =
                    `${userData.prenom || ''} ${userData.nom || ''}`.trim();
                if (!userData.nomComplet) {
                    userData.nomComplet = userData.email || 'Utilisateur';
                }

                localStorage.setItem('user', JSON.stringify(userData));
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
        const token = this.getToken();
        return !!(user && token);
    },

    /**
     * @function getCurrentUser
     * @description Lit et parse l'utilisateur à partir du stockage local.
     */
    getCurrentUser() {
        try {
            // CORRECTION : Essayer "user" d'abord, puis "nodyUser" (rétrocompatibilité)
            const userStr =
                localStorage.getItem('user') ||
                localStorage.getItem('nodyUser');
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
        // CORRECTION : Essayer "token" d'abord, puis "nodyToken" (rétrocompatibilité)
        return (
            localStorage.getItem('token') || localStorage.getItem('nodyToken')
        );
    },

    /**
     * @function clearAuth
     * @description Nettoie toutes les données d'authentification
     */
    clearAuth() {
        // CORRECTION : Nettoyer les deux formats
        localStorage.removeItem('user');
        localStorage.removeItem('nodyUser');
        localStorage.removeItem('token');
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
