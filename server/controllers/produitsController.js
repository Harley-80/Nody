import asyncHandler from 'express-async-handler';
import Produit from '../models/produitModel.js';
import Categorie from '../models/categorieModel.js';
import { notifierNouveauProduit } from '../services/websocketService.js';

/**
 * Formater les URLs des images avec l'URL complète
 */
const formaterUrlsImages = (produit, baseUrl) => {
    const produitFormate = produit.toObject
        ? produit.toObject()
        : { ...produit };

    if (produitFormate.images && Array.isArray(produitFormate.images)) {
        produitFormate.images = produitFormate.images.map(image => {
            let urlFinale = image.url;

            // Si l'URL n'est pas complète, la formater
            if (urlFinale && !urlFinale.startsWith('http')) {
                // Extraire le nom de fichier
                let filename;

                if (urlFinale.includes('/')) {
                    filename = urlFinale.split('/').pop();
                } else if (image.nomFichier) {
                    filename = image.nomFichier;
                } else if (image.chemin && image.chemin.includes('/')) {
                    filename = image.chemin.split('/').pop();
                } else {
                    filename = urlFinale;
                }

                // Construire l'URL complète
                if (filename) {
                    urlFinale = `${baseUrl}/uploads/produits/${filename}`;
                }
            }

            return {
                ...image,
                url: urlFinale || image.url,
            };
        });
    }

    return produitFormate;
};

/**
 * Obtenir tous les produits avec filtres et pagination
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

    let requete = { estActif: true };

    if (categorie) {
        const categorieDoc = await Categorie.findOne({ slug: categorie });
        if (categorieDoc) {
            const idsCategories = await Categorie.find({
                $or: [{ _id: categorieDoc._id }, { parent: categorieDoc._id }],
            }).distinct('_id');
            requete.categorie = { $in: idsCategories };
        }
    }

    if (prixMin || prixMax) {
        requete.prix = {};
        if (prixMin) requete.prix.$gte = Number(prixMin);
        if (prixMax) requete.prix.$lte = Number(prixMax);
    }

    if (evaluation) {
        requete['evaluations.moyenne'] = { $gte: Number(evaluation) };
    }

    if (enStock === 'true') {
        requete.quantite = { $gt: 0 };
    }

    if (enVedette === 'true') requete.estEnVedette = true;
    if (estNouveau === 'true') requete.estNouveau = true;
    if (meilleureVente === 'true') requete.estMeilleureVente = true;

    if (recherche) {
        requete.$text = { $search: recherche };
    }

    if (etiquettes) {
        requete.etiquettes = { $in: etiquettes.split(',') };
    }

    if (couleurs) {
        requete.couleurs = { $in: couleurs.split(',') };
    }

    if (tailles) {
        requete.tailles = { $in: tailles.split(',') };
    }

    const sauter = (page - 1) * limite;

    const produits = await Produit.find(requete)
        .populate('categorie', 'nom slug')
        .populate('sousCategorie', 'nom slug')
        .sort(tri)
        .skip(sauter)
        .limit(Number(limite));

    const baseUrl = req.protocol + '://' + req.get('host');
    const produitsFormates = produits.map(produit =>
        formaterUrlsImages(produit, baseUrl)
    );

    const total = await Produit.countDocuments(requete);

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
        donnees: produitsFormates,
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
 * Obtenir un produit par ID ou slug
 */
const obtenirProduit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let produit;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        produit = await Produit.findById(id)
            .populate('categorie', 'nom slug')
            .populate('sousCategorie', 'nom slug')
            .populate('avis.utilisateur', 'prenom nom avatar');
    } else {
        produit = await Produit.findOne({ slug: id })
            .populate('categorie', 'nom slug')
            .populate('sousCategorie', 'nom slug')
            .populate('avis.utilisateur', 'prenom nom avatar');
    }

    if (!produit || !produit.estActif) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    const produitFormate = formaterUrlsImages(produit, baseUrl);

    produit.nombreVues += 1;
    await produit.save();

    res.json({
        succes: true,
        donnees: produitFormate,
    });
});

/**
 * Créer un nouveau produit
 */
