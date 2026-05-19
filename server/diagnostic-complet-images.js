import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;
const MONGODB_URI = process.env.MONGODB_URI;

// Couleurs
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
    console.log('\n' + '═'.repeat(80));
    log(`  ${title}`, 'cyan');
    console.log('═'.repeat(80) + '\n');
}

function subsection(title) {
    log(`\n▶ ${title}`, 'magenta');
    console.log('─'.repeat(80));
}

let problemes = [];
let reussites = [];

function addProbleme(titre, details) {
    problemes.push({ titre, details });
    log(`❌ ${titre}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
}

function addReussite(titre, details) {
    reussites.push({ titre, details });
    log(`✅ ${titre}`, 'green');
    if (details) log(`   ${details}`, 'blue');
}

// ============================================================================
// ÉTAPE 1: VÉRIFICATION ENVIRONNEMENT
// ============================================================================
async function verifierEnvironnement() {
    section('ÉTAPE 1: VÉRIFICATION ENVIRONNEMENT & CONFIGURATION');

    // Variables d'environnement
    subsection("Variables d'environnement (.env)");
    const envVars = {
        MONGODB_URI: process.env.MONGODB_URI,
        BASE_URL: process.env.BASE_URL,
        PORT: process.env.PORT,
        JWT_SECRET: process.env.JWT_SECRET,
    };

    for (const [key, value] of Object.entries(envVars)) {
        if (value) {
            const displayValue =
                key.includes('SECRET') || key.includes('URI')
                    ? `${value.substring(0, 20)}...`
                    : value;
            addReussite(`${key} défini`, displayValue);
        } else {
            addProbleme(
                `${key} manquant`,
                'Cette variable devrait être définie dans .env'
            );
        }
    }

    // Dossiers uploads
    subsection('Structure des dossiers uploads');
    const dossiers = [
        'uploads',
        'uploads/produits',
        'uploads/avatars',
        'uploads/categories',
    ];

    for (const dossier of dossiers) {
        const chemin = path.join(process.cwd(), dossier);
        if (fs.existsSync(chemin)) {
            const fichiers = fs.readdirSync(chemin);
            const images = fichiers.filter(f =>
                /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
            );
            addReussite(
                `${dossier} existe`,
                `${images.length} images trouvées`
            );

            if (images.length > 0 && dossier === 'uploads/produits') {
                log(`   Exemples: ${images.slice(0, 3).join(', ')}`, 'blue');
            }
        } else {
            addProbleme(`${dossier} manquant`, 'Le dossier devrait exister');
        }
    }

    // Vérifier app.js
    subsection('Configuration Express (app.js)');
    try {
        const appJsPath = path.join(process.cwd(), 'app.js');
        if (fs.existsSync(appJsPath)) {
            const appJsContent = fs.readFileSync(appJsPath, 'utf8');

            if (appJsContent.includes("app.use('/uploads'")) {
                addReussite(
                    'Route /uploads configurée',
                    'express.static détecté'
                );

                // Extraire la ligne exacte
                const lignes = appJsContent.split('\n');
                const ligneUploads = lignes.find(l =>
                    l.includes("app.use('/uploads'")
                );
                if (ligneUploads) {
                    log(`   ${ligneUploads.trim()}`, 'blue');
                }
            } else {
                addProbleme(
                    'Route /uploads manquante dans app.js',
                    "Ajouter: app.use('/uploads', express.static('uploads'))"
                );
            }
        } else {
            addProbleme('app.js introuvable', `Cherché dans: ${appJsPath}`);
        }
    } catch (error) {
        addProbleme('Erreur lecture app.js', error.message);
    }
}

// ============================================================================
// ÉTAPE 2: VÉRIFICATION BASE DE DONNÉES
// ============================================================================
async function verifierBaseDeDonnees() {
    section('ÉTAPE 2: VÉRIFICATION BASE DE DONNÉES');

    try {
        subsection('Connexion MongoDB');
        await mongoose.connect(MONGODB_URI);
        addReussite(
            'Connexion MongoDB établie',
            MONGODB_URI.substring(0, 30) + '...'
        );

        // Définir un schéma flexible
        const Produit = mongoose.model(
            'Produit',
            new mongoose.Schema({}, { strict: false }),
            'produits'
        );

        subsection('Analyse des produits en base');
        const produits = await Produit.find({}).limit(10).lean();

        log(`\n📦 Total produits trouvés: ${produits.length}`, 'cyan');

        if (produits.length === 0) {
            addProbleme(
                'Aucun produit en base',
                'Ajoute au moins un produit de test via le dashboard vendeur'
            );
            await mongoose.disconnect();
            return;
        }

        for (const [index, produit] of produits.entries()) {
            log(`\n${'─'.repeat(80)}`, 'blue');
            log(
                `PRODUIT ${index + 1}: ${produit.nom || 'Sans nom'}`,
                'magenta'
            );
            log(`ID: ${produit._id}`, 'blue');
            log(`Vendeur: ${produit.vendeur || 'Non défini'}`, 'blue');
            log(`Statut: ${produit.statut || 'Non défini'}`, 'blue');
            log(`Actif: ${produit.estActif}`, 'blue');

            // Analyser les images
            if (!produit.images || produit.images.length === 0) {
                addProbleme(
                    `Produit "${produit.nom}" n'a aucune image`,
                    'Le champ images est vide ou manquant'
                );
                continue;
            }

            log(`\n📸 Images (${produit.images.length}):`, 'cyan');

            for (const [imgIndex, img] of produit.images.entries()) {
                const imgType = typeof img;

                log(`\n   Image ${imgIndex + 1}:`, 'yellow');
                log(`   Type: ${imgType}`, 'blue');

                if (imgType === 'string') {
                    // Format attendu: string
                    addReussite('Format correct (string)', img);

                    // Vérifier si c'est une URL absolue ou relative
                    if (
                        img.startsWith('http://') ||
                        img.startsWith('https://')
                    ) {
                        log(`   ✓ URL absolue (OK pour API)`, 'green');
                    } else if (img.startsWith('uploads/')) {
                        log(
                            `   ⚠ Chemin relatif (doit être converti en URL par formaterUrlsImages)`,
                            'yellow'
                        );

                        // Vérifier si le fichier existe physiquement
                        const fichierPath = path.join(process.cwd(), img);
                        if (fs.existsSync(fichierPath)) {
                            const stats = fs.statSync(fichierPath);
                            addReussite(
                                'Fichier existe sur disque',
                                `Taille: ${(stats.size / 1024).toFixed(2)} KB`
                            );
                        } else {
                            addProbleme(
                                'Fichier introuvable sur disque',
                                fichierPath
                            );
                        }
                    } else {
                        addProbleme(
                            'Format de chemin inconnu',
                            `Valeur: ${img}`
                        );
                    }
                } else if (imgType === 'object') {
                    // Ancien format objet
                    addProbleme(
                        'Format objet détecté (ancien schéma)',
                        JSON.stringify(img)
                    );
                    log(
                        `   Structure: ${JSON.stringify(img, null, 2)}`,
                        'yellow'
                    );
                    log(
                        `   ⚠ Ce format n'est plus supporté avec images: [String]`,
                        'red'
                    );
                } else {
                    addProbleme(
                        "Type d'image invalide",
                        `Type: ${imgType}, Valeur: ${img}`
                    );
                }
            }
        }

        await mongoose.disconnect();
        addReussite('Déconnexion MongoDB', '');
    } catch (error) {
        addProbleme('Erreur MongoDB', error.message);
        console.error(error);
    }
}

