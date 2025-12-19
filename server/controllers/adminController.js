import asyncHandler from 'express-async-handler';
import Utilisateur from '../models/utilisateurModel.js';
import Notification from '../models/Notification.js';
import { ROLES, CONFIG_INSCRIPTION } from '../constants/roles.js';
import {
    validerTelephone,
    nettoyerTelephone,
} from '../utils/validationTelephone.js';
import logger from '../utils/logger.js';
import { DemandeService } from '../services/demandeService.js';
import HistoriqueDecision from '../models/historiqueDecisionModel.js';
import { notifierDecisionVerification } from '../services/websocketService.js';
import NotificationService from '../services/notificationService.js';

// UTILITAIRES
/**
 * Calculer la date de début en fonction de la période
 * @param {string} periode - 'aujourdhui', 'semaine', 'mois', 'trimestre', 'annee'
 * @returns {Date} Date de début de la période
 */
const calculerDateDebut = periode => {
    const maintenant = new Date();

    switch (periode) {
        case 'aujourdhui':
        case 'jour':
            return new Date(
                maintenant.getFullYear(),
                maintenant.getMonth(),
                maintenant.getDate()
            );
        case 'semaine':
            const jourSemaine = maintenant.getDay();
            const diffLundi = jourSemaine === 0 ? -6 : 1 - jourSemaine;
            const lundi = new Date(maintenant);
            lundi.setDate(maintenant.getDate() + diffLundi);
            return new Date(
                lundi.getFullYear(),
                lundi.getMonth(),
                lundi.getDate()
            );
        case 'mois':
            return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        case 'trimestre':
            const moisActuel = maintenant.getMonth();
            const debutTrimestre = Math.floor(moisActuel / 3) * 3;
            return new Date(maintenant.getFullYear(), debutTrimestre, 1);
        case 'annee':
            return new Date(maintenant.getFullYear(), 0, 1);
        default:
            return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    }
};

// SECTION 1: GESTION DES UTILISATEURS (CRUD)
/**
 * @desc    Créer un utilisateur avec un rôle spécifique (Admin seulement)
 * @route   POST /api/admin/utilisateurs
 * @access  Private/Admin
 */
const creerUtilisateur = asyncHandler(async (req, res) => {
    const {
        nom,
        prenom,
        email,
        motDePasse,
        telephone,
        genre,
        role,
        ...autresDonnees
    } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !motDePasse || !genre || !role) {
        res.status(400);
        throw new Error('Tous les champs obligatoires doivent être remplis');
    }

    // Validation du rôle
    if (!Object.values(ROLES).includes(role)) {
        res.status(400);
        throw new Error(
            `Rôle invalide. Rôles valides: ${Object.values(ROLES).join(', ')}`
        );
    }

    // Validation du genre
    if (!['Homme', 'Femme'].includes(genre)) {
        res.status(400);
        throw new Error('Le genre doit être Homme ou Femme');
    }

    // Validation du téléphone si requis pour le rôle
    const configRole = CONFIG_INSCRIPTION[role];
    if (configRole.validationTelephone && telephone) {
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

    // Créer l'utilisateur avec le rôle spécifié
    const utilisateur = new Utilisateur({
        nom,
        prenom,
        email,
        motDePasse,
        telephone: telephoneNettoye,
        genre,
        role,
        statutVerification: 'verifie',
        emailVerifie: true,
    });

    // Configuration spécifique selon le rôle
    if (role === ROLES.VENDEUR && autresDonnees.boutique) {
        utilisateur.boutique = {
            nomBoutique:
                autresDonnees.boutique.nomBoutique ||
                `${nom} ${prenom} Boutique`,
            descriptionBoutique:
                autresDonnees.boutique.descriptionBoutique || '',
            siteWeb: autresDonnees.boutique.siteWeb || '',
        };
    }

    await utilisateur.save();

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
            dateCreation: utilisateur.createdAt,
        },
        message: `Utilisateur ${CONFIG_INSCRIPTION[role].nom} créé avec succès`,
    });
});

/**
 * @desc    Obtenir tous les utilisateurs (avec pagination)
 * @route   GET /api/admin/utilisateurs
 * @access  Private/Admin
 */
