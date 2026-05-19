import asyncHandler from 'express-async-handler';
import Produit from '../models/produitModel.js';
import Categorie from '../models/categorieModel.js';
import { notifierNouveauProduit } from '../services/websocketService.js';

/**
 * Formater les URLs des images avec l'URL complète
 * ✅ CORRIGÉ: Gère maintenant le format [String] ET les anciens objets
 */
const formaterUrlsImages = (produit, baseUrl) => {
    const produitObj = produit.toObject ? produit.toObject() : { ...produit };

    if (produitObj.images && Array.isArray(produitObj.images)) {
        produitObj.images = produitObj.images.map(image => {
            // Gérer le cas où c'est un objet (ancien format)
            let imagePath =
                typeof image === 'string' ? image : image.url || image;

            // Si déjà une URL complète, garder tel quel
            if (imagePath.startsWith('http')) {
                return imagePath;
            }

            // Sinon, construire l'URL complète
            // Supprimer le slash initial si présent pour éviter double slash
            const cleanPath = imagePath.startsWith('/')
                ? imagePath.slice(1)
                : imagePath;
            return `${baseUrl}/${cleanPath}`;
        });
    }

    return produitObj;
};

/**
 * @desc    Obtenir tous les produits avec filtres et pagination
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

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const produitsFormates = produits.map(p => formaterUrlsImages(p, baseUrl));

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
 * @desc    Obtenir un produit par ID ou slug
 */
const obtenirProduit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let produit;

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

    produit = await Produit.findOne(query)
        .populate('categorie', 'nom slug')
        .populate('sousCategorie', 'nom slug')
        .populate('avis.utilisateur', 'prenom nom avatar');

    if (!produit || !produit.estActif) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const produitFormate = formaterUrlsImages(produit, baseUrl);

    produit.nombreVues += 1;
    await produit.save();

    res.json({
        succes: true,
        donnees: produitFormate,
    });
});

/**
 * @desc    Créer un nouveau produit (Admin/Vendeur)
 * ✅ CORRIGÉ: Stocke maintenant les images comme tableau de strings
 */
const creerProduit = asyncHandler(async (req, res) => {
    // Garde-fou : au moins une image obligatoire
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Au moins une image produit est obligatoire',
        });
    }

    // ✅ CORRECTION: Stocker uniquement les chemins (strings)
    const images = req.files.map(file => `uploads/produits/${file.filename}`);

    // Parsing sécurisé des données JSON
    let dimensions,
        etiquettes = [];
    try {
        if (req.body.dimensions)
            dimensions =
                typeof req.body.dimensions === 'string'
                    ? JSON.parse(req.body.dimensions)
                    : req.body.dimensions;
        if (req.body.etiquettes)
            etiquettes =
                typeof req.body.etiquettes === 'string'
                    ? JSON.parse(req.body.etiquettes)
                    : req.body.etiquettes;
    } catch (e) {
        console.error('Erreur parsing champs complexes:', e);
    }

    const produit = await Produit.create({
        ...req.body,
        images, // ✅ Tableau de strings
        dimensions,
        etiquettes,
        vendeur: req.utilisateur._id,
        estActif: req.body.estActif === 'true' || req.body.estActif === true,
    });

    // Notification WebSocket
    try {
        if (produit.statut === 'en_attente') {
            const produitPopule = await Produit.findById(produit._id).populate(
                'vendeur',
                'nom email entreprise'
            );
            notifierNouveauProduit(produitPopule);
        }
    } catch (notifError) {
        console.error('Erreur notification:', notifError);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({
        succes: true,
        donnees: formaterUrlsImages(produit, baseUrl),
        message: 'Produit créé avec succès',
    });
});

/**
 * @desc    Mettre à jour un produit
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

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
        succes: true,
        donnees: formaterUrlsImages(produit, baseUrl),
        message: 'Produit mis à jour avec succès',
    });
});

/**
 * @desc    Supprimer un produit
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
    res.json({ succes: true, message: 'Produit supprimé avec succès' });
});

/**
 * @desc    Ajouter un avis
 */
const ajouterAvis = asyncHandler(async (req, res) => {
    const { note, commentaire, images } = req.body;
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    const dejaEvalue = produit.avis.find(
        a => a.utilisateur.toString() === req.utilisateur._id.toString()
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
        message: 'Avis ajouté',
        donnees: produit.avis,
    });
});

/**
 * @desc    Produits similaires & populaires (Formatage inclus)
 */
const obtenirProduitsSimilaires = asyncHandler(async (req, res) => {
    const produit = await Produit.findById(req.params.id);
    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    const produits = await Produit.find({
        _id: { $ne: produit._id },
        categorie: produit.categorie,
        estActif: true,
    })
        .limit(8)
        .select('nom prix images evaluations slug');

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
        succes: true,
        donnees: produits.map(p => formaterUrlsImages(p, baseUrl)),
    });
});

const obtenirProduitsPopulaires = asyncHandler(async (req, res) => {
    const limite = parseInt(req.query.limite) || 8;
    const produits = await Produit.find({ estActif: true })
        .sort({ 'evaluations.moyenne': -1, nombreVentes: -1 })
        .limit(limite);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
        succes: true,
        donnees: produits.map(p => formaterUrlsImages(p, baseUrl)),
    });
});

const obtenirNouveauxProduits = asyncHandler(async (req, res) => {
    const limite = parseInt(req.query.limite) || 8;
    const produits = await Produit.find({ estActif: true, estNouveau: true })
        .sort({ creeLe: -1 })
        .limit(limite);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
        succes: true,
        donnees: produits.map(p => formaterUrlsImages(p, baseUrl)),
    });
});

const obtenirStatistiquesProduits = asyncHandler(async (req, res) => {
    const [total, actifs, enRupture, brouillons] = await Promise.all([
        Produit.countDocuments({ estActif: true }),
        Produit.countDocuments({ estActif: true, quantite: { $gt: 0 } }),
        Produit.countDocuments({ estActif: true, quantite: 0 }),
        Produit.countDocuments({ estActif: false }),
    ]);
    res.json({ succes: true, total, actifs, enRupture, brouillons });
});

const obtenirProduitsVedettes = asyncHandler(async (req, res) => {
    const produits = await Produit.find({ estEnVedette: true, estActif: true })
        .populate('categorie', 'nom slug')
        .limit(10);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
        succes: true,
        donnees: produits.map(p => formaterUrlsImages(p, baseUrl)),
    });
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
};
