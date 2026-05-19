import express from 'express';
import Produit from '../models/produitModel.js';
import {
    uploadMemory,
    uploadProduits,
    handleMulterError,
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
import {
    obtenirAvisProduit,
    posterAvis,
} from '../controllers/avisController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js'; // ← CORRECTION ICI
import {
    validerObjectId,
    validerProduit,
    validerPagination,
} from '../middleware/validationMiddleware.js';

const routeur = express.Router();

// ===== RECHERCHE PAR IMAGE =====
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

// ===== ROUTES PUBLIQUES =====
routeur.route('/').get(validerPagination, obtenirProduits);
routeur.route('/stats').get(obtenirStatistiquesProduits);
routeur.route('/populaires').get(obtenirProduitsPopulaires);
routeur.route('/nouveaux').get(obtenirNouveauxProduits);

// ===== ROUTES AVIS (PUBLIQUES) =====
routeur.route('/:id/avis').get(validerObjectId('id'), obtenirAvisProduit);

// ===== ROUTES PRODUITS SIMILAIRES (PUBLIQUES) =====
routeur
    .route('/:id/similaires')
    .get(validerObjectId('id'), obtenirProduitsSimilaires);

// ===== DÉTAILS PRODUIT (PUBLIC) =====
routeur.route('/:id').get(obtenirProduit);

// ===== ROUTES PROTÉGÉES (AUTHENTIFICATION REQUISE) =====
routeur.use(proteger);

// Poster un avis (authentifié)
routeur.route('/:id/avis').post(validerObjectId('id'), posterAvis);

// ===== ROUTES VENDEUR/ADMIN =====
// Créer un produit
routeur
    .route('/')
    .post(
        autoriser('admin', 'vendeur'),
        uploadProduits.array('images', 5),
        handleMulterError,
        creerProduit
    );

// Modifier/Supprimer un produit
routeur
    .route('/:id')
    .put(
        autoriser('admin', 'vendeur'),
        validerObjectId('id'),
        uploadProduits.array('images', 6),
        handleMulterError,
        mettreAJourProduit
    )
    .delete(
        autoriser('admin', 'vendeur'),
        validerObjectId('id'),
        supprimerProduit
    );

export default routeur;
