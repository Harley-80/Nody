import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import Utilisateur from '../models/utilisateurModel.js';
import logger from '../utils/logger.js';
import config from '../config/env.js';
import envoyerEmail, {
    envoyerEmailNotificationAdmin,
} from '../services/emailService.js'; 
import {
    validerTelephone,
    nettoyerTelephone,
} from '../utils/validationTelephone.js';
// Importations pour la gestion des rôles
import {
    ROLES,
    CONFIG_INSCRIPTION,
    CODES_INVITATION,
} from '../constants/roles.js';

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

// --- NOUVELLES FONCTIONS DE LOGIQUE D'INSCRIPTION PAR RÔLE ---

/**
 * Valide l'inscription selon le rôle
 * @param {Object} donnees - Données de la requête
 * @param {string} role - Rôle de l'utilisateur
 */
const validerInscriptionParRole = (donnees, role) => {
    const configRole = CONFIG_INSCRIPTION[role];

    if (!configRole) {
        throw new Error('Rôle invalide');
    }

    // 1. Vérifier les champs obligatoires
    const champsManquants = configRole.champsObligatoires.filter(
        champ => !donnees[champ]
    );
    if (champsManquants.length > 0) {
        throw new Error(
            `Champs obligatoires manquants: ${champsManquants.join(', ')}`
        );
    }

    // 2. Vérification du code d'invitation pour les rôles restreints
    if (configRole.codeInvitation && !donnees.codeInvitation) {
        throw new Error("Code d'invitation requis pour ce rôle");
    }

    // 3. Validation spécifique du téléphone
    if (configRole.validationTelephone && donnees.telephone) {
        const validationTelephone = validerTelephone(donnees.telephone);
        if (!validationTelephone.valide) {
            throw new Error(validationTelephone.erreur);
        }
    }

    return true;
};

/**
 * Traiter l'inscription selon le rôle (ajout de données spécifiques, envoi d'emails staff)
 * @param {Object} utilisateur - Instance Mongoose de l'utilisateur
 * @param {string} role - Rôle de l'utilisateur
 * @param {Object} donnees - Données supplémentaires (nomBoutique, etc.)
 */
const traiterInscriptionParRole = async (utilisateur, role, donnees) => {
    const configRole = CONFIG_INSCRIPTION[role];

    // Configuration spécifique selon le rôle
    switch (role) {
        case ROLES.VENDEUR:
            utilisateur.boutique = {
                nomBoutique:
                    donnees.nomBoutique ||
                    `${utilisateur.nom} ${utilisateur.prenom} Boutique`,
                descriptionBoutique: donnees.descriptionBoutique || '',
                siteWeb: donnees.siteWeb || '',
            };
            utilisateur.statutVerification = 'en_attente';
            break;

        case ROLES.ADMIN:
        case ROLES.MODERATEUR:
            utilisateur.statutVerification = 'en_attente';
            // Logique d'approbation manuelle (Utilisation de la fonction dédiée)
            try {
                await envoyerEmailNotificationAdmin({
                    nom: `${utilisateur.prenom} ${utilisateur.nom}`,
                    email: utilisateur.email,
                    role: configRole.nom,
                    date: new Date().toLocaleDateString('fr-FR'),
                });
            } catch (error) {
                logger.error('Erreur envoi email notification admin:', error);
            }
            break;

        case ROLES.CLIENT:
            utilisateur.statutVerification = 'verifie';
            break;
    }

    return utilisateur;
};

// --- CONTRÔLEURS MODIFIÉS OU AJOUTÉS ---

/**
 * @desc 	Inscription d'un utilisateur avec gestion des rôles
 * @route 	 POST /api/auth/inscription
 * @access 	Public
 */
