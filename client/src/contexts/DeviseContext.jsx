import React, { createContext, useContext, useState, useEffect } from 'react';

// Création du contexte
const DeviseContext = createContext();

/**
 * Hook personnalisé pour utiliser le contexte de devise
 */
export const useDevise = () => {
    const context = useContext(DeviseContext);
    if (!context) {
        throw new Error('useDevise doit être utilisé dans un DeviseProvider');
    }
    return context;
};

/**
 * Provider pour le contexte de devise
 */
export const DeviseProvider = ({ children }) => {
    // État de la devise (valeur par défaut : XOF)
    const [devise, setDevise] = useState(() => {
        // Récupérer la devise sauvegardée ou utiliser XOF par défaut
        return localStorage.getItem('devise') || 'XOF';
    });

    // Taux de conversion (base : 1 XOF)
    const tauxConversion = {
        XOF: 1,
        XAF: 1, // Même valeur que XOF
        EUR: 0.00152, // 1 XOF = 0.00152 EUR
        USD: 0.00165, // 1 XOF = 0.00165 USD
    };

    /**
     * Effet pour sauvegarder la devise dans localStorage
     */
    useEffect(() => {
        localStorage.setItem('devise', devise);
    }, [devise]);

    /**
     * Convertir un prix dans la devise sélectionnée
     * @param {Number} prixXOF - Prix en XOF
     * @returns {Number} - Prix converti
     */
    const convertirPrix = prixXOF => {
        if (!prixXOF || isNaN(prixXOF)) return 0;
        const taux = tauxConversion[devise] || 1;
        return prixXOF * taux;
    };

    /**
     * Formater un prix avec le symbole de devise
     * @param {Number} prixXOF - Prix en XOF
     * @returns {String} - Prix formaté avec symbole
     */
    const formaterPrix = prixXOF => {
        const prixConverti = convertirPrix(prixXOF);

        switch (devise) {
            case 'XOF':
            case 'XAF':
                return `${Math.round(prixConverti).toLocaleString('fr-FR')} CFA`;
            case 'EUR':
                return `${prixConverti.toFixed(2)} €`;
            case 'USD':
                return `$${prixConverti.toFixed(2)}`;
            default:
                return `${prixConverti.toFixed(2)} ${devise}`;
        }
    };

    /**
     * Obtenir le symbole de la devise
     * @returns {String} - Symbole de devise
     */
    const getSymboleDevise = () => {
        switch (devise) {
            case 'XOF':
            case 'XAF':
                return 'CFA';
            case 'EUR':
                return '€';
            case 'USD':
                return '$';
            default:
                return devise;
        }
    };

    /**
     * Obtenir le nom complet de la devise
     * @returns {String} - Nom complet
     */
    const getNomDevise = () => {
        const noms = {
            XOF: 'Franc CFA (XOF)',
            XAF: 'Franc CFA (XAF)',
            EUR: 'Euro (EUR)',
            USD: 'Dollar US (USD)',
        };
        return noms[devise] || devise;
    };

    // Valeur du contexte
    const value = {
        devise,
        setDevise,
        convertirPrix,
        formaterPrix,
        getSymboleDevise,
        getNomDevise,
        tauxConversion,
    };

    return (
        <DeviseContext.Provider value={value}>
            {children}
        </DeviseContext.Provider>
    );
};

export default DeviseContext;
