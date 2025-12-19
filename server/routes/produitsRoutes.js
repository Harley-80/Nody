import express from 'express';
import Produit from '../models/produitModel.js';
import {
    uploadMemory,
    uploadProduits,
} from '../middleware/uploadMiddleware.js';
import { rechercherProduitsParImage } from '../services/imageSearchService.js';
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
    obtenirStatistiquesProduits,
} from '../controllers/produitsController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';
import {
    validerObjectId,
    validerProduit,
    validerPagination,
} from '../middleware/validationMiddleware.js';

const routeur = express.Router();

routeur.post(
    '/recherche-image',
    uploadMemory.single('image'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res
                    .status(400)
                    .json({ message: 'Aucune image fournie' });
            }

            console.log('Recherche par image démarrée');
            console.log(
                'Fichier reçu:',
                req.file.originalname,
                req.file.size,
                'bytes'
            );

            const produits = await rechercherProduitsParImage(req.file.buffer);

            console.log(`${produits.length} produits trouvés`);

            res.json({
                success: true,
                message: `${produits.length} produits similaires trouvés`,
                produits: produits,
                analyse:
                    produits.length > 0
                        ? {
                            meilleurScore: produits[0].scoreRecherche,
                            nombreResultats: produits.length,
                        }
                        : null,
            });
        } catch (error) {
            console.error('Erreur recherche image:', error);
            res.status(500).json({
                message: 'Erreur lors de la recherche par image',
                error: error.message,
            });
        }
    }
);

// ROUTES PUBLIQUES - ORDRE CRITIQUE
routeur.route('/').get(validerPagination, obtenirProduits);

routeur.route('/stats').get(obtenirStatistiquesProduits);

routeur.route('/populaires').get(obtenirProduitsPopulaires);

routeur.route('/nouveaux').get(obtenirNouveauxProduits);

routeur
    .route('/:id/similaires')
    .get(validerObjectId('id'), obtenirProduitsSimilaires);

routeur.route('/:id').get(obtenirProduit);

// ROUTES PROTÉGÉES
routeur.use(proteger);

routeur.route('/:id/avis').post(validerObjectId('id'), ajouterAvis);

// CRÉATION PRODUIT AVEC UPLOAD D'IMAGES
routeur
    .route('/')
    .post(
        autoriser('admin', 'vendeur'),
        uploadProduits.array('images', 5),
        creerProduit
    );

// MODIFICATION/SUPPRESSION PRODUIT
routeur
    .route('/:id')
    .put(
        autoriser('admin', 'vendeur'),
        validerObjectId('id'),
        uploadProduits.array('images', 5),
        mettreAJourProduit
    )
    .delete(
        autoriser('admin', 'vendeur'),
        validerObjectId('id'),
        supprimerProduit
    );

export default routeur;