import asyncHandler from 'express-async-handler';
import Produit from '../models/produitModel.js';
import Categorie from '../models/categorieModel.js';
import Commande from '../models/commandeModel.js';
import Utilisateur from '../models/utilisateurModel.js';

/**
 * Formater les URLs des images avec l'URL complète
 */
const formaterUrlsImages = (produit, baseUrl) => {
    const produitObj = produit.toObject ? produit.toObject() : { ...produit };

    if (produitObj.images && Array.isArray(produitObj.images)) {
        produitObj.images = produitObj.images.map(imagePath => {
            // Si déjà une URL complète, garder tel quel
            if (typeof imagePath === 'string' && imagePath.startsWith('http')) {
                return imagePath;
            }
            // Construire l'URL complète
            const cleanPath = imagePath.startsWith('/')
                ? imagePath.slice(1)
                : imagePath;
            return `${baseUrl}/${cleanPath}`;
        });
    }

    return produitObj;
};

// @desc    Obtenir les statistiques vendeur (avec filtres)
// @route   GET /api/vendeur/statistiques
// @access  Private/Vendeur
const getStatistiques = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const { periode, dateDebut, dateFin } = req.query;

    let filtreDate = {};
    const maintenant = new Date();

    if (periode === '7j') {
        const dateDebut = new Date(maintenant);
        dateDebut.setDate(dateDebut.getDate() - 7);
        filtreDate.createdAt = { $gte: dateDebut };
    } else if (periode === 'mois') {
        const dateDebut = new Date(
            maintenant.getFullYear(),
            maintenant.getMonth(),
            1
        );
        filtreDate.createdAt = { $gte: dateDebut };
    } else if (periode === 'trimestre') {
        const moisActuel = maintenant.getMonth();
        const trimestreDebut = Math.floor(moisActuel / 3) * 3;
        const dateDebut = new Date(maintenant.getFullYear(), trimestreDebut, 1);
        filtreDate.createdAt = { $gte: dateDebut };
    } else if (periode === 'annee') {
        const dateDebut = new Date(maintenant.getFullYear(), 0, 1);
        filtreDate.createdAt = { $gte: dateDebut };
    } else if (dateDebut && dateFin) {
        filtreDate.createdAt = {
            $gte: new Date(dateDebut),
            $lte: new Date(dateFin),
        };
    }

    const totalProduits = await Produit.countDocuments({
        vendeur: vendeurId,
        ...filtreDate,
    });
    const produitsActifs = await Produit.countDocuments({
        vendeur: vendeurId,
        statut: 'actif',
        ...filtreDate,
    });
    const produitsEnAttente = await Produit.countDocuments({
        vendeur: vendeurId,
        statut: 'en_attente',
        ...filtreDate,
    });

    const totalCommandes = await Commande.countDocuments({
        'produits.vendeur': vendeurId,
        ...filtreDate,
    });

    const chiffreAffaires = await Commande.aggregate([
        { $unwind: '$produits' },
        {
            $match: {
                'produits.vendeur': vendeurId,
                statut: 'livree',
                ...filtreDate,
            },
        },
        { $group: { _id: null, total: { $sum: '$produits.prix' } } },
    ]);

    const commandesEnAttente = await Commande.countDocuments({
        'produits.vendeur': vendeurId,
        statut: 'en_attente',
        ...filtreDate,
    });
    const commandesLivrees = await Commande.countDocuments({
        'produits.vendeur': vendeurId,
        statut: 'livree',
        ...filtreDate,
    });

    const tauxConversion =
        totalCommandes > 0 ? (commandesLivrees / totalCommandes) * 100 : 0;

    const panierMoyen = await Commande.aggregate([
        { $unwind: '$produits' },
        {
            $match: {
                'produits.vendeur': vendeurId,
                statut: 'livree',
                ...filtreDate,
            },
        },
        { $group: { _id: '$_id', montant: { $sum: '$produits.prix' } } },
        { $group: { _id: null, moyenne: { $avg: '$montant' } } },
    ]);

    res.json({
        succes: true,
        data: {
            totalProduits,
            produitsActifs,
            produitsEnAttente,
            totalCommandes,
            chiffreAffaires: chiffreAffaires[0]?.total || 0,
            tauxConversion: parseFloat(tauxConversion.toFixed(2)),
            panierMoyen: panierMoyen[0]?.moyenne || 0,
            commandesEnAttente,
            commandesLivrees,
        },
        meta: {
            periode: periode || 'global',
            dateDebut: filtreDate.createdAt?.$gte || null,
            dateFin: filtreDate.createdAt?.$lte || null,
        },
    });
});

