import cron from 'node-cron';
import Banniere from '../models/banniereModel.js';
import Suivi from '../models/suiviModel.js';
import Utilisateur from '../models/utilisateurModel.js';
import { traiterBonusQuotidiens } from '../services/creditsService.js';
import { nettoyerSuivisExpires } from '../services/suiviService.js';

/**
 * Configuration des tâches
 */
const TACHES_CONFIG = {
    // Exécution quotidienne à 00:00
    CRON_EXPRESSION: '0 0 * * *',
    // Pour les tests : toutes les 5 minutes
    // CRON_EXPRESSION: '*/5 * * * *',

    TIMEZONE: 'Africa/Sénégal', // Fuseau horaire Sénégal

    // Nombre de jours avant expiration
    DUREE_EXPIRATION_JOURS: 30,

    // Activer/désactiver chaque tâche
    ACTIVER_EXPIRATION_BANNIERES: true,
    ACTIVER_NETTOYAGE_SUIVI: true,
    ACTIVER_BONUS_VENTES: true,
    ACTIVER_RAPPORT_QUOTIDIEN: true,
};

/**
 * @desc    Désactiver les bannières expirées (> 30 jours)
 * @returns {Promise} Résultat de l'opération
 */
export const desactiverBannieresExpirees = async () => {
    try {
        const maintenant = new Date();

        // Trouver les bannières expirées
        const bannieresExpirees = await Banniere.find({
            dateExpiration: { $lt: maintenant },
            estExpiree: false,
            estActif: true,
        });

        if (bannieresExpirees.length === 0) {
            return {
                succes: true,
                nbDesactivees: 0,
                message: 'Aucune bannière à désactiver',
            };
        }

        let nbDesactivees = 0;

        for (const banniere of bannieresExpirees) {
            await banniere.verifierExpiration();
            nbDesactivees++;
        }

        console.log(`${nbDesactivees} bannière(s) expirée(s) désactivée(s)`);

        return {
            succes: true,
            nbDesactivees,
            message: `${nbDesactivees} bannière(s) expirée(s) désactivée(s)`,
        };
    } catch (error) {
        console.error(
            `Erreur lors de la désactivation des bannières expirées:`,
            error
        );
        throw error;
    }
};

/**
 * @desc    Nettoyer les cookies de suivi expirés (> 7 jours)
 * @returns {Promise} Résultat du nettoyage
 */
export const nettoyerCookiesExpires = async () => {
    try {
        const result = await nettoyerSuivisExpires();

        console.log(`${result.message}`);

        return result;
    } catch (error) {
        console.error(
            `Erreur lors du nettoyage des cookies expirés:`,
            error
        );
        throw error;
    }
};

/**
 * @desc    Calculer et attribuer les bonus de ventes quotidiens
 * @returns {Promise} Résultat de l'opération
 */
export const calculerBonusVentes = async () => {
    try {
        const result = await traiterBonusQuotidiens();

        console.log(`${result.message}`);

        return result;
    } catch (error) {
        console.error(`Erreur lors du calcul des bonus ventes:`, error);
        throw error;
    }
};

/**
 * @desc    Générer un rapport quotidien des bannières
 * @returns {Promise} Rapport
 */
export const genererRapportQuotidien = async () => {
    try {
        const maintenant = new Date();
        const hier = new Date(maintenant);
        hier.setDate(hier.getDate() - 1);

        // Statistiques bannières
        const bannieresActives = await Banniere.countDocuments({
            estActif: true,
            statut: 'approuve',
        });

        const bannieresEnAttente = await Banniere.countDocuments({
            statut: 'en_attente',
        });

        const bannieresCreesHier = await Banniere.countDocuments({
            createdAt: { $gte: hier, $lt: maintenant },
        });

        // Statistiques suivi
        const suivisActifs = await Suivi.countDocuments({
            estActif: true,
            dateExpiration: { $gt: maintenant },
        });

        const conversionsHier = await Suivi.countDocuments({
            'conversion.aConverti': true,
            'conversion.dateConversion': { $gte: hier, $lt: maintenant },
        });

        // Statistiques vendeurs
        const vendeurs = await Utilisateur.find({ role: 'vendeur' }).select(
            'creditsBannieres statistiquesBannieres'
        );

        const totalCreditsCirculation = vendeurs.reduce(
            (total, v) => total + (v.creditsBannieres || 0),
            0
        );

        const rapport = {
            date: maintenant.toISOString().split('T')[0],
            bannieres: {
                actives: bannieresActives,
                enAttente: bannieresEnAttente,
                creesHier: bannieresCreesHier,
            },
            suivi: {
                cookiesActifs: suivisActifs,
                conversionsHier,
            },
            vendeurs: {
                total: vendeurs.length,
                creditsCirculation: totalCreditsCirculation,
                moyenneCredits:
                    vendeurs.length > 0
                        ? (totalCreditsCirculation / vendeurs.length).toFixed(2)
                        : 0,
            },
        };

        console.log('RAPPORT QUOTIDIEN BANNIÈRES');
        console.log('================================');
        console.log(`Date: ${rapport.date}`);
        console.log(`Bannières actives: ${rapport.bannieres.actives}`);
        console.log(`Bannières en attente: ${rapport.bannieres.enAttente}`);
        console.log(`Bannières créées hier: ${rapport.bannieres.creesHier}`);
        console.log(`Cookies actifs: ${rapport.suivi.cookiesActifs}`);
        console.log(`Conversions hier: ${rapport.suivi.conversionsHier}`);
        console.log(`Total vendeurs: ${rapport.vendeurs.total}`);
        console.log(
            `Crédits en circulation: ${rapport.vendeurs.creditsCirculation}`
        );
        console.log('================================\n');

        return {
            succes: true,
            rapport,
        };
    } catch (error) {
        console.error(
            ` Erreur lors de la génération du rapport quotidien:`,
            error
        );
        throw error;
    }
};

