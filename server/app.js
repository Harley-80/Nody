import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import sanitize from 'mongo-sanitize';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';

// Import des configurations et utilitaires
import config from './config/env.js';
import connectDatabase from './config/database.js';
import { initialiserRedis, redisDisponible } from './config/configRedis.js';
import logger from './utils/logger.js';

// Import des middlewares
import {
    gestionnaireErreurs as errorHandler,
    nonTrouve,
} from './middleware/errorMiddleware.js';

// Import des modèles
import Utilisateur from './models/utilisateurModel.js';

// Import des services
import WebSocketService from './services/websocketService.js';

// Import des routes
import authRoutes from './routes/authRoutes.js';
import utilisateursRoutes from './routes/utilisateursRoutes.js';
import produitsRoutes from './routes/produitsRoutes.js';
import categorieRoutes from './routes/categorieRoutes.js';
import commandesRoutes from './routes/commandesRoutes.js';
import paiementRoutes from './routes/paiementRoutes.js';
import moderateurRoutes from './routes/moderateurRoutes.js';
import vendeurRoutes from './routes/vendeurRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import statistiquesRoutes from './routes/statistiquesRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import banniereRoutes from './routes/banniereRoutes.js';
import creditsRoutes from './routes/creditsRoutes.js';
import suiviRoutes from './routes/suiviRoutes.js'; 

// Constantes pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Création de l'application Express
const app = express();

