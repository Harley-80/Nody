import Banniere from '../models/banniereModel.js';
import { debiterCredits } from '../services/creditsService.js';
import asyncHandler from 'express-async-handler';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @desc    Obtenir toutes les bannières actives (PUBLIC)
 * @route   GET /api/bannieres/actives
 * @access  Public
 */
export const obtenirBannieresActives = asyncHandler(async (req, res) => {
    const { type, position } = req.query;
    const maintenant = new Date();

    // Construire la requête pour n'obtenir que les bannières actives et approuvées
    const query = {
        estActif: true,
        statut: 'approuve',
        $or: [
            { dateDebut: { $lte: maintenant }, dateFin: { $gte: maintenant } },
            { dateDebut: { $lte: maintenant }, dateFin: null },
            { dateDebut: null, dateFin: { $gte: maintenant } },
            { dateDebut: null, dateFin: null },
        ],
    };

    // Filtrer par type et position si spécifié
    if (type) query.type = type;
    if (position) query.position = position;

    const bannieres = await Banniere.find(query)
        .populate('creePar', 'nom prenom boutique.nom')
        .populate('categories', 'nom slug')
        .sort({ ordre: 1, createdAt: -1 })
        .lean();

    // Formater les URLs des images
    const bannieresFormatees = bannieres.map(banniere => ({
        ...banniere,
        image: banniere.image.startsWith('http')
            ? banniere.image
            : `${process.env.BASE_URL}${banniere.image}`,
        imageMobile: banniere.imageMobile
            ? banniere.imageMobile.startsWith('http')
                ? banniere.imageMobile
                : `${process.env.BASE_URL}${banniere.imageMobile}`
            : null,
    }));
    // Incrémenter les vues pour chaque bannière active
    res.status(200).json({
        succes: true,
        donnees: bannieresFormatees,
        total: bannieresFormatees.length,
    });
});

/**
 * @desc    Obtenir toutes les bannières (ADMIN/MODÉRATEUR)
 * @route   GET /api/bannieres
 * @access  Privé (Admin, Modérateur)
 */