const obtenirTousUtilisateurs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const recherche = req.query.recherche || '';
    const role = req.query.role || '';

    const filtre = {};

    // Filtre par recherche
    if (recherche) {
        filtre.$or = [
            { nom: { $regex: recherche, $options: 'i' } },
            { prenom: { $regex: recherche, $options: 'i' } },
            { email: { $regex: recherche, $options: 'i' } },
        ];
    }

    // Filtre par rôle
    if (role && Object.values(ROLES).includes(role)) {
        filtre.role = role;
    }

    const options = {
        page,
        limite,
        sort: { createdAt: -1 },
        select: '-motDePasse',
    };

    const resultat = await Utilisateur.paginate(filtre, options);

    res.json({
        succes: true,
        donnees: {
            utilisateurs: resultat.docs,
            pagination: {
                page: resultat.page,
                limite: resultat.limit,
                totalPages: resultat.totalPages,
                total: resultat.totalDocs,
                hasNext: resultat.hasNextPage,
                hasPrev: resultat.hasPrevPage,
            },
        },
    });
});

/**
 * @desc    Obtenir uniquement les clients avec pagination
 * @route   GET /api/admin/clients
 * @access  Private/Admin
 */
const obtenirClients = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const recherche = req.query.recherche || '';

    const filtre = {
        role: ROLES.CLIENT,
    };

    if (recherche) {
        filtre.$or = [
            { nom: { $regex: recherche, $options: 'i' } },
            { prenom: { $regex: recherche, $options: 'i' } },
            { email: { $regex: recherche, $options: 'i' } },
        ];
    }

    const options = {
        page,
        limite,
        sort: { createdAt: -1 },
        select: '-motDePasse',
    };

    const resultat = await Utilisateur.paginate(filtre, options);

    res.json({
        succes: true,
        donnees: {
            utilisateurs: resultat.docs,
            pagination: {
                page: resultat.page,
                limite: resultat.limit,
                totalPages: resultat.totalPages,
                total: resultat.totalDocs,
                hasNext: resultat.hasNextPage,
                hasPrev: resultat.hasPrevPage,
            },
        },
    });
});

/**
 * @desc    Obtenir uniquement les vendeurs avec pagination
 * @route   GET /api/admin/vendeurs
 * @access  Private/Admin
 */
const obtenirVendeurs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const recherche = req.query.recherche || '';

    const filtre = {
        role: ROLES.VENDEUR,
    };

    if (recherche) {
        filtre.$or = [
            { nom: { $regex: recherche, $options: 'i' } },
            { prenom: { $regex: recherche, $options: 'i' } },
            { email: { $regex: recherche, $options: 'i' } },
        ];
    }

    const options = {
        page,
        limite,
        sort: { createdAt: -1 },
        select: '-motDePasse',
    };

    const resultat = await Utilisateur.paginate(filtre, options);

    res.json({
        succes: true,
        donnees: {
            utilisateurs: resultat.docs,
            pagination: {
                page: resultat.page,
                limite: resultat.limit,
                totalPages: resultat.totalPages,
                total: resultat.totalDocs,
                hasNext: resultat.hasNextPage,
                hasPrev: resultat.hasPrevPage,
            },
        },
    });
});

/**
 * @desc   Obtenir tous les modérateurs
 * @route  GET /api/admin/moderateurs
 * @access Private/Admin
 */
const obtenirModerateurs = asyncHandler(async (req, res) => {
    const moderateurs = await Utilisateur.find({ role: ROLES.MODERATEUR })
        .select('-motDePasse -tokens')
        .sort({ createdAt: -1 });

    res.status(200).json({
        succes: true,
        donnees: {
            moderateurs,
            total: moderateurs.length,
        },
    });
});

/**
 * @desc   Mettre à jour un modérateur
 * @route  PUT /api/admin/moderateurs/:id
 * @access Private/Admin
 */
const mettreAJourModerateur = asyncHandler(async (req, res) => {
    const { nom, prenom, email, motDePasse, telephone, photo } = req.body;

    const moderateur = await Utilisateur.findById(req.params.id);

    if (!moderateur) {
        res.status(404);
        throw new Error('Modérateur non trouvé');
    }

    if (moderateur.role !== ROLES.MODERATEUR) {
        res.status(400);
        throw new Error("Cet utilisateur n'est pas un modérateur");
    }

    // Mise à jour des champs
    if (nom) moderateur.nom = nom;
    if (prenom) moderateur.prenom = prenom;
    if (email) moderateur.email = email;
    if (telephone) moderateur.telephone = telephone;
    if (photo) moderateur.photo = photo;

    // Ne mettre à jour le mot de passe que s'il est fourni
    if (motDePasse && motDePasse.trim() !== '') {
        moderateur.motDePasse = motDePasse;
    }

    await moderateur.save();

    res.json({
        succes: true,
        donnees: {
            _id: moderateur._id,
            nom: moderateur.nom,
            prenom: moderateur.prenom,
            email: moderateur.email,
            telephone: moderateur.telephone,
            photo: moderateur.photo,
            role: moderateur.role,
            estActif: moderateur.estActif,
        },
        message: 'Modérateur mis à jour avec succès',
    });
});

