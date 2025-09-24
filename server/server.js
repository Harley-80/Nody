import app from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';

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

// Fonction pour arrêter le serveur de manière propre
const arretProgressif = () => {
    logger.info(
        "Signal d'arrêt reçu, le serveur s'éteint de manière progressive..."
    );

    // Ferme le serveur HTTP, n'acceptant plus de nouvelles requêtes
    server.close(() => {
        logger.info('Serveur HTTP fermé.');
        // Met fin au processus avec un code de succès (0)
        process.exit(0);
    });

    // En cas de blocage, force l'arrêt après 10 secondes
    setTimeout(() => {
        logger.error(
            'Impossible de fermer les connexions à temps, arrêt forcé.'
        );
        // Met fin au processus avec un code d'erreur (1)
        process.exit(1);
    }, 10000);
};

// Écoute les signaux d'arrêt standards (SIGTERM et SIGINT)
// SIGTERM : signal envoyé par la plupart des gestionnaires de processus (ex: Docker)
// SIGINT  : signal généré par l'utilisateur (ex: Ctrl+C dans le terminal)
process.on('SIGTERM', arretProgressif);
process.on('SIGINT', arretProgressif);

// --- Gestion des erreurs non capturées ---

// Gère les rejets de promesses non gérés
process.on('unhandledRejection', err => {
    logger.error('Rejet de promesse non géré :', err);
    // Arrête le serveur pour éviter un état instable
    arretProgressif();
});

// Gère les exceptions non capturées
process.on('uncaughtException', err => {
    logger.error('Exception non capturée :', err);
    // Arrête le serveur pour éviter un état imprévisible
    arretProgressif();
});

export default server;
