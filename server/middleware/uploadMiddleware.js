import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configuration pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer DEUX dossiers uploads
const uploadsAvatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
const uploadsProduitsDir = path.join(__dirname, '..', 'uploads', 'produits');

if (!fs.existsSync(uploadsAvatarsDir)) {
    fs.mkdirSync(uploadsAvatarsDir, { recursive: true });
}

if (!fs.existsSync(uploadsProduitsDir)) {
    fs.mkdirSync(uploadsProduitsDir, { recursive: true });
}

// 1. DÉFINIR fileFilter EN PREMIER (avant toute utilisation)
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.'
            ),
            false
        );
    }
};

// 2. CONFIGURATION 1 : STOCKAGE EN MÉMOIRE (pour recherche par image)
const memoryStorage = multer.memoryStorage();

// 3. CONFIGURATION 2 : STOCKAGE SUR DISQUE (pour avatars)
const diskStorageAvatars = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsAvatarsDir);
    },
    filename: (req, file, cb) => {
        // Vérifier si req.utilisateur existe
        if (req.utilisateur && req.utilisateur._id) {
            const uniqueName = `${req.utilisateur._id}_${Date.now()}${path.extname(file.originalname)}`;
            cb(null, uniqueName);
        } else {
            // Fallback pour les utilisateurs non authentifiés
            const uniqueName = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
            cb(null, uniqueName);
        }
    },
});

// 4. CONFIGURATION 3 : STOCKAGE SUR DISQUE (pour produits)
const diskStorageProduits = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsProduitsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `produit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

// 5. CONFIGURATION 4 : STOCKAGE SUR DISQUE (pour catégories)
const uploadsCategoriesDir = path.join(
    __dirname,
    '..',
    'uploads',
    'categories'
);

// Créer le dossier si il n'existe pas
if (!fs.existsSync(uploadsCategoriesDir)) {
    fs.mkdirSync(uploadsCategoriesDir, { recursive: true });
}

const diskStorageCategories = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsCategoriesDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `cat_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

// 6. CRÉER LES UPLOADERS APRÈS avoir tout défini

export const uploadMemory = multer({
    storage: memoryStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadAvatars = multer({
    storage: diskStorageAvatars,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadProduits = multer({
    storage: diskStorageProduits,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadCategories = multer({
    storage: diskStorageCategories,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Export par défaut (utilise memory storage)
const upload = uploadMemory;

// 7. MIDDLEWARE DE GESTION DES ERREURS MULTER
export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                succes: false,
                erreur: 'Fichier trop volumineux. Taille maximale : 5 MB',
            });
        }
        return res.status(400).json({
            succes: false,
            erreur: `Erreur d'upload: ${err.message}`,
        });
    } else if (err) {
        return res.status(400).json({
            succes: false,
            erreur: err.message,
        });
    }
    next();
};

export default upload;