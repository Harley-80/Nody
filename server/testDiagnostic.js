// testDiagnostic.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Utilisateur from './models/utilisateurModel.js';

const diagnostiquer = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/nody_db');
        console.log('🔍 DIAGNOSTIC DU PROBLÈME');

        // 1. Vérifier si l'admin est trouvé
        const admin = await Utilisateur.findOne({
            email: 'admin@nody.sn',
        }).select('+motDePasse');

        if (!admin) {
            console.log('❌ Admin non trouvé dans la base');
            return;
        }

        console.log('✅ Admin trouvé:', admin.email);
        console.log('📝 Hash présent:', !!admin.motDePasse);
        console.log('🔑 Hash:', admin.motDePasse);

        // 2. Test direct avec bcrypt
        console.log('\n🧪 TEST DIRECT AVEC BCRYPT:');
        const testDirect = await bcrypt.compare('Admin123!', admin.motDePasse);
        console.log('   bcrypt.compare("Admin123!") ->', testDirect);

        // 3. Test avec la méthode du modèle
        console.log('\n🧪 TEST AVEC MÉTHODE DU MODÈLE:');
        const testModele = await admin.comparerMotDePasse('Admin123!');
        console.log('   admin.comparerMotDePasse("Admin123!") ->', testModele);

        // 4. Test avec d'autres mots de passe
        console.log('\n🧪 TEST AUTRES MOTS DE PASSE:');
        const tests = [
            'Admin123',
            'admin123',
            'Admin@2025',
            'admin',
            'password',
        ];

        for (const mdp of tests) {
            const resultat = await bcrypt.compare(mdp, admin.motDePasse);
            console.log(`   "${mdp}" -> ${resultat}`);
            if (resultat) {
                console.log(`   🎉 MOT DE PASSE TROUVÉ: "${mdp}"`);
                break;
            }
        }

        if (!testDirect) {
            console.log('\n🔍 ANALYSE DU HASH:');
            console.log('   Longueur hash:', admin.motDePasse.length);
            console.log(
                '   Format:',
                admin.motDePasse.substring(0, 30) + '...'
            );
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.connection.close();
    }
};

diagnostiquer();