/**
 * @desc   Supprimer un modérateur
 * @route  DELETE /api/admin/moderateurs/:id
 * @access Private/Admin
 */
const supprimerModerateur = asyncHandler(async (req, res) => {
    const moderateur = await Utilisateur.findById(req.params.id);

    if (!moderateur) {
        res.status(404);
        throw new Error('Modérateur non trouvé');
    }

    if (moderateur.role !== ROLES.MODERATEUR) {
        res.status(400);
        throw new Error("Cet utilisateur n'est pas un modérateur");
    }

    // Empêcher de supprimer son propre compte
    if (moderateur._id.toString() === req.utilisateur._id.toString()) {
        res.status(400);
        throw new Error('Vous ne pouvez pas supprimer votre propre compte');
    }

    await Utilisateur.findByIdAndDelete(req.params.id);

    logger.info(
        `Modérateur supprimé: ${moderateur.email} par ${req.utilisateur.email}`
    );

    res.json({
        succes: true,
        message: 'Modérateur supprimé avec succès',
    });
});

/**
 * @desc   Changer le statut d'un modérateur (actif/inactif)
 * @route  PATCH /api/admin/moderateurs/:id/statut
 * @access Private/Admin
 */
const mettreAJourStatutModerateur = asyncHandler(async (req, res) => {
    const { estActif } = req.body;

    if (typeof estActif !== 'boolean') {
        res.status(400);
        throw new Error('Le champ estActif doit être un booléen');
    }

    const moderateur = await Utilisateur.findById(req.params.id);

    if (!moderateur) {
        res.status(404);
        throw new Error('Modérateur non trouvé');
    }

    if (moderateur.role !== ROLES.MODERATEUR) {
        res.status(400);
        throw new Error("Cet utilisateur n'est pas un modérateur");
    }

    // Empêcher de désactiver son propre compte
    if (
        !estActif &&
        moderateur._id.toString() === req.utilisateur._id.toString()
    ) {
        res.status(400);
        throw new Error('Vous ne pouvez pas désactiver votre propre compte');
    }

    moderateur.estActif = estActif;
    await moderateur.save();

    res.json({
        succes: true,
        donnees: {
            _id: moderateur._id,
            nom: moderateur.nom,
            prenom: moderateur.prenom,
            email: moderateur.email,
            role: moderateur.role,
            estActif: moderateur.estActif,
        },
        message: `Modérateur ${estActif ? 'activé' : 'désactivé'} avec succès`,
    });
});

/**
 * @desc    Obtenir un utilisateur par ID
 * @route   GET /api/admin/utilisateurs/:id
 * @access  Private/Admin
 */
const obtenirUtilisateur = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.params.id).select(
        '-motDePasse'
    );

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    res.json({
        succes: true,
        donnees: utilisateur,
    });
});

// SECTION 2: ACTIONS SUR LES UTILISATEURS
/**
 * @desc    Mettre à jour le rôle d'un utilisateur
 * @route   PUT /api/admin/utilisateurs/:id/role
 * @access  Private/Admin
 */
const mettreAJourRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!role || !Object.values(ROLES).includes(role)) {
        res.status(400);
        throw new Error(
            `Rôle invalide. Rôles valides: ${Object.values(ROLES).join(', ')}`
        );
    }

    const utilisateur = await Utilisateur.findById(req.params.id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    // Empêcher de modifier son propre rôle
    if (utilisateur._id.toString() === req.utilisateur._id.toString()) {
        res.status(400);
        throw new Error('Vous ne pouvez pas modifier votre propre rôle');
    }

    // Sauvegarder l'ancien rôle pour le log
    const ancienRole = utilisateur.role;

    utilisateur.role = role;

    // Réinitialiser le statut de vérification pour les nouveaux rôles admin/moderateur
    if ([ROLES.ADMIN, ROLES.MODERATEUR].includes(role)) {
        utilisateur.statutVerification = 'verifie';
        utilisateur.emailVerifie = true;
    }

    await utilisateur.save();

    // Log de la modification
    logger.info(
        `Rôle modifié: ${utilisateur.email} - ${ancienRole} → ${role} par ${req.utilisateur.email}`
    );

    res.json({
        succes: true,
        donnees: {
            _id: utilisateur._id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            role: utilisateur.role,
            statutVerification: utilisateur.statutVerification,
        },
        message: `Rôle de l'utilisateur modifié de ${ancienRole} à ${role}`,
    });
});

