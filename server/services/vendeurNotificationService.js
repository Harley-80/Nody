import Notification from '../models/Notification.js';
import vendeurWebSocketService from './vendeurWebSocketService.js';
import logger from '../utils/logger.js';

/**
 * Fonction interne : Crée une notification en DB et prépare le retour
 * @param {String} vendeurId - ID du vendeur
 * @param {Object} notificationData - Données de la notification
 */
const creerEtEnvoyer = async (vendeurId, notificationData) => {
    try {
        // 1. Créer la notification en DB avec le champ standardisé 'utilisateurId'
        const notification = await Notification.create({
            utilisateurId: vendeurId, 
            ...notificationData,
            dateCreation: new Date(),
            lue: false,
        });

        logger.info(`Notification créée en DB : ${notification._id}`);
        return notification;
    } catch (error) {
        logger.error('Erreur création notification vendeur :', error);
        throw error;
    }
};

/**
 * NOUVELLE COMMANDE
 */
export const notifierNouvelleCommande = async (vendeurId, commande) => {
    try {
        const notification = await creerEtEnvoyer(vendeurId, {
            type: 'commande',
            titre: 'Nouvelle commande',
            message: `Commande #${commande.numeroCommande} reçue - ${commande.montantTotal}€`,
            lien: `/vendeur/commandes/${commande._id}`,
            metadata: {
                commandeId: commande._id,
                numeroCommande: commande.numeroCommande,
                montant: commande.montantTotal,
            },
        });

        vendeurWebSocketService.notifierNouvelleCommande(vendeurId, commande);
        return notification;
    } catch (error) {
        logger.error('Erreur notification nouvelle commande :', error);
        throw error;
    }
};

/**
 * MISE À JOUR COMMANDE
 */
export const notifierMiseAJourCommande = async (
    vendeurId,
    commande,
    ancienStatut,
    nouveauStatut
) => {
    try {
        const messages = {
            payee: 'Commande payée et confirmée',
            en_preparation: 'Commande en cours de préparation',
            expedie: 'Commande expédiée',
            livre: 'Commande livrée',
            annule: 'Commande annulée',
        };

        const notification = await creerEtEnvoyer(vendeurId, {
            type: 'commande',
            titre: 'Mise à jour commande',
            message: `${messages[nouveauStatut] || 'Statut mis à jour'} - Commande #${commande.numeroCommande}`,
            lien: `/vendeur/commandes/${commande._id}`,
            metadata: {
                commandeId: commande._id,
                ancienStatut,
                nouveauStatut,
            },
        });

        vendeurWebSocketService.notifierMiseAJourCommande(
            vendeurId,
            commande,
            ancienStatut,
            nouveauStatut
        );
        return notification;
    } catch (error) {
        logger.error('Erreur notification mise à jour commande :', error);
        throw error;
    }
};

/**
 * ALERTE STOCK FAIBLE
 */
export const notifierStockFaible = async (vendeurId, produit, stockRestant) => {
    try {
        const notification = await creerEtEnvoyer(vendeurId, {
            type: 'alerte',
            titre: 'Stock faible',
            message: `Le produit "${produit.nom}" n'a plus que ${stockRestant} unités`,
            lien: `/vendeur/produits/${produit._id}/modifier`,
            metadata: {
                produitId: produit._id,
                stockRestant,
                seuil: 10,
            },
        });

        vendeurWebSocketService.notifierStockFaible(
            vendeurId,
            produit,
            stockRestant
        );
        return notification;
    } catch (error) {
        logger.error('Erreur notification stock faible :', error);
        throw error;
    }
};

/**
 * VALIDATION PRODUIT
 */
export const notifierValidationProduit = async (
    vendeurId,
    produit,
    decision,
    motif = ''
) => {
    try {
        const estApprouve = decision === 'approuve';
        const notification = await creerEtEnvoyer(vendeurId, {
            type: 'validation',
            titre: estApprouve ? 'Produit approuvé' : 'Produit rejeté',
            message: estApprouve
                ? `Votre produit "${produit.nom}" est maintenant en ligne !`
                : `Produit "${produit.nom}" rejeté. ${motif}`,
            lien: estApprouve
                ? `/vendeur/produits/${produit._id}`
                : `/vendeur/produits/${produit._id}/modifier`,
            metadata: { produitId: produit._id, decision, motif },
        });

        vendeurWebSocketService.notifierValidationProduit(
            vendeurId,
            produit,
            decision,
            motif
        );
        return notification;
    } catch (error) {
        logger.error('Erreur notification validation produit :', error);
        throw error;
    }
};

