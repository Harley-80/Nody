
import Utilisateur from '../models/utilisateurModel.js';
import Banniere from '../models/banniereModel.js';
import asyncHandler from 'express-async-handler';

/**
 * Configuration des crédits
 */
export const CREDITS_CONFIG = {
    INITIAUX: 5,
    COUT_BANNIERE: 2,
    BONUS_VENTES: 1,
    SEUIL_VENTES: 10,
};

/**
 * @desc    Attribuer les crédits initiaux à un nouveau vendeur
 * @param   {ObjectId} vendeurId - ID du vendeur
 * @returns {Promise} Résultat de l'opération
 */
export const attribuerCreditsInitiaux = async vendeurId => {
    try {
        const vendeur = await Utilisateur.findById(vendeurId);

        if (!vendeur) {
            throw new Error('Vendeur non trouvé');
        }

        if (vendeur.role !== 'vendeur') {
            throw new Error("Cet utilisateur n'est pas un vendeur");
        }

        // Vérifier si les crédits n'ont pas déjà été attribués
        if (
            vendeur.creditsBannieres > 0 ||
            vendeur.historiqueCredits?.length > 0
        ) {
            return {
                succes: false,
                message: 'Crédits déjà attribués',
            };
        }

        // Attribuer les crédits
        await vendeur.crediterPoints(
            CREDITS_CONFIG.INITIAUX,
            'Crédits de bienvenue (inscription vendeur)'
        );

        return {
            succes: true,
            message: `${CREDITS_CONFIG.INITIAUX} crédits attribués avec succès`,
            solde: vendeur.creditsBannieres,
        };
    } catch (error) {
        console.error(
            "Erreur lors de l'attribution des crédits initiaux:",
            error
        );
        throw error;
    }
};

/**
 * @desc    Débiter des crédits lors de la création d'une bannière
 * @param   {ObjectId} vendeurId - ID du vendeur
 * @param   {ObjectId} banniereId - ID de la bannière créée
 * @returns {Promise} Résultat de l'opération
 */
export const debiterCredits = async (vendeurId, banniereId) => {
    try {
        const vendeur = await Utilisateur.findById(vendeurId);

        if (!vendeur) {
            throw new Error('Vendeur non trouvé');
        }

        // Vérifier les crédits disponibles
        if (!vendeur.peutCreerBanniere()) {
            throw new Error('Crédits insuffisants pour créer une bannière');
        }

        // Débiter
        const result = await vendeur.debiterPoints(
            CREDITS_CONFIG.COUT_BANNIERE,
            "Création d'une bannière publicitaire",
            banniereId
        );

        // Mettre à jour les statistiques
        vendeur.statistiquesBannieres.totalBannieresCreees += 1;
        await vendeur.save();

        return {
            succes: true,
            message: `${CREDITS_CONFIG.COUT_BANNIERE} crédits débités`,
            nouveauSolde: result.nouveauSolde,
        };
    } catch (error) {
        console.error('Erreur lors du débit des crédits:', error);
        throw error;
    }
};

/**
 * @desc    Créditer un bonus pour les ventes (tous les 10 ventes)
 * @param   {ObjectId} vendeurId - ID du vendeur
 * @param   {Number} nombreVentes - Nombre de ventes attribuées
 * @returns {Promise} Résultat de l'opération
 */
export const crediterBonusVentes = async (vendeurId, nombreVentes) => {
    try {
        const vendeur = await Utilisateur.findById(vendeurId);

        if (!vendeur) {
            throw new Error('Vendeur non trouvé');
        }

        const ventesAvant =
            vendeur.statistiquesBannieres?.totalVentesAttribuees || 0;
        const ventesApres = ventesAvant + nombreVentes;

        // Calculer le nombre de bonus à attribuer
        const palierAvant = Math.floor(
            ventesAvant / CREDITS_CONFIG.SEUIL_VENTES
        );
        const palierApres = Math.floor(
            ventesApres / CREDITS_CONFIG.SEUIL_VENTES
        );
        const nouveauxBonus = palierApres - palierAvant;

        if (nouveauxBonus > 0) {
            const montantBonus = nouveauxBonus * CREDITS_CONFIG.BONUS_VENTES;

            // Créditer le bonus
            await vendeur.crediterPoints(
                montantBonus,
                `Bonus ventes (${nombreVentes} vente(s) attribuée(s))`
            );

            // Mettre à jour les statistiques
            vendeur.statistiquesBannieres.totalVentesAttribuees = ventesApres;
            vendeur.statistiquesBannieres.dernierBonusVentes = new Date();
            await vendeur.save();

            return {
                succes: true,
                bonusAttribue: true,
                montantBonus,
                nouveauSolde: vendeur.creditsBannieres,
                message: `Bonus de ${montantBonus} point(s) attribué pour ${nombreVentes} vente(s)`,
            };
        }

        // Pas de bonus cette fois, mais mettre à jour le compteur
        vendeur.statistiquesBannieres.totalVentesAttribuees = ventesApres;
        await vendeur.save();

        return {
            succes: true,
            bonusAttribue: false,
            ventesRestantes:
                CREDITS_CONFIG.SEUIL_VENTES -
                (ventesApres % CREDITS_CONFIG.SEUIL_VENTES),
            message: `Ventes enregistrées. ${CREDITS_CONFIG.SEUIL_VENTES - (ventesApres % CREDITS_CONFIG.SEUIL_VENTES)} vente(s) restante(s) pour le prochain bonus.`,
        };
    } catch (error) {
        console.error('Erreur lors du crédit du bonus ventes:', error);
        throw error;
    }
};