/**
 * @desc    Mettre à jour le statut de vérification d'un utilisateur
 * @route   PUT /api/admin/utilisateurs/:id/verification
 * @access  Private/Admin
 */
const mettreAJourVerification = asyncHandler(async (req, res) => {
    const { statutVerification, raisonRejet } = req.body;

    if (
        !['en_attente', 'verifie', 'rejete', 'en_revision'].includes(
            statutVerification
        )
    ) {
        res.status(400);
        throw new Error('Statut de vérification invalide');
    }

    const utilisateur = await Utilisateur.findById(req.params.id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    utilisateur.statutVerification = statutVerification;
    utilisateur.dateVerification = new Date();

    if (statutVerification === 'rejete' && raisonRejet) {
        utilisateur.raisonRejet = raisonRejet;
    } else if (statutVerification === 'verifie') {
        utilisateur.raisonRejet = undefined;
        utilisateur.emailVerifie = true;
    }

    await utilisateur.save();

    // Envoyer une notification WebSocket
    notifierDecisionVerification(utilisateur, statutVerification, raisonRejet);

    res.json({
        succes: true,
        donnees: {
            _id: utilisateur._id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            role: utilisateur.role,
            statutVerification: utilisateur.statutVerification,
            dateVerification: utilisateur.dateVerification,
            raisonRejet: utilisateur.raisonRejet,
        },
        message: `Statut de vérification mis à jour: ${statutVerification}`,
    });
});

/**
 * @desc    Activer/Désactiver un utilisateur
 * @route   PUT /api/admin/utilisateurs/:id/statut
 * @access  Private/Admin
 */
const mettreAJourStatut = asyncHandler(async (req, res) => {
    const { estActif } = req.body;

    if (typeof estActif !== 'boolean') {
        res.status(400);
        throw new Error('Le champ estActif doit être un booléen');
    }

    const utilisateur = await Utilisateur.findById(req.params.id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    // Empêcher de désactiver son propre compte
    if (
        !estActif &&
        utilisateur._id.toString() === req.utilisateur._id.toString()
    ) {
        res.status(400);
        throw new Error('Vous ne pouvez pas désactiver votre propre compte');
    }

    utilisateur.estActif = estActif;
    await utilisateur.save();

    res.json({
        succes: true,
        donnees: {
            _id: utilisateur._id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            role: utilisateur.role,
            estActif: utilisateur.estActif,
        },
        message: `Compte ${estActif ? 'activé' : 'désactivé'} avec succès`,
    });
});

/**
 * @desc    Supprimer un utilisateur
 * @route   DELETE /api/admin/utilisateurs/:id
 * @access  Private/Admin
 */
const supprimerUtilisateur = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.params.id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    // Empêcher de supprimer son propre compte
    if (utilisateur._id.toString() === req.utilisateur._id.toString()) {
        res.status(400);
        throw new Error('Vous ne pouvez pas supprimer votre propre compte');
    }

    await Utilisateur.findByIdAndDelete(req.params.id);

    // Log de la suppression
    logger.info(
        `Utilisateur supprimé: ${utilisateur.email} (${utilisateur.role}) par ${req.utilisateur.email}`
    );

    res.json({
        succes: true,
        message: 'Utilisateur supprimé avec succès',
    });
});

/**
 * @desc    Réactiver un utilisateur désactivé
 * @route   PUT /api/admin/utilisateurs/:id/reactiver
 * @access  Private/Admin
 */
const reactiverUtilisateur = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.params.id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    if (utilisateur.estActif) {
        res.status(400);
        throw new Error("L'utilisateur est déjà actif");
    }

    utilisateur.estActif = true;
    await utilisateur.save();

    logger.info(
        `Utilisateur réactivé: ${utilisateur.email} par ${req.utilisateur.email}`
    );

    res.json({
        succes: true,
        donnees: {
            _id: utilisateur._id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            role: utilisateur.role,
            estActif: utilisateur.estActif,
        },
        message: 'Utilisateur réactivé avec succès',
    });
});

