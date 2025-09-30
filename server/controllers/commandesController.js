// Importation des modules nécessaires
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Commande from '../models/commandeModel.js';
import Produit from '../models/produitModel.js';
import Utilisateur from '../models/utilisateurModel.js';

/**
 * @desc    Créer une commande
 * @route   POST /api/commandes
 * @access  Private
 */
const creerCommande = asyncHandler(async (req, res) => {
    // Démarrer une session pour la transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const {
        articles,
        adresseLivraison,
        adresseFacturation,
        methodeLivraison,
        methodePaiement,
        notesClient,
        devise, // Ajouter la devise depuis la requête
    } = req.body;

    try {
        // Vérifier le stock et calculer les totaux
        let sousTotal = 0;
        const articlesCommande = [];
        for (const article of articles) {
            const produit = await Produit.findById(article.produit).session(
                session
            );

            if (!produit) {
                throw new Error(`Produit non trouvé: ${article.produit}`);
            }
            if (produit.quantite < article.quantite) {
                throw new Error(`Stock insuffisant pour: ${produit.nom}`);
            }
            const totalArticle = produit.prix * article.quantite;
            sousTotal += totalArticle;
            articlesCommande.push({
                produit: produit._id,
                nom: produit.nom,
                prix: produit.prix,
                quantite: article.quantite,
                variante: article.variante,
                image: produit.images[0]?.url || '',
                sku: produit.sku,
            });
        }
        // Calculer les totaux (simplifié)
        const taxe = sousTotal * 0.2; // 20% de TVA
        const livraison = methodeLivraison?.cout || 0;
        const remise = 0; // À implémenter avec les coupons
        const total = sousTotal + taxe + livraison - remise;
        // Créer la commande
        const [commande] = await Commande.create(
            [
                {
                    client: req.utilisateur._id,
                    articles: articlesCommande,
                    sousTotal,
                    taxe,
                    livraison,
                    remise,
                    total,
                    adresseLivraison,
                    adresseFacturation: adresseFacturation || adresseLivraison,
                    methodeLivraison,
                    paiement: {
                        methode: methodePaiement,
                        statut: 'en_attente',
                    },
                    notesClient,
                    devise: devise || 'XOF',
                },
            ],
            { session }
        );

        // Mettre à jour le stock
        for (const article of articlesCommande) {
            await Produit.findByIdAndUpdate(
                article.produit,
                {
                    $inc: {
                        quantite: -article.quantite,
                        nombreVentes: article.quantite,
                    },
                },
                { session }
            );
        }

        // Mettre à jour l'utilisateur
        await Utilisateur.updateOne(
            { _id: req.utilisateur._id },
            {
                $push: { historiqueCommandes: commande._id },
                $set: { panier: [] },
            },
            { session }
        );

        await session.commitTransaction();
        res.status(201).json({
            succes: true,
            donnees: commande,
            message: 'Commande créée avec succès',
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400);
        throw new Error(error.message || 'Impossible de créer la commande');
    } finally {
        session.endSession();
    }
});

/**
 * @desc    Récupérer les commandes de l'utilisateur
 * @route   GET /api/commandes
 * @access  Private
 */
const obtenirMesCommandes = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const sauter = (page - 1) * limite;
    const commandes = await Commande.find({ client: req.utilisateur._id })
        .populate('articles.produit', 'nom images') // Un seul populate suffit
        .sort({ createdAt: -1 }) // Trier par date de création
        .skip(sauter) // Appliquer la pagination
        .limit(limite);
    const total = await Commande.countDocuments({
        client: req.utilisateur._id,
    });
    res.json({
        succes: true,
        donnees: commandes,
        pagination: {
            page,
            limite,
            total,
            pages: Math.ceil(total / limite),
        },
    });
});

/**
 * @desc    Récupérer une commande
 * @route   GET /api/commandes/:id
 * @access  Private
 */
