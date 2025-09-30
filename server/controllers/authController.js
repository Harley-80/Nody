// Importation des modules nécessaires
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Utilisateur from '../models/utilisateurModel.js';
import logger from '../utils/logger.js';
import config from '../config/env.js';
import envoyerEmail from '../services/emailService.js';

/**
 * Génère un token JWT pour un utilisateur
 * @param {String} id - ID de l'utilisateur
 * @returns {String} Token JWT
 */
const genererToken = id => {
    return jwt.sign({ id }, config.jwtSecret, {
        expiresIn: config.jwtExpire,
    });
};

/**
 * @desc    Inscription d'un utilisateur
 * @route   POST /api/auth/inscription
 * @access  Public
 */
const inscription = asyncHandler(async (req, res) => {
    const { prenom, nom, email, motDePasse } = req.body;
    // Vérifier si l'utilisateur existe déjà
    const utilisateurExiste = await Utilisateur.findOne({ email });
    if (utilisateurExiste) {
        res.status(400);
        throw new Error('Un utilisateur avec cet email existe déjà');
    }
    // Créer l'utilisateur
    const utilisateur = await Utilisateur.create({
        prenom,
        nom,
        email,
        motDePasse,
    });
    if (utilisateur) {
        // Générer le token
        const token = genererToken(utilisateur._id);
        // Envoyer un email de vérification
        try {
            await envoyerEmail({
                a: utilisateur.email,
                sujet: 'Bienvenue sur Nody - Vérifiez votre email',
                modele: 'bienvenue',
                contexte: {
                    nom: utilisateur.prenom,
                    jetonVerification: utilisateur.jetonVerificationEmail,
                },
            });
        } catch (error) {
            logger.error('Erreur envoi email de bienvenue:', error);
        }
        res.status(201).json({
            succes: true,
            donnees: {
                _id: utilisateur._id,
                prenom: utilisateur.prenom,
                nom: utilisateur.nom,
                email: utilisateur.email,
                role: utilisateur.role,
                emailVerifie: utilisateur.emailVerifie,
                token,
            },
            message:
                'Inscription réussie. Un email de vérification a été envoyé.',
        });
    } else {
        res.status(400);
        throw new Error('Données utilisateur invalides');
    }
});

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/auth/connexion
 * @access  Public
 */
const connexion = asyncHandler(async (req, res) => {
    const { email, motDePasse } = req.body;
    // Vérifier l'email et le mot de passe
    const utilisateur = await Utilisateur.findOne({ email }).select(
        '+motDePasse'
    );
    if (utilisateur && (await utilisateur.comparerMotDePasse(motDePasse))) {
        if (!utilisateur.estActif) {
            res.status(401);
            throw new Error('Compte désactivé. Contactez le support.');
        }
        // Mettre à jour le compteur de connexions
        await utilisateur.incrementerNombreConnexions();
        const token = genererToken(utilisateur._id);
        res.json({
            succes: true,
            donnees: {
                _id: utilisateur._id,
                prenom: utilisateur.prenom,
                nom: utilisateur.nom,
                email: utilisateur.email,
                role: utilisateur.role,
                emailVerifie: utilisateur.emailVerifie,
                token,
            },
            message: 'Connexion réussie',
        });
    } else {
        res.status(401);
        throw new Error('Email ou mot de passe invalide');
    }
});

/**
 * @desc    Déconnexion d'un utilisateur
 * @route   POST /api/auth/deconnexion
 * @access  Private
 */
const deconnexion = asyncHandler(async (req, res) => {
    // Avec JWT, la déconnexion est gérée côté client
    res.json({
        succes: true,
        message: 'Déconnexion réussie',
    });
});

/**
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @route   GET /api/auth/moi
 * @access  Private
 */
const obtenirMoi = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);
    res.json({
        succes: true,
        donnees: utilisateur,
    });
});

/**
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @route   PUT /api/auth/moi
 * @access  Private
 */
const mettreAJourMoi = asyncHandler(async (req, res) => {
    const { prenom, nom, telephone, dateNaissance, genre } = req.body;
    const utilisateur = await Utilisateur.findByIdAndUpdate(
        req.utilisateur._id,
        {
            prenom,
            nom,
            telephone,
            dateNaissance,
            genre,
        },
        {
            new: true,
            runValidators: true,
        }
    );
    res.json({
        succes: true,
        donnees: utilisateur,
        message: 'Profil mis à jour avec succès',
    });
});

/**
 * @desc    Changer le mot de passe de l'utilisateur connecté
 * @route   PUT /api/auth/changer-mot-de-passe
 * @access  Private
 */
const changerMotDePasse = asyncHandler(async (req, res) => {
    const { motDePasseActuel, nouveauMotDePasse } = req.body;
    const utilisateur = await Utilisateur.findById(req.utilisateur._id).select(
        '+motDePasse'
    );
    // Vérifier le mot de passe actuel
    if (!(await utilisateur.comparerMotDePasse(motDePasseActuel))) {
        res.status(401);
        throw new Error('Mot de passe actuel incorrect');
    }
    // Mettre à jour le mot de passe
    utilisateur.motDePasse = nouveauMotDePasse;
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Mot de passe changé avec succès',
    });
});

