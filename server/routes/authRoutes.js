// Importation des modules nécessaires
import express from 'express';
import {
    inscription,
    inscriptionVendeur,
    inscriptionAvecInvitation,
    connexion,
    deconnexion,
    obtenirMoi,
    mettreAJourMoi,
    changerMotDePasse,
    motDePasseOublie,
    reinitialiserMotDePasse,
    verifierEmail,
    renvoyerVerification,
} from '../controllers/authController.js';
import { proteger } from '../middleware/authMiddleware.js';
import {
    validerConnexion,
    validerInscription,
} from '../middleware/validationMiddleware.js';

const routeur = express.Router();

// Routes publiques
/**
 * @route   POST /api/auth/inscription
 * @desc    Inscription d'un utilisateur (par défaut: client)
 * @access  Public
 */
routeur.post('/inscription', validerInscription, inscription);

/**
 * @route   POST /api/auth/inscription/vendeur
 * @desc    Inscription spécifique pour vendeur
 * @access  Public
 */
routeur.post('/inscription/vendeur', validerInscription, inscriptionVendeur);

/**
 * @route   POST /api/auth/inscription/invitation
 * @desc    Inscription avec code d'invitation (Admin/Modérateur)
 * @access  Public
 */
routeur.post(
    '/inscription/invitation',
    validerInscription,
    inscriptionAvecInvitation
);

/**
 * @route   POST /api/auth/connexion
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
routeur.post('/connexion', validerConnexion, connexion);

/**
 * @route   POST /api/auth/mot-de-passe-oublie
 * @desc    Demande de réinitialisation du mot de passe
 * @access  Public
 */
routeur.post('/mot-de-passe-oublie', motDePasseOublie);

/**
 * @route   PUT /api/auth/reinitialiser-mot-de-passe/:token
 * @desc    Réinitialiser le mot de passe
 * @access  Public
 */
routeur.put('/reinitialiser-mot-de-passe/:token', reinitialiserMotDePasse);

/**
 * @route   GET /api/auth/verifier-email/:token
 * @desc    Vérifier l'email de l'utilisateur
 * @access  Public
 */
routeur.get('/verifier-email/:token', verifierEmail);

// Routes protégées
routeur.use(proteger); // Toutes les routes suivantes nécessitent une authentification

/**
 * @route   POST /api/auth/deconnexion
 * @desc    Déconnexion d'un utilisateur
 * @access  Private
 */
routeur.post('/deconnexion', deconnexion);

/**
 * @route   GET /api/auth/moi
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Private
 */
routeur.get('/moi', obtenirMoi);

/**
 * @route   PUT /api/auth/moi
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @access  Private
 */
routeur.put('/moi', mettreAJourMoi);

/**
 * @route   PUT /api/auth/changer-mot-de-passe
 * @desc    Changer le mot de passe de l'utilisateur connecté
 * @access  Private
 */
routeur.put('/changer-mot-de-passe', changerMotDePasse);

/**
 * @route   POST /api/auth/renvoyer-verification
 * @desc    Renvoyer l'email de vérification
 * @access  Private
 */
routeur.post('/renvoyer-verification', renvoyerVerification);

// Exportation du routeur
export default routeur;
