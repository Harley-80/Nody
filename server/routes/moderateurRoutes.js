import express from 'express';
import { proteger, autoriser } from '../middleware/authMiddleware.js';
import {
    obtenirStatistiquesModerateurDashboard,
    obtenirDemandes,
    validerProduit,
    validerVendeur,
    obtenirUtilisateurs,
    modifierStatutUtilisateur,
    obtenirHistorique,
} from '../controllers/moderateurController.js';

const routeur = express.Router();

// PROTECTION GLOBALE
// Toutes les routes nécessitent :
// 1. Authentification (proteger)
// 2. Rôle 'moderateur' (autoriser)
routeur.use(proteger);
routeur.use(autoriser('moderateur'));

// DASHBOARD MODÉRATEUR
routeur.get('/dashboard', obtenirStatistiquesModerateurDashboard);

// DEMANDES DE VALIDATION
routeur.get('/demandes', obtenirDemandes);

// VALIDATION PRODUITS
routeur.put('/produits/:id/valider', validerProduit);

// VALIDATION VENDEURS
routeur.put('/vendeurs/:id/valider', validerVendeur);

// GESTION UTILISATEURS (LIMITÉE)
routeur.get('/utilisateurs', obtenirUtilisateurs);
routeur.patch('/utilisateurs/:id/statut', modifierStatutUtilisateur);

// HISTORIQUE DES ACTIONS
routeur.get('/historique', obtenirHistorique);

// EXPORT
export default routeur;