// ============================================================================
// ÉTAPE 3: VÉRIFICATION API ENDPOINTS
// ============================================================================
async function verifierEndpointsAPI() {
    section('ÉTAPE 3: VÉRIFICATION ENDPOINTS API');

    const endpoints = [
        { nom: 'Produits publics', url: '/produits', auth: false },
        {
            nom: 'Produits populaires',
            url: '/produits/populaires',
            auth: false,
        },
    ];

    for (const endpoint of endpoints) {
        subsection(`Test: ${endpoint.nom}`);

        try {
            const response = await axios.get(`${API_URL}${endpoint.url}`);
            addReussite(
                `Endpoint accessible (${response.status})`,
                `${API_URL}${endpoint.url}`
            );

            // Analyser la réponse
            const data = response.data;
            let produits = [];

            if (Array.isArray(data)) {
                produits = data;
            } else if (data.donnees && Array.isArray(data.donnees)) {
                produits = data.donnees;
            } else if (data.data && Array.isArray(data.data)) {
                produits = data.data;
            }

            log(`   Produits retournés: ${produits.length}`, 'blue');

            if (produits.length > 0) {
                const premier = produits[0];
                log(`\n   Premier produit:`, 'cyan');
                log(`   Nom: ${premier.nom || 'N/A'}`, 'blue');
                log(`   ID: ${premier._id || 'N/A'}`, 'blue');

                if (premier.images && premier.images.length > 0) {
                    log(`\n   Images (${premier.images.length}):`, 'cyan');
                    premier.images.slice(0, 2).forEach((img, i) => {
                        const imgStr =
                            typeof img === 'string' ? img : JSON.stringify(img);

                        if (
                            imgStr.startsWith('http://') ||
                            imgStr.startsWith('https://')
                        ) {
                            addReussite(
                                `Image ${i + 1} - URL absolue`,
                                imgStr.substring(0, 80)
                            );
                        } else {
                            addProbleme(
                                `Image ${i + 1} - URL relative`,
                                imgStr
                            );
                            log(
                                `   ⚠ Le frontend ne pourra pas charger cette image`,
                                'red'
                            );
                            log(
                                `   Devrait être: ${BASE_URL}/${imgStr}`,
                                'yellow'
                            );
                        }
                    });
                } else {
                    addProbleme(
                        'Aucune image retournée',
                        'Le produit devrait avoir des images'
                    );
                }
            }
        } catch (error) {
            if (error.response) {
                addProbleme(
                    `Erreur ${error.response.status}`,
                    error.response.data?.erreur || error.message
                );
            } else {
                addProbleme('Erreur réseau', error.message);
            }
        }
    }
}

