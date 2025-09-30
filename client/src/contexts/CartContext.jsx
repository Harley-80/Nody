import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const [panier, setPanier] = useState(() => {
        try {
            const localData = localStorage.getItem('panierNody');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error(
                'Erreur lors de la lecture du panier depuis le localStorage',
                error
            );
            return [];
        }
    });

    const [devise, setDevise] = useState(() => {
        return localStorage.getItem('nodyDevise') || 'XOF';
    });

    const tauxConversion = 655.957;

    useEffect(() => {
        try {
            localStorage.setItem('panierNody', JSON.stringify(panier));
            localStorage.setItem('nodyDevise', devise);
        } catch (error) {
            console.error(
                "Erreur lors de l'écriture dans le localStorage",
                error
            );
        }
    }, [panier, devise]);

    const ajouterAuPanier = (produit, quantite = 1, options = {}) => {
        setPanier(prevPanier => {
            const itemExistant = prevPanier.find(
                item =>
                    item.id === produit.id &&
                    JSON.stringify(item.options) === JSON.stringify(options)
            );

            if (itemExistant) {
                return prevPanier.map(item =>
                    item.id === produit.id &&
                    JSON.stringify(item.options) === JSON.stringify(options)
                        ? { ...item, quantite: item.quantite + quantite }
                        : item
                );
            } else {
                return [...prevPanier, { ...produit, quantite, options }];
            }
        });
    };

    const supprimerDuPanier = produitId => {
        setPanier(
            (
                prevPanier // The item in the cart might not have a `produitId` property if it's added directly
            ) => prevPanier.filter(item => item.id !== produitId) // Assuming every cart item has an `id`
        );
    };

    const viderPanier = () => {
        setPanier([]);
    };

    const totalPanier = useMemo(
        () =>
            panier.reduce(
                (total, item) => total + item.prix * item.quantite,
                0
            ),
        [panier]
    );

    const formaterPrix = prix => {
        if (devise === 'EUR') {
            return `${(prix / tauxConversion).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })} €`;
        }
        if (devise === 'XAF') {
            return `${prix.toLocaleString()} XAF`;
        }
        return `${prix.toLocaleString()} XOF`;
    };

    const value = {
        panier,
        ajouterAuPanier,
        supprimerDuPanier,
        viderPanier,
        totalPanier,
        devise,
        setDevise,
        formaterPrix,
    };

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
}
