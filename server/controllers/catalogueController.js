import asyncHandler from 'express-async-handler';
import Categorie from '../models/categorieModel.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Obtenir toutes les catégories
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
            .map(categorie => {
                const categorieObj = categorie.toObject();

                const categorieAvecParent = {
                    ...categorieObj,
                    parent: categorie.parent
                        ? {
                              _id: categorie.parent,
                              nom: categorie.nom,
                          }
                        : null,
                    sousCategories: construireArbre(
                        categories,
                        categorie._id.toString()
                    ),
                };

                if (
                    categorieAvecParent.sousCategories &&
                    categorieAvecParent.sousCategories.length > 0
                ) {
                    categorieAvecParent.sousCategories =
                        categorieAvecParent.sousCategories.map(subCat => ({
                            ...subCat,
                            parent: {
                                _id: categorie._id,
                                nom: categorie.nom,
                            },
                        }));
                }

                return categorieAvecParent;
            });
    };

    const arbreCategories = construireArbre(categories);

    res.json({
        succes: true,
        donnees: arbreCategories,
    });
});

// 2. Obtenir une catégorie spécifique
const obtenirCategorie = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let categorie;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        categorie = await Categorie.findById(id).populate('parent', 'nom slug');
    } else {
        categorie = await Categorie.findOne({ slug: id }).populate(
            'parent',
            'nom slug'
        );
    }

    if (!categorie || !categorie.estActif) {
        res.status(404);
        throw new Error('Catégorie non trouvée');
    }

    const sousCategories = await Categorie.find({
        parent: categorie._id,
        estActif: true,
    }).sort({ ordre: 1, nom: 1 });

    res.json({
        succes: true,
        donnees: {
            ...categorie.toObject(),
            sousCategories,
        },
    });
});

// 3. Créer une catégorie
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

// 4. Mettre à jour une catégorie
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

// 5. Supprimer une catégorie
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

// 6. Obtenir les catégories en vedette
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

// 7. Obtenir le fil d'Ariane (breadcrumb) - NOUVELLE FONCTION
const obtenirBreadcrumb = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const categorie = await Categorie.findOne({ slug });

    if (!categorie) {
        res.status(404);
        throw new Error('Catégorie non trouvée');
    }

    const breadcrumb = [];
    let currentCategorie = categorie;

    // Remonter jusqu'à la racine
    while (currentCategorie) {
        breadcrumb.unshift({
            _id: currentCategorie._id,
            nom: currentCategorie.nom,
            slug: currentCategorie.slug,
        });

        if (currentCategorie.parent) {
            currentCategorie = await Categorie.findById(
                currentCategorie.parent
            );
        } else {
            currentCategorie = null;
        }
    }

    res.json({
        succes: true,
        donnees: breadcrumb,
    });
});

// 8. Rechercher des catégories
const rechercherCategories = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.json({
            succes: true,
            donnees: [],
        });
    }

    const categories = await Categorie.find({
        $or: [
            { nom: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
        ],
        estActif: true,
    })
        .limit(20)
        .sort({ nom: 1 });

    res.json({
        succes: true,
        donnees: categories,
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
    obtenirBreadcrumb, 
    rechercherCategories, 
};