/**
 * @desc    Rembourser des crédits si une bannière est rejetée (optionnel)
 * @param   {ObjectId} vendeurId - ID du vendeur
 * @param   {ObjectId} banniereId - ID de la bannière rejetée
 * @param   {Boolean} remboursementTotal - True pour rembourser tous les crédits
 * @returns {Promise} Résultat de l'opération
 */
export const rembourserCredits = async (
    vendeurId,
    banniereId,
    remboursementTotal = true
) => {
    try {
        const vendeur = await Utilisateur.findById(vendeurId);

        if (!vendeur) {
            throw new Error('Vendeur non trouvé');
        }

        const montant = remboursementTotal
            ? CREDITS_CONFIG.COUT_BANNIERE
            : Math.floor(CREDITS_CONFIG.COUT_BANNIERE / 2); // Remboursement partiel

        await vendeur.crediterPoints(
            montant,
            `Remboursement (bannière rejetée${remboursementTotal ? '' : ' - partiel'})`,
            banniereId
        );

        return {
            succes: true,
            message: `${montant} crédit(s) remboursé(s)`,
            nouveauSolde: vendeur.creditsBannieres,
        };
    } catch (error) {
        console.error('Erreur lors du remboursement des crédits:', error);
        throw error;
    }
};

/**
 * @desc    Attribuer un bonus manuel (Admin uniquement)
 * @param   {ObjectId} vendeurId - ID du vendeur
 * @param   {Number} montant - Montant du bonus
 * @param   {String} raison - Raison du bonus
 * @returns {Promise} Résultat de l'opération
 */
export const attribuerBonusManuel = async (vendeurId, montant, raison) => {
    try {
        const vendeur = await Utilisateur.findById(vendeurId);

        if (!vendeur) {
            throw new Error('Vendeur non trouvé');
        }

        await vendeur.crediterPoints(montant, raison);

        return {
            succes: true,
            message: `Bonus de ${montant} point(s) attribué`,
            nouveauSolde: vendeur.creditsBannieres,
        };
    } catch (error) {
        console.error("Erreur lors de l'attribution du bonus manuel:", error);
        throw error;
    }
};

/**
 * @desc    Obtenir les statistiques globales des crédits (Admin)
 * @returns {Promise} Statistiques globales
 */
export const obtenirStatistiquesGlobales = async () => {
    try {
        const vendeurs = await Utilisateur.find({ role: 'vendeur' }).select(
            'creditsBannieres statistiquesBannieres historiqueCredits'
        );

        const stats = {
            totalVendeurs: vendeurs.length,
            totalCreditsCirculation: 0,
            totalBannieresCreees: 0,
            totalVentesAttribuees: 0,
            moyenneCreditsParVendeur: 0,
            vendeursAvecCredits: 0,
            vendeursSansCredits: 0,
        };

        vendeurs.forEach(vendeur => {
            const credits = vendeur.creditsBannieres || 0;
            stats.totalCreditsCirculation += credits;

            if (credits > 0) {
                stats.vendeursAvecCredits++;
            } else {
                stats.vendeursSansCredits++;
            }

            if (vendeur.statistiquesBannieres) {
                stats.totalBannieresCreees +=
                    vendeur.statistiquesBannieres.totalBannieresCreees || 0;
                stats.totalVentesAttribuees +=
                    vendeur.statistiquesBannieres.totalVentesAttribuees || 0;
            }
        });

        if (stats.totalVendeurs > 0) {
            stats.moyenneCreditsParVendeur = (
                stats.totalCreditsCirculation / stats.totalVendeurs
            ).toFixed(2);
        }

        return {
            succes: true,
            donnees: stats,
        };
    } catch (error) {
        console.error(
            'Erreur lors de la récupération des statistiques:',
            error
        );
        throw error;
    }
};

/**
 * @desc    Calculer et attribuer les bonus quotidiens (Worker)
 * @returns {Promise} Résultat de l'opération
 */
export const traiterBonusQuotidiens = async () => {
    try {
        const vendeurs = await Utilisateur.find({ role: 'vendeur' });

        let nbVendeursTraites = 0;
        let totalBonusAttribues = 0;

        for (const vendeur of vendeurs) {
            // Récupérer les bannières du vendeur avec des ventes attribuées
            const bannieres = await Banniere.find({
                creePar: vendeur._id,
                'ventesAttribuees.0': { $exists: true },
            });

            if (bannieres.length === 0) continue;

            // Compter le total de ventes
            let totalVentes = 0;
            bannieres.forEach(banniere => {
                totalVentes += banniere.ventesAttribuees.length;
            });

            if (totalVentes === 0) continue;

            // Attribuer le bonus si nécessaire
            const result = await crediterBonusVentes(vendeur._id, totalVentes);

            if (result.bonusAttribue) {
                nbVendeursTraites++;
                totalBonusAttribues += result.montantBonus;
            }
        }

        return {
            succes: true,
            nbVendeursTraites,
            totalBonusAttribues,
            message: `${nbVendeursTraites} vendeur(s) ont reçu des bonus (total: ${totalBonusAttribues} points)`,
        };
    } catch (error) {
        console.error('Erreur lors du traitement des bonus quotidiens:', error);
        throw error;
    }
};

export default {
    attribuerCreditsInitiaux,
    debiterCredits,
    crediterBonusVentes,
    rembourserCredits,
    attribuerBonusManuel,
    obtenirStatistiquesGlobales,
    traiterBonusQuotidiens,
    CREDITS_CONFIG,
};