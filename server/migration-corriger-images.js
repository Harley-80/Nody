// ============================================
// SCRIPT DE MIGRATION - CORRIGER LES IMAGES
// ============================================
// À exécuter UNE SEULE FOIS pour corriger les produits existants
// cd C:\xampp\htdocs\Documents\Nody\server
// node migration-corriger-images.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Produit from './models/produitModel.js';

dotenv.config();

console.log('🔧 DÉBUT MIGRATION - CORRECTION IMAGES PRODUITS\n');
console.log('═══════════════════════════════════════════════════════════\n');

const connectDB = async () => {
    try {
        const mongoUri =
            process.env.MONGO_URI ||
            process.env.MONGODB_URI ||
            process.env.DATABASE_URL;
        if (!mongoUri) {
            console.error('❌ MONGO_URI non trouvée dans .env');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connecté à MongoDB');
        console.log(`📊 Base de données: ${mongoose.connection.name}\n`);
    } catch (error) {
        console.error('❌ Erreur connexion MongoDB:', error.message);
        process.exit(1);
    }
};

const corrigerImages = async () => {
    try {
        console.log('📋 Récupération de tous les produits...\n');

        const produits = await Produit.find({});
        console.log(`✅ ${produits.length} produits trouvés\n`);

        let nbCorrige = 0;
        let nbDejaOK = 0;

        for (const produit of produits) {
            let needsUpdate = false;
            let newImages = [];

            console.log(`\n🔍 Analyse: ${produit.nom} (${produit._id})`);
            console.log(`   Images actuelles (type):`, typeof produit.images);
            console.log(
                `   Images actuelles (length):`,
                produit.images?.length || 0
            );

            // CAS 1: Images est un tableau d'objets
            if (Array.isArray(produit.images) && produit.images.length > 0) {
                const firstItem = produit.images[0];

                if (
                    typeof firstItem === 'object' &&
                    firstItem !== null &&
                    !Array.isArray(firstItem)
                ) {
                    console.log(
                        '   ⚠️  Images stockées comme objets → Conversion en cours'
                    );

                    newImages = produit.images
                        .map(img => {
                            if (typeof img === 'object') {
                                const url =
                                    img.url || img.src || img.path || '';
                                // Construire l'URL complète
                                if (url && !url.startsWith('http')) {
                                    if (url.startsWith('/uploads')) {
                                        return `http://localhost:5000${url}`;
                                    } else if (!url.includes('/')) {
                                        return `http://localhost:5000/uploads/produits/${url}`;
                                    }
                                }
                                return url;
                            }
                            return img;
                        })
                        .filter(url => url); // Retirer les URLs vides

                    needsUpdate = true;
                }
                // CAS 2: Images est déjà un tableau de strings
                else if (typeof firstItem === 'string') {
                    console.log('   ✅ Images déjà en format string');

                    // Vérifier si les URLs sont complètes
                    newImages = produit.images.map(img => {
                        if (!img.startsWith('http')) {
                            if (img.startsWith('/uploads')) {
                                return `http://localhost:5000${img}`;
                            } else if (!img.includes('/')) {
                                return `http://localhost:5000/uploads/produits/${img}`;
                            }
                        }
                        return img;
                    });

                    // Vérifier si on a modifié des URLs
                    const hasChanged = newImages.some(
                        (url, i) => url !== produit.images[i]
                    );
                    if (hasChanged) {
                        needsUpdate = true;
                        console.log('   🔧 URLs complétées avec domaine');
                    }
                }
            }
            // CAS 3: Aucune image mais imagesObjets existe
            else if (
                (!produit.images || produit.images.length === 0) &&
                produit.imagesObjets &&
                produit.imagesObjets.length > 0
            ) {
                console.log('   ⚠️  Utilisation de imagesObjets comme source');

                newImages = produit.imagesObjets
                    .map(img => {
                        const url = img.url || img.src || '';
                        if (url && !url.startsWith('http')) {
                            if (url.startsWith('/uploads')) {
                                return `http://localhost:5000${url}`;
                            } else if (!url.includes('/')) {
                                return `http://localhost:5000/uploads/produits/${url}`;
                            }
                        }
                        return url;
                    })
                    .filter(url => url);

                needsUpdate = true;
            }

            if (needsUpdate && newImages.length > 0) {
                console.log(`   🔄 Mise à jour: ${newImages.length} images`);
                newImages.forEach((url, i) => {
                    console.log(`      ${i + 1}. ${url}`);
                });

                // Mise à jour directe sans trigger le middleware
                await Produit.updateOne(
                    { _id: produit._id },
                    { $set: { images: newImages } }
                );

                nbCorrige++;
                console.log('   ✅ Produit corrigé');
            } else {
                nbDejaOK++;
                console.log('   ✅ Produit déjà OK');
            }
        }

        console.log(
            '\n\n═══════════════════════════════════════════════════════════'
        );
        console.log('📋 RÉSUMÉ MIGRATION');
        console.log(
            '═══════════════════════════════════════════════════════════\n'
        );
        console.log(`✅ Produits corrigés: ${nbCorrige}`);
        console.log(`✅ Produits déjà OK: ${nbDejaOK}`);
        console.log(`📦 Total traité: ${produits.length}`);
        console.log('\n🎉 Migration terminée avec succès !');
    } catch (error) {
        console.error('\n❌ Erreur migration:', error);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        await corrigerImages();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    }
};

main();