/**
 * VALIDATION VENDEUR
 */
export const notifierValidationVendeur = async (
    vendeurId,
    decision,
    motif = ''
) => {
    try {
        const estApprouve = decision === 'approuve';
        const notification = await creerEtEnvoyer(vendeurId, {
            type: 'validation',
            titre: estApprouve ? 'Boutique approuvée' : 'Demande rejetée',
            message: estApprouve
                ? 'Votre boutique est maintenant active ! Vous pouvez commencer à vendre.'
                : `Votre demande a été rejetée. ${motif}`,
            lien: estApprouve ? '/vendeur/dashboard' : '/vendeur/profil',
            metadata: { decision, motif },
        });

        vendeurWebSocketService.notifierValidationVendeur(
            vendeurId,
            decision,
            motif
        );
        return notification;
    } catch (error) {
        logger.error('Erreur notification validation vendeur :', error);
        throw error;
    }
};

/**
 * NOUVEAU MESSAGE
 */
export const notifierNouveauMessage = async (vendeurId, message) => {
    try {
        const notification = await creerEtEnvoyer(vendeurId, {
            type: 'message',
            titre: 'Nouveau message',
            message: `Message de ${message.expediteur?.prenom || 'un client'}`,
            lien: `/vendeur/messages/${message._id}`,
            metadata: { messageId: message._id },
        });

        vendeurWebSocketService.notifierNouveauMessage(vendeurId, message);
        return notification;
    } catch (error) {
        logger.error('Erreur notification nouveau message :', error);
        throw error;
    }
};

/**
 * NOUVEL AVIS
 */
export const notifierNouvelAvis = async (vendeurId, avis, produit) => {
    try {
        const notification = await creerEtEnvoyer(vendeurId, {
            type: 'avis',
            titre: 'Nouvel avis client',
            message: `${avis.note}/5 étoiles pour "${produit.nom}"`,
            lien: `/vendeur/produits/${produit._id}/avis`,
            metadata: {
                avisId: avis._id,
                produitId: produit._id,
                note: avis.note,
            },
        });

        vendeurWebSocketService.notifierNouvelAvis(vendeurId, avis, produit);
        return notification;
    } catch (error) {
        logger.error('Erreur notification nouvel avis :', error);
        throw error;
    }
};

/**
 * PAIEMENT REÇU
 */
export const notifierPaiementRecu = async (vendeurId, paiement, commande) => {
    try {
        const notification = await creerEtEnvoyer(vendeurId, {
            type: 'paiement',
            titre: 'Paiement reçu',
            message: `${paiement.montant}€ pour commande #${commande.numeroCommande}`,
            lien: `/vendeur/commandes/${commande._id}`,
            metadata: {
                paiementId: paiement._id,
                commandeId: commande._id,
                montant: paiement.montant,
            },
        });

        vendeurWebSocketService.notifierPaiementRecu(
            vendeurId,
            paiement,
            commande
        );
        return notification;
    } catch (error) {
        logger.error('Erreur notification paiement reçu :', error);
        throw error;
    }
};

/**
 * Récupère les notifications non lues d'un vendeur
 */
export const getNotificationsNonLues = async vendeurId => {
    try {
        return await Notification.find({
            utilisateurId: vendeurId, // ← Utilisation du champ standardisé ici aussi
            lue: false,
        })
            .sort({ dateCreation: -1 })
            .limit(50);
    } catch (error) {
        logger.error('Erreur récupération notifications non lues :', error);
        throw error;
    }
};

export default {
    notifierNouvelleCommande,
    notifierMiseAJourCommande,
    notifierStockFaible,
    notifierValidationProduit,
    notifierValidationVendeur,
    notifierNouveauMessage,
    notifierNouvelAvis,
    notifierPaiementRecu,
    getNotificationsNonLues,
};