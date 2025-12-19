import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Commande from '../models/commandeModel.js';
import Produit from '../models/produitModel.js';
import Utilisateur from '../models/utilisateurModel.js';
import vendeurNotificationService from '../services/vendeurNotificationService.js'; // 1. NOUVEL IMPORT

// Simulation d'un logger global pour les besoins du code
const logger = {
    info: message => console.log(`INFO: ${message}`),
    error: (message, error) => console.error(`ERROR: ${message}`, error),
};

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
        const produitsAMettreAJour = []; // Stocker les articles avec infos vendeur/produit complets

        for (const article of articles) {
            const produit = await Produit.findById(article.produit)
                .session(session)
                .populate('vendeur', '_id'); // Populater le vendeur pour les notifications

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

            // Préparer pour la mise à jour du stock et les notifications
            produitsAMettreAJour.push({
                produitId: produit._id,
                quantite: article.quantite,
                vendeurId: produit.vendeur?._id,
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

        // Mettre à jour le stock et alerter le stock faible
        for (const articleAUpdater of produitsAMettreAJour) {
            // Mettre à jour le stock
            const produitMisAJour = await Produit.findByIdAndUpdate(
                articleAUpdater.produitId,
                {
                    $inc: {
                        quantite: -articleAUpdater.quantite,
                        nombreVentes: articleAUpdater.quantite,
                    },
                },
                { new: true, session } // 'new: true' pour obtenir le document mis à jour
            );

            // 3. ALERTE STOCK FAIBLE
            if (produitMisAJour.quantite < 10 && articleAUpdater.vendeurId) {
                try {
                    await vendeurNotificationService.notifierStockFaible(
                        articleAUpdater.vendeurId,
                        produitMisAJour,
                        produitMisAJour.quantite
                    );
                    logger.info(
                        `Alerte stock faible envoyée pour produit ${produitMisAJour._id}`
                    );
                } catch (notifError) {
                    logger.error(
                        'Erreur notification stock faible :',
                        notifError
                    );
                }
            }
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

        // Récupérer la commande pour les notifications (avec les détails du vendeur)
        const commandePopulee = await Commande.findById(commande._id).populate({
            path: 'articles.produit',
            select: 'vendeur nom prix quantite images',
            populate: {
                path: 'vendeur',
                select: 'nom email',
            },
        });

        // 2. NOTIFIER CHAQUE VENDEUR CONCERNÉ
        const vendeursNotifies = new Set();

        // On itère sur la commande populée après le commit pour éviter les problèmes de transaction
        for (const article of commandePopulee.articles) {
            if (article.produit?.vendeur) {
                vendeursNotifies.add(article.produit.vendeur._id.toString());
            }
        }

        for (const vendeurId of vendeursNotifies) {
            try {
                await vendeurNotificationService.notifierNouvelleCommande(
                    vendeurId,
                    commandePopulee // Utiliser la commande populée complète
                );
                logger.info(
                    `Notification nouvelle commande envoyée au vendeur ${vendeurId}`
                );
            } catch (notifError) {
                logger.error(
                    `Erreur notification vendeur ${vendeurId} :`,
                    notifError
                );
            }
        }

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

// ... Autres fonctions

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
    const commande = await Commande.findById(req.params.id).populate({
        path: 'articles.produit',
        select: 'vendeur nom prix',
        populate: {
            path: 'vendeur',
            select: 'nom email',
        },
    }); // Populater pour les notifications

    if (!commande) {
        res.status(404);
        throw new Error('Commande non trouvée');
    }

    const ancienStatut = commande.statut; // Définir l'ancien statut

    commande.statut = statut;

    if (note) {
        commande.notes.push({
            note,
            creePar: req.utilisateur._id,
            estInterne: true,
        });
    }

    await commande.save();

    // 4. NOTIFIER LE(S) VENDEUR(S)
    const vendeursNotifies = new Set();

    for (const article of commande.articles) {
        // Le produit est déjà populé dans la requête findById
        if (article.produit?.vendeur) {
            vendeursNotifies.add(article.produit.vendeur._id.toString());
        }
    }

    for (const vendeurId of vendeursNotifies) {
        try {
            await vendeurNotificationService.notifierMiseAJourCommande(
                vendeurId,
                commande,
                ancienStatut,
                statut
            );
            logger.info(
                `Notification mise à jour commande envoyée au vendeur ${vendeurId}`
            );
        } catch (notifError) {
            logger.error(
                `Erreur notification vendeur ${vendeurId} :`,
                notifError
            );
        }
    }

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
        .sort({ createdAt: -1 }) // Utiliser 'createdAt' pour le tri, car 'creeLe' n'est pas standard Mongoose
        .skip(sauter)
        .limit(Number(limite));

    const total = await Commande.countDocuments(requete);

    // Statistiques
    const stats = await Commande.aggregate([
        {
            $match: requete, // Appliquer les filtres de la requête aux statistiques
        },
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