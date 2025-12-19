import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Utilisateur from '../models/utilisateurModel.js';

dotenv.config();

const supprimerTous = async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/nody'
        );
        console.log('✅ Connecté\n');

        // Liste de TOUS les emails de test à supprimer
        const emailsTest = [
            'vendeur1@test.com',
            'vendeur2@test.com',
            'moderateur1@test.com',
            'test@gmail.com',
            'aminata.diallo@test.sn',
            'cheikh.ndiaye@test.sn',
            'fatou.sow@test.sn',
            'ousmane.sarr@test.sn',
        ];

        console.log('🗑️  Suppression de TOUS les utilisateurs de test...\n');

        for (const email of emailsTest) {
            const result = await Utilisateur.deleteOne({ email });
            if (result.deletedCount > 0) {
                console.log(`✅ Supprimé: ${email}`);
            } else {
                console.log(`⚠️  Non trouvé: ${email}`);
            }
        }

        // Supprimer AUSSI tous les vendeurs/modérateurs en attente (au cas où)
        const resultGlobal = await Utilisateur.deleteMany({
            role: { $in: ['vendeur', 'moderateur'] },
            statutVerification: 'en_attente',
        });

        console.log(
            `\n🗑️  ${resultGlobal.deletedCount} autres utilisateurs supprimés (filtre global)\n`
        );

        // Vérification finale
        const total = await Utilisateur.countDocuments({
            role: { $in: ['vendeur', 'moderateur'] },
            statutVerification: 'en_attente',
        });

        console.log(`📊 TOTAL restant: ${total} demandes en attente\n`);

        if (total === 0) {
            console.log('✅ PARFAIT: Base de données nettoyée complètement');
        } else {
            console.log('⚠️  ATTENTION: Il reste encore des utilisateurs');
        }

        await mongoose.connection.close();
        console.log('\n✅ Nettoyage terminé');
        process.exit(0);
    } catch (erreur) {
        console.error('❌ Erreur:', erreur);
        await mongoose.connection.close();
        process.exit(1);
    }
};

supprimerTous();
