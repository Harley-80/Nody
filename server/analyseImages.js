import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI =
    'mongodb+srv://admin_nody:AdminNody0025@nody-cluster.bzm0vhd.mongodb.net/nody_db?retryWrites=true&w=majority&appName=nody-cluster';
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'produits');

const produitSchema = new mongoose.Schema({}, { strict: false });
const Produit = mongoose.model('Produit', produitSchema);

async function analyserProbleme() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');

        // Fichiers sur disque
        const fichiersDisque = fs
            .readdirSync(UPLOADS_DIR)
            .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
        console.log(`📁 Fichiers sur disque: ${fichiersDisque.length}`);
        fichiersDisque.forEach(f => console.log(`   - ${f}`));
        console.log();

        // Produits en base
        const produits = await Produit.find({}).lean();
        console.log(`📊 Produits en base: ${produits.length}\n`);
        console.log('═'.repeat(80));

        for (const produit of produits) {
            console.log(`\n🔍 PRODUIT: ${produit.nom || 'Sans nom'}`);
            console.log(`   ID: ${produit._id}`);
            console.log(`   Créé: ${produit.creeLe || 'N/A'}`);

            if (!produit.images || produit.images.length === 0) {
                console.log('   ⚠️  Aucune image');
                continue;
            }

            console.log(`   Images (${produit.images.length}):`);

            for (let i = 0; i < produit.images.length; i++) {
                const img = produit.images[i];
                console.log(`\n   📷 Image ${i + 1}:`);
                console.log(`      Type: ${typeof img}`);
                console.log(
                    `      Valeur brute: ${JSON.stringify(img, null, 2)}`
                );

                // Essayer d'extraire l'URL
                let urlBD = null;
                if (typeof img === 'string') {
                    urlBD = img;
                } else if (typeof img === 'object' && img !== null) {
                    urlBD = img.url || img.path || img.filename || null;
                    console.log(`      Structure objet:`);
                    Object.keys(img).forEach(key => {
                        console.log(
                            `         ${key}: ${JSON.stringify(img[key])}`
                        );
                    });
                }

                if (!urlBD) {
                    console.log(
                        "      ❌ Impossible d'extraire le nom de fichier"
                    );
                    continue;
                }

                console.log(`      URL extraite: "${urlBD}"`);

                const nomFichier = urlBD.includes('/')
                    ? urlBD.split('/').pop()
                    : urlBD;
                console.log(`      Nom fichier: "${nomFichier}"`);

                const cheminComplet = path.join(UPLOADS_DIR, nomFichier);
                const existe = fs.existsSync(cheminComplet);

                if (existe) {
                    console.log(`      ✅ Fichier trouvé sur disque`);
                } else {
                    console.log(`      ❌ FICHIER INTROUVABLE`);
                    console.log(`      Chemin: ${cheminComplet}`);

                    // Chercher similaires
                    const similaires = fichiersDisque.filter(f => {
                        const ext = path.extname(f);
                        if (ext !== path.extname(nomFichier)) return false;

                        const ts = nomFichier.match(/\d{13}/);
                        if (ts && f.includes(ts[0])) return true;

                        if (
                            f.startsWith('produit_') &&
                            nomFichier.startsWith('produit_')
                        ) {
                            const p1 = f.split('_')[1]?.substring(0, 8);
                            const p2 = nomFichier
                                .split('_')[1]
                                ?.substring(0, 8);
                            return p1 === p2;
                        }

                        return false;
                    });

                    if (similaires.length > 0) {
                        console.log(`      🔍 Fichiers similaires:`);
                        similaires.forEach(s => console.log(`         - ${s}`));
                    }
                }
            }
        }

        console.log('\n\n═'.repeat(80));
        console.log('💡 DIAGNOSTIC');
        console.log('═'.repeat(80));
        console.log('Vérifiez la structure des images ci-dessus.');
        console.log(
            'Si vous voyez des objets complexes au lieu de simples strings,'
        );
        console.log(
            'le problème vient de la façon dont les images sont enregistrées en BD.'
        );

        await mongoose.disconnect();
        console.log('\n✅ Analyse terminée');
    } catch (error) {
        console.error('❌ Erreur:', error);
        await mongoose.disconnect();
    }
}

analyserProbleme();
