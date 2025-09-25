import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import redis from 'redis';

import config from './config/env.js';
import connectDatabase from './config/database.js';
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

// Connexion à la base de données
connectDatabase();

// --- Configuration de Redis pour les sessions ---
let clientRedis;
let magasinRedis;

// N'initialise pas Redis en mode de test
if (config.nodeEnv !== 'test') {
    clientRedis = redis.createClient({
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword,
    });

    // Gère les erreurs de connexion à Redis
    clientRedis.on('error', erreur => {
        logger.error('Erreur Redis :', erreur);
    });

    // Confirmation de la connexion réussie
    clientRedis.on('connect', () => {
        logger.info('Connexion Redis réussie');
    });

    // Crée le magasin de sessions basé sur Redis
    magasinRedis = new RedisStore({
        client: clientRedis,
        prefix: 'nody:', // Préfixe pour les clés de session dans Redis
    });
}

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

// Middleware de gestion des sessions
app.use(
    session({
        store: magasinRedis, // Utilise Redis pour stocker les sessions
        secret: config.jwtSecret, // Clé secrète pour signer le cookie de session
        resave: false, // Évite de réenregistrer la session si elle n'a pas été modifiée
        saveUninitialized: false, // Évite d'enregistrer les sessions non initialisées
        cookie: {
            secure: config.nodeEnv === 'production', // Le cookie est sécurisé uniquement en production
            httpOnly: true, // Le cookie n'est accessible que via HTTP(S)
            maxAge: 24 * 60 * 60 * 1000, // Durée de vie du cookie (24 heures)
        },
    })
);

// --- Définition des routes de l'API ---
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
app.use('*', (req, res) => {
    res.status(404).json({
        erreur: 'Route non trouvée',
        message: `L'itinéraire demandé '${req.originalUrl}' n'existe pas sur ce serveur.`,
    });
});

// Middleware de gestion des erreurs, à placer en dernier
app.use(errorHandler);

export default app;
