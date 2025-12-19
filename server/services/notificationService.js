import envoyerEmail from './emailService.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import Notification from '../models/Notification.js';
import vendeurWebSocketService from './vendeurWebSocketService.js';

/**
 * Service centralisé pour la gestion des notifications (Email, DB, WebSocket)
 */
export const NotificationService = {
    /**
     * WORKFLOW DE VALIDATION COMPLET (DB + Email + WebSocket)
     * Gère l'approbation/rejet des vendeurs ET des produits
     */
    async envoyerNotificationValidation(
        utilisateur,
        type,
        decision,
        objetConcerne = null,
        motif = ''
    ) {
        try {
            const estApprouve = decision === 'approuve';

            // 1. Créer la notification en DB (Standardisation 'utilisateurId')
            const notification = await Notification.create({
                utilisateurId: utilisateur._id,
                type: 'validation',
                titre: estApprouve
                    ? type === 'vendeur'
                        ? 'Boutique approuvée'
                        : 'Produit approuvé'
                    : type === 'vendeur'
                      ? 'Inscription rejetée'
                      : 'Produit rejeté',
                message: estApprouve
                    ? `Votre demande ${type} a été validée avec succès !`
                    : `Votre demande ${type} a été refusée. Motif : ${motif}`,
                lien:
                    type === 'vendeur'
                        ? estApprouve
                            ? '/vendeur/dashboard'
                            : '/vendeur/profil'
                        : `/vendeur/produits`,
                metadata: {
                    type,
                    decision,
                    motif,
                    objetId: objetConcerne?._id,
                },
                dateCreation: new Date(),
                lue: false,
            });

            logger.info(
                `Notification DB (${type}) créée pour : ${utilisateur.email}`
            );

            // 2. Envoyer l'Email selon le type et la décision
            if (estApprouve) {
                if (type === 'produit' && objetConcerne) {
                    await this.envoyerEmailApprobationProduit(
                        utilisateur,
                        objetConcerne
                    );
                } else {
                    await this.envoyerEmailApprobation(utilisateur);
                }
            } else {
                await this.envoyerEmailRejet(utilisateur, motif);
            }

            // 3. Envoyer via WebSocket (Temps réel)
            if (type === 'vendeur') {
                vendeurWebSocketService.notifierValidationVendeur(
                    utilisateur._id,
                    decision,
                    motif
                );
            } else {
                vendeurWebSocketService.notifierValidationProduit(
                    utilisateur._id,
                    objetConcerne,
                    decision,
                    motif
                );
            }

            return notification;
        } catch (error) {
            logger.error(
                `Erreur workflow validation pour ${utilisateur.email}:`,
                error
            );
            throw error;
        }
    },

    /**
     * Envoyer un email d'approbation spécifique pour un produit
     */
    async envoyerEmailApprobationProduit(vendeur, produit) {
        try {
            const contexte = {
                nom: vendeur.prenom,
                produitNom: produit.nom,
                dateApprobation: new Date().toLocaleDateString('fr-FR'),
                urlProduit: `${config.clientUrl}/produit/${produit._id}`,
                urlDashboard: `${config.clientUrl}/vendeur/dashboard`,
            };

            await envoyerEmail({
                a: vendeur.email,
                sujet: `Produit approuvé : ${produit.nom}`,
                modele: 'approbation_produit',
                contexte,
            });
            logger.info(
                `Email approbation produit envoyé pour: ${produit.nom}`
            );
        } catch (error) {
            logger.error(
                `Erreur email approbation produit ${produit._id}:`,
                error
            );
            throw error;
        }
    },

    /**
     * Envoyer un email de confirmation d'approbation (Compte/Boutique)
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

            let sujet =
                utilisateur.role === 'vendeur'
                    ? 'Félicitations ! Votre compte vendeur Nody a été approuvé'
                    : 'Félicitations ! Votre compte modérateur Nody a été approuvé';

            let modele =
                utilisateur.role === 'vendeur'
                    ? 'bienvenue_vendeur'
                    : 'bienvenue_staff';

            await envoyerEmail({
                a: utilisateur.email,
                sujet,
                modele,
                contexte,
            });

            logger.info(
                `Email d'approbation compte envoyé à: ${utilisateur.email}`
            );
        } catch (error) {
            logger.error(
                `Erreur email approbation à ${utilisateur.email}:`,
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

            await envoyerEmail({
                a: utilisateur.email,
                sujet: `Mise à jour concernant votre demande ${utilisateur.role} - Nody`,
                modele: 'rejet_inscription',
                contexte,
            });

            logger.info(`Email de rejet envoyé à: ${utilisateur.email}`);
        } catch (error) {
            logger.error(`Erreur email rejet à ${utilisateur.email}:`, error);
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

            await envoyerEmail({
                a: utilisateur.email,
                sujet: 'Bienvenue sur Nody !',
                modele: 'bienvenue',
                contexte,
            });

            logger.info(`Email de bienvenue envoyé à: ${utilisateur.email}`);
        } catch (error) {
            logger.error(
                `Erreur email bienvenue à ${utilisateur.email}:`,
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
                nom,
                email,
                role,
                date,
                urlAdmin: `${config.clientUrl}/admin/demandes`,
            };

            await envoyerEmail({
                a: config.emailUser || 'admin@nody.sn',
                sujet: `Nouvelle demande ${role} - Nody`,
                modele: 'demande_inscription_admin',
                contexte,
            });

            logger.info(`Email notification admin envoyé pour: ${email}`);
        } catch (error) {
            logger.error('Erreur email notification admin:', error);
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

            await envoyerEmail({
                a: utilisateur.email,
                sujet: 'Réinitialisation de votre mot de passe Nody',
                modele: 'reinitialisation_motdepasse',
                contexte,
            });
        } catch (error) {
            logger.error(`Erreur email reset à ${utilisateur.email}:`, error);
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

            await envoyerEmail({
                a: utilisateur.email,
                sujet: 'Vérifiez votre adresse email Nody',
                modele: 'verification_email',
                contexte,
            });
        } catch (error) {
            logger.error(
                `Erreur email vérification à ${utilisateur.email}:`,
                error
            );
            throw error;
        }
    },
};

export default NotificationService;