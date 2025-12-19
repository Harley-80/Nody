import { useState, useEffect } from 'react';
import { api } from '../services/api';

// Hook personnalisé pour récupérer le nombre de demandes en attente
const useDemandesCount = () => {
    // État pour stocker le nombre de demandes
    const [count, setCount] = useState(0);
    // État pour gérer le chargement
    const [loading, setLoading] = useState(true);

    // Fonction pour charger le nombre de demandes
    const chargerNombreDemandes = async () => {
        try {
            console.log('[useDemandesCount] Debut du chargement...');

            // Appel API pour récupérer uniquement les demandes en attente
            // Limite à 1 résultat car on veut juste le total
            const response = await api.get('/admin/demandes', {
                params: {
                    page: 1,
                    limite: 1,
                    statut: 'en_attente',
                },
            });

            console.log('[useDemandesCount] Reponse complete:', response.data);

            // Vérifier si la réponse est valide
            if (response.data && response.data.succes) {
                let total = 0;

                // FORMAT 1 : { succes: true, pagination: { total: X } }
                // C'est le format corrigé que le backend doit maintenant retourner
                if (response.data.pagination?.total !== undefined) {
                    total = response.data.pagination.total;
                    console.log(
                        '[useDemandesCount] Format direct detecte (pagination.total)'
                    );
                }
                // FORMAT 2 : { succes: true, donnees: { pagination: { total: X } } }
                // C'est l'ancien format au cas où le backend n'est pas encore corrigé...
                else if (
                    response.data.donnees?.pagination?.total !== undefined
                ) {
                    total = response.data.donnees.pagination.total;
                    console.log(
                        '[useDemandesCount] Format imbrique detecte (donnees.pagination.total)'
                    );
                }
                // FORMAT 3 : Fallback - compter les demandes directement
                else if (Array.isArray(response.data.demandes)) {
                    total = response.data.demandes.length;
                    console.log(
                        '[useDemandesCount] Format array detecte (demandes.length)'
                    );
                } else if (Array.isArray(response.data.donnees?.demandes)) {
                    total = response.data.donnees.demandes.length;
                    console.log(
                        '[useDemandesCount] Format array imbrique detecte (donnees.demandes.length)'
                    );
                } else {
                    console.warn(
                        '[useDemandesCount] Format de reponse non reconnu, compteur mis a 0'
                    );
                }

                // Mettre à jour le compteur
                setCount(total);
                console.log(
                    '[useDemandesCount] Nombre final de demandes en attente:',
                    total
                );
            } else {
                // En cas d'échec, mettre le compteur à 0
                setCount(0);
                console.warn(
                    '[useDemandesCount] Reponse API invalide (succes = false)'
                );
            }
        } catch (erreur) {
            // En cas d'erreur réseau ou serveur
            console.error(
                '[useDemandesCount] Erreur lors du chargement:',
                erreur
            );
            console.error('[useDemandesCount] Message erreur:', erreur.message);
            if (erreur.response) {
                console.error(
                    '[useDemandesCount] Reponse erreur:',
                    erreur.response.data
                );
            }
            setCount(0);
        } finally {
            // Toujours arrêter le chargement
            setLoading(false);
        }
    };

    // Charger les demandes au montage du composant
    useEffect(() => {
        chargerNombreDemandes();

        // Actualiser toutes les 30 secondes
        const interval = setInterval(() => {
            console.log('[useDemandesCount] Actualisation automatique (30s)');
            chargerNombreDemandes();
        }, 30000);

        // Écouter l'événement de mise à jour des demandes
        const handleUpdate = () => {
            console.log(
                '[useDemandesCount] Evenement demandesUpdated detecte, rechargement immediat'
            );
            chargerNombreDemandes();
        };
        window.addEventListener('demandesUpdated', handleUpdate);

        // Nettoyer au démontage du composant
        return () => {
            clearInterval(interval);
            window.removeEventListener('demandesUpdated', handleUpdate);
        };
    }, []);

    // Retourner le compteur, l'état de chargement et la fonction de rechargement manuel
    return { count, loading, recharger: chargerNombreDemandes };
};

export default useDemandesCount;
