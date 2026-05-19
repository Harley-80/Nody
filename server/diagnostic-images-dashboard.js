// diagnostic-images-dashboard.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configuration ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Couleurs pour console
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

const log = {
    error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warn: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: msg => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
};

// Fonction principale
async function diagnostiquerImages() {
    console.log('\n🔍 DIAGNOSTIC DES IMAGES - TABLEAUX DE BORD\n');
    console.log('='.repeat(60));

    // 1. VÉRIFICATION STRUCTURE DOSSIERS
    console.log('\n📁 1. STRUCTURE DES DOSSIERS UPLOADS');
    console.log('-'.repeat(60));

    const dossiers = [
        'uploads/produits',
        'uploads/avatars',
        'uploads/categories',
    ];
    dossiers.forEach(dossier => {
        const fullPath = path.join(__dirname, dossier);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath);
            log.success(`${dossier} existe (${files.length} fichiers)`);

            // Afficher les 3 premiers fichiers comme exemple
            if (files.length > 0) {
                console.log(`   Exemples: ${files.slice(0, 3).join(', ')}`);
            }
        } else {
            log.error(`${dossier} n'existe pas !`);
        }
    });

    // 2. VÉRIFICATION BASE DE DONNÉES
    console.log('\n💾 2. VÉRIFICATION DONNÉES PRODUITS');
    console.log('-'.repeat(60));

    try {
        // Connexion MongoDB
        const MONGO_URI =
            process.env.MONGO_URI || 'mongodb://localhost:27017/nody';
        await mongoose.connect(MONGO_URI);
        log.success('Connecté à MongoDB');

        const { default: Produit } = await import('./models/produitModel.js');
        const produitsAvecImages = await Produit.find({
            images: { $exists: true, $ne: [] },
        }).limit(5);

        if (produitsAvecImages.length === 0) {
            log.error('Aucun produit avec images trouvé en BDD');
        } else {
            log.success(
                `${produitsAvecImages.length} produits avec images trouvés`
            );

            produitsAvecImages.forEach((p, idx) => {
                console.log(`\n   Produit ${idx + 1}: ${p.nom}`);
                console.log(`   - ID: ${p._id}`);
                console.log(`   - Vendeur: ${p.vendeur}`);
                console.log(`   - Images (${p.images.length}):`);
                p.images.forEach((img, i) => {
                    console.log(`     [${i}] ${img}`);

                    // Vérifier si le fichier existe physiquement
                    const imagePath = path.join(__dirname, img);
                    if (fs.existsSync(imagePath)) {
                        const stats = fs.statSync(imagePath);
                        log.success(
                            `         Fichier existe (${(stats.size / 1024).toFixed(2)} KB)`
                        );
                    } else {
                        log.error(`         Fichier MANQUANT sur disque !`);
                    }
                });
            });
        }

        await mongoose.disconnect();
    } catch (error) {
        log.error(`Erreur BDD: ${error.message}`);
    }

    // 3. VÉRIFICATION API ENDPOINTS
    console.log('\n🌐 3. VÉRIFICATION ENDPOINTS API');
    console.log('-'.repeat(60));

    const API_BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    log.info(`URL API: ${API_BASE_URL}`);

    const endpoints = [
        '/api/produits',
        '/api/admin/produits',
        '/api/vendeur/produits',
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
                validateStatus: () => true,
                timeout: 5000,
            });

            if (response.status === 401 || response.status === 403) {
                log.warn(`${endpoint} - Auth requise (normal)`);
            } else if (response.status === 200) {
                const count =
                    response.data?.produits?.length ||
                    response.data?.length ||
                    0;
                log.success(`${endpoint} - OK (${count} produits)`);

                // Vérifier structure des images dans la réponse
                const premierProduit =
                    response.data?.produits?.[0] || response.data?.[0];
                if (premierProduit?.images?.[0]) {
                    console.log(
                        `   Exemple URL image: ${premierProduit.images[0]}`
                    );
                }
            } else {
                log.error(`${endpoint} - Status ${response.status}`);
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                log.error(`${endpoint} - Serveur non démarré !`);
            } else {
                log.error(`${endpoint} - Erreur: ${error.message}`);
            }
        }
    }

    // 4. VÉRIFICATION VARIABLES D'ENVIRONNEMENT
    console.log('\n⚙️  4. CONFIGURATION ENVIRONNEMENT (SERVER)');
    console.log('-'.repeat(60));

    const envVars = ['MONGO_URI', 'BASE_URL', 'PORT', 'JWT_SECRET'];

    envVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            // Masquer les secrets
            if (varName.includes('SECRET') || varName.includes('PASSWORD')) {
                log.success(`${varName} = ***${value.slice(-4)}`);
            } else {
                log.success(`${varName} = ${value}`);
            }
        } else {
            log.warn(`${varName} non défini`);
        }
    });

    // 5. VÉRIFICATION SERVEUR STATIC
    console.log('\n📦 5. CONFIGURATION EXPRESS STATIC');
    console.log('-'.repeat(60));

    try {
        const appFile = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

        if (
            appFile.includes("app.use('/uploads'") ||
            appFile.includes('app.use("/uploads"')
        ) {
            log.success("Route '/uploads' configurée dans app.js");

            // Extraire la ligne exacte
            const lines = appFile.split('\n');
            const uploadLine = lines.find(
                l => l.includes('/uploads') && l.includes('express.static')
            );
            if (uploadLine) {
                console.log(`   Config: ${uploadLine.trim()}`);
            }
        } else {
            log.error("Route '/uploads' MANQUANTE dans app.js !");
        }

        if (appFile.includes('express.static')) {
            log.success('express.static() utilisé');
        } else {
            log.error('express.static() MANQUANT !');
        }
    } catch (error) {
        log.error(`Erreur lecture app.js: ${error.message}`);
    }

    // 6. VÉRIFICATION URL CONSTRUCTION (CLIENT)
    console.log('\n🔗 6. CONSTRUCTION DES URLs (CLIENT)');
    console.log('-'.repeat(60));

    // Vérifier le .env du client
    const clientEnvPath = path.join(__dirname, '..', 'client', '.env');
    if (fs.existsSync(clientEnvPath)) {
        const clientEnv = fs.readFileSync(clientEnvPath, 'utf8');
        const apiUrl = clientEnv.match(/VITE_API_URL\s*=\s*(.+)/);
        if (apiUrl) {
            log.success(`Client VITE_API_URL = ${apiUrl[1].trim()}`);
        } else {
            log.error('VITE_API_URL non trouvé dans client/.env');
        }
    } else {
        log.warn('Fichier client/.env non trouvé');
    }

    const filesToCheck = [
        '../client/src/components/admin/dashboard/TableauProduitsPopulaires.jsx',
        '../client/src/components/vendeur/CarteProduitVendeur.jsx',
        '../client/src/components/produits/ProduitCard.jsx',
    ];

    filesToCheck.forEach(file => {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const fileName = path.basename(file);

            // Vérifier si l'image utilise VITE_API_URL
            if (
                content.includes('VITE_API_URL') ||
                content.includes('import.meta.env.VITE_API_URL')
            ) {
                log.success(`${fileName} utilise VITE_API_URL`);
            } else {
                log.warn(`${fileName} n'utilise peut-être pas VITE_API_URL`);
            }

            // Chercher les patterns d'URL d'images
            const srcMatches = content.match(/src=\{[^}]+\}/g);
            if (srcMatches && srcMatches.length > 0) {
                console.log(
                    `   Pattern trouvé: ${srcMatches[0].substring(0, 80)}...`
                );
            }
        } else {
            log.error(`Fichier non trouvé: ${file}`);
        }
    });

    // RÉSUMÉ
    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSUMÉ ET PROCHAINES ÉTAPES');
    console.log('='.repeat(60));
    console.log(`
Points à vérifier :
1. Les fichiers images existent physiquement dans uploads/produits/
2. La BDD contient les bons chemins (uploads/produits/xxx.jpg)
3. Express sert les fichiers static avec app.use('/uploads', express.static('uploads'))
4. Le frontend construit les URLs: \${VITE_API_URL}/uploads/produits/xxx.jpg
5. VITE_API_URL pointe vers le bon serveur backend

Prochaine étape : Envoie-moi les fichiers marqués en ❌ rouge
  `);
}

// Exécution
diagnostiquerImages().catch(console.error);
