import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import initializeApp from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import { fermerRedis } from './config/configRedis.js';
import { initialiserWebSocket } from './services/websocketService.js';
// Import du planificateur de tâches
import {
    demarrerPlanificateur,
    arreterPlanificateur,
} from './taches/banniereTache.js';

// Constantes pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = config.port || 5000;
const HOST = config.host || '0.0.0.0';
let server;

// Référence au job cron pour l'arrêt propre
let cronJob = null;

// Vérifier les prérequis système
function verifierPreRequis() {
    const uploadsDir = path.join(__dirname, 'uploads');

    // Créer le dossier uploads s'il n'existe pas
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Créer les sous-dossiers nécessaires
    const sousDossiers = ['produits', 'avatars', 'categories', 'temp'];
    sousDossiers.forEach(dossier => {
        const chemin = path.join(uploadsDir, dossier);
        if (!fs.existsSync(chemin)) {
            fs.mkdirSync(chemin, { recursive: true });
        }
    });
}

// Créer un serveur HTTPS
function creerServeur(app) {
    if (config.nodeEnv === 'production' && config.sslEnabled) {
        try {
            const options = {
                key: fs.readFileSync(config.sslKeyPath),
                cert: fs.readFileSync(config.sslCertPath),
            };
            return https.createServer(options, app);
        } catch (error) {
            logger.error('Erreur certificats SSL:', error);
            logger.warn('Fallback vers HTTP');
        }
    }
    return http.createServer(app);
}

// Afficher les informations de démarrage
function afficherInformationsDemarrage() {
    logger.info('Serveur Nody démarré');
    logger.info(`Port: ${PORT}`);
    logger.info(`Environnement: ${config.nodeEnv}`);
    logger.info(`URL Serveur: ${config.serverUrl}`);
    logger.info(`URL Client: ${config.clientUrl}`);
    logger.info(
        `MongoDB: ${mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'}`
    );

    if (config.nodeEnv === 'development') {
        logger.info('Mode développement');
        logger.info(
            `Debug images: http://localhost:${PORT}/debug/uploads/produits/[nom-fichier]`
        );
    }
}

// Arrêt progressif du serveur
async function arretProgressif(signal, error = null) {
    if (error) {
        logger.error(
            `${signal ? `Signal ${signal} reçu` : 'Erreur'}`,
            error.message
        );
    } else {
        logger.info(`Signal ${signal} reçu - Arrêt en cours`);
    }

    if (!server) {
        logger.info('Serveur non démarré');
        process.exit(error ? 1 : 0);
    }

    // Arrêter le planificateur de tâches
    if (cronJob) {
        try {
            arreterPlanificateur(cronJob);
            logger.info('Planificateur de tâches arrêté');
        } catch (err) {
            logger.error('Erreur arrêt planificateur:', err);
        }
    }

    // Fermer le serveur
    server.close(async () => {
        logger.info('Serveur HTTP fermé');

        try {
            await fermerRedis();
            logger.info('Redis fermé');
        } catch (err) {
            logger.error('Erreur fermeture Redis:', err);
        }

        try {
            await mongoose.connection.close(false);
            logger.info('MongoDB fermé');
        } catch (err) {
            logger.error('Erreur fermeture MongoDB:', err);
        }

        logger.info('Arrêt complet du serveur');
        process.exit(error ? 1 : 0);
    });

    // Timeout d'arrêt forcé
    setTimeout(() => {
        logger.error('Arrêt forcé après timeout');
        process.exit(1);
    }, 10000);
}

// Fonction principale pour démarrer le serveur
async function demarrerServeur() {
    try {
        // Vérifier les prérequis
        verifierPreRequis();

        // Initialiser l'application Express
        logger.info("Initialisation de l'application Express...");
        const app = await initializeApp();

        // Créer le serveur
        server = creerServeur(app);

        // Initialiser WebSocket
        initialiserWebSocket(server);
        logger.info('WebSocket initialisé');

        // Démarrer le planificateur de tâches (après connexion DB)
        try {
            const planificateur = demarrerPlanificateur();
            if (planificateur.succes) {
                cronJob = planificateur.job;
                logger.info('Planificateur de tâches démarré avec succès');
                logger.info(
                    `Prochaine exécution: ${planificateur.config.prochaineExecution}`
                );
            }
        } catch (err) {
            logger.error('Erreur démarrage planificateur:', err);
            // Ne pas bloquer le serveur si le scheduler échoue
        }

        // Gestion des erreurs du serveur
        server.on('error', error => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Le port ${PORT} est déjà utilisé`);
                process.exit(1);
            } else {
                logger.error('Erreur du serveur:', error);
                process.exit(1);
            }
        });

        // Démarrer le serveur
        server.listen(PORT, HOST, () => {
            afficherInformationsDemarrage();
        });

        return server;
    } catch (error) {
        logger.error('Erreur démarrage serveur:', error);
        await arretProgressif('STARTUP_ERROR', error);
    }
}

// Gestion des signaux
process.on('SIGINT', () => arretProgressif('SIGINT'));
process.on('SIGTERM', () => arretProgressif('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
    const error =
        reason instanceof Error
            ? reason
            : new Error(`Rejet de promesse: ${reason}`);
    logger.error('Rejet de promesse non géré:', error.message);

    if (config.nodeEnv === 'production') {
        arretProgressif('UNHANDLED_REJECTION', error);
    }
});

process.on('uncaughtException', error => {
    logger.error('Exception non capturée:', error.message);
    arretProgressif('UNCAUGHT_EXCEPTION', error);
});

// Démarrer le serveur dans une IIFE pour gérer les erreurs de démarrage
(async () => {
    try {
        logger.info('Démarrage du serveur Nody...');
        await demarrerServeur();
    } catch (error) {
        logger.error('Échec du démarrage:', error);
        process.exit(1);
    }
})();