// ============================================================================
// ÉTAPE 4: VÉRIFICATION FRONTEND
// ============================================================================
async function verifierFrontend() {
    section('ÉTAPE 4: VÉRIFICATION CONFIGURATION FRONTEND');

    const clientPath = path.join(process.cwd(), '..', 'client');

    subsection('Fichier .env frontend');
    const envPath = path.join(clientPath, '.env');

    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const viteApiUrl = envContent.match(/VITE_API_URL=(.+)/);
        const viteBackendUrl = envContent.match(/VITE_BACKEND_URL=(.+)/);

        if (viteApiUrl) {
            addReussite('VITE_API_URL défini', viteApiUrl[1]);
        } else {
            addProbleme(
                'VITE_API_URL manquant',
                'Devrait être défini dans client/.env'
            );
        }

        if (viteBackendUrl) {
            addReussite('VITE_BACKEND_URL défini', viteBackendUrl[1]);
        }
    } else {
        addProbleme('client/.env introuvable', envPath);
    }

    subsection('Composants frontend');
    const composants = [
        '../client/src/components/admin/dashboard/TableauProduitsPopulaires.jsx',
        '../client/src/components/vendeur/CarteProduitVendeur.jsx',
        '../client/src/components/produits/ProduitCard.jsx',
    ];

    for (const comp of composants) {
        const compPath = path.join(process.cwd(), comp);
        if (fs.existsSync(compPath)) {
            const content = fs.readFileSync(compPath, 'utf8');

            const nomFichier = path.basename(comp);

            // Vérifier si le composant utilise VITE_API_URL ou construit des URLs
            if (
                content.includes('VITE_API_URL') ||
                content.includes('VITE_BACKEND_URL')
            ) {
                addReussite(`${nomFichier} utilise les variables d'env`, '');
            } else if (
                content.includes('API_BASE_URL') ||
                content.includes('getImageUrl')
            ) {
                addReussite(
                    `${nomFichier} gère les URLs`,
                    'Fonction getImageUrl détectée'
                );
            } else {
                addProbleme(
                    `${nomFichier} pourrait ne pas gérer les URLs`,
                    "Vérifier la construction des URLs d'images"
                );
            }
        } else {
            log(`   ⚠ ${path.basename(comp)} introuvable`, 'yellow');
        }
    }
}

