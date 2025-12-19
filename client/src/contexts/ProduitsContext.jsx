import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

// Créer le contexte des produits
const ProduitsContext = createContext();

// Fournisseur de contexte des produits
export const ProduitsProvider = ({ children }) => {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Charger tous les produits depuis l'API
    const chargerProduits = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/produits');
            const data = response.data;

            // Gérer différents formats de réponse
            if (data.produits) {
                setProduits(data.produits);
            } else if (data.data) {
                setProduits(data.data);
            } else if (Array.isArray(data)) {
                setProduits(data);
            } else {
                setProduits([]);
            }
        } catch (err) {
            console.error('Erreur lors du chargement des produits:', err);
            setError(err.message);
            setProduits([]);
        } finally {
            setLoading(false);
        }
    };

    // Rechercher des produits
    const rechercherProduits = async query => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(
                `/produits?search=${encodeURIComponent(query)}`
            );
            const data = response.data;

            if (data.produits) {
                setProduits(data.produits);
            } else if (data.data) {
                setProduits(data.data);
            } else if (Array.isArray(data)) {
                setProduits(data);
            } else {
                setProduits([]);
            }
        } catch (err) {
            console.error('Erreur lors de la recherche:', err);
            setError(err.message);
            setProduits([]);
        } finally {
            setLoading(false);
        }
    };

    // Obtenir les nouveaux produits
    const getNouveauxProduits = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/produits/nouveaux');
            const data = response.data;

            if (data.produits) {
                return data.produits;
            } else if (data.data) {
                return data.data;
            } else if (Array.isArray(data)) {
                return data;
            } else {
                return [];
            }
        } catch (err) {
            console.error(
                'Erreur lors du chargement des nouveaux produits:',
                err
            );
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Obtenir un produit par ID
    const getProduitById = async id => {
        try {
            const response = await api.get(`/produits/${id}`);
            return response.data;
        } catch (err) {
            console.error('Erreur lors du chargement du produit:', err);
            throw err;
        }
    };

    // Charger les produits au montage
    useEffect(() => {
        chargerProduits();
    }, []);

    const value = {
        produits,
        loading,
        error,
        chargerProduits,
        rechercherProduits,
        getNouveauxProduits,
        getProduitById,
    };

    return (
        <ProduitsContext.Provider value={value}>
            {children}
        </ProduitsContext.Provider>
    );
};

// Hook personnalisé pour utiliser le contexte des produits
export const useProduits = () => {
    const context = useContext(ProduitsContext);
    if (!context) {
        throw new Error(
            'useProduits doit être utilisé dans un ProduitsProvider'
        );
    }
    return context;
};
