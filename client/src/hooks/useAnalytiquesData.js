import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const useAnalytiquesData = (
    periode = 'mois',
    datesPersonnalisees = null
) => {
    const [donnees, setDonnees] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const chargerDonnees = async () => {
        try {
            setChargement(true);
            setErreur(null);

            // Construction des paramètres
            let params = { periode };

            if (periode === 'personnalise' && datesPersonnalisees) {
                params.dateDebut = datesPersonnalisees.dateDebut;
                params.dateFin = datesPersonnalisees.dateFin;
            }

            console.log('Appel API /admin/statistiques/dashboard');
            console.log('Paramètres:', params);

            // Appel API
            const response = await api.get('/admin/statistiques/dashboard', {
                params,
            });

            console.log('Réponse brute backend:', response.data);

            //  CORRECTION : Vérifier si response.data existe
            if (!response.data) {
                throw new Error('Réponse vide du serveur');
            }

            //  Gérer les structures possibles
            let donneesFinales = null;

            if (response.data.data) {
                // Structure 1 : { success: true, data: {...} }
                console.log(' Structure détectée : response.data.data');
                donneesFinales = response.data.data;
            } else if (
                response.data.statistiquesGlobales ||
                response.data.graphiques
            ) {
                // Structure 2 : { statistiquesGlobales, graphiques, tableaux }
                console.log(' Structure détectée : response.data direct');
                donneesFinales = response.data;
            } else {
                // Structure inconnue - afficher les clés disponibles
                console.log('Clés disponibles:', Object.keys(response.data));
                donneesFinales = response.data;
            }

            console.log(
                'statistiquesGlobales:',
                donneesFinales?.statistiquesGlobales
            );
            console.log('graphiques:', donneesFinales?.graphiques);
            console.log('tableaux:', donneesFinales?.tableaux);

            setDonnees(donneesFinales);
            setChargement(false);
        } catch (err) {
            console.error('Erreur chargement statistiques:', err);
            console.error('Détails:', err.response?.data || err.message);

            setErreur(
                err.response?.data?.message ||
                    err.message ||
                    'Erreur lors du chargement des statistiques'
            );
            setChargement(false);
        }
    };

    useEffect(() => {
        chargerDonnees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periode, datesPersonnalisees]);

    return { donnees, chargement, erreur, actualiser: chargerDonnees };
};