// SECTION 3: GESTION DES DEMANDES DE VÉRIFICATION
/**
 * @desc    Obtenir les demandes d'inscription avec filtres avancés
 * @route   GET /api/admin/demandes
 * @access  Private/Admin
 */
const obtenirDemandesAvecFiltres = asyncHandler(async (req, res) => {
    const filtres = {
        page: req.query.page,
        limite: req.query.limite,
        role: req.query.role,
        statutVerification: req.query.statut || 'en_attente',
        dateDebut: req.query.dateDebut,
        dateFin: req.query.dateFin,
        recherche: req.query.recherche,
        tri: req.query.tri,
        ordre: req.query.ordre,
    };

    const resultat = await DemandeService.obtenirDemandes(filtres);

    res.json({
        succes: true,
        demandes: resultat.demandes || resultat.docs || [],
        pagination: {
            total: resultat.pagination?.total || resultat.totalDocs || 0,
            page:
                resultat.pagination?.page ||
                resultat.page ||
                parseInt(req.query.page) ||
                1,
            totalPages:
                resultat.pagination?.totalPages || resultat.totalPages || 1,
            limite:
                resultat.pagination?.limite ||
                resultat.limit ||
                parseInt(req.query.limite) ||
                10,
        },
    });
});

/**
 * @desc    Approuver une demande avec historique
 * @route   PUT /api/admin/demandes/:id/approuver
 * @access  Private/Admin
 */
const approuverDemandeAvecHistorique = asyncHandler(async (req, res) => {
    const utilisateur = await DemandeService.approuverDemande(
        req.params.id,
        req.utilisateur,
        req.ip,
        req.get('User-Agent')
    );

    // Envoyer une notification WebSocket à l'utilisateur ciblé
    notifierDecisionVerification(utilisateur, 'verifie');

    res.json({
        succes: true,
        donnees: {
            _id: utilisateur._id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            role: utilisateur.role,
            statutVerification: utilisateur.statutVerification,
            dateVerification: utilisateur.dateVerification,
        },
        message: `Demande de ${utilisateur.role} approuvée avec succès`,
    });
});

/**
 * @desc    Rejeter une demande avec historique
 * @route   PUT /api/admin/demandes/:id/rejeter
 * @access  Private/Admin
 */
const rejeterDemandeAvecHistorique = asyncHandler(async (req, res) => {
    const { raison } = req.body;

    if (!raison || raison.trim().length === 0) {
        res.status(400);
        throw new Error('Veuillez fournir une raison pour le rejet');
    }

    const utilisateur = await DemandeService.rejeterDemande(
        req.params.id,
        raison.trim(),
        req.utilisateur,
        req.ip,
        req.get('User-Agent')
    );

    // Envoyer une notification WebSocket
    notifierDecisionVerification(utilisateur, 'rejete', raison.trim());

    res.json({
        succes: true,
        donnees: {
            _id: utilisateur._id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            role: utilisateur.role,
            statutVerification: utilisateur.statutVerification,
            dateVerification: utilisateur.dateVerification,
            raisonRejet: utilisateur.raisonRejet,
        },
        message: `Demande de ${utilisateur.role} rejetée avec succès`,
    });
});

/**
 * @desc    Réapprouver une demande précédemment rejetée
 * @route   PUT /api/admin/demandes/:id/reapprouver
 * @access  Private/Admin
 */
const reapprouverDemande = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.params.id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    if (utilisateur.statutVerification !== 'rejete') {
        res.status(400);
        throw new Error(
            'Seuls les utilisateurs rejetés peuvent être réapprouvés'
        );
    }

    const ancienStatut = utilisateur.statutVerification;

    utilisateur.statutVerification = 'verifie';
    utilisateur.emailVerifie = true;
    utilisateur.dateVerification = new Date();
    utilisateur.raisonRejet = undefined;
    utilisateur.estActif = true;

    await utilisateur.save();

    await HistoriqueDecision.loggerDecision({
        utilisateurCible: utilisateur._id,
        emailUtilisateurCible: utilisateur.email,
        roleUtilisateurCible: utilisateur.role,
        adminDecision: req.utilisateur._id,
        emailAdminDecision: req.utilisateur.email,
        typeDecision: 'reapprobation',
        ancienStatut,
        nouveauStatut: 'verifie',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: {
            role: utilisateur.role,
            boutique: utilisateur.boutique,
        },
    });

    try {
        await NotificationService.envoyerEmailApprobation(utilisateur);
    } catch (emailError) {
        logger.error('Erreur envoi email réapprobation:', emailError);
    }

    logger.info(
        `Utilisateur réapprouvé: ${utilisateur.email} par ${req.utilisateur.email}`
    );

    res.json({
        succes: true,
        donnees: {
            _id: utilisateur._id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            role: utilisateur.role,
            statutVerification: utilisateur.statutVerification,
            dateVerification: utilisateur.dateVerification,
        },
        message: `Utilisateur ${utilisateur.role} réapprouvé avec succès`,
    });
});