const inscription = asyncHandler(async (req, res) => {
    const {
        nom,
        prenom,
        email,
        motDePasse,
        telephone,
        genre,
        role,
        codeInvitation,
        ...autresDonnees
    } = req.body;

    // Déterminer le rôle (par défaut: client)
    const roleInscription = role || ROLES.CLIENT;

    try {
        // Valider l'inscription selon le rôle
        validerInscriptionParRole(
            {
                nom,
                prenom,
                email,
                motDePasse,
                telephone,
                genre,
                codeInvitation,
            },
            roleInscription
        );
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }

    // Validation du genre
    if (!['Homme', 'Femme'].includes(genre)) {
        res.status(400);
        throw new Error('Le genre doit être Homme ou Femme');
    }

    // Vérifier si l'utilisateur existe déjà
    const utilisateurExiste = await Utilisateur.findOne({ email });
    if (utilisateurExiste) {
        res.status(400);
        throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Vérifier le code d'invitation pour les rôles restreints
    if (CONFIG_INSCRIPTION[roleInscription].codeInvitation) {
        const codeValide = CODES_INVITATION[roleInscription];
        if (!codeValide || codeInvitation !== codeValide.code) {
            res.status(400);
            throw new Error("Code d'invitation invalide");
        }
    }

    // Nettoyer le téléphone
    const telephoneNettoye = telephone
        ? nettoyerTelephone(telephone)
        : undefined;

    // Créer l'utilisateur de base
    const utilisateur = new Utilisateur({
        nom,
        prenom,
        email,
        motDePasse,
        telephone: telephoneNettoye,
        genre,
        role: roleInscription,
        codeInvitation: codeInvitation || undefined,
    });

    // Traiter l'inscription selon le rôle
    await traiterInscriptionParRole(
        utilisateur,
        roleInscription,
        autresDonnees
    );

    // Sauvegarder l'utilisateur
    await utilisateur.save();

    // Générer le token
    const token = genererToken(utilisateur._id);

    // Envoyer un email de bienvenue selon le rôle
    try {
        const configRole = CONFIG_INSCRIPTION[roleInscription];
        let modeleEmail = 'bienvenue';
        let sujetEmail = 'Bienvenue sur Nody - Vérifiez votre email';

        if (roleInscription === ROLES.VENDEUR) {
            modeleEmail = 'bienvenue_vendeur';
            sujetEmail = 'Bienvenue en tant que vendeur sur Nody';
        } else if (
            roleInscription === ROLES.ADMIN ||
            roleInscription === ROLES.MODERATEUR
        ) {
            modeleEmail = 'bienvenue_staff';
            sujetEmail = `Bienvenue en tant que ${configRole.nom} sur Nody`;
        }

        await envoyerEmail({
            a: utilisateur.email,
            sujet: sujetEmail,
            modele: modeleEmail,
            contexte: {
                nom: utilisateur.prenom,
                role: configRole.nom,
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
            statutVerification: utilisateur.statutVerification,
            emailVerifie: utilisateur.emailVerifie,
            estActif: utilisateur.estActif,
            token,
            // CORRECTION: Propriétés calculées pour le frontend
            nomComplet: `${utilisateur.nom} ${utilisateur.prenom}`,
            isAdmin: utilisateur.role === ROLES.ADMIN,
        },
        message: `Inscription réussie en tant que ${CONFIG_INSCRIPTION[roleInscription].nom}.`,
    });
});

/**
 * @desc 	Inscription spécifique pour vendeur
 * @route 	 POST /api/auth/inscription/vendeur
 * @access 	Public
 */
const inscriptionVendeur = asyncHandler(async (req, res) => {
    const { nomBoutique, descriptionBoutique, siteWeb, ...donneesUtilisateur } =
        req.body;

    // Forcer le rôle vendeur et ajouter les données spécifiques
    req.body.role = ROLES.VENDEUR;
    req.body = { ...req.body, nomBoutique, descriptionBoutique, siteWeb };

    await inscription(req, res);
});

/**
 * @desc 	Inscription avec code d'invitation (Admin/Modérateur)
 * @route 	 POST /api/auth/inscription/invitation
 * @access 	Public
 */
const inscriptionAvecInvitation = asyncHandler(async (req, res) => {
    const { codeInvitation, ...donneesUtilisateur } = req.body;

    // Déterminer le rôle basé sur le code d'invitation
    let role = ROLES.CLIENT;
    Object.entries(CODES_INVITATION).forEach(([roleCode, configCode]) => {
        if (configCode.code === codeInvitation) {
            role = roleCode;
        }
    });

    if (role === ROLES.CLIENT) {
        res.status(400);
        throw new Error("Code d'invitation invalide");
    }

    req.body.role = role;
    req.body.codeInvitation = codeInvitation;

    await inscription(req, res);
});

// --- CONTRÔLEURS EXISTANTS (AVEC AMÉLIORATIONS) ---

/**
 * @desc 	Connexion d'un utilisateur
 * @route 	 POST /api/auth/connexion
 * @access 	Public
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

        // Vérifier si le compte est vérifié selon le rôle
        if (
            utilisateur.role === ROLES.VENDEUR &&
            utilisateur.statutVerification !== 'verifie'
        ) {
            res.status(403);
            throw new Error(
                'Votre compte vendeur est en attente de vérification.'
            );
        }

        if (
            [ROLES.ADMIN, ROLES.MODERATEUR].includes(utilisateur.role) &&
            utilisateur.statutVerification !== 'verifie'
        ) {
            res.status(403);
            throw new Error("Votre compte est en attente d'approbation.");
        }

        // Mettre à jour le compteur de connexions
        await utilisateur.incrementerNombreConnexions();

        const token = genererToken(utilisateur._id);

        // CORRECTION: Réponse structurée avec toutes les données nécessaires
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
                statutVerification: utilisateur.statutVerification,
                emailVerifie: utilisateur.emailVerifie,
                estActif: utilisateur.estActif,
                token,
                // CORRECTION: Propriétés calculées pour le frontend
                nomComplet: `${utilisateur.nom} ${utilisateur.prenom}`,
                isAdmin: utilisateur.role === ROLES.ADMIN,
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
 * @desc 	Déconnexion d'un utilisateur
 * @route 	 POST /api/auth/deconnexion
 * @access 	Private
 */
const deconnexion = asyncHandler(async (req, res) => {
    res.json({
        succes: true,
        message: 'Déconnexion réussie',
    });
});

/**
 * @desc 	Récupérer le profil de l'utilisateur connecté
 * @route 	 GET /api/auth/moi
 * @access 	Private
 */
const obtenirMoi = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    // CORRECTION: Ajouter les propriétés calculées
    const userResponse = utilisateur.toObject();
    userResponse.nomComplet = `${utilisateur.nom} ${utilisateur.prenom}`;
    userResponse.isAdmin = utilisateur.role === ROLES.ADMIN;

    res.json({
        succes: true,
        donnees: userResponse,
    });
});

