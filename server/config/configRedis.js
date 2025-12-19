import Redis from 'ioredis';
import logger from '../utils/logger.js';
import config from './env.js';

let redisClient = null;

/**
 * Configuration Redis
 */
const redisConfig = {
    host: config.redisHost || 'localhost',
    port: config.redisPort || 6379,
    password: config.redisPassword || undefined,
    db: config.redisDb || 0,
    retryStrategy: times => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
};

/**
 * Initialiser Redis
 */
export const initialiserRedis = async () => {
    try {
        redisClient = new Redis(redisConfig);

        redisClient.on('connect', () => {
            logger.info('Redis: Connexion en cours...');
        });

        redisClient.on('ready', () => {
            logger.info('Redis: Prêt à recevoir des commandes');
        });

        redisClient.on('error', err => {
            logger.error('Redis: Erreur de connexion', err.message);
        });

        redisClient.on('close', () => {
            logger.warn('Redis: Connexion fermée');
        });

        redisClient.on('reconnecting', () => {
            logger.info('Redis: Reconnexion en cours...');
        });

        // Tenter la connexion
        await redisClient.connect();

        // Test de connexion
        await redisClient.ping();
        logger.info('Redis connecté avec succès');

        return redisClient;
    } catch (error) {
        logger.warn(
            'Redis non disponible - Fonctionnement sans cache:',
            error.message
        );
        redisClient = null;
        return null;
    }
};

/**
 * Obtenir le client Redis
 */
export const obtenirClientRedis = () => {
    return redisClient;
};

/**
 * Vérifier si Redis est disponible
 */
export const redisDisponible = () => {
    return redisClient && redisClient.status === 'ready';
};

/**
 * Fermer la connexion Redis
 */
export const fermerRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        logger.info('Redis déconnecté');
    }
};

/**
 * Service de cache Redis
 */
export class CacheService {
    /**
     * Obtenir une valeur du cache
     */
    static async obtenir(cle) {
        if (!redisDisponible()) return null;

        try {
            const valeur = await redisClient.get(cle);
            return valeur ? JSON.parse(valeur) : null;
        } catch (error) {
            logger.error(`Erreur lecture cache ${cle}:`, error);
            return null;
        }
    }

    /**
     * Définir une valeur dans le cache
     */
    static async definir(cle, valeur, ttlSecondes = 3600) {
        if (!redisDisponible()) return false;

        try {
            await redisClient.setex(cle, ttlSecondes, JSON.stringify(valeur));
            return true;
        } catch (error) {
            logger.error(`Erreur écriture cache ${cle}:`, error);
            return false;
        }
    }

    /**
     * Supprimer une clé du cache
     */
    static async supprimer(cle) {
        if (!redisDisponible()) return false;

        try {
            await redisClient.del(cle);
            return true;
        } catch (error) {
            logger.error(`Erreur suppression cache ${cle}:`, error);
            return false;
        }
    }

    /**
     * Supprimer par pattern
     */
    static async supprimerPattern(pattern) {
        if (!redisDisponible()) return false;

        try {
            const cles = await redisClient.keys(pattern);
            if (cles.length > 0) {
                await redisClient.del(...cles);
            }
            return true;
        } catch (error) {
            logger.error(`Erreur suppression pattern ${pattern}:`, error);
            return false;
        }
    }

    /**
     * Vider tout le cache
     */
    static async viderCache() {
        if (!redisDisponible()) return false;

        try {
            await redisClient.flushdb();
            logger.info('Cache Redis vidé');
            return true;
        } catch (error) {
            logger.error('Erreur vidage cache:', error);
            return false;
        }
    }

    /**
     * Incrémenter une valeur
     */
    static async incrementer(cle, montant = 1) {
        if (!redisDisponible()) return null;

        try {
            return await redisClient.incrby(cle, montant);
        } catch (error) {
            logger.error(`Erreur incrémentation ${cle}:`, error);
            return null;
        }
    }

    /**
     * Obtenir TTL d'une clé
     */
    static async obtenirTTL(cle) {
        if (!redisDisponible()) return null;

        try {
            return await redisClient.ttl(cle);
        } catch (error) {
            logger.error(`Erreur lecture TTL ${cle}:`, error);
            return null;
        }
    }
}

// Export par défaut
export default {
    initialiserRedis,
    obtenirClientRedis,
    redisDisponible,
    fermerRedis,
    CacheService,
};
