import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Utilisateur from '../models/utilisateurModel.js';

dotenv.config();

const nettoyerTout = async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/nody'
        );
        console.log('✅ Connecté\n');

        // Supprimer TOUS les vendeurs et modérateurs en attente
        const result = await Utilisateur.deleteMany({
            role: { $in: ['vendeur', 'moderateur'] },
            statutVerification: 'en_attente',
        });

        console.log(`🗑️  ${result.deletedCount} utilisateurs supprimés\n`);

        await mongoose.connection.close();
        console.log('✅ Nettoyage terminé');
        process.exit(0);
    } catch (erreur) {
        console.error('❌ Erreur:', erreur);
        await mongoose.connection.close();
        process.exit(1);
    }
};

nettoyerTout();
