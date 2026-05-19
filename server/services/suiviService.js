import mongoose from 'mongoose';
import Suivi from '../models/suiviModel.js';
import Banniere from '../models/banniereModel.js';
import Utilisateur from '../models/utilisateurModel.js';
import { crediterBonusVentes } from './creditsService.js';

/**
 * Configuration du suivi
 */
export const SUIVI_CONFIG = {
    DUREE_COOKIE_JOURS: 7,
    MAX_COOKIES_PAR_CLIENT: 10, // Limite pour éviter les abus
    DELAI_ATTRIBUTION_MS: 1000, // 1 seconde entre clic et achat minimum
};

/**
 * @desc    Créer un cookie de suivi lors d'un clic sur une bannière
 * @param   {Object} data - {banniereId, clientId, ipClient, userAgent, page}
 * @returns {Promise} Cookie de suivi créé
 */
export const creerSuiviClic = async data => {
    try {
        const { banniereId, clientId, ipClient, userAgent, page } = data;

        // Vérifier que la bannière existe
        const banniere =
            await Banniere.findById(banniereId).populate('creePar');

        if (!banniere) {
            throw new Error('Bannière non trouvée');
        }

        // Ne pas créer de suivi pour les bannières non-vendeur
        const vendeur = banniere.creePar;
        if (vendeur.role !== 'vendeur') {
            return {
                succes: false,
                message: 'Suivi non nécessaire (bannière admin/modérateur)',
            };
        }

        // Vérifier qu'il n'existe pas déjà un suivi actif pour ce client/bannière
        const suiviExistant = await Suivi.findOne({
            $or: [{ client: clientId }, { ipClient }],
            banniere: banniereId,
            estActif: true,
            dateExpiration: { $gt: new Date() },
        });

        // Si un suivi existe déjà pour cette bannière et ce client/IP, ne pas en créer un nouveau
        if (suiviExistant) {
            return {
                succes: true,
                cookieSuivi: suiviExistant.cookieSuiviId,
                message: 'Suivi déjà actif pour cette bannière',
                suivi: suiviExistant,
            };
        }

        // Limiter le nombre de suivis actifs par client (anti-spam)
        const suivisActifs = await Suivi.countDocuments({
            $or: [{ client: clientId }, { ipClient }],
            estActif: true,
            dateExpiration: { $gt: new Date() },
        });

        // Si le client a déjà atteint la limite de suivis actifs, désactiver les plus anciens pour faire de la place au nouveau
        if (suivisActifs >= SUIVI_CONFIG.MAX_COOKIES_PAR_CLIENT) {
            // Désactiver les plus anciens
            await Suivi.updateMany(
                {
                    $or: [{ client: clientId }, { ipClient }],
                    estActif: true,
                },
                { $set: { estActif: false } },
                {
                    sort: { createdAt: 1 },
                    limit:
                        suivisActifs - SUIVI_CONFIG.MAX_COOKIES_PAR_CLIENT + 1,
                }
            );
        }

        // Créer le suivi
        const result = await Suivi.creerSuivi({
            banniereId,
            vendeurId: vendeur._id,
            clientId,
            ipClient,
            userAgent,
            page,
        });

        // Incrémenter le compteur de clics de la bannière
        await banniere.incrementerClics();

        return {
            succes: true,
            cookieSuivi: result.cookieSuivi,
            suivi: result.suivi,
            message: 'Cookie de suivi créé avec succès',
        };
    } catch (error) {
        console.error('Erreur lors de la création du suivi:', error);
        throw error;
    }
};

/**
 * @desc    Vérifier et attribuer une vente à une bannière
 * @param   {Object} data - {commandeId, clientId, ipClient, montantFCFA, produits}
 * @returns {Promise} Résultat de l'attribution
 */
