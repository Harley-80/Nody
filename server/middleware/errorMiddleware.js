// Importation du logger pour la gestion des erreurs
import logger from '../utils/logger.js';

/**
 * Middleware pour gérer les erreurs
 * @param {Error} err - Objet d'erreur
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 * @param {Function} next - Fonction pour passer au middleware suivant
 */
const gestionnaireErreurs = (err, req, res, next) => {
    let erreur = { ...err };
    erreur.message = err.message;

    // Journalisation de l'erreur
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        utilisateur: req.utilisateur ? req.utilisateur._id : 'anonyme',
    });

    // Erreur Mongoose - ObjectId incorrect
    if (err.name === 'CastError') {
        const message = 'Ressource non trouvée';
        erreur = { message, statusCode: 404 };
    }

    // Erreur Mongoose - Duplication de clé
    if (err.code === 11000) {
        const champ = Object.keys(err.keyValue)[0];
        const message = `${champ} existe déjà`;
        erreur = { message, statusCode: 400 };
    }

    // Erreur Mongoose - Validation
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        const message = messages.join(', ');
        erreur = { message, statusCode: 400 };
    }

    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token JWT invalide';
        erreur = { message, statusCode: 401 };
    }

    // Erreur JWT expiré
    if (err.name === 'TokenExpiredError') {
        const message = 'Token JWT expiré';
        erreur = { message, statusCode: 401 };
    }

    // Code de statut par défaut
    const statusCode = erreur.statusCode || err.statusCode || 500;

    // Réponse d'erreur
    res.status(statusCode).json({
        succes: false,
        erreur: erreur.message || 'Erreur serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

/**
 * Middleware pour les routes non trouvées
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 * @param {Function} next - Fonction pour passer au middleware suivant
 */
const nonTrouve = (req, res, next) => {
    const erreur = new Error(`Route non trouvée - ${req.originalUrl}`);
    res.status(404);
    next(erreur);
};

// Exportation des middlewares
export { gestionnaireErreurs, nonTrouve };
