// server/reset-vendeur-final.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function resetVendeur() {
    console.log('🔧 RÉINITIALISATION VENDEUR 6943e3a0025650574ad6cffd\n');

    try {
        // Connexion MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
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
        console.log('   Nom:', vendeur.nom || 'N/A');
        console.log('   Email:', vendeur.email);
        console.log('   statutVerification:', vendeur.statutVerification);
        console.log('   estActif:', vendeur.estActif);
        console.log('   dateVerification:', vendeur.dateVerification);
        console.log('   raisonRejet:', vendeur.raisonRejet);

        // RÉINITIALISATION
        console.log('\n🔄 RÉINITIALISATION...');
        vendeur.statutVerification = 'en_attente';
        vendeur.estActif = false;
        vendeur.dateVerification = undefined;
        vendeur.raisonRejet = undefined;
        vendeur.moderateur = undefined;

        await vendeur.save();

        console.log('\n✅ ÉTAT FINAL:');
        console.log('   statutVerification:', vendeur.statutVerification);
        console.log('   estActif:', vendeur.estActif);
        console.log('   dateVerification:', vendeur.dateVerification);

        console.log('\n🎯 VENDEUR RÉINITIALISÉ AVEC SUCCÈS !');
        console.log(
            "💡 Vous pouvez maintenant l'approuver depuis l'interface."
        );
    } catch (error) {
        console.error('❌ ERREUR:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetVendeur();
