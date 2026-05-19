import asyncHandler from 'express-async-handler';
import Utilisateur from '../models/utilisateurModel.js';

/**
 * Constantes pour le système de crédits
 */
export const CREDITS_CONFIG = {
    COUT_BANNIERE: 2, // Coût d'une bannière
    CREDITS_INITIAUX: 5, // Crédits à l'inscription
    BONUS_PAR_VENTES: 1, // +1 point tous les 10 ventes
    SEUIL_VENTES_BONUS: 10, // Nombre de ventes requis pour le bonus
};

/**
 * @desc    Vérifier que le vendeur a suffisamment de crédits
 * @usage   Utiliser comme middleware avant creerBanniere()
 * @access  Privé (Vendeur uniquement)
 */
export const verifierCredits = asyncHandler(async (req, res, next) => {
    // Ce middleware ne s'applique qu'aux vendeurs
    if (req.utilisateur.role !== 'vendeur') {
        return next(); // Admin et modérateur ne sont pas limités
    }

    try {
        // Récupérer le vendeur complet
        const vendeur = await Utilisateur.findById(req.utilisateur._id);

        if (!vendeur) {
            res.status(404);
            throw new Error('Utilisateur non trouvé');
        }

        // Vérifier les crédits
        const creditsActuels = vendeur.creditsBannieres || 0;
        const coutBanniere = CREDITS_CONFIG.COUT_BANNIERE;

        if (creditsActuels < coutBanniere) {
            res.status(403);
            throw new Error(
                `Crédits insuffisants. Vous avez ${creditsActuels} point(s), ${coutBanniere} requis. ` +
                    `Gagnez +1 point tous les ${CREDITS_CONFIG.SEUIL_VENTES_BONUS} ventes validées.`
            );
        }

        // Informations sur les crédits disponibles
        req.creditsInfo = {
            creditsActuels,
            coutBanniere,
            creditsRestantsApresCréation: creditsActuels - coutBanniere,
        };

        next();
    } catch (error) {
        res.status(error.statusCode || 500);
        throw error;
    }
});

/**
 * @desc    Middleware pour débiter automatiquement les crédits après création
 * @usage   Utiliser après creerBanniere() avec asyncHandler
 * @access  Privé (Vendeur uniquement)
 */
export const debiterCreditsApresCréation = asyncHandler(
    async (req, res, next) => {
        // Ne débiter que pour les vendeurs
        if (req.utilisateur.role !== 'vendeur') {
            return next();
        }

        try {
            const vendeur = await Utilisateur.findById(req.utilisateur._id);

            if (!vendeur) {
                return next(); // Ne pas bloquer si erreur
            }

            // ID de la bannière créée (doit être attaché par le controller)
            const banniereId = res.locals.banniereCreee?._id;

            // Débiter les crédits
            await vendeur.debiterPoints(
                CREDITS_CONFIG.COUT_BANNIERE,
                "Création d'une bannière publicitaire",
                banniereId
            );

            // Ajouter l'info dans la réponse
            res.locals.creditsDebites = CREDITS_CONFIG.COUT_BANNIERE;
            res.locals.nouveauSolde = vendeur.creditsBannieres;

            next();
        } catch (error) {
            console.error('Erreur lors du débit des crédits:', error);
            // Ne pas bloquer la création même si le débit échoue
            next();
        }
    }
);

/**
 * @desc    Obtenir le solde de crédits du vendeur connecté
 * @route   GET /api/vendeur/credits
 * @access  Privé (Vendeur)
 */
export const obtenirSoldeCredits = asyncHandler(async (req, res) => {
    if (req.utilisateur.role !== 'vendeur') {
        res.status(403);
        throw new Error('Accès réservé aux vendeurs');
    }

    const vendeur = await Utilisateur.findById(req.utilisateur._id).select(
        'creditsBannieres historiqueCredits statistiquesBannieres'
    );

    if (!vendeur) {
        res.status(404);
        throw new Error('Vendeur non trouvé');
    }

    // Calcul des prochains bonus possibles
    const ventesRestantes =
        CREDITS_CONFIG.SEUIL_VENTES_BONUS -
        (vendeur.statistiquesBannieres?.totalVentesAttribuees %
            CREDITS_CONFIG.SEUIL_VENTES_BONUS || 0);

    res.status(200).json({
        succes: true,
        donnees: {
            solde: vendeur.creditsBannieres || 0,
            coutBanniere: CREDITS_CONFIG.COUT_BANNIERE,
            bannieresCreables: Math.floor(
                (vendeur.creditsBannieres || 0) / CREDITS_CONFIG.COUT_BANNIERE
            ),
            prochainBonus: {
                montant: CREDITS_CONFIG.BONUS_PAR_VENTES,
                ventesRestantes,
            },
            historique: vendeur.historiqueCredits?.slice(-10) || [], // 10 dernières transactions
            statistiques: vendeur.statistiquesBannieres || {},
        },
    });
});

/**
 * @desc    Obtenir l'historique complet des crédits
 * @route   GET /api/vendeur/credits/historique
 * @access  Privé (Vendeur)
 */
export const obtenirHistoriqueCredits = asyncHandler(async (req, res) => {
    if (req.utilisateur.role !== 'vendeur') {
        res.status(403);
        throw new Error('Accès réservé aux vendeurs');
    }

    const { page = 1, limite = 20 } = req.query;

    const vendeur = await Utilisateur.findById(req.utilisateur._id)
        .select('historiqueCredits creditsBannieres')
        .lean();

    if (!vendeur) {
        res.status(404);
        throw new Error('Vendeur non trouvé');
    }

    const historique = vendeur.historiqueCredits || [];

    // Pagination
    const startIndex = (page - 1) * limite;
    const endIndex = page * limite;
    const historiquePagee = historique.slice(startIndex, endIndex);

    res.status(200).json({
        succes: true,
        donnees: {
            soldeActuel: vendeur.creditsBannieres || 0,
            historique: historiquePagee,
            page: Number(page),
            totalPages: Math.ceil(historique.length / limite),
            total: historique.length,
        },
    });
});

/**
 * @desc    Vérifier si un vendeur peut créer une bannière (endpoint public)
 * @route   GET /api/vendeur/credits/verifier
 * @access  Privé (Vendeur)
 */
export const verifierCapaciteCréation = asyncHandler(async (req, res) => {
    if (req.utilisateur.role !== 'vendeur') {
        res.status(403);
        throw new Error('Accès réservé aux vendeurs');
    }

    const vendeur = await Utilisateur.findById(req.utilisateur._id).select(
        'creditsBannieres'
    );

    if (!vendeur) {
        res.status(404);
        throw new Error('Vendeur non trouvé');
    }

    const peutCreer = vendeur.peutCreerBanniere();
    const creditsManquants = peutCreer
        ? 0
        : CREDITS_CONFIG.COUT_BANNIERE - (vendeur.creditsBannieres || 0);

    res.status(200).json({
        succes: true,
        donnees: {
            peutCreer,
            creditsActuels: vendeur.creditsBannieres || 0,
            coutBanniere: CREDITS_CONFIG.COUT_BANNIERE,
            creditsManquants,
            message: peutCreer
                ? 'Vous pouvez créer une bannière'
                : `Il vous manque ${creditsManquants} point(s) pour créer une bannière`,
        },
    });
});

export default {
    verifierCredits,
    debiterCreditsApresCréation,
    obtenirSoldeCredits,
    obtenirHistoriqueCredits,
    verifierCapaciteCréation,
    CREDITS_CONFIG,
};