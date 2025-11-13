import envoyerEmail from './emailService.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Service d'envoi de notifications pour les approbations/rejets
 */
export const NotificationService = {
    /**
     * Envoyer un email de confirmation d'approbation
     */
    async envoyerEmailApprobation(utilisateur) {
        try {
            const contexte = {
                nom: utilisateur.prenom,
                role: utilisateur.role === 'vendeur' ? 'vendeur' : 'modérateur',
                dateApprobation: new Date().toLocaleDateString('fr-FR'),
                urlConnexion: `${config.clientUrl}/connexion`,
                urlTableauBord: `${config.clientUrl}/dashboard`,
                nomComplet: `${utilisateur.prenom} ${utilisateur.nom}`,
            };

            let sujet = '';
            let modele = '';

            if (utilisateur.role === 'vendeur') {
                sujet =
                    'Félicitations ! Votre compte vendeur Nody a été approuvé';
                modele = 'bienvenue_vendeur';
            } else if (utilisateur.role === 'moderateur') {
                sujet =
                    'Félicitations ! Votre compte modérateur Nody a été approuvé';
                modele = 'bienvenue_staff';
            } else {
                logger.warn(
                    `Tentative d'envoi d'email d'approbation pour un rôle non géré: ${utilisateur.role}`
                );
                return null;
            }

            const resultat = await envoyerEmail({
                a: utilisateur.email,
                sujet,
                modele,
                contexte,
            });

            logger.info(
                `Email d'approbation envoyé à: ${utilisateur.email}`
            );
            return resultat;
        } catch (error) {
            logger.error(
                `Erreur envoi email approbation à ${utilisateur.email}:`,
                error
            );
            throw error;
        }
    },

    /**
     * Envoyer un email de notification de rejet
     */
    async envoyerEmailRejet(utilisateur, raison) {
        try {
            const contexte = {
                nom: utilisateur.prenom,
                role: utilisateur.role === 'vendeur' ? 'vendeur' : 'modérateur',
                raison: raison,
                dateRejet: new Date().toLocaleDateString('fr-FR'),
                contactSupport: config.emailUser || 'support@nody.sn',
                nomComplet: `${utilisateur.prenom} ${utilisateur.nom}`,
            };

            // Sujet et modèle d'email
            const resultat = await envoyerEmail({
                a: utilisateur.email,
                sujet: `Mise à jour concernant votre demande ${utilisateur.role} - Nody`,
                modele: 'rejet_inscription',
                contexte,
            });

            logger.info(`Email de rejet envoyé à: ${utilisateur.email}`);
            return resultat;
        } catch (error) {
            logger.error(
                `Erreur envoi email rejet à ${utilisateur.email}:`,
                error
            );
            throw error;
        }
    },

    /**
     * Envoyer un email de bienvenue pour les nouveaux clients
     */
    async envoyerEmailBienvenueClient(utilisateur) {
        try {
            const contexte = {
                nom: utilisateur.prenom,
                urlVerification: `${config.clientUrl}/verifier-email`,
                urlConnexion: `${config.clientUrl}/connexion`,
                nomComplet: `${utilisateur.prenom} ${utilisateur.nom}`,
            };

            // Sujet et modèle d'email
            const resultat = await envoyerEmail({
                a: utilisateur.email,
                sujet: 'Bienvenue sur Nody !',
                modele: 'bienvenue',
                contexte,
            });

            logger.info(`Email de bienvenue envoyé à: ${utilisateur.email}`);
            return resultat;
        } catch (error) {
            logger.error(
                `Erreur envoi email bienvenue à ${utilisateur.email}:`,
                error
            );
            throw error;
        }
    },

    /**
     * Envoyer un email de notification admin pour nouvelle demande
     */
    async envoyerEmailNotificationAdmin(donneesDemande) {
        try {
            const { nom, email, role, date } = donneesDemande;

            const contexte = {
                nom: nom,
                email: email,
                role: role,
                date: date,
                urlAdmin: `${config.clientUrl}/admin/demandes`,
            };

            // Sujet et modèle d'email
            const resultat = await envoyerEmail({
                a: config.emailUser || 'admin@nody.sn',
                sujet: `Nouvelle demande ${role} - Nody`,
                modele: 'demande_inscription_admin',
                contexte,
            });

            logger.info(`Email notification admin envoyé pour: ${email}`);
            return resultat;
        } catch (error) {
            logger.error('Erreur envoi email notification admin:', error);
            throw error;
        }
    },

    /**
     * Envoyer un email de réinitialisation de mot de passe
     */
    async envoyerEmailReinitialisationMotDePasse(utilisateur, resetToken) {
        try {
            const resetURL = `${config.clientUrl}/reinitialiser-mot-de-passe?token=${resetToken}`;

            const contexte = {
                nom: utilisateur.prenom,
                lienReinitialisation: resetURL,
                nomComplet: `${utilisateur.prenom} ${utilisateur.nom}`,
            };

            // Sujet et modèle d'email
            const resultat = await envoyerEmail({
                a: utilisateur.email,
                sujet: 'Réinitialisation de votre mot de passe Nody',
                modele: 'reinitialisation_motdepasse',
                contexte,
            });

            logger.info(
                `Email réinitialisation envoyé à: ${utilisateur.email}`
            );
            return resultat;
        } catch (error) {
            logger.error(
                `Erreur envoi email réinitialisation à ${utilisateur.email}:`,
                error
            );
            throw error;
        }
    },

    /**
     * Envoyer un email de vérification d'email
     */
    async envoyerEmailVerification(utilisateur, verificationToken) {
        try {
            const verificationURL = `${config.clientUrl}/verifier-email?token=${verificationToken}`;

            const contexte = {
                nom: utilisateur.prenom,
                lienVerification: verificationURL,
                nomComplet: `${utilisateur.prenom} ${utilisateur.nom}`,
            };

            // Sujet et modèle d'email
            const resultat = await envoyerEmail({
                a: utilisateur.email,
                sujet: 'Vérifiez votre adresse email Nody',
                modele: 'verification_email',
                contexte,
            });

            logger.info(`Email vérification envoyé à: ${utilisateur.email}`);
            return resultat;
        } catch (error) {
            logger.error(
                `Erreur envoi email vérification à ${utilisateur.email}:`,
                error
            );
            throw error;
        }
    },
};

export default NotificationService;