const creerProduit = asyncHandler(async (req, res) => {
    const imagesPaths = [];
    if (req.files && req.files.length > 0) {
        const baseUrl = req.protocol + '://' + req.get('host');

        req.files.forEach(file => {
            const imageUrl = `${baseUrl}/uploads/produits/${file.filename}`;
            imagesPaths.push({
                url: imageUrl,
                alt: req.body.nom || 'Image produit',
                estPrincipale: imagesPaths.length === 0,
            });
        });
    }

    let dimensions = undefined;
    if (req.body.dimensions) {
        try {
            dimensions =
                typeof req.body.dimensions === 'string'
                    ? JSON.parse(req.body.dimensions)
                    : req.body.dimensions;
        } catch (e) {
            console.error('Erreur parsing dimensions:', e);
        }
    }

    let etiquettes = [];
    if (req.body.etiquettes) {
        try {
            etiquettes =
                typeof req.body.etiquettes === 'string'
                    ? JSON.parse(req.body.etiquettes)
                    : req.body.etiquettes;
        } catch (e) {
            console.error('Erreur parsing etiquettes:', e);
        }
    }

    const produitData = {
        nom: req.body.nom,
        description: req.body.description,
        prix: parseFloat(req.body.prix),
        quantite: parseInt(req.body.quantite, 10),
        categorie: req.body.categorie,
        estActif: req.body.estActif === 'true' || req.body.estActif === true,
        images: imagesPaths,
    };

    if (req.body.marque) produitData.marque = req.body.marque;
    if (req.body.poids) produitData.poids = parseFloat(req.body.poids);
    if (dimensions) produitData.dimensions = dimensions;
    if (etiquettes.length > 0) produitData.etiquettes = etiquettes;

    const produit = await Produit.create(produitData);

    // Notifier les modérateurs et admin d'un nouveau produit
    try {
        if (produit.statut === 'en_attente') {
            const produitPopule = await Produit.findById(produit._id).populate(
                'vendeur',
                'nom email entreprise'
            );
            notifierNouveauProduit(produitPopule);
        }
    } catch (notifError) {
        console.error('Erreur notification produit:', notifError);
    }

    res.status(201).json({
        succes: true,
        donnees: produit,
        message: 'Produit créé avec succès',
    });
});

/**
 * Mettre à jour un produit existant
 */
const mettreAJourProduit = asyncHandler(async (req, res) => {
    let produit = await Produit.findById(req.params.id);
    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

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
 * Supprimer un produit
 */
const supprimerProduit = asyncHandler(async (req, res) => {
    const produit = await Produit.findById(req.params.id);
    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

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
 * Ajouter un avis à un produit
 */
const ajouterAvis = asyncHandler(async (req, res) => {
    const { note, commentaire, images } = req.body;
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    const dejaEvalue = produit.avis.find(
        avis => avis.utilisateur.toString() === req.utilisateur._id.toString()
    );

    if (dejaEvalue) {
        res.status(400);
        throw new Error('Vous avez déjà évalué ce produit');
    }

    const avis = {
        utilisateur: req.utilisateur._id,
        note: Number(note),
        commentaire,
        images: images || [],
        estVerifie: true,
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
 * Obtenir les produits similaires
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
 * Obtenir les produits populaires
 */
const obtenirProduitsPopulaires = asyncHandler(async (req, res) => {
    const limite = parseInt(req.query.limite) || 8;
    const produits = await Produit.find({ estActif: true })
        .sort({ 'evaluations.moyenne': -1, nombreVentes: -1 })
        .limit(limite)
        .select('nom prix images evaluations slug categorie nombreVentes');

    // formattage des URLs
    const baseUrl = req.protocol + '://' + req.get('host');
    const produitsFormates = produits.map(produit =>
        formaterUrlsImages(produit, baseUrl)
    );

    res.json({
        succes: true,
        donnees: produitsFormates,
    });
});

/**
 * Obtenir les nouveaux produits
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

/**
 * Obtenir les statistiques des produits
 */
const obtenirStatistiquesProduits = asyncHandler(async (req, res) => {
    try {
        const [total, actifs, enRupture, brouillons] = await Promise.all([
            Produit.countDocuments({ estActif: true }),
            Produit.countDocuments({ estActif: true, quantite: { $gt: 0 } }),
            Produit.countDocuments({ estActif: true, quantite: 0 }),
            Produit.countDocuments({ estActif: false }),
        ]);

        res.json({
            succes: true,
            total,
            actifs,
            enRupture,
            brouillons,
        });
    } catch (error) {
        console.error('Erreur stats produits:', error);
        res.status(500).json({
            succes: false,
            message: 'Erreur lors du calcul des statistiques',
            error: error.message,
        });
    }
});

/**
 * Obtenir les produits en vedette
 */
const obtenirProduitsVedettes = asyncHandler(async (req, res) => {
    try {
        const produits = await Produit.find({
            estEnVedette: true,
            estActif: true,
            statut: 'approuve',
        })
            .populate('categorie', 'nom slug')
            .populate('vendeur', 'nom entreprise')
            .sort({ createdAt: -1 })
            .limit(10);

        if (!produits || produits.length === 0) {
            return res.status(200).json({
                succes: true,
                donnees: [],
                message: 'Aucun produit en vedette pour le moment',
            });
        }

        const baseUrl = req.protocol + '://' + req.get('host');
        const produitsFormates = produits.map(produit =>
            formaterUrlsImages(produit, baseUrl)
        );

        res.status(200).json({
            succes: true,
            donnees: produitsFormates,
        });
    } catch (error) {
        console.error('Erreur récupération produits vedettes:', error);
        res.status(500).json({
            succes: false,
            erreur: 'Erreur serveur',
        });
    }
});

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
    obtenirStatistiquesProduits,
    obtenirProduitsVedettes,
};//