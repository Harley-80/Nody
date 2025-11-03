import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
// Importation du store Redis spécifique pour express-session
import { RedisStore } from 'connect-redis';
// Importation du client Redis moderne
import redis from 'redis';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/env.js';
import connectDatabase from './config/database.js';
import {
    gestionnaireErreurs as errorHandler,
    nonTrouve,
} from './middleware/errorMiddleware.js';
import logger from './utils/logger.js';

// Importation des routes de l'API
import authRoutes from './routes/authRoutes.js';
import utilisateursRoutes from './routes/utilisateursRoutes.js';
import produitsRoutes from './routes/produitsRoutes.js';
import categorieRoutes from './routes/categorieRoutes.js';
import commandesRoutes from './routes/commandesRoutes.js';
import paiementRoutes from './routes/paiementRoutes.js';

// --- Déclaration des constantes de chemin ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Création de l'application Express
const app = express();

// --- Middlewares de sécurité et de configuration ---

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Active Helmet pour sécuriser les en-têtes HTTP
app.use(helmet());

// --- Configuration CORS adaptative pour le développement et la production ---
// Définit les origines autorisées pour les requêtes CORS.
const allowedOrigins = [
    config.frontendProdUrl,
    // En mode développement, autoriser les URLs locales de Vite et l'URL configurée
    ...(config.nodeEnv === 'development'
        ? [config.clientUrl, 'http://127.0.0.1:5173']
        : []),
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // En développement, autoriser toutes les origines
            if (config.nodeEnv === 'development') {
                return callback(null, true);
            }

            // En production, vérifier les origines autorisées
            const allowedOrigins = [
                config.frontendProdUrl,
                config.clientUrl,
            ].filter(Boolean);

            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
);

// Limitation du débit (rate limiting) pour protéger l'API contre les abus
const limiteur = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: {
        erreur: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiteur);

// Middleware de journalisation (logging) pour les requêtes HTTP (utilise le stream de logger)
app.use(
    morgan('combined', {
        stream: { write: message => logger.info(message.trim()) },
    })
);

// Middleware d'analyse du corps des requêtes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Initialise l'application de manière asynchrone.
 * Se connecte d'abord à la base de données, puis configure les sessions et les routes.
 * @returns {Promise<express.Express>} L'application Express configurée.
 */
const initializeApp = async () => {
    try {
        // Connexion à la base de données (attend que la connexion soit établie)
        await connectDatabase();

        // --- Configuration améliorée de Redis pour les sessions ---
        let magasinRedis;
        // On n'utilise pas Redis pour les tests
        if (config.nodeEnv !== 'test') {
            try {
                const clientRedis = redis.createClient({
                    url: `redis://${config.redisHost}:${config.redisPort}`,
                    // Gère proprement l'absence de mot de passe en passant 'undefined'
                    password: config.redisPassword || undefined,
                });

                // Meilleure gestion des événements Redis avec logging :

                // Journalise toute erreur client Redis (perte de connexion, échec de commande)
                clientRedis.on('error', erreur => {
                    logger.error('Erreur Redis:', erreur);
                });

                // Confirme le début de la connexion
                clientRedis.on('connect', () => {
                    logger.info('Connexion à Redis établie');
                });

                // Confirme que le client est prêt à émettre des commandes
                clientRedis.on('ready', () => {
                    logger.info('Connexion Redis réussie et prête.');
                });

                // Attendre que la connexion soit établie
                await clientRedis.connect();

                // Initialiser le store de Redis
                magasinRedis = new RedisStore({
                    client: clientRedis,
                    prefix: 'nody:',
                    // Désactive l'extension automatique de la durée de vie des sessions (optimisation des performances)
                    disableTouch: true,
                });
            } catch (error) {
                // Fallback : en cas d'échec, le store est mis à undefined.
                // Le middleware de session utilisera le store mémoire par défaut.
                logger.error(
                    'Échec connexion Redis - Sessions en mémoire uniquement',
                    error
                );
                magasinRedis = undefined;
            }
        }

        // Middleware de gestion des sessions (avec fallback sur store mémoire si magasinRedis est undefined)
        app.use(
            session({
                store: magasinRedis,
                secret: config.jwtSecret,
                resave: false,
                saveUninitialized: false,
                cookie: {
                    secure: config.nodeEnv === 'production',
                    httpOnly: true,
                    maxAge: 24 * 60 * 60 * 1000,
                    // Ajout de 'sameSite: lax' pour meilleure sécurité CSRF et compatibilité
                    sameSite: 'lax',
                },
            })
        );

        // Ajout d'un middleware de logging de débogage pour les requêtes entrantes
        app.use((req, res, next) => {
            // Log le type de requête et le chemin (utile pour le débogage fin)
            logger.debug(`Requête reçue: ${req.method} ${req.path}`);
            next();
        });

        // --- Définition des routes de l'API ---
        app.use('/api/auth', authRoutes);
        app.use('/api/utilisateurs', utilisateursRoutes);
        app.use('/api/produits', produitsRoutes);
        app.use('/api/categories', categorieRoutes);
        app.use('/api/commandes', commandesRoutes);
        app.use('/api/paiements', paiementRoutes);

        // Point de contrôle de l'état du serveur (health check)
        app.get('/api/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                message: "Le serveur Nody est en cours d'exécution.",
                timestamp: new Date().toISOString(),
            });
        });

        // Gestion de la route 404 (non trouvée)
        app.use(nonTrouve);

        // Middleware de gestion des erreurs, à placer en dernier
        app.use(errorHandler);

        return app;
    } catch (error) {
        // Log critique si l'initialisation (ex: connexion BD) échoue
        logger.error("Échec critique de l'initialisation:", error);
        throw error; // Propager l'erreur pour que le serveur soit arrêté
    }
};

export default initializeApp;
