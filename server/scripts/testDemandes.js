import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const testDemandes = async () => {
    try {
        const MONGO_URI =
            process.env.MONGODB_URI || 'mongodb://localhost:27017/nody_db';
        await mongoose.connect(MONGO_URI);
        console.log('Connecté à MongoDB\n');

        const Utilisateur = mongoose.model(
            'Utilisateur',
            new mongoose.Schema({}, { strict: false })
        );

        // Test 1: Tous les utilisateurs
        const tous = await Utilisateur.find({});
        console.log(`Total utilisateurs: ${tous.length}`);
        console.log(
            'Détails:',
            tous.map(u => ({
                email: u.email,
                role: u.role,
                statut: u.statutVerification,
            }))
        );

        // Test 2: Demandes en attente
        const enAttente = await Utilisateur.find({
            role: { $in: ['vendeur', 'moderateur'] },
            statutVerification: 'en_attente',
        });
        console.log(`\nDemandes en attente: ${enAttente.length}`);
        console.log(
            'Détails:',
            enAttente.map(u => ({
                email: u.email,
                role: u.role,
                statut: u.statutVerification,
            }))
        );

        // Test 3: Verifier les valeurs exactes
        const vendeurs = await Utilisateur.find({ role: 'vendeur' });
        const moderateurs = await Utilisateur.find({ role: 'moderateur' });
        console.log(`\nVendeurs: ${vendeurs.length}`);
        console.log(`Modérateurs: ${moderateurs.length}`);
    } catch (err) {
        console.error('Erreur:', err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

testDemandes();