// SECTION 4: STATISTIQUES ET RAPPORTS
/**
 * @desc    Obtenir les statistiques des utilisateurs
 * @route   GET /api/admin/statistiques/utilisateurs
 * @access  Private/Admin
 */
const obtenirStatistiquesUtilisateurs = asyncHandler(async (req, res) => {
    const totalUtilisateurs = await Utilisateur.countDocuments();

    const utilisateursParRole = await Utilisateur.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 },
            },
        },
    ]);

    const nouveauxUtilisateursMois = await Utilisateur.countDocuments({
        createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
    });

    const utilisateursVerifies = await Utilisateur.countDocuments({
        statutVerification: 'verifie',
    });

    const statistiques = {
        total: totalUtilisateurs,
        parRole: utilisateursParRole.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {}),
        nouveauxCeMois: nouveauxUtilisateursMois,
        verifies: utilisateursVerifies,
        nonVerifies: totalUtilisateurs - utilisateursVerifies,
    };

    res.json({
        succes: true,
        donnees: statistiques,
    });
});

/**
 * @desc    Obtenir les statistiques avancées des demandes
 * @route   GET /api/admin/demandes/statistiques
 * @access  Private/Admin
 */
const obtenirStatistiquesAvancees = asyncHandler(async (req, res) => {
    const statistiques = await DemandeService.obtenirStatistiquesDemandes();

    res.json({
        succes: true,
        donnees: statistiques,
    });
});

/**
 * @desc    Obtenir les statistiques du dashboard avec filtre par période
 * @route   GET /api/admin/statistiques/dashboard
 * @access  Private/Admin
 */
