import express from 'express';
import {
    creerSuiviClic,
    verifierEtAttribuerVente,
    obtenirHistoriqueClient,
    desactiverSuivisClient,
} from '../services/suiviService.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';

// Note : Les statistiques de conversion sont gérées dans le contrôleur de statistiques pour éviter les dépendances circulaires
const router = express.Router();

/**
 * @route   POST /api/suivi/clic
 * @desc    Créer un cookie de suivi lors d'un clic sur une bannière
 * @body    { banniereId, clientId?, ipClient, userAgent, page }
 * @access  Public (clics anonymes autorisés)
 */
router.post('/clic', creerSuiviClic);

/**
 * @route   POST /api/suivi/attribution
 * @desc    Vérifier et attribuer une vente à une bannière via le suivi
 * @body    { commandeId, clientId?, ipClient, montantFCFA, produits: [{produit, prix, quantite}] }
 * @access  Privé (Système de paiement / Webhook)
 */
router.post(
    '/attribution',
    proteger,
    autoriser('systeme', 'admin'),
    verifierEtAttribuerVente
);

/**
 * @route   GET /api/suivi/historique
 * @desc    Obtenir l'historique des suivis d'un client (RGPD)
 * @query   clientId (optionnel, sinon utilise utilisateur connecté)
 * @access  Privé (Client connecté ou Admin)
 */
router.get(
    '/historique',
    proteger,
    autoriser('client', 'admin'),
    obtenirHistoriqueClient
);

/**
 * @route   DELETE /api/suivi/desactiver
 * @desc    Désactiver tous les suivis d'un client (droit à l'oubli RGPD)
 * @body    { clientId?, ipClient? }
 * @access  Privé (Client connecté ou Admin)
 */
router.delete(
    '/desactiver',
    proteger,
    autoriser('client', 'admin'),
    desactiverSuivisClient
);

/**
 * @route   GET /api/suivi/stats
 * @desc    Obtenir les statistiques de conversion (Vendeur/Admin)
 * @query   vendeurId (pour admin), dateDebut, dateFin
 * @access  Privé (Vendeur, Admin)
 */
router.get(
    '/stats',
    proteger,
    autoriser('vendeur', 'admin'),
    async (req, res, next) => {
        try {
            const { obtenirStatsConversion } =
                await import('../services/suiviService.js');
            const vendeurId =
                req.utilisateur.role === 'admin'
                    ? req.query.vendeurId
                    : req.utilisateur._id;

            if (!vendeurId) {
                res.status(400);
                throw new Error('vendeurId requis pour les admins');
            }

            const stats = await obtenirStatsConversion(
                vendeurId,
                req.query.dateDebut ? new Date(req.query.dateDebut) : null,
                req.query.dateFin ? new Date(req.query.dateFin) : null
            );

            res.status(200).json(stats);
        } catch (error) {
            next(error);
        }
    }
);

export default router;