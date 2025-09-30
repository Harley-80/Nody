// Importation des modules nécessaires
import { envoyerEmail } from '../services/emailService.js';

/**
 * Utilitaires pour les opérations liées aux emails
 */
const UtilitairesEmail = {
    /**
     * Envoyer un email de vérification
     * @param {Object} utilisateur - Utilisateur destinataire
     * @param {String} jeton - Jeton de vérification
     * @returns {Object} Résultat de l'envoi
     */
    async envoyerEmailVerification(utilisateur, jeton) {
        return envoyerEmail({
            a: utilisateur.email,
            sujet: 'Vérifiez votre adresse email',
            modele: 'verifier-email',
            contexte: {
                nom: utilisateur.prenom,
                urlVerification: `${process.env.CLIENT_URL}/verifier-email?jeton=${jeton}`,
            },
        });
    },

    /**
     * Envoyer un email de réinitialisation de mot de passe
     * @param {Object} utilisateur - Utilisateur destinataire
     * @param {String} jeton - Jeton de réinitialisation
     * @returns {Object} Résultat de l'envoi
     */
    async envoyerEmailReinitialisationMotDePasse(utilisateur, jeton) {
        return envoyerEmail({
            a: utilisateur.email,
            sujet: 'Réinitialisez votre mot de passe',
            modele: 'reinitialiser-mot-de-passe',
            contexte: {
                nom: utilisateur.prenom,
                urlReinitialisation: `${process.env.CLIENT_URL}/reinitialiser-mot-de-passe?jeton=${jeton}`,
            },
        });
    },

    /**
     * Envoyer un email de confirmation de commande
     * @param {Object} utilisateur - Utilisateur destinataire
     * @param {Object} commande - Commande à confirmer
     * @returns {Object} Résultat de l'envoi
     */
    async envoyerConfirmationCommande(utilisateur, commande) {
        return envoyerEmail({
            a: utilisateur.email,
            sujet: `Confirmation de commande #${commande.numeroCommande}`,
            modele: 'confirmation-commande',
            contexte: {
                nom: utilisateur.prenom,
                numeroCommande: commande.numeroCommande,
                dateCommande: commande.creeLe.toLocaleDateString('fr-FR'),
                total: commande.total.toFixed(2),
                articles: commande.articles,
                adresseLivraison: commande.adresseLivraison,
            },
        });
    },

    /**
     * Envoyer une notification admin pour une nouvelle commande
     * @param {Object} commande - Commande reçue
     * @returns {Object} Résultat de l'envoi
     */
    async envoyerNotificationNouvelleCommande(commande) {
        return envoyerEmail({
            a: process.env.ADMIN_EMAIL,
            sujet: `Nouvelle commande reçue #${commande.numeroCommande}`,
            modele: 'notification-nouvelle-commande',
            contexte: {
                numeroCommande: commande.numeroCommande,
                nomClient: `${commande.adresseLivraison.prenom} ${commande.adresseLivraison.nom}`,
                total: commande.total.toFixed(2),
                nombreArticles: commande.articles.length,
            },
        });
    },
};

// Exportation des utilitaires
export default UtilitairesEmail;
