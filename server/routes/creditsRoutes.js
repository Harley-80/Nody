import express from 'express';
import {
    obtenirSoldeCredits,
    obtenirHistoriqueCredits,
    verifierCapaciteCréation,
} from '../middleware/creditsMiddleware.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/vendeur/credits/solde
 * @desc    Obtenir le solde de crédits du vendeur connecté
 * @access  Privé (Vendeur uniquement)
 */
router.get('/solde', proteger, autoriser('vendeur'), obtenirSoldeCredits);

/**
 * @route   GET /api/vendeur/credits/historique
 * @desc    Obtenir l'historique complet des crédits (pagination)
 * @query   page, limite
 * @access  Privé (Vendeur uniquement)
 */
router.get(
    '/historique',
    proteger,
    autoriser('vendeur'),
    obtenirHistoriqueCredits
);

/**
 * @route   GET /api/vendeur/credits/verifier
 * @desc    Vérifier si le vendeur peut créer une bannière (endpoint utilitaire)
 * @access  Privé (Vendeur uniquement)
 */
router.get(
    '/verifier',
    proteger,
    autoriser('vendeur'),
    verifierCapaciteCréation
);

export default router;