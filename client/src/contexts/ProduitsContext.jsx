import React, { createContext, useState, useEffect, useCallback } from 'react';
import { fakeApiGetProduits } from '../services/produitsService'; // Importe la fonction du service API fictif
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const ProduitsContext = createContext();

export function ProduitsProvider({ children }) {
    const [produits, setProduits] = useState([]);
    const { t } = useTranslation();
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [devise, setDevise] = useState('XOF'); // Ajout de la devise

    /**
     * Retourne le taux de change pour une devise donnée.
     * @param {string} deviseCible - La devise cible (ex: 'EUR', 'USD').
     * @returns {number} Le taux de change.
     */
    const getTauxDeChange = deviseCible => {
        const taux = {
            XOF: 1, // Taux de base
            EUR: 0.0015,
        };
        return taux[deviseCible] || 1;
    };
    /**
     * Charge les produits depuis l'API fictive.
     * @param {string} [category=null] - Catégorie optionnelle pour filtrer les produits.
     */
    const chargerProduits = useCallback(async (category = null) => {
        try {
            setError(null);

            // Appelle la fonction importée du service
            const data = await fakeApiGetProduits(category);

            setProduits(data.produits);
            // S'assure que categories est un tableau, même si la prop n'est pas fournie par l'API fictive
            setCategories(data.categories || []);
        } catch (err) {
            console.error('Erreur de chargement des produits:', err);
            setError(t('productErrors.load'));
        } finally {
        }
    }, []); // `useCallback` avec un tableau de dépendances vide signifie que `chargerProduits` ne sera recréée qu'une seule fois.

    // Déclenche le chargement initial des produits lorsque le composant est monté
    useEffect(() => {
        chargerProduits();
    }, [chargerProduits]);

    /**
     * Retourne un produit par son ID.
     * @param {number} id - L'ID du produit.
     * @returns {object|undefined} Le produit trouvé ou `undefined`.
     */
    const getProduitById = id => {
        return produits.find(p => p.id === id);
    };

    /**
     * Retourne les produits appartenant à une catégorie donnée.
     * @param {string} categoryId - L'identifiant de la catégorie.
     * @returns {Array} Un tableau de produits filtrés par catégorie.
     */
    const getProduitsByCategory = categoryId => {
        return produits.filter(p => p.category === categoryId);
    };

    /**
     * Convertit un prix de XOF vers la devise sélectionnée.
     * @param {number} prix - Le prix en XOF.
     * @returns {string} Le prix formaté dans la devise actuelle.
     */
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
                getProduitById,
                getProduitsByCategory,
                convertirPrix, // Exposer la fonction de conversion
            }}
        >
            {children}
        </ProduitsContext.Provider>
    );
}

// --- Hook Personnalisé pour utiliser le Contexte des Produits ---
/**
 * Hook personnalisé pour accéder facilement aux valeurs du ProduitsContext.
 * @returns {object} L'objet de valeur fourni par le ProduitsContext.
 */
export function useProduits() {
    return useContext(ProduitsContext);
}
