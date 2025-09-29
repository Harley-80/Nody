import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import redis from 'redis';

import config from './config/env.js'; // Correction du nom de fichier
import connectDatabase from './config/database.js'; // Correction du nom de fichier
import errorHandler from './middleware/errorMiddleware.js';
import logger from './utils/logger.js';

// Importation des routes de l'API
import authRoutes from './routes/authRoutes.js';
import utilisateursRoutes from './routes/utilisateursRoutes.js';
import produitsRoutes from './routes/produitsRoutes.js';
import categorieRoutes from './routes/categorieRoutes.js';
import commandesRoutes from './routes/commandesRoutes.js';
import paiementRoutes from './routes/paiementRoutes.js';

// Création de l'application Express
const app = express();

// --- Middlewares de sécurité et de configuration ---
// Active Helmet pour sécuriser les en-têtes HTTP
app.use(helmet());

// Configuration de CORS pour autoriser les requêtes depuis le client
app.use(
    cors({
        origin: config.clientUrl,
        credentials: true,
    })
);

// Limitation du débit (rate limiting) pour protéger l'API contre les abus
const limiteur = rateLimit({
    windowMs: config.rateLimitWindowMs, // Fenêtre de temps
    max: config.rateLimitMaxRequests, // Nombre maximum de requêtes
    message: {
        erreur: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.',
    },
    standardHeaders: true, // Renvoie les en-têtes standard de limitation du débit
    legacyHeaders: false, // Désactive les en-têtes obsolètes
});
app.use(limiteur);

// Middleware de journalisation (logging) pour les requêtes HTTP
app.use(
    morgan('combined', {
        stream: { write: message => logger.info(message.trim()) },
    })
);

// Middleware d'analyse du corps des requêtes
app.use(express.json({ limit: '10mb' })); // Analyse les corps de requête JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Analyse les corps de requête encodés en URL

/**
 * Initialise l'application de manière asynchrone.
 * Se connecte d'abord à la base de données, puis configure les sessions et les routes.
 * @returns {Promise<express.Express>} L'application Express configurée.
 */
const initializeApp = async () => {
    try {
        // Connexion à la base de données (attend que la connexion soit établie)
        await connectDatabase();

        // --- Configuration de Redis pour les sessions ---
        let magasinRedis;
        if (config.nodeEnv !== 'test') {
            try {
                const clientRedis = redis.createClient({
                    url: `redis://${config.redisHost}:${config.redisPort}`,
                    password: config.redisPassword,
                });

                clientRedis.on('error', erreur => {
                    // Gère les erreurs qui surviennent APRÈS la connexion initiale
                    logger.error('Erreur du client Redis :', erreur);
                });

                clientRedis.on('connect', () => {
                    logger.info('Connexion à Redis en cours...');
                });

                clientRedis.on('ready', () => {
                    logger.info('Connexion Redis réussie et prête.');
                });

                // Attendre que la connexion soit établie
                await clientRedis.connect();

                // Initialiser le store de Redis APRÈS la connexion
                magasinRedis = new RedisStore({
                    client: clientRedis,
                    prefix: 'nody:',
                });
            } catch (error) {
                logger.error(
                    "Échec de la connexion à Redis. L'application ne pourra pas gérer les sessions correctement.",
                    error
                );
                // En production, il serait judicieux de ne pas démarrer si Redis est requis.
                // Pour le développement, on peut continuer sans sessions persistantes.
            }
        }

        // Middleware de gestion des sessions (placé ici pour utiliser magasinRedis)
        app.use(
            session({
                store: magasinRedis,
                secret: config.jwtSecret,
                resave: false,
                saveUninitialized: false,
                cookie: {
                    // En production, le cookie ne sera envoyé que via HTTPS
                    secure: config.nodeEnv === 'production',
                    // Empêche l'accès au cookie depuis le JavaScript côté client
                    httpOnly: true,
                    // Durée de vie du cookie (ici, 24 heures)
                    maxAge: 24 * 60 * 60 * 1000,
                },
            })
        );

        // --- Définition des routes de l'API (placées ici pour qu'elles aient accès à la session) ---
        app.use('/api/auth', authRoutes);
        app.use('/api/users', utilisateursRoutes);
        app.use('/api/products', produitsRoutes);
        app.use('/api/categories', categorieRoutes);
        app.use('/api/orders', commandesRoutes);
        app.use('/api/payments', paiementRoutes);

        // Point de contrôle de l'état du serveur (health check)
        app.get('/api/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                message: "Le serveur Nody est en cours d'exécution.",
                timestamp: new Date().toISOString(),
            });
        });

        // Gestion de la route 404 (non trouvée)
        app.use((req, res) => {
            res.status(404).json({
                erreur: 'Route non trouvée',
                message: `L'itinéraire demandé '${req.originalUrl}' n'existe pas sur ce serveur.`,
            });
        });

        // Middleware de gestion des erreurs, à placer en dernier
        app.use(errorHandler);

        return app;
    } catch (error) {
        logger.error(
            "Erreur lors de l'initialisation de l'application:",
            error
        );
        throw error; // Propager l'erreur pour que le serveur puisse la gérer
    }
};

export default initializeApp;
