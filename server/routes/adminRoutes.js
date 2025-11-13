import express from 'express';
import {
    creerUtilisateur,
    obtenirTousUtilisateurs,
    obtenirUtilisateur,
    mettreAJourRole,
    mettreAJourVerification,
    mettreAJourStatut,
    supprimerUtilisateur,
    obtenirStatistiquesUtilisateurs,
    obtenirDemandesAvecFiltres,
    obtenirStatistiquesAvancees,
    approuverDemandeAvecHistorique,
    rejeterDemandeAvecHistorique,
    obtenirHistoriqueDecisions,
    obtenirHistoriqueUtilisateur,
} from '../controllers/adminController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const routeur = express.Router();

// Toutes les routes admin nécessitent une authentification et le rôle admin
routeur.use(proteger);
routeur.use(autoriser(ROLES.ADMIN));

// --- Routes pour les Statistiques et la Gestion des Utilisateurs ---

/**
 * @route GET /api/admin/statistiques/utilisateurs
 * @desc Obtenir les statistiques des utilisateurs
 * @access Private/Admin
 */
routeur.get('/statistiques/utilisateurs', obtenirStatistiquesUtilisateurs);

/**
 * @route /api/admin/utilisateurs
 * @desc Gestion CRUD de base et listage des utilisateurs
 */
routeur
    .route('/utilisateurs')
    .get(obtenirTousUtilisateurs)
    .post(creerUtilisateur);

/**
 * @route /api/admin/utilisateurs/:id
 * @desc Opérations sur un utilisateur spécifique
 */
routeur
    .route('/utilisateurs/:id')
    .get(obtenirUtilisateur)
    .delete(supprimerUtilisateur);

// --- Routes d'action spécifiques sur les Utilisateurs ---

routeur.put('/utilisateurs/:id/role', mettreAJourRole);
routeur.put('/utilisateurs/:id/verification', mettreAJourVerification);
routeur.put('/utilisateurs/:id/statut', mettreAJourStatut);

/**
 * @route GET /api/admin/utilisateurs/:id/historique
 * @desc Obtenir l'historique des décisions d'un utilisateur spécifique
 * @access Private/Admin
 */
routeur.get('/utilisateurs/:id/historique', obtenirHistoriqueUtilisateur);

// --- Routes pour la Gestion des Demandes (Vérification) ---

/**
 * @route GET /api/admin/demandes
 * @desc Obtenir les demandes d'inscription avec filtres avancés
 * @access Private/Admin
 */
routeur.get('/demandes', obtenirDemandesAvecFiltres);

/**
 * @route GET /api/admin/demandes/statistiques
 * @desc Obtenir les statistiques avancées des demandes
 * @access Private/Admin
 */
routeur.get('/demandes/statistiques', obtenirStatistiquesAvancees);

/**
 * @route PUT /api/admin/demandes/:id/approuver
 * @desc Approuver une demande avec historique
 * @access Private/Admin
 */
routeur.put('/demandes/:id/approuver', approuverDemandeAvecHistorique);

/**
 * @route PUT /api/admin/demandes/:id/rejeter
 * @desc Rejeter une demande avec historique
 * @access Private/Admin
 */
routeur.put('/demandes/:id/rejeter', rejeterDemandeAvecHistorique);

// --- Routes pour l'Historique des Décisions ---

/**
 * @route GET /api/admin/historique-decisions
 * @desc Obtenir l'historique des décisions de l'équipe admin
 * @access Private/Admin
 */
routeur.get('/historique-decisions', obtenirHistoriqueDecisions);

// Exportation du routeur
export default routeur;
