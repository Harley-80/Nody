/**
 * SERVICE WEBSOCKET VENDEUR
 * Gestion des événements temps réel pour les vendeurs
 * @module vendeurWebSocketService
 */
import logger from '../utils/logger.js';

let io = null;

/**
 * Initialise le service WebSocket vendeur
 * @param {Server} socketIo - Instance Socket.io
 */
export const initialiser = socketIo => {
    io = socketIo;
    logger.info('VendeurWebSocketService initialisé');
};

/**
 * Envoie une notification à un vendeur spécifique
 * @param {String} vendeurId - ID du vendeur
 * @param {String} evenement - Nom de l'événement
 * @param {Object} donnees - Données de la notification
 */
const envoyerAuVendeur = (vendeurId, evenement, donnees) => {
    if (!io) {
        logger.error(
            'Socket.io non initialisé dans vendeurWebSocketService'
        );
        return;
    }

    // Envoyer au vendeur via room personnalisée
    io.to(`vendeur_${vendeurId}`).emit(evenement, {
        ...donnees,
        timestamp: new Date(),
        destinataire: 'vendeur',
    });

    logger.info(`Événement WebSocket [${evenement}] → Vendeur ${vendeurId}`);
};

/**
 * NOUVELLE COMMANDE
 * Notifie le vendeur d'une nouvelle commande
 */
export const notifierNouvelleCommande = (vendeurId, commande) => {
    envoyerAuVendeur(vendeurId, 'nouvelleCommande', {
        type: 'nouvelleCommande',
        titre: 'Nouvelle commande !',
        message: `Commande #${commande.numeroCommande} reçue`,
        commande: {
            _id: commande._id,
            numeroCommande: commande.numeroCommande,
            montantTotal: commande.montantTotal,
            articles: commande.articles.length,
            client: {
                nom: commande.utilisateur?.nom,
                prenom: commande.utilisateur?.prenom,
            },
            createdAt: commande.createdAt,
        },
        priorite: 'haute',
        lienAction: `/vendeur/commandes/${commande._id}`,
    });
};

/**
 * MISE À JOUR COMMANDE
 * Notifie le vendeur d'un changement de statut
 */
export const notifierMiseAJourCommande = (
    vendeurId,
    commande,
    ancienStatut,
    nouveauStatut
) => {
    const messages = {
        payee: 'Commande payée et confirmée',
        en_preparation: 'Commande en cours de préparation',
        expedie: 'Commande expédiée',
        livre: 'Commande livrée',
        annule: 'Commande annulée',
    };

    envoyerAuVendeur(vendeurId, 'commandeMiseAJour', {
        type: 'commandeMiseAJour',
        titre: 'Mise à jour commande',
        message: messages[nouveauStatut] || `Statut modifié : ${nouveauStatut}`,
        commande: {
            _id: commande._id,
            numeroCommande: commande.numeroCommande,
            ancienStatut,
            nouveauStatut,
        },
        priorite: nouveauStatut === 'annule' ? 'haute' : 'moyenne',
        lienAction: `/vendeur/commandes/${commande._id}`,
    });
};

/**
 * ALERTE STOCK FAIBLE
 * Notifie le vendeur quand stock < seuil
 */
export const notifierStockFaible = (vendeurId, produit, stockRestant) => {
    envoyerAuVendeur(vendeurId, 'alerteStockFaible', {
        type: 'alerteStockFaible',
        titre: 'Stock faible !',
        message: `Le produit "${produit.nom}" n'a plus que ${stockRestant} unités en stock`,
        produit: {
            _id: produit._id,
            nom: produit.nom,
            stockRestant,
            seuil: 10,
        },
        priorite: stockRestant < 5 ? 'critique' : 'haute',
        lienAction: `/vendeur/produits/${produit._id}/modifier`,
    });
};

/**
 * VALIDATION PRODUIT
 * Notifie le vendeur de la décision du modérateur
 */
