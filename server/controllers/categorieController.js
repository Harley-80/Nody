import asyncHandler from 'express-async-handler';
import Categorie from '../models/categorieModel.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtenir toutes les catégories en arbre
const obtenirCategories = asyncHandler(async (req, res) => {
    const categories = await Categorie.find({}).sort({ ordre: 1, nom: 1 });

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

// Obtenir une catégorie par ID
const obtenirCategorie = asyncHandler(async (req, res) => {
    let categorie;

    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        categorie = await Categorie.findById(req.params.id).populate(
            'parent',
            'nom slug'
        );
    } else {
        categorie = await Categorie.findOne({
            $or: [
                { slug: req.params.id },
                { nom: { $regex: new RegExp(req.params.id, 'i') } },
            ],
        }).populate('parent', 'nom slug');
    }

    if (!categorie) {
        res.status(404);
        throw new Error('Catégorie non trouvée');
    }

    // Récupérer les sous-catégories
    const sousCategories = await Categorie.find({
        parent: categorie._id,
        estActif: true,
    }).sort({ ordre: 1, nom: 1 });

    const categorieAvecSous = {
        ...categorie.toObject(),
        sousCategories: sousCategories,
    };

    res.json({
        succes: true,
        donnees: categorieAvecSous,
    });
});

// Créer une catégorie
const creerCategorie = asyncHandler(async (req, res) => {
    let imageUrl = null;

    if (req.file) {
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'categories');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const uniqueName = `cat_${Date.now()}${path.extname(req.file.originalname)}`;
        const imagePath = path.join(uploadsDir, uniqueName);

        fs.writeFileSync(imagePath, req.file.buffer);
        imageUrl = `/uploads/categories/${uniqueName}`;
    }

    const categorieData = {
        ...req.body,
        image: imageUrl,
    };

    const categorie = await Categorie.create(categorieData);

    res.status(201).json({
        succes: true,
        donnees: categorie,
        message: 'Catégorie créée avec succès',
    });
});