const obtenirStatistiquesDashboard = asyncHandler(async (req, res) => {
    const { periode, dateDebut, dateFin } = req.query;

    // Calculer les dates de début et fin selon la période
    let dateDebutCalculee, dateFinCalculee;

    if (periode && periode !== 'personnalise') {
        dateDebutCalculee = calculerDateDebut(periode);
        dateFinCalculee = new Date();
    } else if (dateDebut && dateFin) {
        dateDebutCalculee = new Date(dateDebut);
        dateFinCalculee = new Date(dateFin);
        dateFinCalculee.setHours(23, 59, 59, 999);
    } else {
        dateDebutCalculee = calculerDateDebut('mois');
        dateFinCalculee = new Date();
    }

    // Filtre MongoDB
    const filtreDate = {
        createdAt: {
            $gte: dateDebutCalculee,
            $lte: dateFinCalculee,
        },
    };

    // Import des modèles nécessaires
    const Commande = (await import('../models/commandeModel.js')).default;
    const Produit = (await import('../models/produitModel.js')).default;

    // 1. Chiffre d'affaires de la période
    const commandesPeriode = await Commande.find({
        ...filtreDate,
        statut: { $ne: 'annulée' },
    });

    const chiffreAffaires = commandesPeriode.reduce(
        (total, cmd) => total + (cmd.montantTotal || 0),
        0
    );

    // 2. Nombre de commandes
    const nombreCommandes = commandesPeriode.length;
    const commandesEnAttente = await Commande.countDocuments({
        ...filtreDate,
        statut: 'en_attente',
    });

    // 3. Nouveaux clients
    const nouveauxClients = await Utilisateur.countDocuments({
        ...filtreDate,
        role: ROLES.CLIENT,
    });

    // 4. Produits populaires
    const produitsPopulaires = await Commande.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: dateDebutCalculee,
                    $lte: dateFinCalculee,
                },
                statut: { $ne: 'annulée' },
            },
        },
        { $unwind: '$produits' },
        {
            $group: {
                _id: '$produits.produit',
                totalVendu: { $sum: '$produits.quantite' },
                revenu: {
                    $sum: {
                        $multiply: ['$produits.prix', '$produits.quantite'],
                    },
                },
            },
        },
        { $sort: { totalVendu: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'produits',
                localField: '_id',
                foreignField: '_id',
                as: 'infoProduit',
            },
        },
        { $unwind: '$infoProduit' },
        {
            $project: {
                _id: 1,
                nom: '$infoProduit.nom',
                image: '$infoProduit.images.principale',
                totalVendu: 1,
                revenu: 1,
            },
        },
    ]);

    // 5. Évolution des ventes (7 derniers jours)
    const evolutionVentes = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(dateFinCalculee);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const dateFin = new Date(date);
        dateFin.setHours(23, 59, 59, 999);

        const ventesDuJour = await Commande.countDocuments({
            createdAt: { $gte: date, $lte: dateFin },
            statut: { $ne: 'annulée' },
        });

        evolutionVentes.push({
            date: date.toISOString().split('T')[0],
            ventes: ventesDuJour,
        });
    }

    // 6. Chiffre d'affaires par mois (6 derniers mois)
    const evolutionCA = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date(dateFinCalculee);
        date.setMonth(date.getMonth() - i);

        const moisDebut = new Date(date.getFullYear(), date.getMonth(), 1);
        const moisFin = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0,
            23,
            59,
            59
        );

        const commandesMois = await Commande.find({
            createdAt: { $gte: moisDebut, $lte: moisFin },
            statut: { $ne: 'annulée' },
        });

        const caMois = commandesMois.reduce(
            (total, cmd) => total + (cmd.montantTotal || 0),
            0
        );

        evolutionCA.push({
            mois: moisDebut.toLocaleDateString('fr-FR', {
                month: 'short',
                year: 'numeric',
            }),
            montant: caMois,
        });
    }

    // 7. Répartition par catégories
    const repartitionCategories = await Commande.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: dateDebutCalculee,
                    $lte: dateFinCalculee,
                },
                statut: { $ne: 'annulée' },
            },
        },
        { $unwind: '$produits' },
        {
            $lookup: {
                from: 'produits',
                localField: 'produits.produit',
                foreignField: '_id',
                as: 'infoProduit',
            },
        },
        { $unwind: '$infoProduit' },
        {
            $lookup: {
                from: 'categories',
                localField: 'infoProduit.categorie',
                foreignField: '_id',
                as: 'infoCategorie',
            },
        },
        { $unwind: '$infoCategorie' },
        {
            $group: {
                _id: '$infoCategorie.nom',
                total: {
                    $sum: {
                        $multiply: ['$produits.prix', '$produits.quantite'],
                    },
                },
            },
        },
        { $sort: { total: -1 } },
        { $limit: 6 },
    ]);

    // 8. Indicateurs de performance
    const totalProduits = await Produit.countDocuments();
    const produitsStockFaible = await Produit.countDocuments({
        stock: { $lt: 10, $gt: 0 },
    });
    const produitsRupture = await Produit.countDocuments({ stock: 0 });

    const tauxConversion =
        nouveauxClients > 0 ? (nombreCommandes / nouveauxClients) * 100 : 0;
    const panierMoyen =
        nombreCommandes > 0 ? chiffreAffaires / nombreCommandes : 0;

    // 9. Commandes récentes
    const commandesRecentes = await Commande.find(filtreDate)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('client', 'nom prenom email')
        .select('numeroCommande montantTotal statut createdAt client');

    // 10. Nouveaux clients
    const clientsRecents = await Utilisateur.find({
        ...filtreDate,
        role: ROLES.CLIENT,
    })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('nom prenom email createdAt');

    // Réponse finale
    res.json({
        success: true,
        data: {
            periode: {
                type: periode || 'mois',
                dateDebut: dateDebutCalculee,
                dateFin: dateFinCalculee,
            },
            statistiquesGlobales: {
                chiffreAffaires: {
                    total: chiffreAffaires,
                },
                commandes: {
                    total: nombreCommandes,
                    enAttente: commandesEnAttente,
                },
                clients: {
                    nouveauxPeriode: nouveauxClients,
                    total: await Utilisateur.countDocuments({
                        role: ROLES.CLIENT,
                    }),
                },
                produits: {
                    actifs: totalProduits,
                    stockFaible: produitsStockFaible,
                    enRupture: produitsRupture,
                },
                performance: {
                    tauxConversion: tauxConversion.toFixed(2),
                    panierMoyen: panierMoyen.toFixed(0),
                },
            },
            graphiques: {
                evolutionVentes,
                evolutionCA,
                repartitionCategories: repartitionCategories.map(cat => ({
                    nom: cat._id,
                    valeur: cat.total,
                })),
            },
            tableaux: {
                produitsPopulaires,
                commandesRecentes,
                nouveauxClients: clientsRecents,
            },
        },
    });
});

