import express from 'express';
import {
    getStatistiques,
    getProduitsEnAttente,
    validerProduit,
    rejeterProduit,
    getVendeursEnAttente,
    verifierVendeur,
    rejeterVendeur,
    getUtilisateurs,
    suspendreUtilisateur,
    activerUtilisateur,
} from '../controllers/moderateurController.js';
import { proteger } from '../middleware/authMiddleware.js';
import { estModerateur } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Routes protégées modérateur
router.use(proteger);
router.use(estModerateur);

// Statistiques
router.get('/statistiques', getStatistiques);

// Gestion des produits
router.get('/produits/en-attente', getProduitsEnAttente);
router.put('/produits/:id/valider', validerProduit);
router.put('/produits/:id/rejeter', rejeterProduit);

// Gestion des vendeurs
router.get('/vendeurs/en-attente', getVendeursEnAttente);
router.put('/vendeurs/:id/verifier', verifierVendeur);
router.put('/vendeurs/:id/rejeter', rejeterVendeur);

// Gestion des utilisateurs
router.get('/utilisateurs', getUtilisateurs);
router.put('/utilisateurs/:id/suspendre', suspendreUtilisateur);
router.put('/utilisateurs/:id/activer', activerUtilisateur);

export default router;
