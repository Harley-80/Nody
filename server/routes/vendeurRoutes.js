import express from 'express';
import {
    getStatistiques,
    getMesProduits,
    creerProduit,
    modifierProduit,
    supprimerProduit,
    getMesCommandes,
    mettreAJourStatutProduit,
    getMaBoutique,
    mettreAJourBoutique,
} from '../controllers/vendeurController.js';
import { proteger } from '../middleware/authMiddleware.js';
import { estVendeur, estVerifie } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Routes protégées vendeur
router.use(proteger);
router.use(estVendeur);

// Statistiques
router.get('/statistiques', getStatistiques);

// Gestion des produits
router.route('/produits').get(getMesProduits).post(creerProduit);

router.route('/produits/:id').put(modifierProduit).delete(supprimerProduit);

// Gestion des commandes
router.get('/commandes', getMesCommandes);
router.put(
    '/commandes/:commandeId/produits/:produitId',
    mettreAJourStatutProduit
);

// Gestion de la boutique
router.route('/boutique').get(getMaBoutique).put(mettreAJourBoutique);

export default router;