// ============================================================================
// RÉSUMÉ FINAL
// ============================================================================
function afficherResume() {
    section('📊 RÉSUMÉ DU DIAGNOSTIC');

    log(`\n✅ RÉUSSITES: ${reussites.length}`, 'green');
    log(`❌ PROBLÈMES: ${problemes.length}`, 'red');

    if (problemes.length > 0) {
        log('\n\n' + '═'.repeat(80), 'red');
        log('  🚨 PROBLÈMES DÉTECTÉS (À CORRIGER EN PRIORITÉ)', 'red');
        log('═'.repeat(80) + '\n', 'red');

        problemes.forEach((p, i) => {
            log(`${i + 1}. ${p.titre}`, 'red');
            if (p.details) log(`   ${p.details}`, 'yellow');
            console.log('');
        });
    }

    // Recommandations
    section('🔧 RECOMMANDATIONS');

    const recommandations = [];

    // Analyser les problèmes et générer des recommandations
    if (problemes.some(p => p.titre.includes('URL relative'))) {
        recommandations.push({
            titre: '1. Corriger formaterUrlsImages()',
            actions: [
                'Vérifier que formaterUrlsImages() préfixe TOUTES les URLs relatives',
                "S'assurer que baseUrl = `${req.protocol}://${req.get('host')}`",
                'Vérifier que la fonction est appelée sur TOUS les endpoints',
            ],
        });
    }

    if (problemes.some(p => p.titre.includes('Format objet'))) {
        recommandations.push({
            titre: '2. Migrer les anciennes données',
            actions: [
                'Lancer le script de migration pour convertir les objets en strings',
                'Modifier produitModel.js: images: [String]',
                'Corriger creerProduit() pour stocker des strings, pas des objets',
            ],
        });
    }

    if (problemes.some(p => p.titre.includes('Fichier introuvable'))) {
        recommandations.push({
            titre: '3. Vérifier les fichiers uploads',
            actions: [
                "S'assurer que Multer enregistre bien les fichiers dans uploads/produits/",
                "Vérifier les permissions d'écriture du dossier",
                "Tester l'upload d'un nouveau produit",
            ],
        });
    }

    if (
        problemes.some(
            p => p.titre.includes('frontend') || p.titre.includes('VITE')
        )
    ) {
        recommandations.push({
            titre: '4. Corriger la configuration frontend',
            actions: [
                'Définir VITE_API_URL=http://localhost:5000/api dans client/.env',
                'Définir VITE_BACKEND_URL=http://localhost:5000 dans client/.env',
                "S'assurer que les composants construisent les URLs correctement",
            ],
        });
    }

    if (recommandations.length > 0) {
        recommandations.forEach(rec => {
            log(`\n${rec.titre}`, 'cyan');
            rec.actions.forEach(action => {
                log(`   • ${action}`, 'yellow');
            });
        });
    } else {
        log('\n✅ Aucune action requise - Tout semble correct !', 'green');
        log("\nSi les images ne s'affichent toujours pas:", 'yellow');
        log(
            '1. Vérifier la console du navigateur (F12) pour des erreurs 404',
            'yellow'
        );
        log(
            "2. Vérifier l'onglet Network pour voir les URLs exactes appelées",
            'yellow'
        );
        log(
            "3. Tester l'accès direct: http://localhost:5000/uploads/produits/xxx.jpg",
            'yellow'
        );
    }

    section('🎯 PROCHAINES ÉTAPES');
    log('1. Corriger les problèmes listés ci-dessus', 'cyan');
    log('2. Redémarrer le backend: npm run dev', 'cyan');
    log('3. Redémarrer le frontend: cd ../client && npm run dev', 'cyan');
    log("4. Tester l'ajout d'un nouveau produit", 'cyan');
    log("5. Vérifier l'affichage dans les dashboards", 'cyan');
    log(
        '\n💡 Partage ce rapport complet avec ton mentor pour un debug ciblé!\n',
        'green'
    );
}

// ============================================================================
// EXÉCUTION PRINCIPALE
// ============================================================================
async function diagnosticComplet() {
    console.clear();
    log(
        '\n╔═══════════════════════════════════════════════════════════════════════════╗',
        'cyan'
    );
    log(
        '║                                                                           ║',
        'cyan'
    );
    log(
        '║          🔍 DIAGNOSTIC COMPLET - PROBLÈME AFFICHAGE IMAGES                ║',
        'cyan'
    );
    log(
        '║                                                                           ║',
        'cyan'
    );
    log(
        '╚═══════════════════════════════════════════════════════════════════════════╝',
        'cyan'
    );

    log('\n📅 Date: ' + new Date().toLocaleString('fr-FR'), 'blue');
    log('📂 Dossier: ' + process.cwd(), 'blue');

    try {
        await verifierEnvironnement();
        await verifierBaseDeDonnees();
        await verifierEndpointsAPI();
        await verifierFrontend();
        afficherResume();
    } catch (error) {
        log('\n\n💥 ERREUR FATALE PENDANT LE DIAGNOSTIC', 'red');
        console.error(error);
    }
}

// Lancer le diagnostic
diagnosticComplet().catch(error => {
    console.error('Erreur:', error);
    process.exit(1);
});
