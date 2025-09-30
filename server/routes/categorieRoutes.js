// Importation des modules nécessaires
import express from 'express';
import {
    obtenirCategories,
    obtenirCategorie,
    creerCategorie,
    mettreAJourCategorie,
    supprimerCategorie,
    obtenirCategoriesEnVedette,
} from '../controllers/categorieController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';
import { validerObjectId } from '../middleware/validationMiddleware.js';

const routeur = express.Router();

// Routes publiques
routeur.route('/').get(obtenirCategories);

routeur.route('/en-vedette').get(obtenirCategoriesEnVedette);

routeur.route('/:id').get(obtenirCategorie);

// Routes protégées (admin seulement)
routeur.use(proteger);
routeur.use(autoriser('admin'));

routeur.route('/').post(creerCategorie);

routeur
    .route('/:id')
    .put(validerObjectId('id'), mettreAJourCategorie)
    .delete(validerObjectId('id'), supprimerCategorie);

// Exportation du routeur
export default routeur;