// Mettre à jour
const mettreAJourCategorie = asyncHandler(async (req, res) => {
    let updateData = { ...req.body };

    if (req.file) {
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'categories');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const categorie = await Categorie.findById(req.params.id);

        if (categorie?.image) {
            const oldImagePath = path.join(__dirname, '..', categorie.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        const uniqueName = `cat_${Date.now()}${path.extname(req.file.originalname)}`;
        const imagePath = path.join(uploadsDir, uniqueName);

        fs.writeFileSync(imagePath, req.file.buffer);
        updateData.image = `/uploads/categories/${uniqueName}`;
    }

    const categorie = await Categorie.findByIdAndUpdate(
        req.params.id,
        updateData,
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

// Supprimer
const supprimerCategorie = asyncHandler(async (req, res) => {
    const categorie = await Categorie.findById(req.params.id);

    if (!categorie) {
        res.status(404);
        throw new Error('Catégorie non trouvée');
    }

    const sousCategories = await Categorie.countDocuments({
        parent: categorie._id,
    });

    if (sousCategories > 0) {
        res.status(400);
        throw new Error(
            'Impossible de supprimer une catégorie avec des sous-catégories'
        );
    }

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

    if (categorie.image) {
        const imagePath = path.join(__dirname, '..', categorie.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    await Categorie.findByIdAndDelete(req.params.id);

    res.json({
        succes: true,
        message: 'Catégorie supprimée avec succès',
    });
});

// Catégories en vedette
const obtenirCategoriesEnVedette = asyncHandler(async (req, res) => {
    const categories = await Categorie.find({
        estActif: true,
        enVedette: true,
        parent: null,
    })
        .limit(10)
        .sort({ ordre: 1, nom: 1 });

    const categoriesAvecSousCategories = await Promise.all(
        categories.map(async cat => {
            const sousCategories = await Categorie.find({
                parent: cat._id,
                estActif: true,
            })
                .limit(5)
                .sort({ ordre: 1, nom: 1 });

            return {
                ...cat.toObject(),
                sousCategories,
            };
        })
    );

    res.json({
        succes: true,
        donnees: categoriesAvecSousCategories,
    });
});

// Rechercher des catégories
const rechercherCategories = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q) {
        res.status(400);
        throw new Error('Le terme de recherche est requis');
    }

    const categories = await Categorie.find({
        $or: [
            { nom: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { slug: { $regex: q, $options: 'i' } },
        ],
        estActif: true,
    }).limit(20);

    res.json({
        succes: true,
        donnees: categories,
    });
});

// Obtenir les catégories racines
const obtenirCategoriesRacines = asyncHandler(async (req, res) => {
    const categories = await Categorie.find({
        parent: null,
        estActif: true,
    }).sort({ ordre: 1, nom: 1 });

    res.json({
        succes: true,
        donnees: categories,
    });
});

// Obtenir le breadcrumb
const obtenirBreadcrumb = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const breadcrumb = [];
    let currentId = id;

    while (currentId) {
        let categorie;
        if (currentId.match(/^[0-9a-fA-F]{24}$/)) {
            categorie = await Categorie.findById(currentId);
        } else {
            categorie = await Categorie.findOne({ slug: currentId });
        }

        if (!categorie || !categorie.estActif) break;

        breadcrumb.unshift({
            id: categorie._id,
            nom: categorie.nom,
            slug: categorie.slug,
        });

        currentId = categorie.parent ? categorie.parent.toString() : null;
    }

    res.json({
        succes: true,
        donnees: breadcrumb,
    });
});

// Obtenir les statistiques
const obtenirStatistiques = asyncHandler(async (req, res) => {
    const totalCategories = await Categorie.countDocuments();
    const categoriesActives = await Categorie.countDocuments({
        estActif: true,
    });
    const categoriesInactives = await Categorie.countDocuments({
        estActif: false,
    });
    const categoriesEnVedette = await Categorie.countDocuments({
        enVedette: true,
    });
    const categoriesRacines = await Categorie.countDocuments({ parent: null });

    // Statistiques supplémentaires (optionnelles)
    const categoriesAvecImage = await Categorie.countDocuments({
        image: { $ne: null, $ne: '' },
    });
    const categoriesAvecParent = await Categorie.countDocuments({
        parent: { $ne: null },
    });

    // Catégories par niveau (profondeur)
    const categoriesParNiveau = await Categorie.aggregate([
        {
            $graphLookup: {
                from: 'categories',
                startWith: '$_id',
                connectFromField: 'parent',
                connectToField: '_id',
                as: 'ancestors',
                maxDepth: 10,
            },
        },
        {
            $project: {
                niveau: { $size: '$ancestors' },
            },
        },
        {
            $group: {
                _id: '$niveau',
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    res.json({
        succes: true,
        donnees: {
            totalCategories,
            categoriesActives,
            categoriesInactives,
            categoriesEnVedette,
            categoriesRacines,
            categoriesAvecImage,
            categoriesAvecParent,
            categoriesParNiveau: categoriesParNiveau.reduce((acc, item) => {
                acc[`niveau${item._id}`] = item.count;
                return acc;
            }, {}),
        },
    });
});

// Obtenir les sous-catégories d'une catégorie spécifique
const obtenirSousCategories = asyncHandler(async (req, res) => {
    const { parentId } = req.params;

    if (!parentId) {
        res.status(400);
        throw new Error('ID parent requis');
    }

    const sousCategories = await Categorie.find({
        parent: parentId,
        estActif: true,
    })
        .sort({ ordre: 1, nom: 1 })
        .select('_id nom description slug niveau estActif');

    res.json({
        succes: true,
        donnees: sousCategories,
        message: 'Sous-catégories récupérées avec succès',
    });
});

// Obtenir le chemin complet d'une catégorie (avec tous les parents)
const obtenirCheminCategorie = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const chemin = [];
    let currentId = id;

    while (currentId) {
        let categorie;
        if (currentId.match(/^[0-9a-fA-F]{24}$/)) {
            categorie = await Categorie.findById(currentId)
                .select('nom slug parent estActif')
                .populate('parent', 'nom slug');
        } else {
            categorie = await Categorie.findOne({ slug: currentId })
                .select('nom slug parent estActif')
                .populate('parent', 'nom slug');
        }

        if (!categorie || !categorie.estActif) break;

        chemin.unshift({
            id: categorie._id,
            nom: categorie.nom,
            slug: categorie.slug,
        });

        currentId = categorie.parent ? categorie.parent._id.toString() : null;
    }

    res.json({
        succes: true,
        donnees: chemin,
    });
});

// Exporter toutes les fonctions
export {
    obtenirCategories,
    obtenirCategorie,
    creerCategorie,
    mettreAJourCategorie,
    supprimerCategorie,
    obtenirCategoriesEnVedette,
    rechercherCategories,
    obtenirCategoriesRacines,
    obtenirBreadcrumb,
    obtenirStatistiques,
    obtenirSousCategories,
    obtenirCheminCategorie,
};//