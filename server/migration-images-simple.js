// migration-images-simple.js
import mongoose from 'mongoose';
import Produit from './models/produitModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function migrerImages() {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            console.error('❌ MONGODB_URI non trouvé dans .env');
            process.exit(1);
        }

        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(uri);
        console.log('✅ Connecté à MongoDB\n');

        const produits = await Produit.find({
            images: { $exists: true, $ne: [] },
        }).lean();
        console.log(`📦 ${produits.length} produits trouvés avec images\n`);

        if (produits.length === 0) {
            console.log('⚠️  Aucun produit à migrer');
            await mongoose.disconnect();
            process.exit(0);
        }

        let migreCount = 0;
        let skipCount = 0;

        for (const produit of produits) {
            console.log(`\n🔍 Analyse: ${produit.nom}`);
            console.log(`   ID: ${produit._id}`);
            console.log(
                `   Images actuelles (${produit.images?.length || 0}):`
            );

            // Convertir en objet simple pour débug
            const imagesRaw = JSON.parse(JSON.stringify(produit.images || []));
            console.log('   Structure:', JSON.stringify(imagesRaw, null, 2));

            if (!produit.images || produit.images.length === 0) {
                console.log("   ⏭️  Pas d'images, ignoré");
                skipCount++;
                continue;
            }

            const premierImage = produit.images[0];

            // Vérifier le type
            if (typeof premierImage === 'string') {
                console.log('   ✅ Déjà au format string simple');
                skipCount++;
                continue;
            }

            // Si c'est un objet avec {url, alt, estPrincipale}
            if (premierImage && typeof premierImage === 'object') {
                console.log(
                    '   🔄 Migration nécessaire (format objet détecté)'
                );

                const nouvellesImages = [];

                for (let i = 0; i < produit.images.length; i++) {
                    const img = produit.images[i];
                    const url = img.url || img;

                    console.log(
                        `   [${i}] Traitement: ${JSON.stringify(img).substring(0, 100)}`
                    );

                    // Ignorer les URLs externes
                    if (typeof url === 'string' && url.startsWith('http')) {
                        console.log(
                            `       ⚠️  URL externe ignorée: ${url.substring(0, 60)}...`
                        );
                        continue;
                    }

                    // Si déjà au format relatif
                    if (typeof url === 'string' && url.startsWith('uploads/')) {
                        console.log(`       ✅ Conservé: ${url}`);
                        nouvellesImages.push(url);
                        continue;
                    }

                    // Ajouter le préfixe
                    if (typeof url === 'string' && url.trim() !== '') {
                        const newUrl = url.includes('/')
                            ? url
                            : `uploads/produits/${url}`;
                        console.log(`       🔧 Transformé: ${url} → ${newUrl}`);
                        nouvellesImages.push(newUrl);
                    }
                }

                if (nouvellesImages.length === 0) {
                    console.log(
                        '   ⚠️  Aucune image valide après migration, ajout placeholder'
                    );
                    nouvellesImages.push('uploads/produits/placeholder.jpg');
                }

                // Mise à jour directe en BDD
                await Produit.updateOne(
                    { _id: produit._id },
                    { $set: { images: nouvellesImages } }
                );

                console.log(`   ✅ Migré: ${nouvellesImages.length} image(s)`);
                console.log(`   Nouvelles images:`, nouvellesImages);
                migreCount++;
            } else {
                console.log('   ⚠️  Format inconnu, ignoré');
                console.log('   Type:', typeof premierImage);
                console.log('   Valeur:', premierImage);
                skipCount++;
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('📊 RÉSUMÉ DE LA MIGRATION');
        console.log('='.repeat(70));
        console.log(`✅ Produits migrés avec succès: ${migreCount}`);
        console.log(`⏭️  Produits déjà au bon format: ${skipCount}`);
        console.log(`📦 Total traité: ${produits.length}`);
        console.log('='.repeat(70));

        // Vérification post-migration
        console.log('\n🔍 VÉRIFICATION POST-MIGRATION');
        const produitsApres = await Produit.find({
            images: { $exists: true, $ne: [] },
        })
            .lean()
            .limit(3);

        for (const p of produitsApres) {
            console.log(`\n✓ ${p.nom}`);
            console.log(`  Images:`, p.images);
        }

        await mongoose.disconnect();
        console.log('\n✅ Migration terminée avec succès\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERREUR MIGRATION:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

migrerImages();
