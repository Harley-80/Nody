import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;

async function verifierBD() {
    try {
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté');

        const Produit = mongoose.model(
            'Produit',
            new mongoose.Schema({}, { strict: false })
        );

        console.log('\n📦 PRODUITS EN BASE DE DONNÉES:\n');

        const produits = await Produit.find({}).limit(5).lean();

        console.log(`Total: ${produits.length} produits\n`);

        produits.forEach((p, index) => {
            console.log(
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
            );
            console.log(`PRODUIT ${index + 1}: ${p.nom}`);
            console.log(`ID: ${p._id}`);
            console.log(`Vendeur: ${p.vendeur}`);
            console.log(`Statut: ${p.statut || 'Non défini'}`);
            console.log(
                `\n📸 Images (type: ${typeof p.images}, length: ${p.images?.length || 0}):`
            );

            if (p.images && p.images.length > 0) {
                p.images.forEach((img, i) => {
                    console.log(`  [${i}] Type: ${typeof img}`);
                    if (typeof img === 'string') {
                        console.log(`      Valeur: "${img}"`);
                    } else if (typeof img === 'object') {
                        console.log(
                            `      Structure:`,
                            JSON.stringify(img, null, 6)
                        );
                    } else {
                        console.log(`      Valeur:`, img);
                    }
                });
            } else {
                console.log('  ⚠️  Aucune image');
            }
            console.log('');
        });

        await mongoose.disconnect();
        console.log('\n✅ Déconnexion réussie');
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error(error);
    }
}

verifierBD();