/**
 * @desc 	Mettre à jour le profil de l'utilisateur connecté
 * @route 	 PUT /api/auth/moi
 * @access 	Private
 */
const mettreAJourMoi = asyncHandler(async (req, res) => {
    const { nom, prenom, telephone, dateNaissance, genre, ...autresDonnees } =
        req.body;

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

    // Mise à jour des données spécifiques aux vendeurs
    if (req.utilisateur.role === ROLES.VENDEUR && autresDonnees.boutique) {
        champsAMettreAJour.boutique = {
            ...req.utilisateur.boutique,
            ...autresDonnees.boutique,
        };
    }

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

    // CORRECTION: Ajouter les propriétés calculées
    const userResponse = utilisateur.toObject();
    userResponse.nomComplet = `${utilisateur.nom} ${utilisateur.prenom}`;
    userResponse.isAdmin = utilisateur.role === ROLES.ADMIN;

    res.json({
        succes: true,
        donnees: userResponse,
        message: 'Profil mis à jour avec succès',
    });
});

/**
 * @desc 	Changer le mot de passe de l'utilisateur connecté
 * @route 	 PUT /api/auth/changer-mot-de-passe
 * @access 	Private
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
 * @desc 	Demande de réinitialisation de mot de passe
 * @route 	 POST /api/auth/mot-de-passe-oublie
 * @access 	Public
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
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reinitialiser-mot-de-passe/${resetToken}`;

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
 * @desc 	Réinitialisation du mot de passe avec le jeton
 * @route 	 PUT /api/auth/reinitialiser-mot-de-passe/:resetToken
 * @access 	Public
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
 * @desc 	Vérification d'email avec le jeton
 * @route 	 GET /api/auth/verifier-email/:verificationToken
 * @access 	Public
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
 * @desc 	Renvoyer l'email de vérification
 * @route 	 POST /api/auth/renvoyer-verification
 * @access 	Private
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

    // Créer le lien de vérification
    const lienVerification = `${req.protocol}://${req.get('host')}/api/auth/verifier-email/${verificationToken}`;

    try {
        await envoyerEmail({
            a: utilisateur.email,
            sujet: 'Vérifiez votre email Nody',
            modele: 'verification_email',
            contexte: {
                nom: utilisateur.prenom,
                lienVerification: lienVerification,
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
    inscriptionVendeur,
    inscriptionAvecInvitation,
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