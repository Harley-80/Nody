// Importation des modules nécessaires
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from '../config/env.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// S'assurer que le dossier de téléchargement existe
const dossierTelechargement = path.join(__dirname, '../uploads');
if (!fs.existsSync(dossierTelechargement)) {
    fs.mkdirSync(dossierTelechargement, { recursive: true });
}

/**
 * Configuration du stockage des fichiers
 */
const stockage = multer.diskStorage({
    destination: (req, fichier, cb) => {
        let dossier = 'general';

        if (req.baseUrl.includes('produits')) {
            dossier = 'produits';
        } else if (req.baseUrl.includes('utilisateurs')) {
            dossier = 'utilisateurs';
        } else if (req.baseUrl.includes('categories')) {
            dossier = 'categories';
        }
        const cheminDossier = path.join(dossierTelechargement, dossier);
        if (!fs.existsSync(cheminDossier)) {
            fs.mkdirSync(cheminDossier, { recursive: true });
        }
        cb(null, cheminDossier);
    },
    filename: (req, fichier, cb) => {
        const suffixeUnique =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(fichier.originalname);
        cb(null, fichier.fieldname + '-' + suffixeUnique + extension);
    },
});

/**
 * Filtre des fichiers autorisés
 */
const filtreFichier = (req, fichier, cb) => {
    const typesAutorises = /jpeg|jpg|png|gif|webp/;
    const extension = typesAutorises.test(
        path.extname(fichier.originalname).toLowerCase()
    );
    const typeMime = typesAutorises.test(fichier.mimetype);
    if (typeMime && extension) {
        return cb(null, true);
    } else {
        cb(new Error('Seules les images sont autorisées'), false);
    }
};

/**
 * Configuration de multer
 */
const telechargement = multer({
    storage: stockage,
    limits: {
        fileSize: config.tailleMaxFichier,
    },
    fileFilter: filtreFichier,
});

/**
 * Middleware pour gérer plusieurs fichiers
 * @param {String} nomChamp - Nom du champ de fichier
 * @param {Number} nombreMax - Nombre maximum de fichiers
 * @returns {Function} Middleware multer
 */
const telechargerPlusieurs = (nomChamp, nombreMax = 5) => {
    return telechargement.array(nomChamp, nombreMax);
};

/**
 * Middleware pour gérer un seul fichier
 * @param {String} nomChamp - Nom du champ de fichier
 * @returns {Function} Middleware multer
 */
const telechargerUnique = nomChamp => {
    return telechargement.single(nomChamp);
};

/**
 * Middleware pour gérer des champs spécifiques
 * @param {Array} champs - Liste des champs à télécharger
 * @returns {Function} Middleware multer
 */
const telechargerChamps = champs => {
    return telechargement.fields(champs);
};

/**
 * Supprimer un fichier
 * @param {String} cheminFichier - Chemin du fichier à supprimer
 */
const supprimerFichier = cheminFichier => {
    const cheminComplet = path.join(dossierTelechargement, cheminFichier);

    if (fs.existsSync(cheminComplet)) {
        fs.unlinkSync(cheminComplet);
        logger.info(`Fichier supprimé: ${cheminFichier}`);
    }
};

/**
 * Obtenir l'URL d'un fichier
 * @param {String} cheminFichier - Chemin du fichier
 * @returns {String} URL complète du fichier
 */
const obtenirUrlFichier = cheminFichier => {
    if (!cheminFichier) return null;
    return `${config.urlServeur}/uploads/${cheminFichier}`;
};

// Exportation des fonctions
export {
    telechargerPlusieurs,
    telechargerUnique,
    telechargerChamps,
    supprimerFichier,
    obtenirUrlFichier,
};
