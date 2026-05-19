import express from 'express';
import {
    obtenirBannieresActives,
    obtenirToutesBannieres,
    obtenirBanniereParId,
    creerBanniere,
    modifierBanniere,
    supprimerBanniere,
    approuverBanniere,
    rejeterBanniere,
    incrementerVueBanniere,
    incrementerClicBanniere,
    obtenirStatistiquesBannieres,
} from '../controllers/banniereController.js';

import { proteger, autoriser } from '../middleware/authMiddleware.js';
import { verifierCredits } from '../middleware/creditsMiddleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Pour obtenir le chemin du répertoire actuel (équivalent à __dirname en CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// CONFIGURATION MULTER - UPLOAD D'IMAGES
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/bannieres');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const ext = path.extname(file.originalname);
        cb(null, `banniere_${uniqueSuffix}${ext}`);
    },
});

// Filtre pour n'accepter que les fichiers image (extensions et types MIME)
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
                'Seuls les fichiers image (JPEG, PNG, GIF, WEBP) sont autorisés'
            )
        );
    }
};

// Limite de taille de fichier : 5MB
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
    },
});

// ROUTES PUBLIQUES
/**
 * @route   GET /api/bannieres/actives
 * @desc    Obtenir toutes les bannières actives
 * @query   type (hero|promo|pub), position (haut|milieu|bas|sidebar)
 * @access  Public
 */
router.get('/actives', obtenirBannieresActives);

/**
 * @route   POST /api/bannieres/:id/vue
 * @desc    Incrémenter le compteur de vues
 * @access  Public
 */
router.post('/:id/vue', incrementerVueBanniere);

/**
 * @route   POST /api/bannieres/:id/clic
 * @desc    Incrémenter le compteur de clics
 * @access  Public
 */
router.post('/:id/clic', incrementerClicBanniere);

// ROUTES PROTÉGÉES - LECTURE
/**
 * @route   GET /api/bannieres
 * @desc    Obtenir toutes les bannières (avec filtres)
 * @query   page, limite, type, statut, estActif, search
 * @access  Privé (Admin, Modérateur, Vendeur)
 */
router.get(
    '/',
    proteger,
    autoriser('admin', 'moderateur', 'vendeur'),
    obtenirToutesBannieres
);

/**
 * @route   GET /api/bannieres/stats
 * @desc    Obtenir les statistiques des bannières
 * @access  Privé (Admin, Modérateur, Vendeur)
 */
router.get(
    '/stats',
    proteger,
    autoriser('admin', 'moderateur', 'vendeur'),
    obtenirStatistiquesBannieres
);

/**
 * @route   GET /api/bannieres/:id
 * @desc    Obtenir une bannière par ID
 * @access  Privé (Admin, Modérateur, Créateur)
 */
router.get(
    '/:id',
    proteger,
    autoriser('admin', 'moderateur', 'vendeur'),
    obtenirBanniereParId
);

// ROUTES PROTÉGÉES - CRÉATION
/**
 * @route   POST /api/bannieres
 * @desc    Créer une nouvelle bannière
 * @body    titre, sousTitre, description, lien, texteBouton, type, position, ordre, etc.
 * @file    image (required)
 * @access  Privé (Admin, Modérateur, Vendeur)
 */
router.post(
    '/',
    proteger,
    autoriser('admin', 'moderateur', 'vendeur'),
    verifierCredits, // Middleware de vérification des crédits
    upload.single('image'),
    creerBanniere
);

// ROUTES PROTÉGÉES - MODIFICATION
/**
 * @route   PUT /api/bannieres/:id
 * @desc    Modifier une bannière
 * @body    Champs à modifier
 * @file    image (optional)
 * @access  Privé (Admin, Modérateur, Créateur)
 */
router.put(
    '/:id',
    proteger,
    autoriser('admin', 'moderateur', 'vendeur'),
    upload.single('image'),
    modifierBanniere
);

/**
 * @route   PUT /api/bannieres/:id/approuver
 * @desc    Approuver une bannière
 * @access  Privé (Admin, Modérateur)
 */
router.put(
    '/:id/approuver',
    proteger,
    autoriser('admin', 'moderateur'),
    approuverBanniere
);

/**
 * @route   PUT /api/bannieres/:id/rejeter
 * @desc    Rejeter une bannière
 * @body    raison (required)
 * @access  Privé (Admin, Modérateur)
 */
router.put(
    '/:id/rejeter',
    proteger,
    autoriser('admin', 'moderateur'),
    rejeterBanniere
);

// ROUTES PROTÉGÉES - SUPPRESSION
/**
 * @route   DELETE /api/bannieres/:id
 * @desc    Supprimer une bannière
 * @access  Privé (Admin, Créateur)
 */
router.delete(
    '/:id',
    proteger,
    autoriser('admin', 'vendeur'),
    supprimerBanniere
);

export default router;