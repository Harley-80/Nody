import asyncHandler from 'express-async-handler';
import Produit from '../models/produitModel.js';
import Categorie from '../models/categorieModel.js';
import Commande from '../models/commandeModel.js';

// @desc    Obtenir les statistiques vendeur
// @route   GET /api/vendeur/statistiques
// @access  Private/Vendeur
const getStatistiques = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;

    const totalProduits = await Produit.countDocuments({ vendeur: vendeurId });
    const produitsActifs = await Produit.countDocuments({
        vendeur: vendeurId,
        statut: 'actif',
    });
    const produitsEnAttente = await Produit.countDocuments({
        vendeur: vendeurId,
        statut: 'en_attente',
    });

    const totalCommandes = await Commande.countDocuments({
        'produits.vendeur': vendeurId,
    });

    const chiffreAffaires = await Commande.aggregate([
        { $unwind: '$produits' },
        { $match: { 'produits.vendeur': vendeurId, statut: 'livree' } },
        { $group: { _id: null, total: { $sum: '$produits.prix' } } },
    ]);

    res.json({
        succes: true,
        data: {
            totalProduits,
            produitsActifs,
            produitsEnAttente,
            totalCommandes,
            chiffreAffaires: chiffreAffaires[0]?.total || 0,
        },
    });
});

// @desc    Obtenir les produits du vendeur
// @route   GET /api/vendeur/produits
// @access  Private/Vendeur
const getMesProduits = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { statut } = req.query;

    const filtre = { vendeur: vendeurId };
    if (statut) filtre.statut = statut;

    const produits = await Produit.find(filtre)
        .populate('categorie', 'nom')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Produit.countDocuments(filtre);

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

// @desc    Créer un nouveau produit
// @route   POST /api/vendeur/produits
// @access  Private/Vendeur
const creerProduit = asyncHandler(async (req, res) => {
    const {
        nom,
        description,
        prix,
        categorie,
        quantite,
        images,
        caracteristiques,
        marque,
        etiquettes,
    } = req.body;

    const produit = await Produit.create({
        nom,
        description,
        prix,
        categorie,
        quantite,
        images: images || [],
        caracteristiques: caracteristiques || [],
        marque,
        etiquettes: etiquettes || [],
        vendeur: req.utilisateur._id,
        statut: 'en_attente', // Doit être validé par un modérateur
    });

    const produitPopulate = await Produit.findById(produit._id)
        .populate('categorie', 'nom')
        .populate('vendeur', 'nom prenom email');

    res.status(201).json({
        succes: true,
        message: 'Produit créé avec succès et en attente de validation',
        data: produitPopulate,
    });
});

// @desc    Modifier un produit
// @route   PUT /api/vendeur/produits/:id
// @access  Private/Vendeur
const modifierProduit = asyncHandler(async (req, res) => {
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    // Vérifier que le produit appartient au vendeur
    if (produit.vendeur.toString() !== req.utilisateur._id.toString()) {
        res.status(403);
        throw new Error('Non autorisé à modifier ce produit');
    }

    const produitModifie = await Produit.findByIdAndUpdate(
        req.params.id,
        {
            ...req.body,
            statut: 'en_attente', // Remet en attente après modification
        },
        { new: true, runValidators: true }
    ).populate('categorie', 'nom');

    res.json({
        succes: true,
        message: 'Produit modifié avec succès et en attente de validation',
        data: produitModifie,
    });
});

// @desc    Supprimer un produit
// @route   DELETE /api/vendeur/produits/:id
// @access  Private/Vendeur
const supprimerProduit = asyncHandler(async (req, res) => {
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    // Vérifier que le produit appartient au vendeur
    if (produit.vendeur.toString() !== req.utilisateur._id.toString()) {
        res.status(403);
        throw new Error('Non autorisé à supprimer ce produit');
    }

    await Produit.findByIdAndDelete(req.params.id);

    res.json({
        succes: true,
        message: 'Produit supprimé avec succès',
    });
});

// @desc    Obtenir les commandes du vendeur
// @route   GET /api/vendeur/commandes
// @access  Private/Vendeur
const getMesCommandes = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { statut } = req.query;

    const filtre = { 'produits.vendeur': vendeurId };
    if (statut) filtre.statut = statut;

    const commandes = await Commande.find(filtre)
        .populate('utilisateur', 'nom prenom email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Commande.countDocuments(filtre);

    res.json({
        succes: true,
        data: {
            commandes,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total,
                limit,
            },
        },
    });
});

// @desc    Mettre à jour le statut d'un produit dans une commande
// @route   PUT /api/vendeur/commandes/:commandeId/produits/:produitId
// @access  Private/Vendeur
const mettreAJourStatutProduit = asyncHandler(async (req, res) => {
    const { statut } = req.body;
    const { commandeId, produitId } = req.params;

    const commande = await Commande.findById(commandeId);

    if (!commande) {
        res.status(404);
        throw new Error('Commande non trouvée');
    }

    // Trouver le produit dans la commande
    const produitCommande = commande.produits.find(
        p =>
            p._id.toString() === produitId &&
            p.vendeur.toString() === req.utilisateur._id.toString()
    );

    if (!produitCommande) {
        res.status(404);
        throw new Error('Produit non trouvé dans la commande');
    }

    produitCommande.statutVendeur = statut;
    await commande.save();

    res.json({
        succes: true,
        message: 'Statut du produit mis à jour',
        data: commande,
    });
});

// @desc    Obtenir les informations de la boutique du vendeur
// @route   GET /api/vendeur/boutique
// @access  Private/Vendeur
const getMaBoutique = asyncHandler(async (req, res) => {
    const vendeur = await Utilisateur.findById(req.utilisateur._id).select(
        'boutique nom prenom email'
    );

    res.json({
        succes: true,
        data: vendeur,
    });
});

// @desc    Mettre à jour les informations de la boutique
// @route   PUT /api/vendeur/boutique
// @access  Private/Vendeur
const mettreAJourBoutique = asyncHandler(async (req, res) => {
    const { boutique } = req.body;

    const vendeur = await Utilisateur.findByIdAndUpdate(
        req.utilisateur._id,
        { boutique },
        { new: true, runValidators: true }
    ).select('boutique nom prenom email');

    res.json({
        succes: true,
        message: 'Boutique mise à jour avec succès',
        data: vendeur,
    });
});

export {
    getStatistiques,
    getMesProduits,
    creerProduit,
    modifierProduit,
    supprimerProduit,
    getMesCommandes,
    mettreAJourStatutProduit,
    getMaBoutique,
    mettreAJourBoutique,
};
