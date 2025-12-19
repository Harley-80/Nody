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

import {
    obtenirAdresses,
    ajouterAdresse,
    modifierAdresse,
    supprimerAdresse,
    definirAdresseParDefaut,
    uploadAvatar,
} from '../controllers/profilController.js';

import {
    uploadAvatars,
    handleMulterError,
} from '../middleware/uploadMiddleware.js';

const routeur = express.Router();

// ROUTES PUBLIQUES
routeur.post('/inscription', validerInscription, inscription);
routeur.post('/inscription/vendeur', validerInscription, inscriptionVendeur);
routeur.post(
    '/inscription/invitation',
    validerInscription,
    inscriptionAvecInvitation
);
routeur.post('/connexion', validerConnexion, connexion);
routeur.post('/mot-de-passe-oublie', motDePasseOublie);
routeur.put('/reinitialiser-mot-de-passe/:token', reinitialiserMotDePasse);
routeur.get('/verifier-email/:token', verifierEmail);

// MIDDLEWARE : PROTECTION DES ROUTES
routeur.use(proteger);

// ROUTES PROTÉGÉES : GESTION DU COMPTE
routeur.post('/deconnexion', deconnexion);
routeur.get('/moi', obtenirMoi);
routeur.get('/profil', obtenirMoi);
routeur.put('/moi', mettreAJourMoi);
routeur.put('/changer-mot-de-passe', changerMotDePasse);
routeur.post('/renvoyer-verification', renvoyerVerification);

// ROUTES PROTÉGÉES : GESTION DES ADRESSES
routeur.get('/adresses', obtenirAdresses);
routeur.post('/adresses', ajouterAdresse);
routeur.put('/adresses/:id', modifierAdresse);
routeur.delete('/adresses/:id', supprimerAdresse);
routeur.put('/adresses/:id/par-defaut', definirAdresseParDefaut);

// ROUTES PROTÉGÉES : UPLOAD D'AVATAR
routeur.post(
    '/upload-avatar',
    uploadAvatars.single('avatar'),
    handleMulterError,
    uploadAvatar
);

export default routeur;