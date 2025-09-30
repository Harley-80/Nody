// Importation des modules nécessaires
import asyncHandler from 'express-async-handler';
import Stripe from 'stripe';
import Commande from '../models/commandeModel.js';
import Utilisateur from '../models/utilisateurModel.js';
import Paiement from '../models/paiementModel.js';
import config from '../config/env.js';
const stripe = new Stripe(config.stripeSecretKey);

/**
 * @desc    Créer un intent de paiement Stripe
 * @route   POST /api/paiements/creer-intent
 * @access  Private
 */
const creerIntentPaiement = asyncHandler(async (req, res) => {
    const { commandeId } = req.body;
    const commande = await Commande.findById(commandeId);
    if (!commande) {
        res.status(404);
        throw new Error('Commande non trouvée');
    }
    // Vérifier que la commande appartient à l'utilisateur
    if (commande.client.toString() !== req.utilisateur._id.toString()) {
        res.status(403);
        throw new Error('Non autorisé');
    }
    // Vérifier que la commande n'est pas déjà payée
    if (commande.paiement.statut === 'paye') {
        res.status(400);
        throw new Error('Commande déjà payée');
    }
    // Créer l'intent de paiement Stripe
    const intentPaiement = await stripe.paymentIntents.create({
        amount: Math.round(commande.total * 100), // Convertir en cents
        currency: commande.devise.toLowerCase(),
        metadata: {
            commandeId: commande._id.toString(),
            clientId: req.utilisateur._id.toString(),
        },
        description: `Paiement pour la commande ${commande.numeroCommande}`,
    });
    // Mettre à jour la commande avec l'ID de l'intent
    commande.paiement.idTransaction = intentPaiement.id;
    await commande.save();
    res.json({
        succes: true,
        donnees: {
            clientSecret: intentPaiement.client_secret,
            commandeId: commande._id,
        },
    });
});

/**
 * @desc    Confirmer un paiement réussi
 * @route   POST /api/paiements/confirmer
 * @access  Private
 */
const confirmerPaiement = asyncHandler(async (req, res) => {
    const { idIntentPaiement } = req.body;
    // Récupérer les détails du paiement depuis Stripe
    const intentPaiement = await stripe.paymentIntents.retrieve(
        idIntentPaiement
    );
    // Trouver la commande associée
    const commande = await Commande.findOne({
        'paiement.idTransaction': idIntentPaiement,
    });
    if (!commande) {
        res.status(404);
        throw new Error('Commande non trouvée');
    }
    // Vérifier le statut du paiement Stripe
    if (intentPaiement.status !== 'succeeded') {
        res.status(400);
        throw new Error('Paiement non réussi');
    }
    // Mettre à jour le statut de la commande
    commande.paiement.statut = 'paye';
    commande.paiement.datePaiement = new Date();
    commande.statut = 'confirme';
    await commande.save();
    // Créer un enregistrement de paiement
    let paiement;
    try {
        paiement = await Paiement.create({
            commande: commande._id,
            client: commande.client,
            montant: commande.total,
            devise: commande.devise,
            methodePaiement: 'stripe',
            passerellePaiement: 'stripe',
            statut: 'termine',
            idTransaction: idIntentPaiement,
            detailsFacturation: {
                prenom: commande.adresseFacturation.prenom,
                nom: commande.adresseFacturation.nom,
                email: req.utilisateur.email,
                adresse: {
                    rue: commande.adresseFacturation.rue,
                    ville: commande.adresseFacturation.ville,
                    etat: commande.adresseFacturation.etat,
                    pays: commande.adresseFacturation.pays,
                    codePostal: commande.adresseFacturation.codePostal,
                },
            },
            reponsePasserelle: intentPaiement,
        });
    } catch (error) {
        // Si le paiement existe déjà (créé par le webhook), on le récupère simplement.
        if (error.code === 11000) {
            paiement = await Paiement.findOne({
                idTransaction: idIntentPaiement,
            });
        } else {
            throw error;
        }
    }
    // Ajouter des points de fidélité
    const pointsFidelite = Math.floor(commande.total);
    await Utilisateur.findByIdAndUpdate(commande.client, {
        $inc: { pointsFidelite },
    });
    res.json({
        succes: true,
        donnees: paiement,
        message: 'Paiement confirmé avec succès',
    });
});

/**
 * @desc    Webhook Stripe pour les événements de paiement
 * @route   POST /api/paiements/webhook
 * @access  Public
 */
const gererWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    let evenement;
    try {
        evenement = stripe.webhooks.constructEvent(
            req.body,
            signature,
            config.stripeWebhookSecret
        );
    } catch (err) {
        console.error(
            'Vérification de la signature du webhook échouée:',
            err.message
        );
        return res.status(400).send(`Erreur Webhook: ${err.message}`);
    }
    // Gérer les différents types d'événements
    switch (evenement.type) {
        case 'payment_intent.succeeded':
            await gererIntentPaiementReussi(evenement.data.object);
            break;
        case 'payment_intent.payment_failed':
            await gererEchecPaiementIntent(evenement.data.object);
            break;
        case 'charge.refunded':
            await gererRemboursementCharge(evenement.data.object);
            break;
        default:
            console.log(`Type d'événement non géré: ${evenement.type}`);
    }
    res.json({ recu: true });
});

// Gestionnaire pour les paiements réussis
const gererIntentPaiementReussi = async intentPaiement => {
    const commande = await Commande.findOne({
        'paiement.idTransaction': intentPaiement.id,
    });
    if (commande && commande.paiement.statut !== 'paye') {
        commande.paiement.statut = 'paye';
        commande.paiement.datePaiement = new Date();
        commande.statut = 'confirme';
        await commande.save();
        await Paiement.create({
            commande: commande._id,
            client: commande.client,
            montant: commande.total,
            devise: commande.devise,
            methodePaiement: 'stripe',
            passerellePaiement: 'stripe',
            statut: 'termine',
            idTransaction: intentPaiement.id,
        });
    }
};

// Gestionnaire pour les échecs de paiement
const gererEchecPaiementIntent = async intentPaiement => {
    const commande = await Commande.findOne({
        'paiement.idTransaction': intentPaiement.id,
    });
    if (commande) {
        commande.paiement.statut = 'echoue';
        commande.paiement.messageErreur =
            intentPaiement.last_payment_error?.message;
        await commande.save();
    }
};

// Gestionnaire pour les remboursements
const gererRemboursementCharge = async charge => {
    const paiement = await Paiement.findOne({
        idTransaction: charge.payment_intent,
    });
    if (paiement) {
        const montantRembourse = charge.amount_refunded / 100;
        paiement.remboursements.push({
            montant: montantRembourse,
            raison: 'Remboursement Stripe',
            idRemboursementPasserelle: charge.id,
        });
        paiement.statut =
            montantRembourse >= paiement.montant
                ? 'rembourse'
                : 'partiellement_rembourse';
        await paiement.save();
        // Mettre à jour la commande associée
        const commande = await Commande.findById(paiement.commande);
        if (commande) {
            commande.paiement.montantRemboursement = montantRembourse;
            commande.paiement.statut = paiement.statut;
            await commande.save();
        }
    }
};

/**
 * @desc    Demander un remboursement
 * @route   POST /api/paiements/:commandeId/remboursement
 * @access  Private/Admin
 */
const demanderRemboursement = asyncHandler(async (req, res) => {
    const { commandeId } = req.params;
    const { montant, raison } = req.body;
    const commande = await Commande.findById(commandeId);
    if (!commande) {
        res.status(404);
        throw new Error('Commande non trouvée');
    }
    if (commande.paiement.statut !== 'paye') {
        res.status(400);
        throw new Error('Seules les commandes payées peuvent être remboursées');
    }
    const montantRemboursement = montant || commande.total;
    // Créer le remboursement Stripe
    const remboursement = await stripe.refunds.create({
        payment_intent: commande.paiement.idTransaction,
        amount: Math.round(montantRemboursement * 100),
        reason: raison || 'requested_by_customer',
    });
    // Mettre à jour la commande et le paiement
    commande.paiement.montantRemboursement = montantRemboursement;
    commande.paiement.statut =
        montantRemboursement >= commande.total
            ? 'rembourse'
            : 'partiellement_rembourse';
    await commande.save();
    const paiement = await Paiement.findOne({ commande: commandeId });
    if (paiement) {
        paiement.remboursements.push({
            montant: montantRemboursement,
            raison,
            idRemboursementPasserelle: remboursement.id,
        });
        paiement.statut = commande.paiement.statut;
        await paiement.save();
    }
    res.json({
        succes: true,
        message: 'Remboursement effectué avec succès',
        donnees: remboursement,
    });
});

// Exportation des contrôleurs
export {
    creerIntentPaiement,
    confirmerPaiement,
    gererWebhook,
    demanderRemboursement,
};
