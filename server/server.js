import initializeApp from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import mongoose from 'mongoose';

let server;

/**
 * Fonction principale pour démarrer le serveur.
 * Initialise l'application Express (qui inclut la connexion à la base de données)
 * puis démarre le serveur HTTP.
 */
async function startServer() {
    try {
        const app = await initializeApp();
        const PORT = config.port;

        server = app.listen(PORT, () => {
            logger.info(
                `Serveur démarré en mode ${config.nodeEnv} sur le port ${PORT}`
            );
            logger.info(
                `Documentation de l'API : ${config.serverUrl}/api/health`
            );
        });
    } catch (error) {
        logger.error('Échec du démarrage du serveur.', { error });
        process.exit(1);
    }
}

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
    // Si le serveur n'a pas encore démarré, on quitte directement.
    if (!server) {
        logger.info('Arrêt du processus avant le démarrage du serveur.');
        process.exit(error ? 1 : 0);
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

// Point d'entrée de l'application
// On utilise une IIFE (Immediately Invoked Function Expression) asynchrone
// pour pouvoir utiliser await au plus haut niveau et bien gérer les erreurs de démarrage.
(async () => {
    await startServer();
})();

// Ce fichier est le point d'entrée, il n'a pas besoin d'exporter la variable server.
// export default server;
