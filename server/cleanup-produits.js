// cleanup-produits.js
import mongoose from 'mongoose';
import Produit from './models/produitModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function nettoyer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');

        // Supprimer tous les produits avec images cassées
        const result = await Produit.deleteMany({
            $or: [
                { images: { $size: 0 } },
                { 'images.url': { $exists: false } },
                { images: { $exists: false } },
            ],
        });

        console.log(`🗑️  ${result.deletedCount} produits cassés supprimés`);

        await mongoose.disconnect();
        console.log('✅ Nettoyage terminé\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

nettoyer();