export const verifierEtAttribuerVente = async data => {
    try {
        const { commandeId, clientId, ipClient, montantFCFA, produits } = data;

        // Trouver le suivi actif le plus récent pour ce client
        const suivi = await Suivi.findOne({
            $or: [{ client: clientId }, { ipClient }],
            estActif: true,
            dateExpiration: { $gt: new Date() },
            'conversion.aConverti': false,
        })
            .sort({ createdAt: -1 })
            .populate('banniere vendeur');

        if (!suivi) {
            return {
                succes: false,
                message: 'Aucun suivi actif trouvé pour ce client',
                attribution: false,
            };
        }

        // Vérifier que la commande contient au moins un produit du vendeur
        const Produit = mongoose.model('Produit');
        const produitIds = produits.map(p => p.produit);
        const produitsVendeur = await Produit.find({
            _id: { $in: produitIds },
            vendeur: suivi.vendeur._id,
        });

        if (produitsVendeur.length === 0) {
            return {
                succes: false,
                message: 'Aucun produit du vendeur dans cette commande',
                attribution: false,
            };
        }

        // Calculer le montant attribuable (seulement les produits du vendeur)
        let montantAttribuable = 0;
        produits.forEach(item => {
            const produitTrouve = produitsVendeur.find(
                p => p._id.toString() === item.produit.toString()
            );
            if (produitTrouve) {
                montantAttribuable += item.prix * item.quantite;
            }
        });

        // Enregistrer la conversion dans le suivi
        await suivi.enregistrerConversion(commandeId, montantAttribuable);

        // Attribuer la vente à la bannière
        await suivi.banniere.attribuerVente(
            commandeId,
            clientId,
            montantAttribuable,
            suivi.cookieSuiviId
        );

        // Mettre à jour les statistiques du vendeur
        const vendeur = await Utilisateur.findById(suivi.vendeur._id);
        if (vendeur.statistiquesBannieres) {
            vendeur.statistiquesBannieres.totalVentesAttribuees += 1;
            vendeur.statistiquesBannieres.montantTotalVentes +=
                montantAttribuable;
            await vendeur.save();
        }

        // Vérifier et attribuer les bonus de ventes
        const bonusResult = await crediterBonusVentes(suivi.vendeur._id, 1);

        return {
            succes: true,
            attribution: true,
            message: 'Vente attribuée avec succès à la bannière',
            donnees: {
                banniereId: suivi.banniere._id,
                vendeurId: suivi.vendeur._id,
                montantAttribuable,
                bonusAttribue: bonusResult.bonusAttribue,
                montantBonus: bonusResult.montantBonus || 0,
            },
        };
    } catch (error) {
        console.error("Erreur lors de l'attribution de la vente:", error);
        throw error;
    }
};

/**
 * @desc    Obtenir les statistiques de conversion pour un vendeur
 * @param   {ObjectId} vendeurId - ID du vendeur
 * @param   {Date} dateDebut - Date de début (optionnel)
 * @param   {Date} dateFin - Date de fin (optionnel)
 * @returns {Promise} Statistiques de conversion
 */
export const obtenirStatsConversion = async (
    vendeurId,
    dateDebut = null,
    dateFin = null
) => {
    try {
        // Stats depuis le modèle Suivi
        const statsSuivi = await Suivi.obtenirStatsConversion(
            vendeurId,
            dateDebut,
            dateFin
        );

        // Stats depuis les bannières du vendeur
        const query = { creePar: vendeurId };

        if (dateDebut || dateFin) {
            query['ventesAttribuees.dateVente'] = {};
            if (dateDebut) query['ventesAttribuees.dateVente'].$gte = dateDebut;
            if (dateFin) query['ventesAttribuees.dateVente'].$lte = dateFin;
        }

        const bannieres = await Banniere.find(query);

        const statsBannieres = {
            totalBannieres: bannieres.length,
            bannieresAvecVentes: bannieres.filter(
                b => b.ventesAttribuees.length > 0
            ).length,
            meilleuresBannieres: bannieres
                .sort(
                    (a, b) =>
                        b.ventesAttribuees.length - a.ventesAttribuees.length
                )
                .slice(0, 5)
                .map(b => ({
                    id: b._id,
                    titre: b.titre,
                    nombreVentes: b.ventesAttribuees.length,
                    montantTotal: b.montantTotalVentes,
                })),
        };

        return {
            succes: true,
            donnees: {
                suivi: statsSuivi,
                bannieres: statsBannieres,
                tauxConversion:
                    bannieres.length > 0
                            ? (
                                (statsBannieres.bannieresAvecVentes /
                                    statsBannieres.totalBannieres) *
                                100
                            ).toFixed(2)
                            : 0,
            },
        };
    } catch (error) {
        console.error(
            'Erreur lors de la récupération des stats de conversion:',
            error
        );
        throw error;
    }
};

