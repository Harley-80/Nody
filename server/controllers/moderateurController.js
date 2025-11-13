import asyncHandler from 'express-async-handler';
import Utilisateur from '../models/utilisateurModel.js';
import Produit from '../models/produitModel.js';
import Categorie from '../models/categorieModel.js';
import Commande from '../models/commandeModel.js';
import { ROLES } from '../constants/roles.js';

// @desc    Obtenir les statistiques modérateur
// @route   GET /api/moderateur/statistiques
// @access  Private/Moderateur
const getStatistiques = asyncHandler(async (req, res) => {
    const totalProduits = await Produit.countDocuments();
    const totalUtilisateurs = await Utilisateur.countDocuments();
    const totalCommandes = await Commande.countDocuments();
    const produitsEnAttente = await Produit.countDocuments({
        statut: 'en_attente',
    });
    const vendeursEnAttente = await Utilisateur.countDocuments({
        role: ROLES.VENDEUR,
        statutVerification: 'en_attente',
    });

    res.json({
        succes: true,
        data: {
            totalProduits,
            totalUtilisateurs,
            totalCommandes,
            produitsEnAttente,
            vendeursEnAttente,
        },
    });
});

// @desc    Obtenir tous les produits en attente de validation
// @route   GET /api/moderateur/produits/en-attente
// @access  Private/Moderateur
const getProduitsEnAttente = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const produits = await Produit.find({ statut: 'en_attente' })
        .populate('vendeur', 'nom prenom email boutique.nomBoutique')
        .populate('categorie', 'nom')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Produit.countDocuments({ statut: 'en_attente' });

    res.json({
        succes: true,
        data: {
            produits,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total,
                limit,
            },
        },
    });
});

// @desc    Valider un produit
// @route   PUT /api/moderateur/produits/:id/valider
// @access  Private/Moderateur
const validerProduit = asyncHandler(async (req, res) => {
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    if (produit.statut !== 'en_attente') {
        res.status(400);
        throw new Error('Ce produit a déjà été traité');
    }

    produit.statut = 'actif';
    produit.dateValidation = new Date();
    produit.moderateur = req.utilisateur._id;

    await produit.save();

    res.json({
        succes: true,
        message: 'Produit validé avec succès',
        data: produit,
    });
});

// @desc    Rejeter un produit
// @route   PUT /api/moderateur/produits/:id/rejeter
// @access  Private/Moderateur
const rejeterProduit = asyncHandler(async (req, res) => {
    const { raison } = req.body;

    if (!raison) {
        res.status(400);
        throw new Error('Veuillez fournir une raison pour le rejet');
    }

    const produit = await Produit.findById(req.params.id);

    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    if (produit.statut !== 'en_attente') {
        res.status(400);
        throw new Error('Ce produit a déjà été traité');
    }

    produit.statut = 'rejete';
    produit.raisonRejet = raison;
    produit.dateValidation = new Date();
    produit.moderateur = req.utilisateur._id;

    await produit.save();

    res.json({
        succes: true,
        message: 'Produit rejeté avec succès',
        data: produit,
    });
});

// @desc    Obtenir tous les vendeurs en attente de vérification
// @route   GET /api/moderateur/vendeurs/en-attente
// @access  Private/Moderateur
const getVendeursEnAttente = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const vendeurs = await Utilisateur.find({
        role: ROLES.VENDEUR,
        statutVerification: 'en_attente',
    })
        .select('-motDePasse')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Utilisateur.countDocuments({
        role: ROLES.VENDEUR,
        statutVerification: 'en_attente',
    });

    res.json({
        succes: true,
        data: {
            vendeurs,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total,
                limit,
            },
        },
    });
});

// @desc    Vérifier un vendeur
// @route   PUT /api/moderateur/vendeurs/:id/verifier
// @access  Private/Moderateur
const verifierVendeur = asyncHandler(async (req, res) => {
    const vendeur = await Utilisateur.findById(req.params.id);

    if (!vendeur) {
        res.status(404);
        throw new Error('Vendeur non trouvé');
    }

    if (vendeur.role !== ROLES.VENDEUR) {
        res.status(400);
        throw new Error("Cet utilisateur n'est pas un vendeur");
    }

    if (vendeur.statutVerification !== 'en_attente') {
        res.status(400);
        throw new Error('Ce vendeur a déjà été traité');
    }

    vendeur.statutVerification = 'verifie';
    vendeur.dateVerification = new Date();

    await vendeur.save();

    res.json({
        succes: true,
        message: 'Vendeur vérifié avec succès',
        data: vendeur,
    });
});

// @desc    Rejeter un vendeur
// @route   PUT /api/moderateur/vendeurs/:id/rejeter
// @access  Private/Moderateur
const rejeterVendeur = asyncHandler(async (req, res) => {
    const { raison } = req.body;

    if (!raison) {
        res.status(400);
        throw new Error('Veuillez fournir une raison pour le rejet');
    }

    const vendeur = await Utilisateur.findById(req.params.id);

    if (!vendeur) {
        res.status(404);
        throw new Error('Vendeur non trouvé');
    }

    if (vendeur.role !== ROLES.VENDEUR) {
        res.status(400);
        throw new Error("Cet utilisateur n'est pas un vendeur");
    }

    if (vendeur.statutVerification !== 'en_attente') {
        res.status(400);
        throw new Error('Ce vendeur a déjà été traité');
    }

    vendeur.statutVerification = 'rejete';
    vendeur.raisonRejet = raison;
    vendeur.dateVerification = new Date();

    await vendeur.save();

    res.json({
        succes: true,
        message: 'Vendeur rejeté avec succès',
        data: vendeur,
    });
});

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/moderateur/utilisateurs
// @access  Private/Moderateur
const getUtilisateurs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { role, statut } = req.query;

    const filtre = {};
    if (role) filtre.role = role;
    if (statut) filtre.statutVerification = statut;

    const utilisateurs = await Utilisateur.find(filtre)
        .select('-motDePasse')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Utilisateur.countDocuments(filtre);

    res.json({
        succes: true,
        data: {
            utilisateurs,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total,
                limit,
            },
        },
    });
});

// @desc    Suspendre un utilisateur
// @route   PUT /api/moderateur/utilisateurs/:id/suspendre
// @access  Private/Moderateur
const suspendreUtilisateur = asyncHandler(async (req, res) => {
    const { raison } = req.body;

    const utilisateur = await Utilisateur.findById(req.params.id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    if (utilisateur.role === ROLES.ADMIN) {
        res.status(403);
        throw new Error('Impossible de suspendre un administrateur');
    }

    utilisateur.estActif = false;
    utilisateur.raisonSuspension = raison;
    utilisateur.dateSuspension = new Date();

    await utilisateur.save();

    res.json({
        succes: true,
        message: 'Utilisateur suspendu avec succès',
        data: utilisateur,
    });
});

// @desc    Activer un utilisateur
// @route   PUT /api/moderateur/utilisateurs/:id/activer
// @access  Private/Moderateur
const activerUtilisateur = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.params.id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    utilisateur.estActif = true;
    utilisateur.raisonSuspension = undefined;
    utilisateur.dateSuspension = undefined;

    await utilisateur.save();

    res.json({
        succes: true,
        message: 'Utilisateur activé avec succès',
        data: utilisateur,
    });
});

export {
    getStatistiques,
    getProduitsEnAttente,
    validerProduit,
    rejeterProduit,
    getVendeursEnAttente,
    verifierVendeur,
    rejeterVendeur,
    getUtilisateurs,
    suspendreUtilisateur,
    activerUtilisateur,
};