export const notifierValidationProduit = (
    vendeurId,
    produit,
    decision,
    motif = ''
) => {
    const estApprouve = decision === 'approuve';

    envoyerAuVendeur(vendeurId, 'validationProduit', {
        type: 'validationProduit',
        titre: estApprouve ? 'Produit approuvé' : 'Produit rejeté',
        message: estApprouve
            ? `Votre produit "${produit.nom}" est maintenant en ligne !`
            : `Produit "${produit.nom}" rejeté. ${motif}`,
        produit: {
            _id: produit._id,
            nom: produit.nom,
            statut: decision,
            motif,
        },
        priorite: 'haute',
        lienAction: estApprouve
            ? `/vendeur/produits/${produit._id}`
            : `/vendeur/produits/${produit._id}/modifier`,
    });
};

/**
 * VALIDATION VENDEUR
 * Notifie le vendeur de la décision sur sa boutique
 */
export const notifierValidationVendeur = (vendeurId, decision, motif = '') => {
    const estApprouve = decision === 'approuve';

    envoyerAuVendeur(vendeurId, 'validationVendeur', {
        type: 'validationVendeur',
        titre: estApprouve ? 'Boutique approuvée !' : 'Demande rejetée',
        message: estApprouve
            ? 'Votre boutique est maintenant active ! Vous pouvez commencer à vendre.'
            : `Votre demande a été rejetée. ${motif}`,
        decision,
        motif,
        priorite: 'critique',
        lienAction: estApprouve ? '/vendeur/dashboard' : '/vendeur/profil',
    });
};

/**
 * NOUVEAU MESSAGE CLIENT
 * Notifie le vendeur d'un message dans le support
 */
export const notifierNouveauMessage = (vendeurId, message) => {
    envoyerAuVendeur(vendeurId, 'nouveauMessage', {
        type: 'nouveauMessage',
        titre: 'Nouveau message',
        message: `Message de ${message.expediteur?.prenom || 'un client'}`,
        messageData: {
            _id: message._id,
            contenu: message.contenu.substring(0, 100),
            expediteur: message.expediteur?.prenom,
            createdAt: message.createdAt,
        },
        priorite: 'moyenne',
        lienAction: `/vendeur/messages/${message._id}`,
    });
};

/**
 * NOUVEL AVIS CLIENT
 * Notifie le vendeur d'une nouvelle évaluation
 */
export const notifierNouvelAvis = (vendeurId, avis, produit) => {
    envoyerAuVendeur(vendeurId, 'nouvelAvis', {
        type: 'nouvelAvis',
        titre: 'Nouvel avis client',
        message: `${avis.note}/5 étoiles pour "${produit.nom}"`,
        avis: {
            _id: avis._id,
            note: avis.note,
            commentaire: avis.commentaire?.substring(0, 100),
            client: avis.utilisateur?.prenom,
            produit: {
                _id: produit._id,
                nom: produit.nom,
            },
        },
        priorite: avis.note <= 2 ? 'haute' : 'basse',
        lienAction: `/vendeur/produits/${produit._id}/avis`,
    });
};

/**
 * PAIEMENT REÇU
 * Notifie le vendeur d'un paiement confirmé
 */
export const notifierPaiementRecu = (vendeurId, paiement, commande) => {
    envoyerAuVendeur(vendeurId, 'paiementRecu', {
        type: 'paiementRecu',
        titre: 'Paiement reçu',
        message: `${paiement.montant}€ pour commande #${commande.numeroCommande}`,
        paiement: {
            _id: paiement._id,
            montant: paiement.montant,
            methodePaiement: paiement.methodePaiement,
            commande: {
                _id: commande._id,
                numeroCommande: commande.numeroCommande,
            },
        },
        priorite: 'moyenne',
        lienAction: `/vendeur/commandes/${commande._id}`,
    });
};

/**
 * Envoie des statistiques en temps réel
 */
export const envoyerStatistiques = (vendeurId, stats) => {
    envoyerAuVendeur(vendeurId, 'statsVendeurMiseAJour', {
        type: 'statistiques',
        stats,
        timestamp: new Date(),
    });
};

export default {
    initialiser,
    notifierNouvelleCommande,
    notifierMiseAJourCommande,
    notifierStockFaible,
    notifierValidationProduit,
    notifierValidationVendeur,
    notifierNouveauMessage,
    notifierNouvelAvis,
    notifierPaiementRecu,
    envoyerStatistiques,
};