/**
 * @desc    Demande de réinitialisation du mot de passe
 * @route   POST /api/auth/mot-de-passe-oublie
 * @access  Public
 */
const motDePasseOublie = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const utilisateur = await Utilisateur.findOne({ email });
    if (!utilisateur) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe
        return res.json({
            succes: true,
            message:
                'Si votre email existe, un lien de réinitialisation a été envoyé',
        });
    }
    // Générer le token de réinitialisation
    const jetonReinitialisation = jwt.sign(
        { id: utilisateur._id },
        config.jwtSecret,
        {
            expiresIn: '1h',
        }
    );
    utilisateur.jetonReinitialisationMotDePasse = jetonReinitialisation;
    utilisateur.expirationJetonReinitialisationMotDePasse =
        Date.now() + 3600000; // 1 heure
    await utilisateur.save();
    // Envoyer l'email
    try {
        await envoyerEmail({
            a: utilisateur.email,
            sujet: 'Réinitialisation de votre mot de passe Nody',
            modele: 'reinitialiser-mot-de-passe',
            contexte: {
                nom: utilisateur.prenom,
                jetonReinitialisation,
            },
        });
        res.json({
            succes: true,
            message:
                'Si votre email existe, un lien de réinitialisation a été envoyé',
        });
    } catch (error) {
        logger.error('Erreur envoi email réinitialisation:', error);
        res.status(500);
        throw new Error("Erreur lors de l'envoi de l'email");
    }
});

/**
 * @desc    Réinitialiser le mot de passe
 * @route   PUT /api/auth/reinitialiser-mot-de-passe/:token
 * @access  Public
 */
const reinitialiserMotDePasse = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { motDePasse } = req.body;
    // Vérifier le token
    let decode;
    try {
        decode = jwt.verify(token, config.jwtSecret);
    } catch (error) {
        res.status(400);
        throw new Error('Token invalide ou expiré');
    }
    const utilisateur = await Utilisateur.findOne({
        _id: decode.id,
        jetonReinitialisationMotDePasse: token,
        expirationJetonReinitialisationMotDePasse: { $gt: Date.now() },
    });
    if (!utilisateur) {
        res.status(400);
        throw new Error('Token invalide ou expiré');
    }
    // Mettre à jour le mot de passe
    utilisateur.motDePasse = motDePasse;
    utilisateur.jetonReinitialisationMotDePasse = undefined;
    utilisateur.expirationJetonReinitialisationMotDePasse = undefined;
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Mot de passe réinitialisé avec succès',
    });
});

/**
 * @desc    Vérifier l'email
 * @route   GET /api/auth/verifier-email/:token
 * @access  Public
 */
const verifierEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const utilisateur = await Utilisateur.findOne({
        jetonVerificationEmail: token,
        expirationJetonVerificationEmail: { $gt: Date.now() },
    });
    if (!utilisateur) {
        res.status(400);
        throw new Error('Token de vérification invalide ou expiré');
    }
    utilisateur.emailVerifie = true;
    utilisateur.jetonVerificationEmail = undefined;
    utilisateur.expirationJetonVerificationEmail = undefined;
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Email vérifié avec succès',
    });
});

/**
 * @desc    Renvoyer l'email de vérification
 * @route   POST /api/auth/renvoyer-verification
 * @access  Private
 */
const renvoyerVerification = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);
    if (utilisateur.emailVerifie) {
        res.status(400);
        throw new Error('Email déjà vérifié');
    }
    // Générer un nouveau token
    const jetonVerification = jwt.sign(
        { id: utilisateur._id },
        config.jwtSecret,
        {
            expiresIn: '24h',
        }
    );
    utilisateur.jetonVerificationEmail = jetonVerification;
    utilisateur.expirationJetonVerificationEmail = Date.now() + 86400000; // 24 heures
    await utilisateur.save();
    // Envoyer l'email
    try {
        await envoyerEmail({
            a: utilisateur.email,
            sujet: 'Vérifiez votre email Nody',
            modele: 'verifier-email',
            contexte: {
                nom: utilisateur.prenom,
                jetonVerification,
            },
        });
        res.json({
            succes: true,
            message: 'Email de vérification envoyé',
        });
    } catch (error) {
        logger.error('Erreur envoi email vérification:', error);
        res.status(500);
        throw new Error("Erreur lors de l'envoi de l'email");
    }
});

// Exportation des contrôleurs
export {
    inscription,
    connexion,
    deconnexion,
    obtenirMoi,
    mettreAJourMoi,
    changerMotDePasse,
    motDePasseOublie,
    reinitialiserMotDePasse,
    verifierEmail,
    renvoyerVerification,
};
