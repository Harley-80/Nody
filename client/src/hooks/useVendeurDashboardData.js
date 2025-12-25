import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

/**
 * Hook personnalisé POUR VENDEUR pour charger les données du dashboard vendeur
 * avec support optionnel pour le filtrage par période.
 */
export const useVendeurDashboardData = (
    periode = 'mois',
    datesPersonnalisees = null
) => {
    const [donnees, setDonnees] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    // Mémoriser les dernières données valides
    const dernieresDonneesValides = useRef(null);

    const chargerDonnees = useCallback(async () => {
        try {
            setChargement(true);
            setErreur(null);

            // Construction des paramètres API SPÉCIFIQUES VENDEUR
            let params = { periode };

            if (periode === 'personnalise' && datesPersonnalisees) {
                params = {
                    periode: 'personnalise',
                    dateDebut: datesPersonnalisees.dateDebut,
                    dateFin: datesPersonnalisees.dateFin,
                };
            }

            console.log(
                '[useVendeurDashboardData] Appel API /vendeur/statistiques'
            );
            console.log('[useVendeurDashboardData] Paramètres:', params);

            // APPEL SPÉCIFIQUE VENDEUR
            const response = await api.get('/vendeur/statistiques', {
                params,
            });

            console.log('[useVendeurDashboardData] Réponse brute:', response);
            console.log(
                '[useVendeurDashboardData] response.data:',
                response.data
            );

            // Gérer la structure de réponse
            let donneesFinales = null;

            // Format attendu pour vendeur : { succes: true, data: {...} }
            if (response.data?.data) {
                console.log(
                    '[useVendeurDashboardData] Structure détectée : response.data.data'
                );
                donneesFinales = response.data.data;
            }
            // Autre format possible
            else if (response.data?.succes) {
                console.log('[useVendeurDashboardData] Structure directe');
                donneesFinales = response.data;
            }
            // Format non standard
            else {
                console.log(
                    '[useVendeurDashboardData] Structure non standard:',
                    response.data
                );
                donneesFinales = response.data;
            }

            console.log(
                '[useVendeurDashboardData] Données finales normalisées:',
                donneesFinales
            );

            // Sauvegarder les données valides
            if (donneesFinales && Object.keys(donneesFinales).length > 0) {
                dernieresDonneesValides.current = donneesFinales;
            }

            setDonnees(donneesFinales);
            setChargement(false);
        } catch (error) {
            console.error(
                '[useVendeurDashboardData] Erreur chargement:',
                error
            );
            console.error(
                '[useVendeurDashboardData] Détails erreur:',
                error.response?.data || error.message
            );

            setErreur(
                error.response?.data?.message ||
                    error.message ||
                    'Impossible de charger les statistiques du vendeur'
            );

            // En cas d'erreur, utiliser les dernières données valides
            if (dernieresDonneesValides.current) {
                console.log(
                    '[useVendeurDashboardData] Restauration des dernières données valides'
                );
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

    // Retourner les données actuelles ou les dernières valides
    const donneesARetourner = donnees || dernieresDonneesValides.current;

    return {
        donnees: donneesARetourner,
        chargement,
        erreur,
        actualiser,
    };
};

// Hook pour les données supplémentaires du vendeur
export const useVendeurDonneesSupplementaires = () => {
    const [donnees, setDonnees] = useState({
        commandesRecentest: [],
        produitsPopulaires: [],
        notifications: [],
    });
    const [chargement, setChargement] = useState(true);

    const chargerDonnees = useCallback(async () => {
        try {
            setChargement(true);

            // Charger en parallèle les données supplémentaires
            const [commandesResponse, produitsResponse] = await Promise.all([
                api.get('/vendeur/commandes?limit=5&sort=-createdAt'),
                api.get(
                    '/vendeur/produits?limit=4&statut=actif&sort=-nombreVentes'
                ),
            ]);

            setDonnees({
                commandesRecentest:
                    commandesResponse.data?.data?.commandes || [],
                produitsPopulaires: produitsResponse.data?.data?.produits || [],
                notifications: [], // Récupérer depuis service notifications
            });
        } catch (error) {
            console.error('Erreur chargement données supplémentaires:', error);
        } finally {
            setChargement(false);
        }
    }, []);

    useEffect(() => {
        chargerDonnees();
    }, [chargerDonnees]);

    return {
        ...donnees,
        chargement,
        actualiser: chargerDonnees,
    };
};