import express from 'express';
import {
    obtenirCategories,
    obtenirCategorie,
    creerCategorie,
    mettreAJourCategorie,
    supprimerCategorie,
    obtenirCategoriesEnVedette,
    rechercherCategories,
    obtenirCategoriesRacines,
    obtenirBreadcrumb,
    obtenirStatistiques,
    obtenirSousCategories,
} from '../controllers/categorieController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';
import { validerObjectId } from '../middleware/validationMiddleware.js';
import { uploadCategories } from '../middleware/uploadMiddleware.js';

const routeur = express.Router();

// Routes publiques
routeur.route('/').get(obtenirCategories);
routeur.route('/en-vedette').get(obtenirCategoriesEnVedette);
routeur.route('/racines').get(obtenirCategoriesRacines);
routeur.route('/search').get(rechercherCategories);
routeur.route('/:id').get(obtenirCategorie);
routeur.route('/:id/breadcrumb').get(obtenirBreadcrumb);
routeur.route('/:parentId/sous-categories').get(obtenirSousCategories);

// Routes protégées (admin uniquement)
routeur.use(proteger);
routeur.use(autoriser('admin'));

routeur.route('/statistiques').get(obtenirStatistiques);
routeur.route('/').post(uploadCategories.single('image'), creerCategorie);

routeur
    .route('/:id')
    .put(
        validerObjectId('id'),
        uploadCategories.single('image'),
        mettreAJourCategorie
    )
    .delete(validerObjectId('id'), supprimerCategorie);

export default routeur;