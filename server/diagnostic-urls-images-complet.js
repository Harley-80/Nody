import axios from 'axios';
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Couleurs pour les logs
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function analyserUrlImage(url) {
    if (!url) {
        return {
            type: 'VIDE',
            valide: false,
            message: 'URL manquante ou vide',
        };
    }

    // URL absolue (http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return { type: 'ABSOLUE', valide: true, url };
    }

    // Chemin relatif (uploads/produits/xxx.jpg)
    if (url.startsWith('uploads/')) {
        return {
            type: 'RELATIF',
            valide: false,
            url,
            urlCorrigee: `${BASE_URL}/${url}`,
            message: 'Chemin relatif - nécessite préfixe BASE_URL',
        };
    }

    // Chemin avec slash initial (/uploads/produits/xxx.jpg)
    if (url.startsWith('/uploads/')) {
        return {
            type: 'RELATIF_SLASH',
            valide: false,
            url,
            urlCorrigee: `${BASE_URL}${url}`,
            message: 'Chemin avec slash - nécessite préfixe BASE_URL',
        };
    }

    // URL externe (loremflickr, etc.)
    if (url.startsWith('http')) {
        return { type: 'EXTERNE', valide: true, url };
    }

    return {
        type: 'INCONNU',
        valide: false,
        url,
        message: 'Format non reconnu',
    };
}

async function testerEndpoint(nom, endpoint, token = null) {
    log(`\n${'='.repeat(70)}`, 'cyan');
    log(`📡 TEST ENDPOINT: ${nom}`, 'cyan');
    log(`   URL: ${API_URL}${endpoint}`, 'blue');
    log('='.repeat(70), 'cyan');

    try {
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.get(`${API_URL}${endpoint}`, { headers });
        const data = response.data;

        log(`✅ Statut: ${response.status}`, 'green');

        // Extraire les produits selon la structure de réponse
        let produits = [];
        if (Array.isArray(data)) {
            produits = data;
        } else if (data.data && Array.isArray(data.data)) {
            produits = data.data;
        } else if (data.produits && Array.isArray(data.produits)) {
            produits = data.produits;
        } else if (data.produit) {
            produits = [data.produit];
        }

        log(`📦 Nombre de produits: ${produits.length}`, 'blue');

        if (produits.length === 0) {
            log('⚠️  Aucun produit trouvé', 'yellow');
            return { ok: true, problemes: 0 };
        }

        let problemes = 0;
        produits.slice(0, 3).forEach((produit, index) => {
            log(
                `\n   🏷️  Produit ${index + 1}: ${produit.nom || 'Sans nom'}`,
                'magenta'
            );
            log(`   ID: ${produit._id}`, 'blue');

            if (!produit.images || produit.images.length === 0) {
                log(`   ❌ PROBLÈME: Aucune image`, 'red');
                problemes++;
                return;
            }

            log(`   📸 Nombre d'images: ${produit.images.length}`, 'blue');

            produit.images.slice(0, 2).forEach((image, imgIndex) => {
                // Gérer les formats: string ou objet {url, alt, ...}
                let url;
                if (typeof image === 'string') {
                    url = image;
                } else if (image && typeof image === 'object' && image.url) {
                    url = image.url;
                } else {
                    log(`   ❌ Image ${imgIndex + 1}: Format invalide`, 'red');
                    console.log('      Valeur:', image);
                    problemes++;
                    return;
                }

                const analyse = analyserUrlImage(url);

                if (analyse.valide) {
                    log(
                        `   ✅ Image ${imgIndex + 1}: ${analyse.type}`,
                        'green'
                    );
                    log(`      ${url.substring(0, 80)}...`, 'blue');
                } else {
                    log(`   ❌ Image ${imgIndex + 1}: ${analyse.type}`, 'red');
                    log(`      Actuel: ${url}`, 'yellow');
                    if (analyse.urlCorrigee) {
                        log(
                            `      Devrait être: ${analyse.urlCorrigee}`,
                            'green'
                        );
                    }
                    log(`      ${analyse.message}`, 'red');
                    problemes++;
                }
            });
        });

        return { ok: true, problemes };
    } catch (error) {
        if (error.response) {
            log(
                `❌ Erreur ${error.response.status}: ${error.response.statusText}`,
                'red'
            );
            if (error.response.status === 401) {
                log('   🔒 Authentification requise', 'yellow');
            } else if (error.response.status === 404) {
                log('   🚫 Endpoint non trouvé', 'yellow');
            }
        } else {
            log(`❌ Erreur: ${error.message}`, 'red');
        }
        return { ok: false, problemes: 0 };
    }
}

