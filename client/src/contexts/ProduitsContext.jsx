import React, { createContext, useState, useEffect, useCallback } from 'react';
import { fakeApiGetProduits } from '../services/produitsService';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

// Création du contexte
export const ProduitsContext = createContext();

export function ProduitsProvider({ children }) {
    const [produits, setProduits] = useState([]);
    const { t } = useTranslation();
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [devise, setDevise] = useState('XOF');

    // Fonction pour obtenir le taux de change en fonction de la devise
    const getTauxDeChange = deviseCible => {
        const taux = {
            XOF: 1,
            EUR: 0.0015,
        };
        return taux[deviseCible] || 1;
    };

    // Fonction pour charger les produits
    const chargerProduits = useCallback(
        async (category = null) => {
            try {
                setError(null);
                const data = await fakeApiGetProduits(category);
                setProduits(data.produits);
                setCategories(data.categories || []);
            } catch (err) {
                console.error('Erreur de chargement des produits:', err);
                setError(t('productErrors.load'));
            }
        },
        [t]
    );

    const chargerCategories = useCallback(async () => {
        try {
            setError(null);
            const data = await fakeApiGetProduits();
            setCategories(data.categories || []);
        } catch (err) {
            console.error('Erreur de chargement des catégories:', err);
            setError(t('productErrors.load'));
        }
    }, [t]);

    useEffect(() => {
        chargerProduits();
    }, [chargerProduits]);

    const getProduitById = id => {
        return produits.find(p => p.id === id);
    };

    const getProduitsByCategory = categoryId => {
        return produits.filter(p => p.category === categoryId);
    };

    const convertirPrix = prix => {
        const taux = getTauxDeChange(devise);
        const prixConverti = prix * taux;
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: devise,
            minimumFractionDigits: 0,
        }).format(prixConverti);
    };

    return (
        <ProduitsContext.Provider
            value={{
                produits,
                error,
                categories,
                devise,
                setDevise,
                chargerProduits,
                chargerCategories,
                getProduitById,
                getProduitsByCategory,
                convertirPrix,
            }}
        >
            {children}
        </ProduitsContext.Provider>
    );
}

export function useProduits() {
    return useContext(ProduitsContext);
}
