// Importation des modules nécessaires
import Stripe from 'stripe';
import config from '../config/env.js';
import logger from '../utils/logger.js';

const stripe = new Stripe(config.stripeSecretKey);

/**
 * Créer un client Stripe
 * @param {Object} utilisateur - Utilisateur pour lequel créer le client Stripe
 * @returns {Object} Client Stripe créé
 */
const creerClient = async utilisateur => {
    try {
        const client = await stripe.customers.create({
            email: utilisateur.email,
            name: `${utilisateur.prenom} ${utilisateur.nom}`,
            metadata: {
                utilisateurId: utilisateur._id.toString(),
            },
        });
        return client;
    } catch (erreur) {
        logger.error('Erreur lors de la création du client Stripe:', erreur);
        throw erreur;
    }
};

/**
 * Créer un intent de paiement
 * @param {Number} montant - Montant du paiement
 * @param {String} devise - Devise du paiement
 * @param {String} clientId - ID du client Stripe
 * @param {Object} metadonnees - Métadonnées supplémentaires
 * @returns {Object} Intent de paiement créé
 */
const creerIntentPaiement = async (
    montant,
    devise,
    clientId,
    metadonnees = {}
) => {
    try {
        const intentPaiement = await stripe.paymentIntents.create({
            amount: Math.round(montant * 100), // Convertir en cents
            currency: devise.toLowerCase(),
            customer: clientId,
            metadata: metadonnees,
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return intentPaiement;
    } catch (erreur) {
        logger.error(
            "Erreur lors de la création de l'intent de paiement:",
            erreur
        );
        throw erreur;
    }
};

/**
 * Confirmer un paiement
 * @param {String} idIntentPaiement - ID de l'intent de paiement
 * @returns {Object} Intent de paiement confirmé
 */
const confirmerPaiement = async idIntentPaiement => {
    try {
        const intentPaiement = await stripe.paymentIntents.retrieve(
            idIntentPaiement
        );
        return intentPaiement;
    } catch (erreur) {
        logger.error('Erreur lors de la confirmation du paiement:', erreur);
        throw erreur;
    }
};

/**
 * Créer un remboursement
 * @param {String} idIntentPaiement - ID de l'intent de paiement
 * @param {Number} montant - Montant à rembourser
 * @param {String} raison - Raison du remboursement
 * @returns {Object} Remboursement créé
 */
const creerRemboursement = async (
    idIntentPaiement,
    montant,
    raison = 'requested_by_customer'
) => {
    try {
        const remboursement = await stripe.refunds.create({
            payment_intent: idIntentPaiement,
            amount: Math.round(montant * 100),
            reason: raison,
        });
        return remboursement;
    } catch (erreur) {
        logger.error('Erreur lors de la création du remboursement:', erreur);
        throw erreur;
    }
};

/**
 * Récupérer les méthodes de paiement d'un client
 * @param {String} clientId - ID du client Stripe
 * @returns {Array} Liste des méthodes de paiement
 */
const obtenirMethodesPaiementClient = async clientId => {
    try {
        const methodesPaiement = await stripe.paymentMethods.list({
            customer: clientId,
            type: 'card',
        });
        return methodesPaiement;
    } catch (erreur) {
        logger.error(
            'Erreur lors de la récupération des méthodes de paiement:',
            erreur
        );
        throw erreur;
    }
};

/**
 * Créer un intent de configuration pour sauvegarder les cartes
 * @param {String} clientId - ID du client Stripe
 * @returns {Object} Intent de configuration créé
 */
const creerIntentConfiguration = async clientId => {
    try {
        const intentConfiguration = await stripe.setupIntents.create({
            customer: clientId,
            payment_method_types: ['card'],
        });
        return intentConfiguration;
    } catch (erreur) {
        logger.error(
            "Erreur lors de la création de l'intent de configuration:",
            erreur
        );
        throw erreur;
    }
};

/**
 * Vérifier la signature d'un webhook
 * @param {String} chargeUtile - Charge utile du webhook
 * @param {String} signature - Signature du webhook
 * @returns {Object} Événement Stripe
 */
const verifierSignatureWebhook = (chargeUtile, signature) => {
    try {
        const evenement = stripe.webhooks.constructEvent(
            chargeUtile,
            signature,
            config.stripeWebhookSecret
        );
        return evenement;
    } catch (erreur) {
        logger.error(
            'Vérification de la signature du webhook échouée:',
            erreur
        );
        throw erreur;
    }
};

// Exportation des fonctions
export {
    creerClient,
    creerIntentPaiement,
    confirmerPaiement,
    creerRemboursement,
    obtenirMethodesPaiementClient,
    creerIntentConfiguration,
    verifierSignatureWebhook,
};
