// Importation des modules nécessaires
import asyncHandler from 'express-async-handler';
import Produit from '../models/produitModel.js';
import Categorie from '../models/categorieModel.js';

/**
 * @desc    Récupérer tous les produits
 * @route   GET /api/produits
 * @access  Public
 */
const obtenirProduits = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limite = 12,
        tri = '-creeLe',
        categorie,
        prixMin,
        prixMax,
        evaluation,
        enStock,
        enVedette,
        nouveau: estNouveau,
        meilleureVente,
        recherche,
        etiquettes,
        couleurs,
        tailles,
    } = req.query;
    // Construction de la requête
    let requete = { estActif: true };
    // Filtrage par catégorie
    if (categorie) {
        const categorieDoc = await Categorie.findOne({ slug: categorie });
        if (categorieDoc) {
            const idsCategories = await Categorie.find({
                $or: [{ _id: categorieDoc._id }, { parent: categorieDoc._id }],
            }).distinct('_id');
            requete.categorie = { $in: idsCategories };
        }
    }
    // Filtrage par prix
    if (prixMin || prixMax) {
        requete.prix = {};
        if (prixMin) requete.prix.$gte = Number(prixMin);
        if (prixMax) requete.prix.$lte = Number(prixMax);
    }
    // Filtrage par évaluation
    if (evaluation) {
        requete['evaluations.moyenne'] = { $gte: Number(evaluation) };
    }
    // Filtrage par stock
    if (enStock === 'true') {
        requete.quantite = { $gt: 0 };
    }
    // Filtres booléens
    if (enVedette === 'true') requete.estEnVedette = true;
    if (estNouveau === 'true') requete.estNouveau = true;
    if (meilleureVente === 'true') requete.estMeilleureVente = true;
    // Recherche textuelle
    if (recherche) {
        requete.$text = { $search: recherche };
    }
    // Filtrage par étiquettes
    if (etiquettes) {
        requete.etiquettes = { $in: etiquettes.split(',') };
    }
    // Filtrage par couleurs
    if (couleurs) {
        requete.couleurs = { $in: couleurs.split(',') };
    }
    // Filtrage par tailles
    if (tailles) {
        requete.tailles = { $in: tailles.split(',') };
    }
    const sauter = (page - 1) * limite;
    // Exécution de la requête
    const produits = await Produit.find(requete)
        .populate('categorie', 'nom slug')
        .sort(tri)
        .skip(sauter)
        .limit(Number(limite));
    const total = await Produit.countDocuments(requete);
    // Agrégations pour les filtres
    const plagePrix = await Produit.aggregate([
        { $match: requete },
        {
            $group: {
                _id: null,
                prixMin: { $min: '$prix' },
                prixMax: { $max: '$prix' },
            },
        },
    ]);
    const couleursDisponibles = await Produit.distinct('couleurs', requete);
    const taillesDisponibles = await Produit.distinct('tailles', requete);
    const etiquettesDisponibles = await Produit.distinct('etiquettes', requete);
    res.json({
        succes: true,
        donnees: produits,
        filtres: {
            plagePrix: plagePrix[0] || { prixMin: 0, prixMax: 0 },
            couleurs: couleursDisponibles.filter(Boolean),
            tailles: taillesDisponibles.filter(Boolean),
            etiquettes: etiquettesDisponibles.filter(Boolean),
        },
        pagination: {
            page: Number(page),
            limite: Number(limite),
            total,
            pages: Math.ceil(total / limite),
        },
    });
});

/**
 * @desc    Récupérer un produit par ID ou slug
 * @route   GET /api/produits/:id
 * @access  Public
 */
const obtenirProduit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let produit;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        // Recherche par ID
        produit = await Produit.findById(id)
            .populate('categorie', 'nom slug')
            .populate('sousCategorie', 'nom slug')
            .populate('avis.utilisateur', 'prenom nom avatar');
    } else {
        // Recherche par slug
        produit = await Produit.findOne({ slug: id })
            .populate('categorie', 'nom slug')
            .populate('sousCategorie', 'nom slug')
            .populate('avis.utilisateur', 'prenom nom avatar');
    }
    if (!produit || !produit.estActif) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }
    // Incrémenter le compteur de vues
    produit.nombreVues += 1;
    await produit.save();
    res.json({
        succes: true,
        donnees: produit,
    });
});

/**
 * @desc    Créer un produit
 * @route   POST /api/produits
 * @access  Private/Admin/Vendeur
 */
const creerProduit = asyncHandler(async (req, res) => {
    const produit = await Produit.create(req.body);
    res.status(201).json({
        succes: true,
        donnees: produit,
        message: 'Produit créé avec succès',
    });
});

