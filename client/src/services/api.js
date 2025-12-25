import axios from 'axios';

// URL de base - IMPORTANT: utiliser le proxy Vite
const baseURL = import.meta.env.MODE === 'development' 
    ? '/api'  // En dev, utiliser le proxy Vite
    : import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// Créer une instance axios avec la configuration de base
const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // IMPORTANT pour les cookies/sessions
    timeout: 30000, // 30 secondes timeout
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log pour déboguer (à désactiver en prod)
        if (import.meta.env.DEV) {
            console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        }
        
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
    (response) => {
        // Log pour déboguer
        if (import.meta.env.DEV) {
            console.log(`API Response: ${response.status} ${response.config.url}`);
        }
        return response;
    },
    (error) => {
        console.error('API Response Error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message
        });
        
        if (error.response?.status === 401) {
            // Token expiré ou invalide
            localStorage.removeItem('token');
            localStorage.removeItem('utilisateur');
            
            // Rediriger seulement si on est pas sur la page de connexion
            if (!window.location.pathname.includes('/connexion')) {
                window.location.href = '/connexion';
            }
        }
        
        if (error.response?.status === 404) {
            console.error('Route API non trouvée:', error.config.url);
        }
        
        return Promise.reject(error);
    }
);

export { api };