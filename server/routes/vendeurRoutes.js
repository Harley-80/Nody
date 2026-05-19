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
    getProduit,
} from '../controllers/vendeurController.js';
import { proteger } from '../middleware/authMiddleware.js';
import { estVendeur } from '../middleware/roleMiddleware.js';
import {
    uploadProduits,
    handleMulterError,
} from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Routes protégées vendeur
router.use(proteger);
router.use(estVendeur);

// Statistiques
router.get('/statistiques', getStatistiques);

// Gestion des produits
router
    .route('/produits')
    .get(getMesProduits)
    .post(uploadProduits.array('images', 6), handleMulterError, creerProduit);

router
    .route('/produits/:id')
    .get(getProduit)
    .put(
        uploadProduits.array('nouvellesImages', 6),
        handleMulterError,
        modifierProduit
    )
    .delete(supprimerProduit);

// Gestion des commandes
router.get('/commandes', getMesCommandes);
router.put(
    '/commandes/:commandeId/produits/:produitId',
    mettreAJourStatutProduit
);

// Gestion de la boutique
router
    .route('/boutique')
    .get(getMaBoutique)
    .put(
        uploadProduits.fields([
            { name: 'logo', maxCount: 1 },
            { name: 'banniere', maxCount: 1 },
        ]),
        handleMulterError,
        mettreAJourBoutique
    );

export default router; // Avant cetait 120