/**
 * @desc    Mettre à jour un produit
 * @route   PUT /api/produits/:id
 * @access  Private/Admin/Vendeur
 */
const mettreAJourProduit = asyncHandler(async (req, res) => {
    let produit = await Produit.findById(req.params.id);
    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }
    // Vérifier les permissions
    if (
        req.utilisateur.role === 'vendeur' &&
        produit.vendeur.toString() !== req.utilisateur._id.toString()
    ) {
        res.status(403);
        throw new Error('Non autorisé à modifier ce produit');
    }
    produit = await Produit.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    }).populate('categorie', 'nom slug');
    res.json({
        succes: true,
        donnees: produit,
        message: 'Produit mis à jour avec succès',
    });
});

/**
 * @desc    Supprimer un produit
 * @route   DELETE /api/produits/:id
 * @access  Private/Admin/Vendeur
 */
const supprimerProduit = asyncHandler(async (req, res) => {
    const produit = await Produit.findById(req.params.id);
    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }
    // Vérifier les permissions
    if (
        req.utilisateur.role === 'vendeur' &&
        produit.vendeur.toString() !== req.utilisateur._id.toString()
    ) {
        res.status(403);
        throw new Error('Non autorisé à supprimer ce produit');
    }
    await Produit.findByIdAndDelete(req.params.id);
    res.json({
        succes: true,
        message: 'Produit supprimé avec succès',
    });
});

/**
 * @desc    Ajouter un avis
 * @route   POST /api/produits/:id/avis
 * @access  Private
 */
const ajouterAvis = asyncHandler(async (req, res) => {
    const { note, commentaire, images } = req.body;
    const produit = await Produit.findById(req.params.id);
    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }
    // Vérifier si l'utilisateur a déjà évalué ce produit
    const dejaEvalue = produit.avis.find(
        avis => avis.utilisateur.toString() === req.utilisateur._id.toString()
    );
    if (dejaEvalue) {
        res.status(400);
        throw new Error('Vous avez déjà évalué ce produit');
    }
    // Vérifier si l'utilisateur a acheté ce produit
    // (Implémentation simplifiée - à compléter avec les commandes)
    const avis = {
        utilisateur: req.utilisateur._id,
        note: Number(note),
        commentaire,
        images: images || [],
        estVerifie: true, // À modifier avec vérification d'achat
    };
    produit.avis.push(avis);
    await produit.save();
    res.status(201).json({
        succes: true,
        message: 'Avis ajouté avec succès',
        donnees: produit.avis,
    });
});

/**
 * @desc    Récupérer les produits similaires
 * @route   GET /api/produits/:id/similaires
 * @access  Public
 */
const obtenirProduitsSimilaires = asyncHandler(async (req, res) => {
    const produit = await Produit.findById(req.params.id);
    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }
    const produitsSimilaires = await Produit.find({
        _id: { $ne: produit._id },
        categorie: produit.categorie,
        estActif: true,
    })
        .limit(8)
        .select('nom prix images evaluations slug')
        .sort({ 'evaluations.moyenne': -1, nombreVentes: -1 });
    res.json({
        succes: true,
        donnees: produitsSimilaires,
    });
});

/**
 * @desc    Récupérer les produits populaires
 * @route   GET /api/produits/populaires
 * @access  Public
 */
const obtenirProduitsPopulaires = asyncHandler(async (req, res) => {
    const limite = parseInt(req.query.limite) || 8;
    const produits = await Produit.find({ estActif: true })
        .sort({ 'evaluations.moyenne': -1, nombreVentes: -1 })
        .limit(limite)
        .select('nom prix images evaluations slug');
    res.json({
        succes: true,
        donnees: produits,
    });
});

/**
 * @desc    Récupérer les nouveaux produits
 * @route   GET /api/produits/nouveaux
 * @access  Public
 */
const obtenirNouveauxProduits = asyncHandler(async (req, res) => {
    const limite = parseInt(req.query.limite) || 8;
    const produits = await Produit.find({ estActif: true, estNouveau: true })
        .sort({ creeLe: -1 })
        .limit(limite)
        .select('nom prix images evaluations slug');
    res.json({
        succes: true,
        donnees: produits,
    });
});

// Exportation des contrôleurs
export {
    obtenirProduits,
    obtenirProduit,
    creerProduit,
    mettreAJourProduit,
    supprimerProduit,
    ajouterAvis,
    obtenirProduitsSimilaires,
    obtenirProduitsPopulaires,
    obtenirNouveauxProduits,
};
