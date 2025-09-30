// Importation des modules nécessaires
import express from 'express';
import {
    obtenirProduits,
    obtenirProduit,
    creerProduit,
    mettreAJourProduit,
    supprimerProduit,
    ajouterAvis,
    obtenirProduitsSimilaires,
    obtenirProduitsPopulaires,
    obtenirNouveauxProduits,
} from '../controllers/produitsController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';
import {
    validerObjectId,
    validerProduit,
    validerPagination,
} from '../middleware/validationMiddleware.js';

const routeur = express.Router();

// Routes publiques
routeur.route('/').get(validerPagination, obtenirProduits);

routeur.route('/populaires').get(obtenirProduitsPopulaires);

routeur.route('/nouveaux').get(obtenirNouveauxProduits);

routeur.route('/:id').get(obtenirProduit);

routeur
    .route('/:id/similaires')
    .get(validerObjectId('id'), obtenirProduitsSimilaires);

// Routes protégées
routeur.use(proteger);

// Routes pour les avis
routeur.route('/:id/avis').post(validerObjectId('id'), ajouterAvis);

// Routes admin/vendeur
routeur
    .route('/')
    .post(autoriser('admin', 'vendeur'), validerProduit, creerProduit);

routeur
    .route('/:id')
    .put(
        autoriser('admin', 'vendeur'),
        validerObjectId('id'),
        validerProduit,
        mettreAJourProduit
    )
    .delete(
        autoriser('admin', 'vendeur'),
        validerObjectId('id'),
        supprimerProduit
    );

// Exportation du routeur
export default routeur;