// SECTION 5: HISTORIQUE ET AUDIT
/**
 * @desc    Obtenir l'historique des décisions
 * @route   GET /api/admin/historique-decisions
 * @access  Private/Admin
 */
const obtenirHistoriqueDecisions = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const typeDecision = req.query.type;
    const dateDebut = req.query.dateDebut;
    const dateFin = req.query.dateFin;

    const query = {};

    if (typeDecision) {
        query.typeDecision = typeDecision;
    }

    if (dateDebut || dateFin) {
        query.dateDecision = {};
        if (dateDebut) query.dateDecision.$gte = new Date(dateDebut);
        if (dateFin)
            query.dateDecision.$lte = new Date(dateFin + 'T23:59:59.999Z');
    }

    const options = {
        page,
        limite,
        sort: { dateDecision: -1 },
        populate: [
            { path: 'utilisateurCible', select: 'nom prenom email role' },
            { path: 'adminDecision', select: 'nom prenom email' },
        ],
    };

    const resultat = await HistoriqueDecision.paginate(query, options);

    res.json({
        succes: true,
        donnees: {
            historique: resultat.docs,
            pagination: {
                page: resultat.page,
                limite: resultat.limit,
                totalPages: resultat.totalPages,
                total: resultat.totalDocs,
                hasNext: resultat.hasNextPage,
                hasPrev: resultat.hasPrevPage,
            },
        },
    });
});

/**
 * @desc    Obtenir l'historique d'un utilisateur spécifique
 * @route   GET /api/admin/utilisateurs/:id/historique
 * @access  Private/Admin
 */
const obtenirHistoriqueUtilisateur = asyncHandler(async (req, res) => {
    const historique = await DemandeService.obtenirHistoriqueUtilisateur(
        req.params.id
    );

    res.json({
        succes: true,
        donnees: historique,
    });
});

// SECTION 6: GESTION DES NOTIFICATIONS
/**
 * @desc    Récupérer les notifications
 * @route   GET /api/admin/notifications
 * @access  Private/Admin
 */
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json({
        succes: true,
        donnees: notifications,
    });
});

/**
 * @desc    Marquer une notification comme lue
 * @route   PUT /api/admin/notifications/:id/lire
 * @access  Private/Admin
 */
const marquerNotificationCommeLue = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
        id,
        { lue: true },
        { new: true }
    );

    if (!notification) {
        res.status(404);
        throw new Error('Notification introuvable');
    }

    res.status(200).json({
        succes: true,
        donnees: notification,
        message: 'Notification marquée comme lue',
    });
});

/**
 * @desc    Marquer toutes les notifications comme lues
 * @route   PUT /api/admin/notifications/tout-lire
 * @access  Private/Admin
 */
const marquerToutesNotificationsCommeLues = asyncHandler(async (req, res) => {
    const resultat = await Notification.updateMany(
        { lue: false },
        { lue: true }
    );

    res.status(200).json({
        succes: true,
        donnees: {
            modifiedCount: resultat.modifiedCount,
        },
        message: `${resultat.modifiedCount} notifications marquées comme lues`,
    });
});

/**
 * @desc    Supprimer une notification
 * @route   DELETE /api/admin/notifications/:id
 * @access  Private/Admin
 */
const supprimerNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification introuvable');
    }

    res.status(200).json({
        succes: true,
        message: 'Notification supprimée avec succès',
    });
});

// EXPORTATION DES FONCTIONS
export {
    creerUtilisateur,
    obtenirTousUtilisateurs,
    obtenirUtilisateur,
    obtenirClients,
    obtenirVendeurs,
    obtenirModerateurs,
    mettreAJourModerateur,
    supprimerModerateur,
    mettreAJourStatutModerateur,
    mettreAJourRole,
    mettreAJourVerification,
    mettreAJourStatut,
    supprimerUtilisateur,
    obtenirStatistiquesUtilisateurs,
    obtenirDemandesAvecFiltres,
    obtenirStatistiquesAvancees,
    approuverDemandeAvecHistorique,
    rejeterDemandeAvecHistorique,
    reapprouverDemande,
    reactiverUtilisateur,
    obtenirHistoriqueDecisions,
    obtenirHistoriqueUtilisateur,
    getNotifications,
    marquerNotificationCommeLue,
    marquerToutesNotificationsCommeLues,
    supprimerNotification,
    obtenirStatistiquesDashboard,
};