// @desc    Obtenir l'évolution des ventes (pour graphiques)
// @route   GET /api/vendeur/statistiques/evolution
// @access  Private/Vendeur
const getEvolutionVentes = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const { periode = '7j' } = req.query;

    let groupBy = '$dayOfWeek';
    let dateDebut = new Date();
    let formatDate = '%d-%m';

    if (periode === '7j') {
        dateDebut.setDate(dateDebut.getDate() - 7);
        groupBy = { $dayOfWeek: '$createdAt' };
        formatDate = '%a %d-%m';
    } else if (periode === 'mois') {
        dateDebut.setMonth(dateDebut.getMonth() - 1);
        groupBy = { $dayOfMonth: '$createdAt' };
        formatDate = '%d-%m';
    } else if (periode === 'annee') {
        dateDebut.setFullYear(dateDebut.getFullYear() - 1);
        groupBy = { $month: '$createdAt' };
        formatDate = '%b %Y';
    }

    const evolution = await Commande.aggregate([
        { $unwind: '$produits' },
        {
            $match: {
                'produits.vendeur': vendeurId,
                createdAt: { $gte: dateDebut },
            },
        },
        {
            $group: {
                _id: groupBy,
                ventes: { $sum: 1 },
                revenu: { $sum: '$produits.prix' },
                date: { $first: '$createdAt' },
            },
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                jour: { $dateToString: { format: formatDate, date: '$date' } },
                ventes: 1,
                revenu: 1,
            },
        },
    ]);

    const joursAttendus = periode === '7j' ? 7 : periode === 'mois' ? 30 : 12;
    const evolutionComplete = Array(joursAttendus)
        .fill()
        .map((_, i) => {
            const jour = evolution.find((_, index) => index === i);
            return jour || { jour: `J${i + 1}`, ventes: 0, revenu: 0 };
        });

    res.json({
        succes: true,
        data: evolution.length > 0 ? evolution : evolutionComplete,
    });
});

// @desc    Obtenir les données de performance (graphiques)
// @route   GET /api/vendeur/statistiques/performance
// @access  Private/Vendeur
const getDonneesPerformance = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const { periode = '7j' } = req.query;

    const dateDebut = new Date();
    if (periode === '7j') dateDebut.setDate(dateDebut.getDate() - 7);
    else if (periode === 'mois') dateDebut.setMonth(dateDebut.getMonth() - 1);

    const performance = await Commande.aggregate([
        { $unwind: '$produits' },
        {
            $match: {
                'produits.vendeur': vendeurId,
                createdAt: { $gte: dateDebut },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                ventes: { $sum: 1 },
                revenu: { $sum: '$produits.prix' },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const labels = performance.map(item => {
        const date = new Date(item._id);
        return periode === '7j'
            ? date.toLocaleDateString('fr-FR', { weekday: 'short' })
            : date.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
              });
    });

    res.json({
        succes: true,
        data: {
            labels,
            ventes: performance.map(item => item.ventes),
            revenus: performance.map(item => item.revenu),
        },
    });
});

// @desc    Obtenir les produits du vendeur
// @route   GET /api/vendeur/produits
// @access  Private/Vendeur
const getMesProduits = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
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

    // ✅ AJOUT: Formater les URLs des images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const produitsFormates = produits.map(p => formaterUrlsImages(p, baseUrl));

    res.json({
        succes: true,
        data: {
            produits: produitsFormates,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total,
                limit,
            },
        },
    });
});

