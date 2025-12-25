import asyncHandler from 'express-async-handler';
import Produit from '../models/produitModel.js';
import Categorie from '../models/categorieModel.js';
import Commande from '../models/commandeModel.js';
import Utilisateur from '../models/utilisateurModel.js';

// @desc    Obtenir les statistiques vendeur (avec filtres)
// @route   GET /api/vendeur/statistiques
// @access  Private/Vendeur
const getStatistiques = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const { periode, dateDebut, dateFin } = req.query;

    // Filtre par période
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

    // Statistiques des produits
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

    // Statistiques des commandes
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

    // Taux de conversion (exemple simplifié)
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

    // Panier moyen
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
        groupBy = {
            $dayOfWeek: '$createdAt',
        };
        formatDate = '%a %d-%m';
    } else if (periode === 'mois') {
        dateDebut.setMonth(dateDebut.getMonth() - 1);
        groupBy = {
            $dayOfMonth: '$createdAt',
        };
        formatDate = '%d-%m';
    } else if (periode === 'annee') {
        dateDebut.setFullYear(dateDebut.getFullYear() - 1);
        groupBy = {
            $month: '$createdAt',
        };
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

    // Remplir les jours manquants avec des zéros
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
// @route   GET /api/vendeur/statistiques/performance?periode=7j
// @access  Private/Vendeur
const getDonneesPerformance = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const { periode = '7j' } = req.query;

    // Logique similaire à getEvolutionVentes, mais adaptée pour les performances
    const dateDebut = new Date();
    if (periode === '7j') {
        dateDebut.setDate(dateDebut.getDate() - 7);
    } else if (periode === 'mois') {
        dateDebut.setMonth(dateDebut.getMonth() - 1);
    }

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

    // Formater les labels et données pour Recharts
    const labels = performance.map(item => {
        const date = new Date(item._id);
        return periode === '7j'
            ? date.toLocaleDateString('fr-FR', { weekday: 'short' })
            : date.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
              });
    });

    const ventes = performance.map(item => item.ventes);
    const revenus = performance.map(item => item.revenu);

    res.json({
        succes: true,
        data: {
            labels,
            ventes,
            revenus,
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

    res.status(200).json({
        succes: true,
        data: produit,
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
    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    if (produit.vendeur.toString() !== req.utilisateur._id.toString()) {
        res.status(403);
        throw new Error('Non autorisé à modifier ce produit');
    }

    const produitModifie = await Produit.findByIdAndUpdate(
        req.params.id,
        {
            ...req.body,
            statut: 'en_attente',
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

// @desc    Obtenir les produits les plus vendus du vendeur
// @route   GET /api/vendeur/produits/populaires
// @access  Private/Vendeur
const obtenirProduitsPopulairesVendeur = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const limite = parseInt(req.query.limite) || 4;

    const produits = await Produit.find({
        vendeur: vendeurId,
        statut: 'actif',
    })
        .sort({ nombreVentes: -1 })
        .limit(limite)
        .select('nom nombreVentes prix images');

    res.json({
        succes: true,
        data: produits,
    });
});

// @desc    Obtenir les commandes récentes du vendeur
// @route   GET /api/vendeur/commandes/recentes
// @access  Private/Vendeur
const obtenirCommandesRecentes = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const limite = parseInt(req.query.limite) || 5;

    const commandes = await Commande.find({
        'produits.vendeur': vendeurId,
    })
        .populate('utilisateur', 'nom prenom')
        .sort({ createdAt: -1 })
        .limit(limite)
        .select('numeroCommande montantTotal statut createdAt');

    res.json({
        succes: true,
        data: commandes,
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

// @desc    Générer un rapport de ventes
// @route   GET /api/vendeur/rapports/ventes
// @access  Private/Vendeur
const genererRapportVentes = asyncHandler(async (req, res) => {
    const vendeurId = req.utilisateur._id;
    const { periode } = req.query;

    let dateDebut = new Date();
    if (periode === '7j') {
        dateDebut.setDate(dateDebut.getDate() - 7);
    } else if (periode === 'mois') {
        dateDebut.setMonth(dateDebut.getMonth() - 1);
    } else if (periode === 'annee') {
        dateDebut.setFullYear(dateDebut.getFullYear() - 1);
    }

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
};// la  