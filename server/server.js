import app from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import mongoose from 'mongoose';

// Récupère le port du serveur à partir de la configuration
const PORT = config.port;

// Démarre le serveur et écoute les connexions sur le port spécifié
const server = app.listen(PORT, () => {
    // Affiche des messages de journalisation au démarrage
    logger.info(
        `Serveur démarré en mode ${config.nodeEnv} sur le port ${PORT}`
    );
    logger.info(`Documentation de l'API : ${config.serverUrl}/api/health`);
});

// --- Gestion de l'arrêt progressif (Graceful Shutdown) ---

/**
 * Arrête le serveur de manière propre.
 * @param {string} signal - Le signal qui a déclenché l'arrêt.
 * @param {Error} [error] - L'erreur éventuelle qui a causé l'arrêt.
 */
const gracefulShutdown = (signal, error) => {
    if (error) {
        logger.error(`Erreur non gérée détectée : ${error.name}`, error);
    }
    logger.info(`Signal ${signal} reçu. Arrêt progressif du serveur...`);

    server.close(() => {
        logger.info('Serveur HTTP fermé.');
        // Ferme la connexion à la base de données
        mongoose.connection.close(false, () => {
            logger.info('Connexion MongoDB fermée.');
            // Quitte le processus avec un code de succès (0) si pas d'erreur, sinon échec (1)
            process.exit(error ? 1 : 0);
        });
    });
};

// Écoute les signaux d'arrêt standards (SIGTERM et SIGINT)
// SIGTERM : signal envoyé par la plupart des gestionnaires de processus (ex: Docker)
// SIGINT  : signal généré par l'utilisateur (ex: Ctrl+C dans le terminal)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// --- Gestion des erreurs non capturées ---

// Gère les rejets de promesses non gérés
process.on('unhandledRejection', (reason, promise) => {
    // 'reason' est souvent une erreur, mais peut être autre chose.
    const error =
        reason instanceof Error
            ? reason
            : new Error(`Unhandled Rejection: ${reason}`);
    logger.error('Rejet de promesse non géré :', { error, promise });
    gracefulShutdown('unhandledRejection', error);
});

// Gère les exceptions non capturées
process.on('uncaughtException', err => {
    logger.error('Exception non capturée :', err);
    gracefulShutdown('uncaughtException', err);
});

export default server;