// @desc    Récupérer un produit spécifique du vendeur
// @route   GET /api/vendeur/produits/:id
// @access  Privé (Vendeur)
const getProduit = asyncHandler(async (req, res) => {
    const produit = await Produit.findById(req.params.id)
        .populate('categorie', 'nom')
        .populate('vendeur', 'nom email');

    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    if (produit.vendeur._id.toString() !== req.utilisateur._id.toString()) {
        res.status(403);
        throw new Error('Non autorisé à accéder à ce produit');
    }

    // ✅ AJOUT: Formater les URLs des images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const produitFormate = formaterUrlsImages(produit, baseUrl);

    res.status(200).json({
        succes: true,
        data: produitFormate,
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
        caracteristiques,
        marque,
        etiquettes,
        stock,
        tags,
    } = req.body;

    if (!req.files || req.files.length === 0) {
        return res
            .status(400)
            .json({
                success: false,
                message: 'Au moins une image est requise',
            });
    }

    const imagesArray = req.files.map(
        file => `uploads/produits/${file.filename}`
    );
    let caracteristiquesParsed = [],
        etiquettesParsed = [],
        tagsParsed = [];

    try {
        if (caracteristiques)
            caracteristiquesParsed =
                typeof caracteristiques === 'string'
                    ? JSON.parse(caracteristiques)
                    : caracteristiques;
        if (etiquettes)
            etiquettesParsed =
                typeof etiquettes === 'string'
                    ? JSON.parse(etiquettes)
                    : etiquettes;
        if (tags)
            tagsParsed = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (e) {
        console.error('Erreur parsing JSON:', e);
    }

    const produit = await Produit.create({
        nom,
        description,
        prix,
        categorie,
        quantite: stock || quantite || 0,
        images: imagesArray,
        caracteristiques: caracteristiquesParsed,
        marque,
        etiquettes: etiquettesParsed.length > 0 ? etiquettesParsed : tagsParsed,
        vendeur: req.utilisateur._id,
        statut: 'en_attente',
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
    if (
        !produit ||
        produit.vendeur.toString() !== req.utilisateur._id.toString()
    ) {
        res.status(produit ? 403 : 404);
        throw new Error(produit ? 'Non autorisé' : 'Produit non trouvé');
    }

    const produitModifie = await Produit.findByIdAndUpdate(
        req.params.id,
        { ...req.body, statut: 'en_attente' },
        { new: true, runValidators: true }
    ).populate('categorie', 'nom');

    res.json({
        succes: true,
        message: 'Produit modifié avec succès',
        data: produitModifie,
    });
});

// @desc    Supprimer un produit
// @route   DELETE /api/vendeur/produits/:id
// @access  Private/Vendeur
const supprimerProduit = asyncHandler(async (req, res) => {
    const produit = await Produit.findById(req.params.id);
    if (
        !produit ||
        produit.vendeur.toString() !== req.utilisateur._id.toString()
    ) {
        res.status(produit ? 403 : 404);
        throw new Error(produit ? 'Non autorisé' : 'Produit non trouvé');
    }

    await Produit.findByIdAndDelete(req.params.id);
    res.json({ succes: true, message: 'Produit supprimé avec succès' });
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
            pagination: { page, pages: Math.ceil(total / limit), total, limit },
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

    const produitCommande = commande.produits.find(
        p =>
            p._id.toString() === produitId &&
            p.vendeur.toString() === req.utilisateur._id.toString()
    );
    if (!produitCommande) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    produitCommande.statutVendeur = statut;
    await commande.save();
    res.json({ succes: true, message: 'Statut mis à jour', data: commande });
});

// @desc    Obtenir les produits les plus vendus du vendeur
// @route   GET /api/vendeur/produits/populaires
// @access  Private/Vendeur
const obtenirProduitsPopulairesVendeur = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const limite = parseInt(req.query.limite) || 4;

    const produits = await Produit.find({ vendeur: vendeurId, statut: 'actif' })
        .sort({ nombreVentes: -1 })
        .limit(limite)
        .select('nom nombreVentes prix images');

    // ✅ AJOUT: Formater les URLs des images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const produitsFormates = produits.map(p => formaterUrlsImages(p, baseUrl));

    res.json({
        succes: true,
        data: produitsFormates,
    });
});

// @desc    Obtenir les commandes récentes du vendeur
// @route   GET /api/vendeur/commandes/recentes
// @access  Private/Vendeur
const obtenirCommandesRecentes = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const limite = parseInt(req.query.limite) || 5;

    const commandes = await Commande.find({ 'produits.vendeur': vendeurId })
        .populate('utilisateur', 'nom prenom')
        .sort({ createdAt: -1 })
        .limit(limite)
        .select('numeroCommande montantTotal statut createdAt');

    res.json({ succes: true, data: commandes });
});

// @desc    Obtenir les informations de la boutique du vendeur
// @route   GET /api/vendeur/boutique
// @access  Private/Vendeur
const getMaBoutique = asyncHandler(async (req, res) => {
    const vendeur = await Utilisateur.findById(req.utilisateur._id).select(
        'boutique nom prenom email'
    );
    res.json({ succes: true, data: vendeur });
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
    res.json({ succes: true, message: 'Boutique mise à jour', data: vendeur });
});

// @desc    Générer un rapport de ventes
// @route   GET /api/vendeur/rapports/ventes
// @access  Private/Vendeur
const genererRapportVentes = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const { periode } = req.query;

    let dateDebut = new Date();
    if (periode === '7j') dateDebut.setDate(dateDebut.getDate() - 7);
    else if (periode === 'mois') dateDebut.setMonth(dateDebut.getMonth() - 1);
    else if (periode === 'annee')
        dateDebut.setFullYear(dateDebut.getFullYear() - 1);

    const ventes = await Commande.aggregate([
        { $unwind: '$produits' },
        {
            $match: {
                'produits.vendeur': vendeurId,
                createdAt: { $gte: dateDebut },
            },
        },
        {
            $group: {
                _id: null,
                totalVentes: { $sum: 1 },
                totalRevenu: { $sum: '$produits.prix' },
                produitsVendus: { $addToSet: '$produits.nom' },
            },
        },
        {
            $project: {
                totalVentes: 1,
                totalRevenu: 1,
                nombreProduits: { $size: '$produitsVendus' },
            },
        },
    ]);

    res.json({
        succes: true,
        data: ventes[0] || {
            totalVentes: 0,
            totalRevenu: 0,
            nombreProduits: 0,
        },
    });
});

export {
    getStatistiques,
    getMesProduits,
    getProduit,
    creerProduit,
    modifierProduit,
    supprimerProduit,
    getMesCommandes,
    mettreAJourStatutProduit,
    obtenirProduitsPopulairesVendeur,
    obtenirCommandesRecentes,
    getMaBoutique,
    mettreAJourBoutique,
    genererRapportVentes,
    getEvolutionVentes,
    getDonneesPerformance,
};
