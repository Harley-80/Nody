import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

// Fonction asynchrone pour se connecter à la base de données MongoDB
const connectDatabase = async () => {
    try {
        // Tente de se connecter à la base de données en utilisant l'URI de configuration
        const connexion = await mongoose.connect(config.mongodbUri, {
            useNewUrlParser: true, // Utilise le nouveau parseur d'URL
            useUnifiedTopology: true, // Utilise le moteur de topologie unifié
        });

        // Affiche un message de succès avec le nom de l'hôte de la connexion
        logger.info(`MongoDB est connecté : ${connexion.connection.host}`);

        // --- Gestion des événements de la connexion ---

        // Écoute l'événement 'error' pour les erreurs de connexion
        mongoose.connection.on('error', erreur => {
            logger.error('Erreur de connexion à MongoDB :', erreur);
        });

        // Écoute l'événement 'disconnected' pour la déconnexion
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB est déconnecté');
        });

        // --- Fermeture propre de la connexion ---

        // Écoute le signal de fin d'application (Ctrl+C)
        process.on('SIGINT', async () => {
            // Ferme la connexion MongoDB
            await mongoose.connection.close();
            logger.info(
                "La connexion à MongoDB a été fermée suite à l'arrêt de l'application."
            );
            // Termine le processus
            process.exit(0);
        });
    } catch (erreur) {
        // En cas d'échec de la connexion, affiche l'erreur et arrête le processus
        logger.error('Erreur lors de la connexion à MongoDB :', erreur.message);
        process.exit(1);
    }
};

export default connectDatabase;
