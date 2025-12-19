import express from 'express';
import { proteger, autoriser } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';
import {
    creerUtilisateur,
    obtenirTousUtilisateurs,
    obtenirUtilisateur,
    obtenirClients,
    obtenirVendeurs,
    obtenirModerateurs,
    mettreAJourModerateur,
    supprimerModerateur,
    mettreAJourStatutModerateur,
    mettreAJourRole,
    mettreAJourVerification,
    mettreAJourStatut,
    supprimerUtilisateur,
    obtenirStatistiquesUtilisateurs,
    obtenirDemandesAvecFiltres,
    obtenirStatistiquesAvancees,
    approuverDemandeAvecHistorique,
    rejeterDemandeAvecHistorique,
    reapprouverDemande,
    reactiverUtilisateur,
    obtenirHistoriqueDecisions,
    obtenirHistoriqueUtilisateur,
    getNotifications,
    marquerNotificationCommeLue,
    marquerToutesNotificationsCommeLues,
    supprimerNotification,
    obtenirStatistiquesDashboard,
} from '../controllers/adminController.js';

const routeur = express.Router();

// MIDDLEWARE GLOBAL : Toutes les routes admin nécessitent authentification + rôle admin
routeur.use(proteger);
routeur.use(autoriser(ROLES.ADMIN));

// SECTION 1: STATISTIQUES ET DASHBOARD
/**
 * @route GET /api/admin/statistiques/utilisateurs
 * @desc Obtenir les statistiques des utilisateurs
 * @access Private/Admin
 */
routeur.get('/statistiques/utilisateurs', obtenirStatistiquesUtilisateurs);

/**
 * @route GET /api/admin/statistiques/dashboard
 * @desc Obtenir les statistiques du dashboard avec filtre par période
 * @access Private/Admin
 */
routeur.get('/statistiques/dashboard', obtenirStatistiquesDashboard);

/**
 * @route GET /api/admin/demandes/statistiques
 * @desc Obtenir les statistiques avancées des demandes
 * @access Private/Admin
 */
routeur.get('/demandes/statistiques', obtenirStatistiquesAvancees);

// SECTION 2: GESTION DES UTILISATEURS (CRUD)
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

// SECTION 3: RÔLES SPÉCIFIQUES (CLIENTS, VENDEURS, MODÉRATEURS)
/**
 * @route GET /api/admin/clients
 * @desc Obtenir uniquement les clients avec pagination
 * @access Private/Admin
 */
routeur.get('/clients', obtenirClients);

/**
 * @route GET /api/admin/vendeurs
 * @desc Obtenir uniquement les vendeurs avec pagination
 * @access Private/Admin
 */
routeur.get('/vendeurs', obtenirVendeurs);

/**
 * @route GET /api/admin/moderateurs
 * @desc Obtenir tous les modérateurs
 * @access Private/Admin
 */
routeur.get('/moderateurs', obtenirModerateurs);

/**
 * @route PUT /api/admin/moderateurs/:id
 * @desc Mettre à jour un modérateur
 * @access Private/Admin
 */
routeur.put('/moderateurs/:id', mettreAJourModerateur);

/**
 * @route DELETE /api/admin/moderateurs/:id
 * @desc Supprimer un modérateur
 * @access Private/Admin
 */
routeur.delete('/moderateurs/:id', supprimerModerateur);

/**
 * @route PATCH /api/admin/moderateurs/:id/statut
 * @desc Changer le statut d'un modérateur (actif/inactif)
 * @access Private/Admin
 */
routeur.patch('/moderateurs/:id/statut', mettreAJourStatutModerateur);

// SECTION 4: ACTIONS SPÉCIFIQUES SUR UTILISATEURS
/**
 * @route PUT /api/admin/utilisateurs/:id/role
 * @desc Mettre à jour le rôle d'un utilisateur
 * @access Private/Admin
 */
routeur.put('/utilisateurs/:id/role', mettreAJourRole);

/**
 * @route PUT /api/admin/utilisateurs/:id/verification
 * @desc Mettre à jour le statut de vérification
 * @access Private/Admin
 */
routeur.put('/utilisateurs/:id/verification', mettreAJourVerification);

/**
 * @route PUT /api/admin/utilisateurs/:id/statut
 * @desc Activer/Désactiver un utilisateur
 * @access Private/Admin
 */
routeur.put('/utilisateurs/:id/statut', mettreAJourStatut);

/**
 * @route PUT /api/admin/utilisateurs/:id/reactiver
 * @desc Réactiver un utilisateur désactivé
 * @access Private/Admin
 */
routeur.put('/utilisateurs/:id/reactiver', reactiverUtilisateur);

/**
 * @route GET /api/admin/utilisateurs/:id/historique
 * @desc Obtenir l'historique des décisions d'un utilisateur spécifique
 * @access Private/Admin
 */
routeur.get('/utilisateurs/:id/historique', obtenirHistoriqueUtilisateur);

// SECTION 5: GESTION DES DEMANDES DE VÉRIFICATION
/**
 * @route GET /api/admin/demandes
 * @desc Obtenir les demandes d'inscription avec filtres avancés
 * @access Private/Admin
 */
routeur.get('/demandes', obtenirDemandesAvecFiltres);

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

/**
 * @route PUT /api/admin/demandes/:id/reapprouver
 * @desc Réapprouver une demande précédemment rejetée
 * @access Private/Admin
 */
routeur.put('/demandes/:id/reapprouver', reapprouverDemande);

// SECTION 6: HISTORIQUE ET AUDIT
/**
 * @route GET /api/admin/historique-decisions
 * @desc Obtenir l'historique des décisions de l'équipe admin
 * @access Private/Admin
 */
routeur.get('/historique-decisions', obtenirHistoriqueDecisions);

// SECTION 7: GESTION DES NOTIFICATIONS
/**
 * @route GET /api/admin/notifications
 * @desc Obtenir toutes les notifications (avec ou sans filtres)
 * @access Private/Admin
 */
routeur.get('/notifications', getNotifications);

/**
 * @route PUT /api/admin/notifications/:id/lire
 * @desc Marquer une notification comme lue
 * @access Private/Admin
 */
routeur.put('/notifications/:id/lire', marquerNotificationCommeLue);

/**
 * @route PUT /api/admin/notifications/tout-lire
 * @desc Marquer toutes les notifications comme lues
 * @access Private/Admin
 */
routeur.put('/notifications/tout-lire', marquerToutesNotificationsCommeLues);

/**
 * @route DELETE /api/admin/notifications/:id
 * @desc Supprimer une notification
 * @access Private/Admin
 */
routeur.delete('/notifications/:id', supprimerNotification);

export default routeur;