async function diagnosticComplet() {
    log(
        '\n╔════════════════════════════════════════════════════════════════════╗',
        'cyan'
    );
    log(
        "║     🔍 DIAGNOSTIC COMPLET DES URLs D'IMAGES - TOUS ENDPOINTS      ║",
        'cyan'
    );
    log(
        '╚════════════════════════════════════════════════════════════════════╝',
        'cyan'
    );

    log('\n📋 Configuration:', 'blue');
    log(`   BASE_URL: ${BASE_URL}`, 'blue');
    log(`   API_URL: ${API_URL}`, 'blue');

    const endpoints = [
        { nom: 'Produits publics', url: '/produits' },
        { nom: 'Produits admin', url: '/admin/produits', needAuth: true },
        { nom: 'Produits vendeur', url: '/vendeur/produits', needAuth: true },
        {
            nom: 'Produit unique (exemple)',
            url: '/produits/69747ba0ad4e96aafed97147',
        },
    ];

    let totalProblemes = 0;
    let endpointsTestees = 0;

    for (const endpoint of endpoints) {
        const result = await testerEndpoint(endpoint.nom, endpoint.url);
        if (result.ok) {
            endpointsTestees++;
            totalProblemes += result.problemes;
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Petit délai entre les tests
    }

    // Résumé final
    log(
        '\n╔════════════════════════════════════════════════════════════════════╗',
        'cyan'
    );
    log(
        '║                          📊 RÉSUMÉ FINAL                           ║',
        'cyan'
    );
    log(
        '╚════════════════════════════════════════════════════════════════════╝',
        'cyan'
    );

    log(
        `\n   Endpoints testés: ${endpointsTestees}/${endpoints.length}`,
        'blue'
    );
    log(
        `   Problèmes d'URLs détectés: ${totalProblemes}`,
        totalProblemes > 0 ? 'red' : 'green'
    );

    if (totalProblemes === 0) {
        log(
            "\n   ✅ PARFAIT ! Toutes les URLs d'images sont correctes",
            'green'
        );
    } else {
        log(
            '\n   ❌ ACTION REQUISE: Corriger la fonction formaterUrlsImages',
            'red'
        );
        log('\n   📝 Solutions recommandées:', 'yellow');
        log(
            '   1. Vérifier que formaterUrlsImages est appelée sur TOUS les endpoints',
            'yellow'
        );
        log(
            "   2. S'assurer que baseUrl est correctement passé (protocol + host)",
            'yellow'
        );
        log('   3. Préfixer TOUS les chemins relatifs avec baseUrl', 'yellow');
    }

    log(
        '\n╔════════════════════════════════════════════════════════════════════╗',
        'cyan'
    );
    log(
        '║                      🔧 PROCHAINES ÉTAPES                          ║',
        'cyan'
    );
    log(
        '╚════════════════════════════════════════════════════════════════════╝',
        'cyan'
    );

    log('\n   Si des problèmes sont détectés, envoie-moi:', 'blue');
    log(
        '   1️⃣  server/controllers/produitsController.js (fonction formaterUrlsImages)',
        'yellow'
    );
    log(
        '   2️⃣  server/controllers/adminController.js (endpoints qui retournent des produits)',
        'yellow'
    );
    log(
        '   3️⃣  server/controllers/vendeurController.js (endpoints qui retournent des produits)',
        'yellow'
    );
}

// Lancer le diagnostic
diagnosticComplet().catch(error => {
    log(`\n💥 Erreur fatale: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
