import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Utilisateur from '../models/utilisateurModel.js';

dotenv.config();

const recreerIndex = async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/nody'
        );
        console.log('✅ Connecté\n');

        console.log('🔄 Suppression des anciens index...');
        await Utilisateur.collection.dropIndexes();
        console.log('✅ Anciens index supprimés\n');

        console.log('🔄 Recréation des index...');
        await Utilisateur.syncIndexes();
        console.log('✅ Index recréés\n');

        console.log('🔄 Vérification des index existants:');
        const indexes = await Utilisateur.collection.getIndexes();
        console.log(indexes);

        await mongoose.connection.close();
        console.log('\n✅ Terminé');
        process.exit(0);
    } catch (erreur) {
        console.error('❌ Erreur:', erreur);
        await mongoose.connection.close();
        process.exit(1);
    }
};

recreerIndex();
