import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const [panier, setPanier] = useState(() => {
        try {
            const stored = localStorage.getItem('nodyPanier');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('nodyPanier', JSON.stringify(panier));
        } catch (e) {
            console.warn("Erreur localStorage panier", e);
        }
    }, [panier]);

    const ajouterAuPanier = (produit, quantite = 1, options = {}) => {
        const produitExistant = panier.find(p =>
            p.id === produit.id &&
            JSON.stringify(p.options) === JSON.stringify(options)
        );

        if (produitExistant) {
            const updated = panier.map(p =>
                p === produitExistant ? { ...p, quantite: p.quantite + quantite } : p
            );
            setPanier(updated);
        } else {
            setPanier([...panier, { ...produit, quantite, options }]);
        }
    };

    const supprimerDuPanier = (produitId, options = {}) => {
        setPanier(prev =>
            prev.filter(p => !(p.id === produitId && JSON.stringify(p.options) === JSON.stringify(options)))
        );
    };

    const viderPanier = () => setPanier([]);

    const totalPanier = panier.reduce((total, p) => total + p.prix * p.quantite, 0);

    return (
        <CartContext.Provider value={{ panier, ajouterAuPanier, supprimerDuPanier, viderPanier, totalPanier }}>
            {children}
        </CartContext.Provider>
    );
}