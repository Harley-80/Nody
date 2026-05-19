// ============================================
// SCRIPT DIAGNOSTIC BACKEND - IMAGES PRODUITS
// ============================================
// À exécuter dans le terminal backend
// cd C:\xampp\htdocs\Documents\Nody\server
// node diagnostic-backend-images.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('🔍 DÉBUT DU DIAGNOSTIC BACKEND - IMAGES PRODUITS\n');
console.log('═══════════════════════════════════════════════════════════\n');

// ============================================
// 1. CONNEXION MONGODB
// ============================================
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
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

// ============================================
// 2. VÉRIFICATION MODÈLES
// ============================================
const verifierModeles = () => {
    console.log('📋 ÉTAPE 1: Vérification Modèles');
    console.log('─────────────────────────────────────────');

    try {
        const Produit = mongoose.model('Produit');
        console.log('✅ Modèle Produit chargé');

        const schema = Produit.schema.obj;
        console.log('📦 Champs du schéma Produit:');
        Object.keys(schema).forEach(key => {
            console.log(
                `   - ${key}: ${schema[key]?.type?.name || typeof schema[key]}`
            );
        });

        // Vérifier champ images
        if (schema.images) {
            console.log('\n✅ Champ "images" existe dans le schéma');
            console.log('   Type:', schema.images);
        } else {
            console.error('\n❌ Champ "images" MANQUANT dans le schéma');
        }

        if (schema.imagePrincipale) {
            console.log('✅ Champ "imagePrincipale" existe dans le schéma');
        }
    } catch (error) {
        console.error('❌ Erreur chargement modèle Produit:', error.message);
    }

    console.log('\n');
};

// ============================================
// 3. ANALYSE BASE DE DONNÉES
// ============================================
const analyserProduits = async () => {
    console.log('📋 ÉTAPE 2: Analyse Produits Base de Données');
    console.log('─────────────────────────────────────────');

    try {
        const Produit = mongoose.model('Produit');

        // Compter tous les produits
        const totalProduits = await Produit.countDocuments();
        console.log(`📦 Total produits: ${totalProduits}`);

        // Compter par vendeur
        const produitsParVendeur = await Produit.aggregate([
            { $group: { _id: '$vendeur', count: { $sum: 1 } } },
        ]);
        console.log(`👥 Produits par vendeur:`);
        produitsParVendeur.forEach(v => {
            console.log(`   Vendeur ${v._id}: ${v.count} produits`);
        });

        // Produits sans images
        const produitsSansImages = await Produit.countDocuments({
            $or: [
                { images: { $exists: false } },
                { images: { $size: 0 } },
                { images: null },
            ],
        });
        console.log(`\n⚠️  Produits sans images: ${produitsSansImages}`);

        // Produits avec images
        const produitsAvecImages = await Produit.countDocuments({
            images: { $exists: true, $ne: [], $ne: null },
        });
        console.log(`✅ Produits avec images: ${produitsAvecImages}`);

        // Analyser les 5 premiers produits
        const produits = await Produit.find()
            .populate('vendeur', 'nom prenom email')
            .populate('categorie', 'nom')
            .limit(5)
            .lean();

        console.log(`\n🔍 Analyse détaillée des 5 premiers produits:\n`);

        produits.forEach((produit, index) => {
            console.log(`   ${index + 1}. ${produit.nom || 'Sans nom'}`);
            console.log(`      ID: ${produit._id}`);
            console.log(
                `      Vendeur: ${produit.vendeur?.nom || 'Inconnu'} (${produit.vendeur?._id})`
            );
            console.log(
                `      Catégorie: ${produit.categorie?.nom || 'Aucune'}`
            );
            console.log(`      Prix: ${produit.prix || 0} XOF`);
            console.log(`      Stock: ${produit.stock || 0}`);
            console.log(`      Images (${produit.images?.length || 0}):`);

            if (produit.images && produit.images.length > 0) {
                produit.images.forEach((img, i) => {
                    console.log(`         ${i + 1}. ${img}`);
                });
            } else {
                console.log('         ⚠️  Aucune image');
            }

            if (produit.imagePrincipale) {
                console.log(
                    `      Image principale: ${produit.imagePrincipale}`
                );
            }

            console.log(`      Statut: ${produit.statut || 'inconnu'}`);
            console.log(
                `      Validation: ${produit.statutValidation || 'inconnu'}`
            );
            console.log('');
        });
    } catch (error) {
        console.error('❌ Erreur analyse produits:', error.message);
    }

    console.log('\n');
};

