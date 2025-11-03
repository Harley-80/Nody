import axios from 'axios';
import config from '../config/config.js';

export const api = axios.create({
    baseURL: config.apiUrl,
    withCredentials: true,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    config => {
        const user = JSON.parse(localStorage.getItem('nodyUser') || '{}');
        if (user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('nodyUser');
            window.location.href = '/connexion';
        }
        return Promise.reject(error);
    }
);

// FONCTIONS DE RECHERCHE AJOUTÉES
export async function searchProduits(query, filters = {}) {
    try {
        const params = { search: query, ...filters };
        const response = await api.get('/produits/search', { params });
        return response.data.donnees || response.data;
    } catch (error) {
        console.error('Erreur lors de la recherche de produits:', error);
        throw error;
    }
}

export async function searchProduitsByImage(imageFile) {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await api.post('/produits/search-by-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.donnees || response.data;
    } catch (error) {
        console.error('Erreur lors de la recherche par image:', error);
        throw error;
    }
}

export async function getCategories() {
    try {
        const response = await api.get('/categories');
        return response.data.donnees || response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
        throw error;
    }
}

export async function getProduits(params = {}) {
    try {
        const response = await api.get('/produits', { params });
        return response.data.donnees || response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        throw error;
    }
}

export async function loginUser(credentials) {
    try {
        const response = await api.post('/auth/connexion', credentials);
        return response.data;
    } catch (error) {
        console.error('Erreur de connexion:', error);
        throw error;
    }
}

export async function registerUser(userData) {
    try {
        const response = await api.post('/auth/inscription', userData);
        return response.data;
    } catch (error) {
        console.error("Erreur d'inscription:", error);
        throw error;
    }
}
