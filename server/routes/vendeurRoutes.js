import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    getStatistiques,
    getMesProduits,
    creerProduit,
    modifierProduit,
    supprimerProduit,
    getMesCommandes,
    mettreAJourStatutProduit,
    getMaBoutique,
    mettreAJourBoutique,
    getProduit, 
} from '../controllers/vendeurController.js';
import { proteger } from '../middleware/authMiddleware.js';
import { estVendeur, estVerifie } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Configuration Multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Définir le dossier de destination selon le type d'upload
        if (file.fieldname === 'logo' || file.fieldname === 'banniere') {
            cb(null, 'uploads/boutiques/');
        } else {
            cb(null, 'uploads/produits/');
        }
    },
    filename: function (req, file, cb) {
        // Générer un nom unique pour chaque fichier
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                '-' +
                uniqueSuffix +
                path.extname(file.originalname)
        );
    },
});

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(
            new Error(
                'Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'
            )
        );
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max par fichier
    },
    fileFilter: fileFilter,
});

// Routes protégées vendeur
router.use(proteger);
router.use(estVendeur);

// Statistiques
router.get('/statistiques', getStatistiques);

// Gestion des produits
router
    .route('/produits')
    .get(getMesProduits)
    .post(upload.array('images', 6), creerProduit); // MODIFIÉ - Accepte jusqu'à 6 images

router
    .route('/produits/:id')
    .get(getProduit) // NOUVEAU - Récupérer un produit spécifique
    .put(
        upload.fields([{ name: 'nouvellesImages', maxCount: 6 }]),
        modifierProduit
    ) // MODIFIÉ - Upload de nouvelles images
    .delete(supprimerProduit);

// Gestion des commandes
router.get('/commandes', getMesCommandes);
router.put(
    '/commandes/:commandeId/produits/:produitId',
    mettreAJourStatutProduit
);

// Gestion de la boutique
router
    .route('/boutique')
    .get(getMaBoutique)
    .put(
        upload.fields([
            { name: 'logo', maxCount: 1 },
            { name: 'banniere', maxCount: 1 },
        ]),
        mettreAJourBoutique
    ); // MODIFIÉ - Upload logo et bannière

export default router;