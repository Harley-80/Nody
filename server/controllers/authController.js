// Importation des modules nécessaires
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import Utilisateur from '../models/utilisateurModel.js';
import logger from '../utils/logger.js';
import config from '../config/env.js';
import envoyerEmail from '../services/emailService.js';
import {
    validerTelephone,
    nettoyerTelephone,
} from '../utils/validationTelephone.js';

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
    const { nom, prenom, email, motDePasse, telephone, genre } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !motDePasse || !genre) {
        res.status(400);
        throw new Error('Tous les champs obligatoires doivent être remplis');
    }

    // Validation du genre
    if (!['Homme', 'Femme'].includes(genre)) {
        res.status(400);
        throw new Error('Le genre doit être Homme ou Femme');
    }

    // Validation du téléphone
    if (telephone) {
        const validationTelephone = validerTelephone(telephone);
        if (!validationTelephone.valide) {
            res.status(400);
            throw new Error(validationTelephone.erreur);
        }
    }

    // Vérifier si l'utilisateur existe déjà
    const utilisateurExiste = await Utilisateur.findOne({ email });
    if (utilisateurExiste) {
        res.status(400);
        throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Nettoyer le téléphone
    const telephoneNettoye = telephone
        ? nettoyerTelephone(telephone)
        : undefined;

    // Créer l'utilisateur
    const utilisateur = await Utilisateur.create({
        nom,
        prenom,
        email,
        motDePasse,
        telephone: telephoneNettoye,
        genre,
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
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email: utilisateur.email,
                telephone: utilisateur.telephone,
                genre: utilisateur.genre,
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
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email: utilisateur.email,
                telephone: utilisateur.telephone,
                genre: utilisateur.genre,
                role: utilisateur.role,
                emailVerifie: utilisateur.emailVerifie,
                token,
            },
            message: 'Connexion réussie',
        });
    } else {
        res.status(401).json({
            succes: false,
            erreur: 'Email ou mot de passe invalide',
        });
        return;
    }
});

/**
 * @desc    Déconnexion d'un utilisateur
 * @route   POST /api/auth/deconnexion
 * @access  Private
 */
const deconnexion = asyncHandler(async (req, res) => {
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

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

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
    const { nom, prenom, telephone, dateNaissance, genre } = req.body;

    // Validation du téléphone si fourni
    if (telephone) {
        const validationTelephone = validerTelephone(telephone);
        if (!validationTelephone.valide) {
            res.status(400);
            throw new Error(validationTelephone.erreur);
        }
    }

    // Validation du genre si fourni
    if (genre && !['Homme', 'Femme'].includes(genre)) {
        res.status(400);
        throw new Error('Le genre doit être Homme ou Femme');
    }

    // Nettoyer le téléphone
    const telephoneMisAJour = telephone
        ? nettoyerTelephone(telephone)
        : undefined;

    // Construire l'objet de mise à jour
    const champsAMettreAJour = {};
    if (nom) champsAMettreAJour.nom = nom;
    if (prenom) champsAMettreAJour.prenom = prenom;
    if (telephone !== undefined)
        champsAMettreAJour.telephone = telephoneMisAJour;
    if (dateNaissance) champsAMettreAJour.dateNaissance = dateNaissance;
    if (genre) champsAMettreAJour.genre = genre;

    const utilisateur = await Utilisateur.findByIdAndUpdate(
        req.utilisateur._id,
        champsAMettreAJour,
        {
            new: true,
            runValidators: true,
        }
    ).select('-motDePasse');

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    res.json({
        succes: true,
        donnees: utilisateur,
        message: 'Profil mis à jour avec succès',
    });
});

/**
 * @desc    Changer le mot de passe de l'utilisateur connecté
 * @route   PUT /api/auth/changerMotDePasse
 * @access  Private
 */
const changerMotDePasse = asyncHandler(async (req, res) => {
    const { motDePasseActuel, nouveauMotDePasse } = req.body;

    if (!motDePasseActuel || !nouveauMotDePasse) {
        res.status(400);
        throw new Error(
            'Veuillez fournir le mot de passe actuel et le nouveau mot de passe'
        );
    }

    const utilisateur = await Utilisateur.findById(req.utilisateur._id).select(
        '+motDePasse'
    );

    if (
        utilisateur &&
        (await utilisateur.comparerMotDePasse(motDePasseActuel))
    ) {
        utilisateur.motDePasse = nouveauMotDePasse;
        await utilisateur.save();

        res.json({
            succes: true,
            message: 'Mot de passe mis à jour avec succès',
        });
    } else {
        res.status(401);
        throw new Error('Mot de passe actuel invalide');
    }
});

/**
 * @desc    Demande de réinitialisation de mot de passe
 * @route   POST /api/auth/motDePasseOublie
 * @access  Public
 */
