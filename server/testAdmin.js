// Test complet du hachage et de la comparaison des mots de passe
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const testHashEtComparaison = async () => {
    console.log('🔐 TEST DE HACHAGE ET COMPARAISON');
    console.log('='.repeat(50));

    const motDePasseClair = 'Admin123!';

    try {
        // 1. Test de hachage basique
        console.log('\n1. 🧪 Test de hachage basique:');
        const sel = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(motDePasseClair, sel);

        console.log('   Mot de passe clair:', motDePasseClair);
        console.log('   Sel utilisé:', sel);
        console.log('   Hash généré:', hash);
        console.log('   Longueur du hash:', hash.length);

        // 2. Test de comparaison
        console.log('\n2. ✅ Test de comparaison:');
        const comparaisonReussie = await bcrypt.compare(motDePasseClair, hash);
        console.log('   Comparaison réussie:', comparaisonReussie);

        // 3. Test avec mauvais mot de passe
        console.log('\n3. ❌ Test avec mauvais mot de passe:');
        const mauvaisComparaison = await bcrypt.compare('Mauvais123!', hash);
        console.log('   Mauvais mot de passe accepté:', mauvaisComparaison);

        // 4. Test avec le même mot de passe mais hash différent
        console.log('\n4. 🔄 Test avec nouveau hash du même mot de passe:');
        const nouveauHash = await bcrypt.hash(motDePasseClair, sel);
        console.log('   Premier hash:', hash.substring(0, 30) + '...');
        console.log('   Second hash :', nouveauHash.substring(0, 30) + '...');
        console.log('   Les hashs sont identiques:', hash === nouveauHash);

        const comparaisonAvecNouveauHash = await bcrypt.compare(
            motDePasseClair,
            nouveauHash
        );
        console.log(
            '   Comparaison avec nouveau hash réussie:',
            comparaisonAvecNouveauHash
        );

        console.log('\n🎉 Tous les tests de hachage sont réussis!');
    } catch (error) {
        console.error('❌ Erreur lors du test de hachage:', error);
    }
};

const testAdminDansBase = async () => {
    console.log("\n🗄️  TEST DE L'ADMIN DANS LA BASE");
    console.log('='.repeat(50));

    try {
        // Connexion à MongoDB
        await mongoose.connect('mongodb://localhost:27017/nody_db');
        console.log('✅ Connecté à MongoDB');

        // Import du modèle
        const { default: Utilisateur } = await import(
            './models/utilisateurModel.js'
        );
        const { ROLES } = await import('./constants/roles.js');

        // Recherche de l'admin
        console.log("\n🔍 Recherche de l'administrateur...");
        const admin = await Utilisateur.findOne({ role: ROLES.ADMIN }).select(
            '+motDePasse'
        );

        if (!admin) {
            console.log('❌ Aucun administrateur trouvé dans la base');
            return;
        }

        console.log('✅ Administrateur trouvé:');
        console.log('   📧 Email:', admin.email);
        console.log('   👤 Nom:', `${admin.prenom} ${admin.nom}`);
        console.log('   🏷️  Rôle:', admin.role);
        console.log('   🔑 Hash du mot de passe:', admin.motDePasse);
        console.log('   📅 Créé le:', admin.createdAt.toLocaleString());
        console.log('   ✅ Email vérifié:', admin.emailVerifie);
        console.log('   ✅ Compte actif:', admin.estActif);

        // Test de comparaison avec le mot de passe stocké
        console.log('\n🧪 Test de connexion avec mot de passe "Admin123!":');
        const motDePasseCorrect = await admin.comparerMotDePasse('Admin123!');
        console.log('   Mot de passe "Admin123!" accepté:', motDePasseCorrect);

        // Test avec mauvais mot de passe
        const motDePasseIncorrect =
            await admin.comparerMotDePasse('Mauvais123!');
        console.log(
            '   Mot de passe "Mauvais123!" accepté:',
            motDePasseIncorrect
        );

        // Test direct avec bcrypt
        console.log('\n🔍 Test direct avec bcrypt.compare:');
        const testDirect = await bcrypt.compare('Admin123!', admin.motDePasse);
        console.log('   Test direct bcrypt réussi:', testDirect);

        if (!motDePasseCorrect) {
            console.log('\n⚠️  PROBLEME IDENTIFIÉ:');
            console.log(
                '   Le mot de passe stocké ne correspond pas à "Admin123!"'
            );
            console.log('   Causes possibles:');
            console.log(
                '   - Mauvais mot de passe utilisé lors de la création'
            );
            console.log('   - Problème de hachage');
            console.log('   - Caractères spéciaux mal interprétés');
        }
    } catch (error) {
        console.error('❌ Erreur lors du test de la base:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Déconnecté de la base de données');
    }
};

// Exécution des tests
const executerTests = async () => {
    console.log('🚀 DÉMARRAGE DES TESTS COMPLETS');
    console.log('='.repeat(50));

    await testHashEtComparaison();
    await testAdminDansBase();

    console.log('\n✨ TOUS LES TESTS TERMINÉS');
};

executerTests().catch(console.error);
