// Importation des modules nécessaires
import asyncHandler from 'express-async-handler';
import Utilisateur from '../models/utilisateurModel.js';
import Produit from '../models/produitModel.js';

/**
 * @desc    Récupérer tous les utilisateurs (admin)
 * @route   GET /api/utilisateurs
 * @access  Private/Admin
 */
const obtenirUtilisateurs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const sauter = (page - 1) * limite;
    const utilisateurs = await Utilisateur.find()
        .select('-motDePasse')
        .sort({ creeLe: -1 })
        .skip(sauter)
        .limit(limite);
    const total = await Utilisateur.countDocuments();
    res.json({
        succes: true,
        donnees: utilisateurs,
        pagination: {
            page,
            limite,
            total,
            pages: Math.ceil(total / limite),
        },
    });
});

/**
 * @desc    Récupérer un utilisateur par ID
 * @route   GET /api/utilisateurs/:id
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
 * @desc    Mettre à jour un utilisateur (admin)
 * @route   PUT /api/utilisateurs/:id
 * @access  Private/Admin
 */
const mettreAJourUtilisateur = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findByIdAndUpdate(
        req.params.id,
        req.body,
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
        message: 'Utilisateur mis à jour avec succès',
    });
});

/**
 * @desc    Supprimer un utilisateur
 * @route   DELETE /api/utilisateurs/:id
 * @access  Private/Admin
 */
const supprimerUtilisateur = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.params.id);
    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }
    // Empêcher la suppression de son propre compte
    if (utilisateur._id.toString() === req.utilisateur._id.toString()) {
        res.status(400);
        throw new Error('Vous ne pouvez pas supprimer votre propre compte');
    }
    await Utilisateur.findByIdAndDelete(req.params.id);
    res.json({
        succes: true,
        message: 'Utilisateur supprimé avec succès',
    });
});

/**
 * @desc    Ajouter un produit au panier
 * @route   POST /api/utilisateurs/panier
 * @access  Private
 */
const ajouterAuPanier = asyncHandler(async (req, res) => {
    const { produitId, quantite = 1, variante } = req.body;
    const produit = await Produit.findById(produitId);
    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }
    if (produit.quantite < quantite) {
        res.status(400);
        throw new Error('Stock insuffisant');
    }
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    // Vérifier si le produit est déjà dans le panier
    const indexArticleExistant = utilisateur.panier.findIndex(
        article =>
            article.produit.toString() === produitId &&
            JSON.stringify(article.variante) === JSON.stringify(variante)
    );
    if (indexArticleExistant > -1) {
        // Mettre à jour la quantité
        utilisateur.panier[indexArticleExistant].quantite += quantite;
    } else {
        // Ajouter un nouvel article
        utilisateur.panier.push({
            produit: produitId,
            quantite,
            variante,
        });
    }
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Produit ajouté au panier',
        donnees: utilisateur.panier,
    });
});

/**
 * @desc    Récupérer le panier
 * @route   GET /api/utilisateurs/panier
 * @access  Private
 */
const obtenirPanier = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(
        req.utilisateur._id
    ).populate({
        path: 'panier.produit',
        select: 'nom prix images quantite',
    });
    // Filtrer les produits supprimés ou hors stock
    const panierValide = utilisateur.panier.filter(
        article => article.produit && article.produit.quantite > 0
    );
    if (panierValide.length !== utilisateur.panier.length) {
        utilisateur.panier = panierValide;
        await utilisateur.save();
    }
    res.json({
        succes: true,
        donnees: utilisateur.panier,
    });
});

/**
 * @desc    Mettre à jour le panier
 * @route   PUT /api/utilisateurs/panier/:articleId
 * @access  Private
 */
const mettreAJourPanier = asyncHandler(async (req, res) => {
    const { quantite } = req.body;
    if (quantite < 1) {
        res.status(400);
        throw new Error('La quantité doit être au moins 1');
    }
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);
    const articlePanier = utilisateur.panier.id(req.params.articleId);
    if (!articlePanier) {
        res.status(404);
        throw new Error('Article non trouvé dans le panier');
    }
    const produit = await Produit.findById(articlePanier.produit);
    if (produit.quantite < quantite) {
        res.status(400);
        throw new Error('Stock insuffisant');
    }
    articlePanier.quantite = quantite;
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Panier mis à jour',
        donnees: utilisateur.panier,
    });
});