/**
 * @desc    Nettoyer les suivis expirés (Worker quotidien)
 * @returns {Promise} Résultat du nettoyage
 */
export const nettoyerSuivisExpires = async () => {
    try {
        const result = await Suivi.nettoyerExpires();

        return {
            succes: true,
            message: `${result.nbDesactives} cookie(s) expiré(s) désactivé(s)`,
        };
    } catch (error) {
        console.error('Erreur lors du nettoyage des suivis expirés:', error);
        throw error;
    }
};

/**
 * @desc    Obtenir l'historique des suivis d'un client
 * @param   {ObjectId} clientId - ID du client
 * @param   {String} ipClient - IP du client (optionnel)
 * @returns {Promise} Historique des suivis
 */
export const obtenirHistoriqueClient = async (clientId, ipClient = null) => {
    try {
        const query = {
            $or: [{ client: clientId }],
        };

        if (ipClient) {
            query.$or.push({ ipClient });
        }

        const suivis = await Suivi.find(query)
            .populate('banniere', 'titre type image')
            .populate('vendeur', 'nom prenom boutique')
            .sort({ createdAt: -1 })
            .limit(50);

        return {
            succes: true,
            donnees: {
                total: suivis.length,
                suivisActifs: suivis.filter(s => s.estValide).length,
                conversions: suivis.filter(s => s.conversion.aConverti).length,
                historique: suivis,
            },
        };
    } catch (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
        throw error;
    }
};

/**
 * @desc    Désactiver tous les suivis d'un client (RGPD)
 * @param   {ObjectId} clientId - ID du client
 * @param   {String} ipClient - IP du client (optionnel)
 * @returns {Promise} Résultat de la désactivation
 */
export const desactiverSuivisClient = async (clientId, ipClient = null) => {
    try {
        const query = {
            $or: [{ client: clientId }],
            estActif: true,
        };

        if (ipClient) {
            query.$or.push({ ipClient });
        }

        const result = await Suivi.updateMany(query, {
            $set: { estActif: false },
        });

        return {
            succes: true,
            message: `${result.modifiedCount} suivi(s) désactivé(s)`,
            nbDesactives: result.modifiedCount,
        };
    } catch (error) {
        console.error('Erreur lors de la désactivation des suivis:', error);
        throw error;
    }
};

/**
 * @desc    Obtenir les statistiques globales de suivi (Admin)
 * @returns {Promise} Statistiques globales
 */
export const obtenirStatsGlobales = async () => {
    try {
        const totalSuivis = await Suivi.countDocuments();
        const suivisActifs = await Suivi.countDocuments({
            estActif: true,
            dateExpiration: { $gt: new Date() },
        });
        const conversions = await Suivi.countDocuments({
            'conversion.aConverti': true,
        });

        // Montant total des conversions
        const suivisConvertis = await Suivi.find({
            'conversion.aConverti': true,
        }).select('conversion.montantFCFA');

        const montantTotal = suivisConvertis.reduce(
            (total, s) => total + (s.conversion.montantFCFA || 0),
            0
        );

        return {
            succes: true,
            donnees: {
                totalSuivis,
                suivisActifs,
                conversions,
                tauxConversion:
                    totalSuivis > 0
                        ? ((conversions / totalSuivis) * 100).toFixed(2)
                        : 0,
                montantTotalFCFA: montantTotal,
                montantMoyenFCFA:
                    conversions > 0
                        ? Math.round(montantTotal / conversions)
                        : 0,
            },
        };
    } catch (error) {
        console.error(
            'Erreur lors de la récupération des stats globales:',
            error
        );
        throw error;
    }
};

export default {
    creerSuiviClic,
    verifierEtAttribuerVente,
    obtenirStatsConversion,
    nettoyerSuivisExpires,
    obtenirHistoriqueClient,
    desactiverSuivisClient,
    obtenirStatsGlobales,
    SUIVI_CONFIG,
};