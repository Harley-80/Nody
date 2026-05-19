import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ debug: true });

// ============================================
// CONFIGURATION
// ============================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nody_db';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'produits');

// ============================================
// SCHÉMA PRODUIT (simplifié)
// ============================================
const produitSchema = new mongoose.Schema(
    {
        nom: String,
        images: [String],
        vendeur: mongoose.Schema.Types.ObjectId,
    },
    { timestamps: true }
);

const Produit = mongoose.model('Produit', produitSchema);

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Récupère tous les fichiers images du dossier uploads/produits
 */
const listerImagesDisponibles = () => {
    console.log(`\n📂 Analyse du dossier: ${UPLOADS_DIR}`);

    if (!fs.existsSync(UPLOADS_DIR)) {
        console.log("❌ Le dossier uploads/produits n'existe pas");
        return [];
    }

    const fichiers = fs.readdirSync(UPLOADS_DIR);
    const images = fichiers.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

    console.log(`✅ ${images.length} images trouvées dans le dossier`);
    images.forEach(img => console.log(`   📷 ${img}`));

    return images;
};

/**
 * Associe les images trouvées aux produits par ordre chronologique
 */
const associerImagesAuxProduits = async images => {
    const produits = await Produit.find({}).sort({ createdAt: 1 });

    console.log(`\n📊 ${produits.length} produits trouvés en base`);

    let imageIndex = 0;
    let produitsModifies = 0;

    for (const produit of produits) {
        // Si le produit a déjà des images, on les garde
        if (produit.images && produit.images.length > 0) {
            console.log(
                `\n✅ ${produit.nom} a déjà ${produit.images.length} images, on garde`
            );
            continue;
        }

        // Sinon, on lui attribue 1-3 images disponibles
        const nombreImages = Math.min(
            Math.floor(Math.random() * 3) + 1,
            images.length - imageIndex
        );

        if (nombreImages === 0) {
            console.log(
                `\n⚠️  ${produit.nom} - Pas assez d'images disponibles`
            );
            continue;
        }

        const nouvellesImages = [];
        for (let i = 0; i < nombreImages; i++) {
            const imageFilename = images[imageIndex++];
            const imageUrl = `${BASE_URL}/uploads/produits/${imageFilename}`;
            nouvellesImages.push(imageUrl);
        }

        console.log(`\n🔧 ${produit.nom} (${produit._id})`);
        console.log(`   Avant: ${produit.images.length} images`);
        console.log(`   Ajout de ${nouvellesImages.length} images:`);
        nouvellesImages.forEach(url => console.log(`      📷 ${url}`));

        produit.images = nouvellesImages;
        await produit.save();

        console.log(`   ✅ Images associées avec succès`);
        produitsModifies++;
    }

    return produitsModifies;
};

/**
 * Mode interactif: permet de choisir les images pour chaque produit
 */
const associerImagesInteractif = async images => {
    const produits = await Produit.find({}).sort({ createdAt: 1 });

    console.log(`\n📊 ${produits.length} produits trouvés`);
    console.log(`📷 ${images.length} images disponibles`);

    let produitsModifies = 0;

    for (const produit of produits) {
        console.log(`\n═══════════════════════════════════════════════`);
        console.log(`📦 Produit: ${produit.nom} (${produit._id})`);
        console.log(`   Images actuelles: ${produit.images.length}`);

        if (produit.images.length > 0) {
            console.log(`   ✅ Ce produit a déjà des images, on garde`);
            continue;
        }

        // Attribution automatique: toutes les images disponibles pour ce produit
        const nouvellesImages = images.map(
            img => `${BASE_URL}/uploads/produits/${img}`
        );

        console.log(`   🔧 Attribution de ${nouvellesImages.length} images:`);
        nouvellesImages.forEach((url, i) =>
            console.log(`      ${i + 1}. ${url}`)
        );

        produit.images = nouvellesImages;
        await produit.save();

        console.log(`   ✅ Images associées avec succès`);
        produitsModifies++;
    }

    return produitsModifies;
};

// ============================================
// FONCTION PRINCIPALE
// ============================================
const executerMigration = async () => {
    try {
        console.log('🔧 DÉBUT MIGRATION - ASSOCIATION IMAGES PRODUITS\n');
        console.log(
            '═══════════════════════════════════════════════════════════\n'
        );

        // Connexion MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connecté à MongoDB');
        console.log(
            `📊 Base de données: ${mongoose.connection.db.databaseName}\n`
        );

        // Lister les images disponibles
        const images = listerImagesDisponibles();

        if (images.length === 0) {
            console.log('\n❌ Aucune image trouvée dans uploads/produits/');
            console.log('💡 Vérifiez que les images sont bien uploadées');
            return;
        }

        // Associer les images aux produits
        console.log('\n🚀 Association des images aux produits...\n');
        const produitsModifies = await associerImagesInteractif(images);

        // Résumé
        console.log(
            '\n═══════════════════════════════════════════════════════════'
        );
        console.log('📋 RÉSUMÉ MIGRATION');
        console.log(
            '═══════════════════════════════════════════════════════════\n'
        );
        console.log(`✅ Produits modifiés: ${produitsModifies}`);
        console.log(`📷 Images disponibles: ${images.length}`);
        console.log(`🔗 Base URL: ${BASE_URL}`);
        console.log('\n🎉 Migration terminée avec succès !');

        // Vérification finale
        console.log('\n📊 Vérification finale...\n');
        const produitsVerif = await Produit.find({});
        for (const p of produitsVerif) {
            console.log(`✅ ${p.nom}: ${p.images.length} images`);
            p.images.forEach((img, i) => console.log(`   ${i + 1}. ${img}`));
        }
    } catch (error) {
        console.error('\n❌ Erreur lors de la migration:', error);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Connexion MongoDB fermée');
    }
};

// Exécution
executerMigration();
