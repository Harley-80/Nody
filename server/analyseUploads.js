const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Configuration
MONGODB_URI=mongodb+srv://admin_nody:AdminNody0025@nody-cluster.bzm0vhd.mongodb.net/nody_db?retryWrites=true&w=majority&appName=nody-cluster
const uploadsDir = path.join(__dirname, 'uploads');

// Connecter à MongoDB
mongoose
    .connect(MONGODB_URI)
    .then(() => console.log('✅ Connecté à MongoDB'))
    .catch(err => console.error('❌ Erreur MongoDB:', err));

// Schéma Produit (à adapter selon votre modèle)
const produitSchema = new mongoose.Schema({}, { strict: false });
const Produit = mongoose.model('Produit', produitSchema);

async function analyseComplete() {
    console.log('\n=== ANALYSE COMPLÈTE DES UPLOADS ===\n');

    // 1. Lister tous les fichiers physiques
    console.log('📁 ÉTAPE 1 : Fichiers physiques sur le disque');
    console.log('─'.repeat(60));

    let fichiersDisque = [];
    try {
        if (!fs.existsSync(UPLOADS_DIR)) {
            console.error(`❌ Dossier introuvable : ${UPLOADS_DIR}`);
            return;
        }

        fichiersDisque = fs
            .readdirSync(UPLOADS_DIR)
            .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

        console.log(`✅ ${fichiersDisque.length} fichiers trouvés\n`);
        fichiersDisque.forEach(f => {
            const fullPath = path.join(UPLOADS_DIR, f);
            const stats = fs.statSync(fullPath);
            console.log(`   📄 ${f}`);
            console.log(`      Taille: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`      Créé: ${stats.birthtime.toLocaleString()}`);
            console.log();
        });
    } catch (err) {
        console.error('❌ Erreur lecture disque:', err.message);
        return;
    }

    // 2. Lister tous les produits en base
    console.log('\n📊 ÉTAPE 2 : Produits dans la base de données');
    console.log('─'.repeat(60));

    let produits;
    try {
        produits = await Produit.find({});
        console.log(`✅ ${produits.length} produits trouvés\n`);
    } catch (err) {
        console.error('❌ Erreur lecture BD:', err.message);
        return;
    }

    // 3. Analyser chaque produit
    console.log('\n🔍 ÉTAPE 3 : Vérification croisée');
    console.log('─'.repeat(60));

    const problemes = [];

    for (const produit of produits) {
        // Extraire les images du produit
        const images = [];

        if (produit.image) images.push(produit.image);
        if (produit.images && Array.isArray(produit.images)) {
            images.push(...produit.images);
        }
        if (produit.photo) images.push(produit.photo);

        for (const imgPath of images) {
            if (!imgPath) continue;

            // Extraire le nom de fichier
            const fileName = path.basename(imgPath);
            const fullPath = path.join(UPLOADS_DIR, fileName);

            // Vérifier si le fichier existe
            const existe = fs.existsSync(fullPath);

            if (!existe) {
                problemes.push({
                    produitId: produit._id,
                    produitNom: produit.nom || produit.name || 'Sans nom',
                    fichierAttendu: fileName,
                    cheminComplet: fullPath,
                    champBD: imgPath,
                });

                console.log(`\n❌ PROBLÈME DÉTECTÉ`);
                console.log(
                    `   Produit: ${produit.nom || 'Sans nom'} (ID: ${produit._id})`
                );
                console.log(`   Fichier attendu: ${fileName}`);
                console.log(`   Chemin complet: ${fullPath}`);
                console.log(`   Valeur en BD: ${imgPath}`);

                // Chercher un fichier similaire
                const similaires = fichiersDisque.filter(f => {
                    // Même préfixe (premiers 10 caractères)
                    return f.substring(0, 10) === fileName.substring(0, 10);
                });

                if (similaires.length > 0) {
                    console.log(`   ⚠️  Fichiers similaires trouvés:`);
                    similaires.forEach(s => console.log(`      - ${s}`));
                }
            } else {
                console.log(`✅ OK: ${fileName}`);
            }
        }
    }

    // 4. Fichiers orphelins (sur disque mais pas en BD)
    console.log(
        '\n\n🗑️  ÉTAPE 4 : Fichiers orphelins (sur disque mais pas en BD)'
    );
    console.log('─'.repeat(60));

    const fichiersEnBD = produits.flatMap(p => {
        const imgs = [];
        if (p.image) imgs.push(path.basename(p.image));
        if (p.images) imgs.push(...p.images.map(i => path.basename(i)));
        if (p.photo) imgs.push(path.basename(p.photo));
        return imgs;
    });

    const orphelins = fichiersDisque.filter(f => !fichiersEnBD.includes(f));

    if (orphelins.length > 0) {
        console.log(`⚠️  ${orphelins.length} fichiers orphelins détectés:\n`);
        orphelins.forEach(o => console.log(`   📄 ${o}`));
    } else {
        console.log('✅ Aucun fichier orphelin');
    }

    // 5. Résumé et recommandations
    console.log('\n\n📋 RÉSUMÉ');
    console.log('═'.repeat(60));
    console.log(`Fichiers sur disque: ${fichiersDisque.length}`);
    console.log(`Produits en base: ${produits.length}`);
    console.log(`Problèmes détectés: ${problemes.length}`);
    console.log(`Fichiers orphelins: ${orphelins.length}`);

    if (problemes.length > 0) {
        console.log('\n\n💡 RECOMMANDATIONS');
        console.log('─'.repeat(60));
        console.log(
            "1. Vérifiez votre code d'upload pour voir où le nom se génère"
        );
        console.log('2. Assurez-vous que le même nom est utilisé pour :');
        console.log('   - Enregistrer le fichier physique');
        console.log('   - Enregistrer le chemin en base de données');
        console.log(
            '3. Utilisez le script de correction ci-dessous si nécessaire'
        );

        // Générer un script de correction
        console.log('\n\n🔧 SCRIPT DE CORRECTION (à exécuter avec précaution)');
        console.log('─'.repeat(60));
        console.log("// Sauvegardez votre base avant d'exécuter ceci !\n");

        problemes.forEach(p => {
            const similaires = fichiersDisque.filter(
                f => f.substring(0, 10) === p.fichierAttendu.substring(0, 10)
            );

            if (similaires.length === 1) {
                console.log(`// Produit: ${p.produitNom}`);
                console.log(`await Produit.updateOne(
  { _id: '${p.produitId}' },
  { $set: { image: 'uploads/produits/${similaires[0]}' } }
);\n`);
            }
        });
    }

    mongoose.disconnect();
}

// Exécuter l'analyse
analyseComplete().catch(err => {
    console.error('❌ Erreur fatale:', err);
    mongoose.disconnect();
});