const motDePasseOublie = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const utilisateur = await Utilisateur.findOne({ email });

    if (!utilisateur) {
        return res.json({
            succes: true,
            message:
                'Si un compte associé à cet email existe, un email de réinitialisation a été envoyé.',
        });
    }

    // Générer le token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const jetonHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Définir l'expiration (1 heure)
    utilisateur.jetonReinitialisationMotDePasse = jetonHash;
    utilisateur.expirationJetonReinitialisationMotDePasse =
        Date.now() + 3600000;

    await utilisateur.save({ validateBeforeSave: false });

    // Créer l'URL de réinitialisation
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reinitialiserMotDePasse/${resetToken}`;

    try {
        await envoyerEmail({
            a: utilisateur.email,
            sujet: 'Réinitialisation de votre mot de passe Nody',
            modele: 'reinitialisation_motdepasse',
            contexte: {
                nom: utilisateur.prenom,
                lienReinitialisation: resetURL,
            },
        });

        res.json({
            succes: true,
            message:
                'Un email de réinitialisation de mot de passe a été envoyé.',
        });
    } catch (error) {
        utilisateur.jetonReinitialisationMotDePasse = undefined;
        utilisateur.expirationJetonReinitialisationMotDePasse = undefined;
        await utilisateur.save({ validateBeforeSave: false });

        logger.error('Erreur envoi email de réinitialisation:', error);
        res.status(500);
        throw new Error(
            "Erreur lors de l'envoi de l'email de réinitialisation."
        );
    }
});

/**
 * @desc    Réinitialisation du mot de passe avec le jeton
 * @route   PUT /api/auth/reinitialiserMotDePasse/:resetToken
 * @access  Public
 */
const reinitialiserMotDePasse = asyncHandler(async (req, res) => {
    const { motDePasse } = req.body;
    const { resetToken } = req.params;

    if (!motDePasse) {
        res.status(400);
        throw new Error('Veuillez fournir un nouveau mot de passe');
    }

    // Hacher le jeton pour comparaison
    const jetonHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const utilisateur = await Utilisateur.findOne({
        jetonReinitialisationMotDePasse: jetonHash,
        expirationJetonReinitialisationMotDePasse: { $gt: Date.now() },
    });

    if (!utilisateur) {
        res.status(400);
        throw new Error('Jeton invalide ou expiré');
    }

    // Mettre à jour le mot de passe et effacer les champs de réinitialisation
    utilisateur.motDePasse = motDePasse;
    utilisateur.jetonReinitialisationMotDePasse = undefined;
    utilisateur.expirationJetonReinitialisationMotDePasse = undefined;

    await utilisateur.save();

    // Générer un nouveau token pour connexion automatique
    const token = genererToken(utilisateur._id);

    res.json({
        succes: true,
        message: 'Mot de passe réinitialisé avec succès.',
        donnees: { token },
    });
});

/**
 * @desc    Vérification d'email avec le jeton
 * @route   GET /api/auth/verifierEmail/:verificationToken
 * @access  Public
 */
const verifierEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params;

    const utilisateur = await Utilisateur.findOne({
        jetonVerificationEmail: verificationToken,
    });

    if (!utilisateur) {
        res.status(400);
        throw new Error('Lien de vérification invalide ou déjà utilisé');
    }

    // Valider l'email et effacer le jeton
    utilisateur.emailVerifie = true;
    utilisateur.jetonVerificationEmail = undefined;
    await utilisateur.save({ validateBeforeSave: false });

    res.json({
        succes: true,
        message: 'Votre email a été vérifié avec succès.',
    });
});

/**
 * @desc    Renvoyer l'email de vérification
 * @route   POST /api/auth/renvoyerVerification
 * @access  Private
 */
const renvoyerVerification = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    if (utilisateur.emailVerifie) {
        res.status(400);
        throw new Error("L'email est déjà vérifié.");
    }

    // Générer un nouveau jeton de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    utilisateur.jetonVerificationEmail = verificationToken;
    await utilisateur.save({ validateBeforeSave: false });

    try {
        await envoyerEmail({
            a: utilisateur.email,
            sujet: 'Vérifiez votre email Nody',
            modele: 'verification_email',
            contexte: {
                nom: utilisateur.prenom,
                lienVerification: `${req.protocol}://${req.get('host')}/api/auth/verifierEmail/${verificationToken}`,
            },
        });

        res.json({
            succes: true,
            message: 'Un nouvel email de vérification a été envoyé.',
        });
    } catch (error) {
        logger.error('Erreur envoi email de vérification:', error);
        res.status(500);
        throw new Error("Erreur lors de l'envoi de l'email de vérification.");
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
