// Configuration de l'application
const config = {
    // URL de l'API - très important !
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',

    // Environnement
    env: import.meta.env.MODE || 'development',

    // Configuration des requêtes
    request: {
        timeout: 30000,
        retryAttempts: 3,
    },

    // Routes principales
    routes: {
        auth: {
            login: '/auth/connexion',
            register: '/auth/inscription',
            logout: '/auth/deconnexion',
            me: '/auth/moi',
        },
        products: {
            list: '/produits',
            featured: '/produits/populaires',
            new: '/produits/nouveaux',
        },
        categories: '/categories',
    },
};

export default config;
