import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

const connectDatabase = async () => {
    try {
        const conn = await mongoose.connect(config.mongodbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Gestion des erreurs de connexion
        mongoose.connection.on('error', err => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB déconnecté');
        });

        // Gestion propre de la fermeture
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info(
                "Connexion MongoDB fermée suite à la fermeture de l'application"
            );
            process.exit(0);
        });
    } catch (error) {
        logger.error('Erreur lors de la connexion à MongoDB:', error.message);
        process.exit(1);
    }
};

export default connectDatabase;