// ============================================
// 4. VÉRIFICATION FICHIERS UPLOADS
// ============================================
const verifierFichiersUploads = () => {
    console.log('📋 ÉTAPE 3: Vérification Dossier Uploads');
    console.log('─────────────────────────────────────────');

    const uploadsPath = path.join(__dirname, 'uploads');
    const produitsPath = path.join(uploadsPath, 'produits');

    // Vérifier dossier uploads
    if (fs.existsSync(uploadsPath)) {
        console.log('✅ Dossier uploads/ existe');
        const uploadsDirs = fs.readdirSync(uploadsPath);
        console.log('📁 Sous-dossiers:', uploadsDirs.join(', '));
    } else {
        console.error('❌ Dossier uploads/ MANQUANT');
        return;
    }

    // Vérifier dossier produits
    if (fs.existsSync(produitsPath)) {
        console.log('✅ Dossier uploads/produits/ existe');

        const files = fs.readdirSync(produitsPath);
        const imageFiles = files.filter(f =>
            /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
        );

        console.log(`📸 Images trouvées: ${imageFiles.length}`);

        if (imageFiles.length > 0) {
            console.log('\n🖼️  Liste des images (10 premières):');
            imageFiles.slice(0, 10).forEach((file, index) => {
                const filePath = path.join(produitsPath, file);
                const stats = fs.statSync(filePath);
                const sizeKB = (stats.size / 1024).toFixed(2);
                console.log(`   ${index + 1}. ${file} (${sizeKB} KB)`);
            });

            if (imageFiles.length > 10) {
                console.log(`   ... et ${imageFiles.length - 10} autres`);
            }
        } else {
            console.warn('⚠️  Aucune image trouvée dans uploads/produits/');
        }

        // Vérifier sous-dossiers
        const subDirs = files.filter(f => {
            const fullPath = path.join(produitsPath, f);
            return fs.statSync(fullPath).isDirectory();
        });

        if (subDirs.length > 0) {
            console.log('\n📁 Sous-dossiers dans uploads/produits/:');
            subDirs.forEach(dir => {
                const dirPath = path.join(produitsPath, dir);
                const dirFiles = fs.readdirSync(dirPath);
                console.log(`   ${dir}/ (${dirFiles.length} fichiers)`);
            });
        }
    } else {
        console.error('❌ Dossier uploads/produits/ MANQUANT');
    }

    console.log('\n');
};

// ============================================
// 5. VÉRIFICATION CONFIGURATION SERVEUR
// ============================================
const verifierConfiguration = () => {
    console.log('📋 ÉTAPE 4: Vérification Configuration');
    console.log('─────────────────────────────────────────');

    console.log("🌐 Variables d'environnement:");
    console.log(`   PORT: ${process.env.PORT || '5000'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(
        `   MONGO_URI: ${process.env.MONGO_URI ? '✅ Défini' : '❌ Manquant'}`
    );
    console.log(
        `   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Défini' : '❌ Manquant'}`
    );

    console.log('\n📦 Vérification fichiers critiques:');
    const criticalFiles = [
        'server.js',
        'app.js',
        'models/produitModel.js',
        'controllers/vendeurController.js',
        'routes/vendeurRoutes.js',
        'middleware/uploadMiddleware.js',
    ];

    criticalFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        const exists = fs.existsSync(filePath);
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    });

    console.log('\n');
};

// ============================================
// 6. VÉRIFICATION VENDEUR CONTROLLER
// ============================================
const verifierVendeurController = () => {
    console.log('📋 ÉTAPE 5: Vérification vendeurController.js');
    console.log('─────────────────────────────────────────');

    try {
        const controllerPath = path.join(
            __dirname,
            'controllers',
            'vendeurController.js'
        );

        if (fs.existsSync(controllerPath)) {
            console.log('✅ vendeurController.js existe');

            const content = fs.readFileSync(controllerPath, 'utf-8');

            // Vérifier exports
            const exports = [
                'getStatistiques',
                'getMesProduits',
                'getProduit',
                'creerProduit',
                'modifierProduit',
                'getMaBoutique',
            ];

            console.log('📦 Exports trouvés:');
            exports.forEach(exp => {
                const hasExport =
                    content.includes(`export ${exp}`) ||
                    content.includes(`export const ${exp}`) ||
                    (content.includes(`export {`) && content.includes(exp));
                console.log(`   ${hasExport ? '✅' : '❌'} ${exp}`);
            });
        } else {
            console.error('❌ vendeurController.js MANQUANT');
        }
    } catch (error) {
        console.error('❌ Erreur lecture vendeurController.js:', error.message);
    }

    console.log('\n');
};

// ============================================
// EXÉCUTION
// ============================================
const main = async () => {
    try {
        await connectDB();
        verifierModeles();
        await analyserProduits();
        verifierFichiersUploads();
        verifierConfiguration();
        verifierVendeurController();

        console.log(
            '═══════════════════════════════════════════════════════════'
        );
        console.log('📋 RÉSUMÉ DU DIAGNOSTIC BACKEND');
        console.log(
            '═══════════════════════════════════════════════════════════\n'
        );

        console.log('✅ Points à vérifier:');
        console.log('   1. Modèle Produit a le champ "images"');
        console.log('   2. Produits existent dans la DB');
        console.log("   3. Produits ont des URLs d'images");
        console.log('   4. Fichiers images existent dans uploads/produits/');
        console.log('   5. vendeurController.js a toutes les méthodes');
        console.log('   6. Routes sont correctes');

        console.log('\n📸 COPIEZ TOUS CES RÉSULTATS ET ENVOYEZ-LES MOI');
        console.log(
            '═══════════════════════════════════════════════════════════\n'
        );

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    }
};

main();
