import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

/**
 * Hook personnalisé pour charger les données du dashboard ADMIN
 * @param {string} periode - 'jour', 'semaine', 'mois', 'trimestre', 'annee'
 * @param {object} datesPersonnalisees - { dateDebut, dateFin }
 */
export const useDashboardData = (
    periode = 'mois',
    datesPersonnalisees = null
) => {
    const [donnees, setDonnees] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);
    const dernieresDonneesValides = useRef(null);

    const chargerDonnees = useCallback(async () => {
        try {
            setChargement(true);
            setErreur(null);

            let params = { periode };
            if (periode === 'personnalise' && datesPersonnalisees) {
                params = {
                    periode: 'personnalise',
                    dateDebut: datesPersonnalisees.dateDebut,
                    dateFin: datesPersonnalisees.dateFin,
                };
            }

            // Endpoint correct
            const response = await api.get('/admin/statistiques/dashboard', {
                params,
            });

            // Normaliser la réponse (votre code existant)
            let donneesFinales = null;
            if (response.data?.data) {
                donneesFinales = response.data.data;
            } else if (response.data?.donnees) {
                donneesFinales = response.data.donnees;
            } else if (
                response.data?.statistiquesGlobales ||
                response.data?.graphiques
            ) {
                donneesFinales = response.data;
            } else {
                donneesFinales = response.data;
            }

            if (donneesFinales && Object.keys(donneesFinales).length > 0) {
                dernieresDonneesValides.current = donneesFinales;
            }

            setDonnees(donneesFinales);
            setChargement(false);
        } catch (error) {
            console.error('[useDashboardData] Erreur:', error);
            setErreur(
                error.response?.data?.message ||
                    error.message ||
                    'Impossible de charger les statistiques'
            );

            if (dernieresDonneesValides.current) {
                setDonnees(dernieresDonneesValides.current);
            }

            setChargement(false);
        }
    }, [periode, datesPersonnalisees]);

    useEffect(() => {
        chargerDonnees();
    }, [chargerDonnees]);

    const actualiser = () => {
        chargerDonnees();
    };

    const donneesARetourner = donnees || dernieresDonneesValides.current;

    return {
        donnees: donneesARetourner,
        chargement,
        erreur,
        actualiser,
    };
};