// Fonction d'initialisation de l'application
const initializeApp = async () => {
    try {
        // Connexion à la base de données MongoDB
        await connectDatabase();
        logger.info('Base de données MongoDB connectée');

        // Initialisation Redis
        try {
            await initialiserRedis();
        } catch (err) {
            logger.warn('Redis non disponible - Mode dégradé');
        }

        // Middlewares de sécurité
        app.use(
            helmet({
                crossOriginResourcePolicy: { policy: 'cross-origin' },
            })
        );

        // Sanitization contre les injections NoSQL
        app.use((req, res, next) => {
            try {
                if (req.body) req.body = sanitize(req.body);
                if (req.params) req.params = sanitize(req.params);
                if (req.query) req.query = sanitize(req.query);
            } catch (error) {
                // Ignorer silencieusement les erreurs
            }
            next();
        });

        // Compression des réponses
        app.use(compression());

        // Configuration des fichiers statiques
        const publicPath = path.join(__dirname, 'public');
        app.use(express.static(publicPath));

        // Configuration du dossier uploads
        const uploadsPath = path.join(__dirname, 'uploads');

        // Créer le dossier uploads s'il n'existe pas
        if (!fs.existsSync(uploadsPath)) {
            fs.mkdirSync(uploadsPath, { recursive: true });
        }

        // Créer les sous-dossiers nécessaires
        const sousDossiers = ['produits', 'avatars', 'categories', 'temp'];
        sousDossiers.forEach(dossier => {
            const chemin = path.join(uploadsPath, dossier);
            if (!fs.existsSync(chemin)) {
                fs.mkdirSync(chemin, { recursive: true });
            }
        });

        // Servir les fichiers uploadés
        app.use(
            '/uploads',
            express.static(uploadsPath, {
                setHeaders: (res, filePath) => {
                    const ext = path.extname(filePath).toLowerCase();
                    if (
                        ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
                    ) {
                        res.setHeader('Cache-Control', 'public, max-age=86400');
                        res.setHeader('Access-Control-Allow-Origin', '*');
                    }
                },
            })
        );

        // Configuration CORS
        const allowedOrigins = [
            config.frontendProdUrl,
            ...(config.nodeEnv === 'development'
                    ? [
                        config.clientUrl,
                        'http://127.0.0.1:5173',
                        'http://localhost:5173',
                        'http://localhost:5000',
                    ]
                : []),
        ].filter(Boolean);

        app.use(
            cors({
                origin: function (origin, callback) {
                    if (config.nodeEnv === 'development') {
                        return callback(null, true);
                    }
                    if (!origin || allowedOrigins.includes(origin)) {
                        callback(null, true);
                    } else {
                        callback(new Error('Non autorisé par CORS'), false);
                    }
                },
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowedHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Requested-With',
                    'Accept',
                    'Origin',
                ],
                exposedHeaders: ['Content-Disposition'],
            })
        );

        // Rate limiting
        const rateLimitConfig = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: config.nodeEnv === 'development' ? 1000 : 100,
            message: {
                success: false,
                erreur: 'Trop de requêtes depuis cette adresse IP',
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: req => {
                if (config.nodeEnv === 'development') {
                    const ip = req.ip || req.connection.remoteAddress;
                    const isLocal =
                        ip === '::1' ||
                        ip === '127.0.0.1' ||
                        ip === '::ffff:127.0.0.1' ||
                        ip.startsWith('192.168.');
                    return isLocal;
                }
                return false;
            },
        };

        const limiteur = rateLimit(rateLimitConfig);
        app.use('/api/', limiteur);

        // Logging des requêtes
        app.use(
            morgan(config.nodeEnv === 'development' ? 'dev' : 'combined', {
                stream: { write: message => logger.http(message.trim()) },
            })
        );

        // Parsing du body
        app.use(
            express.json({
                limit: '50mb',
                verify: (req, res, buf) => {
                    try {
                        JSON.parse(buf.toString());
                    } catch (e) {
                        throw new Error('JSON invalide');
                    }
                },
            })
        );

        app.use(
            express.urlencoded({
                extended: true,
                limit: '50mb',
            })
        );

        // Sessions avec Redis
        let magasinRedis;

        if (config.nodeEnv !== 'test') {
            try {
                const clientRedis = createClient({
                    url: `redis://${config.redisHost || 'localhost'}:${config.redisPort || 6379}`,
                    password: config.redisPassword || undefined,
                });

                clientRedis.on('error', erreur => {
                    logger.error('Erreur Redis Sessions:', erreur.message);
                });

                await clientRedis.connect();

                const { RedisStore } = await import('connect-redis');
                magasinRedis = new RedisStore({
                    client: clientRedis,
                    prefix: 'nody:session:',
                    disableTouch: true,
                });
            } catch (error) {
                logger.error(
                    'Redis Sessions - Fallback vers stockage en mémoire'
                );
                magasinRedis = undefined;
            }
        }

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
                    sameSite: 'lax',
                },
                name: 'nody.sid',
            })
        );

        // Routes de l'API
        app.use('/api/auth', authRoutes);
        app.use('/api/utilisateurs', utilisateursRoutes);
        app.use('/api/produits', produitsRoutes);
        app.use('/api/categories', categorieRoutes);
        app.use('/api/commandes', commandesRoutes);
        app.use('/api/paiements', paiementRoutes);
        app.use('/api/moderateur', moderateurRoutes);
        app.use('/api/vendeur', vendeurRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/statistiques', statistiquesRoutes);
        app.use('/api/statistiques', statistiquesRoutes);
        app.use('/api/notifications', notificationRoutes);
        app.use('/api/bannieres', banniereRoutes);
        app.use('/api/vendeur/credits', creditsRoutes);
        app.use('/api/suivi', suiviRoutes);

        // Route health check
        app.get('/api/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                message: 'Serveur Nody opérationnel',
                timestamp: new Date().toISOString(),
                environment: config.nodeEnv,
                version: config.version || '1.0.0',
                services: {
                    mongodb:
                        mongoose.connection.readyState === 1
                            ? 'connected'
                            : 'disconnected',
                    redis: redisDisponible() ? 'connected' : 'disconnected',
                },
            });
        });

        // Routes de debug en développement
        if (config.nodeEnv === 'development') {
            app.get('/debug/uploads/:dossier/:fichier', (req, res) => {
                const { dossier, fichier } = req.params;
                const fullPath = path.join(uploadsPath, dossier, fichier);

                if (fs.existsSync(fullPath)) {
                    res.sendFile(fullPath);
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Fichier non trouvé',
                    });
                }
            });
        }

        // Route 404
        app.use(nonTrouve);

        // Gestionnaire d'erreurs global
        app.use(errorHandler);

        logger.info('Application Express initialisée');
        return app;
    } catch (error) {
        logger.error('Erreur initialisation application:', error);
        throw error;
    }
};

// Exports
export default initializeApp;
export { app }; // moi