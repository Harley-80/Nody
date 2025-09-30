// Importation des modules nécessaires
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Utilisateur from '../models/utilisateurModel.js';
import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * Middleware pour protéger les routes - vérification du JWT
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 * @param {Function} next - Fonction pour passer au middleware suivant
 */
const proteger = asyncHandler(async (req, res, next) => {
    let token;
    // Vérification de la présence du token dans le header Authorization
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Extraction du token
            token = req.headers.authorization.split(' ')[1];
            // Vérification du token avec la clé secrète
            const decode = jwt.verify(token, config.jwtSecret);
            // Récupération de l'utilisateur sans le mot de passe
            req.utilisateur = await Utilisateur.findById(decode.id).select(
                '-motDePasse'
            );

            if (!req.utilisateur) {
                res.status(401);
                throw new Error('Utilisateur non trouvé');
            }
            if (!req.utilisateur.estActif) {
                res.status(401);
                throw new Error('Compte désactivé');
            }
            next();
        } catch (error) {
            logger.error('Erreur de token :', error.message);
            res.status(401);
            throw new Error('Non autorisé, token invalide');
        }
    }
    if (!token) {
        res.status(401);
        throw new Error('Non autorisé, aucun token');
    }
});

/**
 * Middleware pour vérifier les rôles de l'utilisateur
 * @param  {...String} roles - Rôles autorisés
 * @returns {Function} Middleware express
 */
const autoriser = (...roles) => {
    return (req, res, next) => {
        if (!req.utilisateur) {
            res.status(401);
            throw new Error('Non autorisé, utilisateur non authentifié');
        }
        if (!roles.includes(req.utilisateur.role)) {
            res.status(403);
            throw new Error(
                `Rôle ${req.utilisateur.role} non autorisé à accéder à cette ressource`
            );
        }
        next();
    };
};

/**
 * Middleware pour vérifier la propriété d'une ressource
 * @param {Object} model - Modèle Mongoose
 * @param {String} paramName - Nom du paramètre dans la requête
 * @returns {Function} Middleware express
 */
const verifierPropriete = (model, paramName = 'id') => {
    return asyncHandler(async (req, res, next) => {
        try {
            const idRessource = req.params[paramName];
            const ressource = await model.findById(idRessource);
            if (!ressource) {
                res.status(404);
                throw new Error('Ressource non trouvée');
            }
            // Les administrateurs peuvent accéder à toutes les ressources
            if (req.utilisateur.role === 'admin') {
                return next();
            }
            // Vérification si l'utilisateur est propriétaire de la ressource
            const estProprietaire =
                ressource.client &&
                ressource.client.toString() === req.utilisateur._id.toString();
            if (!estProprietaire) {
                res.status(403);
                throw new Error('Non autorisé à accéder à cette ressource');
            }
            next();
        } catch (error) {
            next(error);
        }
    });
};

/**
 * Middleware pour vérifier si l'email de l'utilisateur est vérifié
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 * @param {Function} next - Fonction pour passer au middleware suivant
 */
const emailVerifieRequis = asyncHandler(async (req, res, next) => {
    if (!req.utilisateur.emailVerifie) {
        res.status(403);
        throw new Error(
            'Email non vérifié. Veuillez vérifier votre email avant de continuer.'
        );
    }
    next();
});

/**
 * Middleware pour limiter les tentatives de connexion
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 * @param {Function} next - Fonction pour passer au middleware suivant
 */
const limiteurConnexion = (req, res, next) => {
    // Implémentation simplifiée - à compléter avec Redis
    const tentativesMax = 5;
    const fenetreTempsMs = 15 * 60 * 1000; // 15 minutes
    // Ici, on pourrait utiliser Redis pour stocker les tentatives
    next();
};

// Exportation des middlewares
export {
    proteger,
    autoriser,
    verifierPropriete,
    emailVerifieRequis,
    limiteurConnexion,
};