export const obtenirToutesBannieres = asyncHandler(async (req, res) => {
    const { page = 1, limite = 20, type, statut, estActif, search } = req.query;

    const query = {};

    if (type) query.type = type;
    if (statut) query.statut = statut;
    if (estActif !== undefined) query.estActif = estActif === 'true';

    if (search) {
        query.$or = [
            { titre: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    // Si l'utilisateur est vendeur, ne montrer que ses bannières
    if (req.utilisateur.role === 'vendeur') {
        query.creePar = req.utilisateur._id;
        query.type = 'pub'; // Les vendeurs ne voient que les pubs
    }

    // Obtenir le nombre total de documents pour la pagination
    const totalDocuments = await Banniere.countDocuments(query);
    const bannieres = await Banniere.find(query)
        .populate('creePar', 'nom prenom role boutique.nom')
        .populate('modifiePar', 'nom prenom')
        .populate('categories', 'nom slug')
        .sort({ ordre: 1, createdAt: -1 })
        .limit(limite * 1)
        .skip((page - 1) * limite);

    res.status(200).json({
        succes: true,
        donnees: bannieres,
        page: Number(page),
        totalPages: Math.ceil(totalDocuments / limite),
        total: totalDocuments,
    });
});

/**
 * @desc    Obtenir une bannière par ID
 * @route   GET /api/bannieres/:id
 * @access  Privé (Admin, Modérateur, Créateur)
 */
export const obtenirBanniereParId = asyncHandler(async (req, res) => {
    const banniere = await Banniere.findById(req.params.id)
        .populate('creePar', 'nom prenom role boutique.nom')
        .populate('modifiePar', 'nom prenom')
        .populate('categories', 'nom slug');

    if (!banniere) {
        res.status(404);
        throw new Error('Bannière non trouvée');
    }

    // Vérifier les permissions
    if (
        req.utilisateur.role === 'vendeur' &&
        banniere.creePar._id.toString() !== req.utilisateur._id.toString()
    ) {
        res.status(403);
        throw new Error('Accès non autorisé');
    }

    res.status(200).json({
        succes: true,
        donnees: banniere,
    });
});

/**
 * @desc    Créer une nouvelle bannière
 * @route   POST /api/bannieres
 * @access  Privé (Admin, Modérateur, Vendeur)
 */
export const creerBanniere = asyncHandler(async (req, res) => {
    const {
        titre,
        sousTitre,
        description,
        lien,
        texteBouton,
        type,
        position,
        ordre,
        alignement,
        dateDebut,
        dateFin,
        cible,
        categories,
    } = req.body;

    // Validation des permissions
    if (req.utilisateur.role === 'vendeur' && type !== 'pub') {
        res.status(403);
        throw new Error(
            'Les vendeurs ne peuvent créer que des bannières publicitaires'
        );
    }

    // Vérifier qu'une image est uploadée
    if (!req.file) {
        res.status(400);
        throw new Error('Une image est requise');
    }

    // Construire le chemin de l'image
    const imagePath = `/uploads/bannieres/${req.file.filename}`;

    // Créer la bannière
    const banniere = await Banniere.create({
        titre,
        sousTitre,
        description,
        image: imagePath,
        lien,
        texteBouton,
        type: type || 'hero',
        position: position || 'haut',
        ordre: ordre || 0,
        alignement: alignement || 'center',
        dateDebut: dateDebut || Date.now(),
        dateFin,
        cible: cible || 'tous',
        categories: categories || [],
        creePar: req.utilisateur._id,
        // Les admins ont un statut approuvé automatique
        statut: req.utilisateur.role === 'admin' ? 'approuve' : 'en_attente',
    });

    await banniere.populate('creePar', 'nom prenom role boutique.nom');

    // DÉBIT DES CRÉDITS POUR LES VENDEURS
    if (req.utilisateur.role === 'vendeur') {
        try {
            await debiterCredits(req.utilisateur._id, banniere._id);
        } catch (error) {
            // Si le débit échoue, on supprime la bannière créée pour éviter les incohérences
            await Banniere.findByIdAndDelete(banniere._id);
            res.status(400);
            throw new Error(`Création annulée: ${error.message}`);
        }
    }

    res.status(201).json({
        succes: true,
        message: 'Bannière créée avec succès',
        donnees: banniere,
        // Info crédits pour le frontend
        credits:
            req.utilisateur.role === 'vendeur'
                    ? {
                        debites: 2,
                        message: '2 crédits débités pour cette création',
                    }
                    : undefined,
    });
});

/**
 * @desc    Modifier une bannière
 * @route   PUT /api/bannieres/:id
 * @access  Privé (Admin, Modérateur, Créateur)
 */
export const modifierBanniere = asyncHandler(async (req, res) => {
    const banniere = await Banniere.findById(req.params.id);

    if (!banniere) {
        res.status(404);
        throw new Error('Bannière non trouvée');
    }

    // Vérifier les permissions
    if (
        req.utilisateur.role === 'vendeur' &&
        banniere.creePar.toString() !== req.utilisateur._id.toString()
    ) {
        res.status(403);
        throw new Error('Accès non autorisé');
    }

    // Si une nouvelle image est uploadée
    if (req.file) {
        // Supprimer l'ancienne image
        if (banniere.image && !banniere.image.startsWith('http')) {
            const ancienneImagePath = path.join(
                __dirname,
                '../../uploads',
                banniere.image.replace('/uploads/', '')
            );
            if (fs.existsSync(ancienneImagePath)) {
                fs.unlinkSync(ancienneImagePath);
            }
        }
        req.body.image = `/uploads/bannieres/${req.file.filename}`;
    }

    // Mise à jour
    req.body.modifiePar = req.utilisateur._id;

    // Si modifié par un vendeur après rejet, repasser en attente
    if (req.utilisateur.role === 'vendeur' && banniere.statut === 'rejete') {
        req.body.statut = 'en_attente';
        req.body.raisonRejet = null;
    }

    const banniereModifiee = await Banniere.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    )
        .populate('creePar', 'nom prenom role')
        .populate('modifiePar', 'nom prenom');

    res.status(200).json({
        succes: true,
        message: 'Bannière modifiée avec succès',
        donnees: banniereModifiee,
    });
});

/**
 * @desc    Supprimer une bannière
 * @route   DELETE /api/bannieres/:id
 * @access  Privé (Admin, Créateur)
 */
export const supprimerBanniere = asyncHandler(async (req, res) => {
    const banniere = await Banniere.findById(req.params.id);

    if (!banniere) {
        res.status(404);
        throw new Error('Bannière non trouvée');
    }

    // Vérifier les permissions
    if (
        req.utilisateur.role === 'vendeur' &&
        banniere.creePar.toString() !== req.utilisateur._id.toString()
    ) {
        res.status(403);
        throw new Error('Accès non autorisé');
    }

    // Supprimer l'image du serveur
    if (banniere.image && !banniere.image.startsWith('http')) {
        const imagePath = path.join(
            __dirname,
            '../../uploads',
            banniere.image.replace('/uploads/', '')
        );
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    await banniere.deleteOne();

    res.status(200).json({
        succes: true,
        message: 'Bannière supprimée avec succès',
    });
});

/**
 * @desc    Approuver une bannière (MODÉRATEUR/ADMIN)
 * @route   PUT /api/bannieres/:id/approuver
 * @access  Privé (Admin, Modérateur)
 */
export const approuverBanniere = asyncHandler(async (req, res) => {
    const banniere = await Banniere.findById(req.params.id);

    if (!banniere) {
        res.status(404);
        throw new Error('Bannière non trouvée');
    }

    banniere.statut = 'approuve';
    banniere.raisonRejet = null;
    banniere.modifiePar = req.utilisateur._id;
    await banniere.save();

    res.status(200).json({
        succes: true,
        message: 'Bannière approuvée avec succès',
        donnees: banniere,
    });
});

/**
 * @desc    Rejeter une bannière (MODÉRATEUR/ADMIN)
 * @route   PUT /api/bannieres/:id/rejeter
 * @access  Privé (Admin, Modérateur)
 */
export const rejeterBanniere = asyncHandler(async (req, res) => {
    const { raison } = req.body;

    if (!raison) {
        res.status(400);
        throw new Error('Une raison de rejet est requise');
    }

    const banniere = await Banniere.findById(req.params.id);

    if (!banniere) {
        res.status(404);
        throw new Error('Bannière non trouvée');
    }

    banniere.statut = 'rejete';
    banniere.raisonRejet = raison;
    banniere.estActif = false;
    banniere.modifiePar = req.utilisateur._id;
    await banniere.save();

    res.status(200).json({
        succes: true,
        message: 'Bannière rejetée',
        donnees: banniere,
    });
});

/**
 * @desc    Incrémenter les vues d'une bannière
 * @route   POST /api/bannieres/:id/vue
 * @access  Public
 */
export const incrementerVueBanniere = asyncHandler(async (req, res) => {
    const banniere = await Banniere.findById(req.params.id);

    if (!banniere) {
        res.status(404);
        throw new Error('Bannière non trouvée');
    }

    await banniere.incrementerVues();

    res.status(200).json({
        succes: true,
        message: 'Vue enregistrée',
    });
});

/**
 * @desc    Incrémenter les clics d'une bannière
 * @route   POST /api/bannieres/:id/clic
 * @access  Public
 */
export const incrementerClicBanniere = asyncHandler(async (req, res) => {
    const banniere = await Banniere.findById(req.params.id);

    if (!banniere) {
        res.status(404);
        throw new Error('Bannière non trouvée');
    }

    await banniere.incrementerClics();

    res.status(200).json({
        succes: true,
        message: 'Clic enregistré',
    });
});

/**
 * @desc    Obtenir les statistiques des bannières
 * @route   GET /api/bannieres/stats
 * @access  Privé (Admin, Modérateur)
 */
export const obtenirStatistiquesBannieres = asyncHandler(async (req, res) => {
    const query =
        req.utilisateur.role === 'vendeur'
            ? { creePar: req.utilisateur._id }
            : {};

    const stats = await Banniere.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$type',
                total: { $sum: 1 },
                actives: {
                    $sum: {
                        $cond: [{ $eq: ['$estActif', true] }, 1, 0],
                    },
                },
                totalVues: { $sum: '$nombreVues' },
                totalClics: { $sum: '$nombreClics' },
            },
        },
    ]);

    const statsGlobales = {
        total: await Banniere.countDocuments(query),
        enAttente: await Banniere.countDocuments({
            ...query,
            statut: 'en_attente',
        }),
        approuvees: await Banniere.countDocuments({
            ...query,
            statut: 'approuve',
        }),
        rejetees: await Banniere.countDocuments({ ...query, statut: 'rejete' }),
        parType: stats,
    };

    res.status(200).json({
        succes: true,
        donnees: statsGlobales,
    });
});

// Exporter toutes les fonctions du contrôleur
export default {
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
};