// Importation des modules nécessaires
import asyncHandler from 'express-async-handler';
import Categorie from '../models/categorieModel.js';

/**
 * @desc    Récupérer toutes les catégories
 * @route   GET /api/categories
 * @access  Public
 */
const obtenirCategories = asyncHandler(async (req, res) => {
    const categories = await Categorie.find({})
        .populate('sousCategories')
        .sort({ ordre: 1, nom: 1 });
    // Organiser en arbre hiérarchique
    const construireArbre = (categories, parentId = null) => {
        return categories
            .filter(categorie => {
                const categorieParentId = categorie.parent
                    ? categorie.parent.toString()
                    : null;
                return categorieParentId === parentId;
            })
            .map(categorie => ({
                ...categorie.toObject(),
                sousCategories: construireArbre(
                    categories,
                    categorie._id.toString()
                ),
            }));
    };
    const arbreCategories = construireArbre(categories);
    res.json({
        succes: true,
        donnees: arbreCategories,
    });
});

/**
 * @desc    Récupérer une catégorie par ID ou slug
 * @route   GET /api/categories/:id
 * @access  Public
 */
const obtenirCategorie = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let categorie;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        categorie = await Categorie.findById(id)
            .populate('parent', 'nom slug')
            .populate({
                path: 'sousCategories',
                match: { estActif: true },
                options: { sort: { ordre: 1, nom: 1 } },
            });
    } else {
        categorie = await Categorie.findOne({ slug: id })
            .populate('parent', 'nom slug')
            .populate({
                path: 'sousCategories',
                match: { estActif: true },
                options: { sort: { ordre: 1, nom: 1 } },
            });
    }
    if (!categorie || !categorie.estActif) {
        res.status(404);
        throw new Error('Catégorie non trouvée');
    }
    res.json({
        succes: true,
        donnees: categorie,
    });
});

/**
 * @desc    Créer une catégorie
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const creerCategorie = asyncHandler(async (req, res) => {
    const categorie = await Categorie.create(req.body);
    res.status(201).json({
        succes: true,
        donnees: categorie,
        message: 'Catégorie créée avec succès',
    });
});

/**
 * @desc    Mettre à jour une catégorie
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const mettreAJourCategorie = asyncHandler(async (req, res) => {
    const categorie = await Categorie.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        }
    ).populate('parent', 'nom slug');
    if (!categorie) {
        res.status(404);
        throw new Error('Catégorie non trouvée');
    }
    res.json({
        succes: true,
        donnees: categorie,
        message: 'Catégorie mise à jour avec succès',
    });
});

/**
 * @desc    Supprimer une catégorie
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const supprimerCategorie = asyncHandler(async (req, res) => {
    const categorie = await Categorie.findById(req.params.id);
    if (!categorie) {
        res.status(404);
        throw new Error('Catégorie non trouvée');
    }
    // Vérifier s'il y a des sous-catégories
    const sousCategories = await Categorie.countDocuments({
        parent: categorie._id,
    });
    if (sousCategories > 0) {
        res.status(400);
        throw new Error(
            'Impossible de supprimer une catégorie avec des sous-catégories'
        );
    }
    // Vérifier s'il y a des produits associés
    const Produit = (await import('../models/produitModel.js')).default;
    const nombreProduits = await Produit.countDocuments({
        categorie: categorie._id,
    });
    if (nombreProduits > 0) {
        res.status(400);
        throw new Error(
            'Impossible de supprimer une catégorie avec des produits'
        );
    }
    await Categorie.findByIdAndDelete(req.params.id);
    res.json({
        succes: true,
        message: 'Catégorie supprimée avec succès',
    });
});

/**
 * @desc    Récupérer les catégories en vedette
 * @route   GET /api/categories/en-vedette
 * @access  Public
 */
const obtenirCategoriesEnVedette = asyncHandler(async (req, res) => {
    const categories = await Categorie.find({
        estActif: true,
        enVedette: true,
        parent: null,
    })
        .populate({
            path: 'sousCategories',
            match: { estActif: true },
            options: { limit: 5 },
        })
        .limit(10)
        .sort({ ordre: 1, nom: 1 });
    res.json({
        succes: true,
        donnees: categories,
    });
});

// Exportation des contrôleurs
export {
    obtenirCategories,
    obtenirCategorie,
    creerCategorie,
    mettreAJourCategorie,
    supprimerCategorie,
    obtenirCategoriesEnVedette,
};
