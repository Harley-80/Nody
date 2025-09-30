// Importation des modules nécessaires
import express from 'express';
import {
    obtenirUtilisateurs,
    obtenirUtilisateur,
    mettreAJourUtilisateur,
    supprimerUtilisateur,
    ajouterAuPanier,
    obtenirPanier,
    mettreAJourPanier,
    retirerDuPanier,
    viderPanier,
    ajouterAListeSouhaits,
    obtenirListeSouhaits,
    retirerDeListeSouhaits,
    ajouterAdresse,
    mettreAJourAdresse,
    supprimerAdresse,
} from '../controllers/utilisateursController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';
import { validerObjectId } from '../middleware/validationMiddleware.js';

const routeur = express.Router();

// Toutes les routes sont protégées
routeur.use(proteger);

// Routes admin pour la gestion des utilisateurs
routeur.route('/').get(autoriser('admin'), obtenirUtilisateurs);

routeur
    .route('/:id')
    .get(autoriser('admin'), validerObjectId('id'), obtenirUtilisateur)
    .put(autoriser('admin'), validerObjectId('id'), mettreAJourUtilisateur)
    .delete(autoriser('admin'), validerObjectId('id'), supprimerUtilisateur);

// Routes pour le panier
routeur
    .route('/panier')
    .get(obtenirPanier)
    .post(ajouterAuPanier)
    .delete(viderPanier);

routeur
    .route('/panier/:articleId')
    .put(mettreAJourPanier)
    .delete(retirerDuPanier);

// Routes pour la liste de souhaits
routeur
    .route('/liste-souhaits')
    .get(obtenirListeSouhaits)
    .post(ajouterAListeSouhaits);

routeur.route('/liste-souhaits/:produitId').delete(retirerDeListeSouhaits);

// Routes pour les adresses
routeur.route('/adresses').post(ajouterAdresse);

routeur
    .route('/adresses/:adresseId')
    .put(mettreAJourAdresse)
    .delete(supprimerAdresse);

// Exportation du routeur
export default routeur;
