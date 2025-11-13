// Importation des modules nécessaires
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Configuration du transporteur pour l'envoi d'emails
 */
const transporteur = nodemailer.createTransport({
    service: config.emailService,
    auth: {
        user: config.emailUser,
        pass: config.emailPass,
    },
});

/**
 * Charge un template d'email à partir du dossier des vues
 * @param {String} nomTemplate - Nom du template à charger
 * @param {Object} contexte - Variables à injecter dans le template
 * @returns {String} Contenu HTML du template
 */
const chargerTemplate = (nomTemplate, contexte = {}) => {
    try {
        let cheminTemplate = path.join(
            __dirname,
            '../views/emails',
            `${nomTemplate}.html`
        );

        if (!fs.existsSync(cheminTemplate)) {
            cheminTemplate = path.join(
                __dirname,
                '../views/emails',
                'parDefaut.html'
            );
        }
        let template = fs.readFileSync(cheminTemplate, 'utf8');

        // Remplacer les variables dans le template
        Object.keys(contexte).forEach(cle => {
            const regex = new RegExp(`{{${cle}}}`, 'g');
            template = template.replace(regex, contexte[cle]);
        });
        return template;
    } catch (erreur) {
        logger.error('Erreur lors du chargement du template email:', erreur);
        return null;
    }
};

/**
 * Service d'envoi d'email
 * @param {Object} options - Options pour l'envoi de l'email
 * @param {String} options.a - Destinataire
 * @param {String} options.sujet - Sujet de l'email
 * @param {String} options.modele - Nom du template à utiliser
 * @param {Object} options.contexte - Variables pour le template
 * @param {Array} options.piecesJointes - Pièces jointes
 * @returns {Object} Résultat de l'envoi
 */
const envoyerEmail = async ({ a, sujet, modele, contexte, piecesJointes }) => {
    try {
        const html = chargerTemplate(modele, contexte);
        if (!html) {
            throw new Error('Template non trouvé');
        }
        const optionsEmail = {
            from: `"Nody Mode" <${config.emailUser}>`,
            to: a,
            subject: sujet,
            html,
            attachments: piecesJointes,
        };
        const info = await transporteur.sendMail(optionsEmail);
        logger.info(`Email envoyé à ${a}: ${info.messageId}`);

        return info;
    } catch (erreur) {
        logger.error("Erreur lors de l'envoi de l'email:", erreur);
        throw erreur;
    }
};

/**
 * Service d'envoi d'email de notification admin
 * @param {Object} options - Options pour l'email de notification
 * @returns {Object} Résultat de l'envoi
 */
const envoyerEmailNotificationAdmin = async options => {
    // <-- CHANGEMENT : 'export' retiré ici
    const { nom, email, role, date } = options;

    const contexte = {
        nom,
        email,
        role,
        date,
        urlAdmin: `${config.clientUrl}/admin/utilisateurs`,
    };

    return await envoyerEmail({
        a: config.emailUser, // Envoi à l'admin (l'expéditeur configuré est souvent utilisé comme admin par défaut dans un setup simple)
        sujet: `Nouvelle demande d'inscription ${role} - Nody`,
        modele: 'demande_inscription_admin',
        contexte,
    });
};

// Exportation des fonctions
export default envoyerEmail;
export { envoyerEmailNotificationAdmin }; 
