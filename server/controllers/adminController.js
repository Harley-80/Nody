import asyncHandler from 'express-async-handler';
import Utilisateur from '../models/utilisateurModel.js';
import { ROLES, CONFIG_INSCRIPTION } from '../constants/roles.js';
import {validerTelephone,nettoyerTelephone,} from '../utils/validationTelephone.js';
import logger from '../utils/logger.js';
import { DemandeService } from '../services/demandeService.js';
import HistoriqueDecision from '../models/historiqueDecisionModel.js';

// --- Fonctions de gestion des Utilisateurs (Existantes) ---

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
        statutVerification: 'verifie', // Les utilisateurs créés par admin sont automatiquement vérifiés
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

    // Log de la création
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
        emailVerifie: true,
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

// --- Nouvelles Fonctions de gestion des Demandes et Historique ---

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
        donnees: resultat,
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

// Exportation de toutes les fonctions
export {
    creerUtilisateur,
    obtenirTousUtilisateurs,
    obtenirUtilisateur,
    mettreAJourRole,
    mettreAJourVerification,
    mettreAJourStatut,
    supprimerUtilisateur,
    obtenirStatistiquesUtilisateurs,
    obtenirDemandesAvecFiltres,
    obtenirStatistiquesAvancees,
    approuverDemandeAvecHistorique,
    rejeterDemandeAvecHistorique,
    obtenirHistoriqueDecisions,
    obtenirHistoriqueUtilisateur,
};