const obtenirCommande = asyncHandler(async (req, res) => {
    const commande = await Commande.findById(req.params.id)
        .populate('client', 'prenom nom email')
        .populate('articles.produit', 'nom images slug');
    if (!commande) {
        res.status(404);
        throw new Error('Commande non trouvée');
    }
    // Vérifier que l'utilisateur peut voir cette commande
    if (
        req.utilisateur.role !== 'admin' &&
        commande.client._id.toString() !== req.utilisateur._id.toString()
    ) {
        res.status(403);
        throw new Error('Non autorisé à voir cette commande');
    }
    res.json({
        succes: true,
        donnees: commande,
    });
});

/**
 * @desc    Mettre à jour le statut d'une commande
 * @route   PUT /api/commandes/:id/statut
 * @access  Private/Admin
 */
const mettreAJourStatutCommande = asyncHandler(async (req, res) => {
    const { statut, note } = req.body;
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
        res.status(404);
        throw new Error('Commande non trouvée');
    }
    commande.statut = statut;

    if (note) {
        commande.notes.push({
            note,
            creePar: req.utilisateur._id,
            estInterne: true,
        });
    }
    await commande.save();
    res.json({
        succes: true,
        donnees: commande,
        message: 'Statut de commande mis à jour',
    });
});

/**
 * @desc    Annuler une commande
 * @route   PUT /api/commandes/:id/annuler
 * @access  Private
 */
const annulerCommande = asyncHandler(async (req, res) => {
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
        res.status(404);
        throw new Error('Commande non trouvée');
    }
    // Vérifier les permissions
    if (
        req.utilisateur.role !== 'admin' &&
        commande.client.toString() !== req.utilisateur._id.toString()
    ) {
        res.status(403);
        throw new Error('Non autorisé à annuler cette commande');
    }
    // Vérifier si l'annulation est possible
    if (!['en_attente', 'confirme', 'en_cours'].includes(commande.statut)) {
        res.status(400);
        throw new Error("Impossible d'annuler cette commande");
    }
    // Restaurer le stock
    for (const article of commande.articles) {
        await Produit.findByIdAndUpdate(article.produit, {
            $inc: {
                quantite: article.quantite,
                nombreVentes: -article.quantite,
            },
        });
    }
    commande.statut = 'annule';
    commande.raisonAnnulation = req.body.raison || 'Annulé par le client';
    await commande.save();
    res.json({
        succes: true,
        message: 'Commande annulée avec succès',
        donnees: commande,
    });
});

/**
 * @desc    Récupérer toutes les commandes (admin)
 * @route   GET /api/commandes/admin/toutes
 * @access  Private/Admin
 */
const obtenirToutesCommandes = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limite = 10,
        statut,
        client,
        dateDebut,
        dateFin,
    } = req.query;
    let requete = {};
    if (statut) requete.statut = statut;
    if (client) requete.client = client;
    if (dateDebut || dateFin) {
        requete.createdAt = {}; // Correction: utiliser createdAt
        if (dateDebut) requete.createdAt.$gte = new Date(dateDebut);
        if (dateFin) requete.createdAt.$lte = new Date(dateFin);
    }
    const sauter = (page - 1) * limite;
    const commandes = await Commande.find(requete)
        .populate('client', 'prenom nom email')
        .sort({ creeLe: -1 })
        .skip(sauter)
        .limit(Number(limite));
    const total = await Commande.countDocuments(requete);
    // Statistiques
    const stats = await Commande.aggregate([
        {
            $group: {
                _id: null,
                totalCommandes: { $sum: 1 },
                chiffreAffairesTotal: { $sum: '$total' },
                moyenneCommande: { $avg: '$total' },
            },
        },
    ]);
    res.json({
        succes: true,
        donnees: commandes,
        stats: stats[0] || {},
        pagination: {
            page: Number(page),
            limite: Number(limite),
            total,
            pages: Math.ceil(total / limite),
        },
    });
});

// Exportation des contrôleurs
export {
    creerCommande,
    obtenirMesCommandes,
    obtenirCommande,
    mettreAJourStatutCommande,
    annulerCommande,
    obtenirToutesCommandes,
};