/**
 * @desc    Supprimer un article du panier
 * @route   DELETE /api/utilisateurs/panier/:articleId
 * @access  Private
 */
const retirerDuPanier = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);
    utilisateur.panier.pull(req.params.articleId);
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Article supprimé du panier',
        donnees: utilisateur.panier,
    });
});

/**
 * @desc    Vider le panier
 * @route   DELETE /api/utilisateurs/panier
 * @access  Private
 */
const viderPanier = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);
    utilisateur.panier = [];
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Panier vidé',
    });
});

/**
 * @desc    Ajouter un produit à la liste de souhaits
 * @route   POST /api/utilisateurs/liste-souhaits
 * @access  Private
 */
const ajouterAListeSouhaits = asyncHandler(async (req, res) => {
    const { produitId } = req.body;
    const produit = await Produit.findById(produitId);
    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    // Vérifier si le produit est déjà dans la liste de souhaits
    const existe = utilisateur.listeSouhaits.some(
        article => article.produit.toString() === produitId
    );
    if (existe) {
        res.status(400);
        throw new Error('Produit déjà dans la liste de souhaits');
    }
    utilisateur.listeSouhaits.push({ produit: produitId });
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Produit ajouté à la liste de souhaits',
        donnees: utilisateur.listeSouhaits,
    });
});

/**
 * @desc    Récupérer la liste de souhaits
 * @route   GET /api/utilisateurs/liste-souhaits
 * @access  Private
 */
const obtenirListeSouhaits = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(
        req.utilisateur._id
    ).populate({
        path: 'listeSouhaits.produit',
        select: 'nom prix images evaluations',
    });
    res.json({
        succes: true,
        donnees: utilisateur.listeSouhaits,
    });
});

/**
 * @desc    Supprimer un produit de la liste de souhaits
 * @route   DELETE /api/utilisateurs/liste-souhaits/:produitId
 * @access  Private
 */
const retirerDeListeSouhaits = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);
    utilisateur.listeSouhaits = utilisateur.listeSouhaits.filter(
        article => article.produit.toString() !== req.params.produitId
    );
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Produit supprimé de la liste de souhaits',
        donnees: utilisateur.listeSouhaits,
    });
});

/**
 * @desc    Ajouter une adresse
 * @route   POST /api/utilisateurs/adresses
 * @access  Private
 */
const ajouterAdresse = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    utilisateur.adresses.push(req.body);
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Adresse ajoutée',
        donnees: utilisateur.adresses,
    });
});

/**
 * @desc    Mettre à jour une adresse
 * @route   PUT /api/utilisateurs/adresses/:adresseId
 * @access  Private
 */
const mettreAJourAdresse = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);
    const adresse = utilisateur.adresses.id(req.params.adresseId);
    if (!adresse) {
        res.status(404);
        throw new Error('Adresse non trouvée');
    }
    adresse.set(req.body);
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Adresse mise à jour',
        donnees: utilisateur.adresses,
    });
});

/**
 * @desc    Supprimer une adresse
 * @route   DELETE /api/utilisateurs/adresses/:adresseId
 * @access  Private
 */
const supprimerAdresse = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);
    utilisateur.adresses.pull(req.params.adresseId);
    await utilisateur.save();
    res.json({
        succes: true,
        message: 'Adresse supprimée',
        donnees: utilisateur.adresses,
    });
});

// Exportation des contrôleurs
export {
    obtenirUtilisateurs,
    obtenirUtilisateur,
    mettreAJourUtilisateur,
    supprimerUtilisateur,
    ajouterAuPanier,
    obtenirPanier,
    mettreAJourPanier,
    retirerDuPanier,
    viderPanier,
    ajouterAListeSouhaits,
    obtenirListeSouhaits,
    retirerDeListeSouhaits,
    ajouterAdresse,
    mettreAJourAdresse,
    supprimerAdresse,
};