/**
 * @desc    Exécuter toutes les tâches quotidiennes
 * @returns {Promise} Résultats de toutes les tâches
 */
export const executerTachesQuotidiennes = async () => {
    console.log(`\n DÉMARRAGE DES TÂCHES QUOTIDIENNES`);
    console.log(
        `${new Date().toLocaleString('fr-FR', { timeZone: TACHES_CONFIG.TIMEZONE })}\n`
    );

    const resultats = {
        dateExecution: new Date(),
        taches: {},
    };

    try {
        // Tâche 1 : Désactiver les bannières expirées
        if (TACHES_CONFIG.ACTIVER_EXPIRATION_BANNIERES) {
            console.log('Tâche 1 : Désactivation des bannières expirées...');
            resultats.taches.expiration = await desactiverBannieresExpirees();
        }

        // Tâche 2 : Nettoyer les cookies de suivi expirés
        if (TACHES_CONFIG.ACTIVER_NETTOYAGE_SUIVI) {
            console.log(
                'Tâche 2 : Nettoyage des cookies de suivi expirés...'
            );
            resultats.taches.nettoyage = await nettoyerCookiesExpires();
        }

        // Tâche 3 : Calculer et attribuer les bonus de ventes
        if (TACHES_CONFIG.ACTIVER_BONUS_VENTES) {
            console.log('Tâche 3 : Calcul des bonus de ventes...');
            resultats.taches.bonus = await calculerBonusVentes();
        }

        // Tâche 4 : Générer le rapport quotidien
        if (TACHES_CONFIG.ACTIVER_RAPPORT_QUOTIDIEN) {
            console.log('Tâche 4 : Génération du rapport quotidien...');
            resultats.taches.rapport = await genererRapportQuotidien();
        }

        console.log(
            `\n TOUTES LES TÂCHES QUOTIDIENNES TERMINÉES AVEC SUCCÈS\n`
        );

        return {
            succes: true,
            resultats,
        };
    } catch (error) {
        console.error(
            `\n ERREUR LORS DE L'EXÉCUTION DES TÂCHES QUOTIDIENNES:`,
            error
        );

        return {
            succes: false,
            erreur: error.message,
            resultats,
        };
    }
};

/**
 * @desc    Démarrer le planificateur de tâches (CRON)
 * @returns {Object} Instance du cron job
 */
export const demarrerPlanificateur = () => {
    console.log('Planificateur de tâches quotidiennes démarré');
    console.log(`Expression CRON: ${TACHES_CONFIG.CRON_EXPRESSION}`);
    console.log(`Fuseau horaire: ${TACHES_CONFIG.TIMEZONE}\n`);

    // Créer le cron job
    const job = cron.schedule(
        TACHES_CONFIG.CRON_EXPRESSION,
        async () => {
            await executerTachesQuotidiennes();
        },
        {
            scheduled: true,
            timezone: TACHES_CONFIG.TIMEZONE,
        }
    );

    // Exécuter immédiatement au démarrage (optionnel)
    // executerTachesQuotidiennes();
    return {
        succes: true,
        message: 'Planificateur démarré avec succès',
        config: {
            expression: TACHES_CONFIG.CRON_EXPRESSION,
            timezone: TACHES_CONFIG.TIMEZONE,
            prochaineExecution: job.nextDate()?.toDate(),
        },
        job,
    };
};

/**
 * @desc    Arrêter le planificateur de tâches
 * @param   {Object} job - Instance du cron job
 * @returns {Object} Confirmation
 */
export const arreterPlanificateur = job => {
    if (job) {
        job.stop();
        console.log('Planificateur de tâches arrêté');

        return {
            succes: true,
            message: 'Planificateur arrêté avec succès',
        };
    }

    return {
        succes: false,
        message: 'Aucun planificateur actif',
    };
};

/**
 * @desc    Exécuter une tâche spécifique manuellement (Admin)
 * @param   {String} nomTache - Nom de la tâche à exécuter
 * @returns {Promise} Résultat de la tâche
 */
export const executerTacheManuelle = async nomTache => {
    console.log(`Exécution manuelle de la tâche: ${nomTache}\n`);

    switch (nomTache) {
        case 'expiration':
            return await desactiverBannieresExpirees();

        case 'nettoyage':
            return await nettoyerCookiesExpires();

        case 'bonus':
            return await calculerBonusVentes();

        case 'rapport':
            return await genererRapportQuotidien();

        case 'toutes':
            return await executerTachesQuotidiennes();

        default:
            throw new Error(`Tâche inconnue: ${nomTache}`);
    }
};

export default {
    desactiverBannieresExpirees,
    nettoyerCookiesExpires,
    calculerBonusVentes,
    genererRapportQuotidien,
    executerTachesQuotidiennes,
    demarrerPlanificateur,
    arreterPlanificateur,
    executerTacheManuelle,
    TACHES_CONFIG,
};