// server/reset-vendeur-fixed.js
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env MANUELLEMENT
function loadEnv() {
    try {
        const envPath = join(__dirname, '..', '.env');
        const envContent = readFileSync(envPath, 'utf8');
        const envVars = {};

        envContent.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                let value = match[2] || '';
                // Supprimer les commentaires
                if (value.includes('#')) {
                    value = value.split('#')[0].trim();
                }
                // Supprimer les guillemets
                value = value.replace(/^['"]|['"]$/g, '');
                envVars[match[1]] = value;
            }
        });

        return envVars;
    } catch (error) {
        console.error('❌ Erreur chargement .env:', error.message);
        return {};
    }
}

async function resetVendeur() {
    console.log('🔧 RÉINITIALISATION VENDEUR\n');

    const env = loadEnv();
    const mongoUri = env.MONGODB_URI || 'mongodb://localhost:27017/nody_db';

    console.log('🔗 URI MongoDB:', mongoUri.substring(0, 50) + '...');

    if (!mongoUri) {
        console.error('❌ MONGODB_URI non définie dans .env');
        process.exit(1);
    }

    try {
        // Connexion MongoDB
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ MongoDB connecté');

        // Charger le modèle
        const Utilisateur = mongoose.model('Utilisateur');

        // Trouver le vendeur
        const vendeur = await Utilisateur.findById('6943e3a0025650574ad6cffd');

        if (!vendeur) {
            console.log('❌ Vendeur non trouvé');
            return;
        }

        console.log('📊 ÉTAT ACTUEL:');
        console.log('   Email:', vendeur.email);
        console.log('   statutVerification:', vendeur.statutVerification);
        console.log('   estActif:', vendeur.estActif);

        // RÉINITIALISATION
        console.log('\n🔄 RÉINITIALISATION...');
        vendeur.statutVerification = 'en_attente';
        vendeur.estActif = false;
        vendeur.dateVerification = undefined;
        vendeur.raisonRejet = undefined;

        await vendeur.save();

        console.log('\n✅ ÉTAT FINAL:');
        console.log('   statutVerification:', vendeur.statutVerification);
        console.log('   estActif:', vendeur.estActif);

        console.log('\n🎯 VENDEUR RÉINITIALISÉ !');
        console.log("💡 Maintenant testez l'approbation.");
    } catch (error) {
        console.error('❌ ERREUR:', error.message);
        if (error.name === 'MongoServerSelectionError') {
            console.error('💡 Problème connexion MongoDB');
            console.error(
                '   Utilisez MongoDB local: mongodb://localhost:27017/nody_db'
            );
        }
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetVendeur();
