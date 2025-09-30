import nodemailer from 'nodemailer';
import config from '../config/env.js';
import logger from '../utils/logger.js';

// NOTE: Cette implémentation est basique. Pour la production,
// il est recommandé d'utiliser un moteur de templates (ex: Pug, EJS)
// pour générer le HTML des e-mails à partir des modèles.

/**
 * Envoie un e-mail en utilisant Nodemailer.
 * @param {Object} options - Options de l'e-mail.
 * @param {string} options.a - L'adresse e-mail du destinataire.
 * @param {string} options.sujet - Le sujet de l'e-mail.
 * @param {string} options.modele - Le nom du modèle d'e-mail (utilisé ici pour générer un texte simple).
 * @param {Object} options.contexte - Les données à injecter dans le modèle.
 */
const envoyerEmail = async options => {
    // 1. Créer un transporteur (transporter)
    // Utilise les informations du fichier de configuration
    const transporter = nodemailer.createTransport({
        host: config.emailHost, // ex: 'smtp.gmail.com'
        port: config.emailPort, // ex: 587
        secure: config.emailPort == 465, // true pour le port 465, false pour les autres
        auth: {
            user: config.emailUser,
            pass: config.emailPass,
        },
    });

    // 2. Définir les options de l'e-mail
    const mailOptions = {
        from: `Nody <${config.emailUser}>`,
        to: options.a,
        subject: options.sujet,
        // Pour l'instant, un simple texte. Idéalement, utiliser un moteur de templates.
        text: `Bonjour ${
            options.contexte?.nom || ''
        }, voici votre message. Jeton: ${
            options.contexte?.jetonVerification ||
            options.contexte?.jetonReinitialisation ||
            ''
        }`,
        html: `<h4>Bonjour ${
            options.contexte?.nom || ''
        },</h4><p>Ceci est un message de Nody.</p><p>Votre jeton est : <strong>${
            options.contexte?.jetonVerification ||
            options.contexte?.jetonReinitialisation ||
            ''
        }</strong></p>`,
    };

    // 3. Envoyer l'e-mail
    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(
            `E-mail envoyé avec succès à ${options.a}: ${info.messageId}`
        );
    } catch (error) {
        logger.error(
            `Erreur lors de l'envoi de l'e-mail à ${options.a}:`,
            error
        );
        // Propager l'erreur pour que le contrôleur puisse la gérer
        throw new Error("Impossible d'envoyer l'e-mail.");
    }
};

export default envoyerEmail;
