import React, { createContext, useState, useEffect, useCallback } from 'react';
import { fakeApiGetProduits } from '../services/produitsService'; // Importe la fonction du service API fictif
import { useContext } from 'react'; // Importe useContext

export const ProduitsContext = createContext();

export function ProduitsProvider({ children }) {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);

    /**
     * Charge les produits depuis l'API fictive.
     * @param {string} [category=null] - Catégorie optionnelle pour filtrer les produits.
     */
    const chargerProduits = useCallback(async (category = null) => {
        try {
            setLoading(true);
            setError(null);
            
            // Appelle la fonction importée du service
            const data = await fakeApiGetProduits(category);
            
            setProduits(data.produits);
            // S'assure que categories est un tableau, même si la prop n'est pas fournie par l'API fictive
            setCategories(data.categories || []); 
        } catch (err) {
            console.error("Erreur de chargement des produits:", err);
            setError("Erreur lors du chargement des produits");
        } finally {
            setLoading(false);
        }
    }, []); // `useCallback` avec un tableau de dépendances vide signifie que `chargerProduits` ne sera recréée qu'une seule fois.

    // Déclenche le chargement initial des produits lorsque le composant est monté
    useEffect(() => {
        chargerProduits();
    }, [chargerProduits]); // La dépendance à `chargerProduits` assure que l'effet est relancé si la fonction change (ce qui est géré par `useCallback`).

    /**
     * Retourne un produit par son ID.
     * @param {number} id - L'ID du produit.
     * @returns {object|undefined} Le produit trouvé ou `undefined`.
     */
    const getProduitById = (id) => {
        return produits.find(p => p.id === id);
    };

    /**
     * Retourne les produits appartenant à une catégorie donnée.
     * @param {string} categoryId - L'identifiant de la catégorie.
     * @returns {Array} Un tableau de produits filtrés par catégorie.
     */
    const getProduitsByCategory = (categoryId) => {
        return produits.filter(p => p.category === categoryId);
    };

    return (
        <ProduitsContext.Provider value={{
            produits,
            loading,
            error,
            categories,
            chargerProduits,
            getProduitById,
            getProduitsByCategory
        }}>
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