import mongoose from 'mongoose';
import 'dotenv/config.js';
import Produit from './models/produitModel.js';

async function fixMissingImages() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connecté à MongoDB');

        // Trouver le produit avec des images sans URL
        const produit = await Produit.findOne({
            _id: '6947b09fca178dac3e454d5f',
        });

        if (produit && produit.images) {
            console.log('Produit trouvé:', produit.nom);

            // Corriger chaque image manquante
            produit.images = produit.images.map((img, index) => {
                if (!img.url) {
                    return {
                        ...img.toObject(),
                        url: 'http://localhost:5000/uploads/produits/produit_1766024126873_cglfxxzk7.jpg',
                        alt: produit.nom,
                        estPrincipale: index === 0,
                    };
                }
                return img;
            });

            await produit.save();
            console.log('Images corrigées pour le produit:', produit.nom);
        } else {
            console.log('Produit non trouvé');
        }

        await mongoose.disconnect();
        console.log('Déconnecté de MongoDB');
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Exécuter
fixMissingImages();