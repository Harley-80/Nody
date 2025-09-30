// Importation des modules nécessaires
import express from 'express';
import {
    creerCommande,
    obtenirMesCommandes,
    obtenirCommande,
    mettreAJourStatutCommande,
    annulerCommande,
    obtenirToutesCommandes,
} from '../controllers/commandesController.js';
import {
    proteger,
    autoriser,
    verifierPropriete,
} from '../middleware/authMiddleware.js';
import {
    validerObjectId,
    validerCommande,
} from '../middleware/validationMiddleware.js';
import Commande from '../models/commandeModel.js';

const routeur = express.Router();

// Toutes les routes sont protégées
routeur.use(proteger);

// Routes utilisateur
routeur
    .route('/')
    .post(validerCommande, creerCommande)
    .get(obtenirMesCommandes);

routeur
    .route('/:id')
    .get(
        validerObjectId('id'),
        verifierPropriete(Commande, 'id'),
        obtenirCommande
    );

routeur
    .route('/:id/annuler')
    .put(
        validerObjectId('id'),
        verifierPropriete(Commande, 'id'),
        annulerCommande
    );

// Routes admin
routeur.route('/admin/toutes').get(autoriser('admin'), obtenirToutesCommandes);

routeur
    .route('/admin/:id/statut')
    .put(autoriser('admin'), validerObjectId('id'), mettreAJourStatutCommande);

// Exportation du routeur
export default routeur;
