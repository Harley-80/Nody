import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

// Fonction asynchrone pour se connecter à la base de données MongoDB
const connectDatabase = async () => {
    // --- Gestion des événements de la connexion ---
    // Attache les écouteurs AVANT de tenter la connexion pour ne manquer aucun événement.

    // Écoute l'événement 'error' pour les erreurs de connexion persistantes.
    mongoose.connection.on('error', erreur => {
        logger.error('Erreur de connexion à MongoDB :', erreur);
    });

    // Écoute l'événement 'disconnected' pour la déconnexion.
    mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB est déconnecté.');
    });

    try {
        // Tente de se connecter à la base de données en utilisant l'URI de configuration
        const connexion = await mongoose.connect(config.mongodbUri);

        // Affiche un message de succès avec le nom de l'hôte de la connexion
        logger.info(`MongoDB est connecté : ${connexion.connection.host}`);
    } catch (erreur) {
        // En cas d'échec, on relance l'erreur pour qu'elle soit gérée par le code appelant (server.js)
        logger.error(
            `Erreur lors de la connexion à MongoDB : ${erreur.message}`
        );
        throw erreur;
    }
};

export default connectDatabase;
