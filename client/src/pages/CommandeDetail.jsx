import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import CommandeFacture from '../components/commandes/CommandeFacture'; 
import '../styles/CommandeFacture.scss';

export default function CommandeDetail() {
    const [commande, setCommande] = useState(null);
    const ref = useRef(); // La référence pour le contenu à imprimer

    useEffect(() => {
        const data = localStorage.getItem('nodyCommandeActive');
        if (data) {
            setCommande(JSON.parse(data));
        }
    }, []);

    // Ajout du useEffect pour surveiller les changements de la commande
    useEffect(() => {
        console.log('Commande actuelle:', {
            statut: commande?.statut,
            normalized: commande?.statut?.toLowerCase().replace(/é/g, 'e')
        });
    }, [commande]);

    // Utilisation du nom de variable 'imprimer' comme demandé
    const imprimer = useReactToPrint({
        content: () => ref.current,
        // Utilisation de commande?.id pour le titre du document, comme demandé
        documentTitle: `Facture_Nody_${commande?.id}`,
        pageStyle: `@page { size: A4; margin: 15mm; }` // Options de style pour l'impression, si nécessaire
    });

    if (!commande) {
        return <div className="container py-5 text-muted">Aucune commande sélectionnée.</div>;
    }

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Détail de la commande</h2>
                {/* Le bouton pour déclencher l'impression/téléchargement PDF */}
                <button className="btn btn-outline-dark" onClick={imprimer}>
                    Télécharger Facture PDF
                </button>
            </div>

            {/* Le contenu de la facture, enveloppé dans la référence 'ref' */}
            <div ref={ref}>
                <CommandeFacture commande={commande} />
            </div>
        </div>
    );
}