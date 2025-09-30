// Importation des modules nécessaires
import express from 'express';
import {
    creerIntentPaiement,
    confirmerPaiement,
    gererWebhook,
    demanderRemboursement,
} from '../controllers/paiementsController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';
import { validerObjectId } from '../middleware/validationMiddleware.js';
import Commande from '../models/commandeModel.js';

const routeur = express.Router();

// Webhook Stripe (doit être public pour que Stripe puisse y accéder)
routeur.post('/webhook', gererWebhook);

// Routes protégées
routeur.use(proteger);

routeur.post('/creer-intent', creerIntentPaiement);
routeur.post('/confirmer', confirmerPaiement);

// Routes admin pour les remboursements
routeur.post(
    '/:commandeId/remboursement',
    autoriser('admin'),
    validerObjectId('commandeId'),
    demanderRemboursement
);

// Exportation du routeur
export default routeur;
