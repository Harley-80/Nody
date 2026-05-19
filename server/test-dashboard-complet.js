import axios from 'axios';
import 'dotenv/config';

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Couleurs
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

console.log(
    '\n╔════════════════════════════════════════════════════════════════════╗'
);
console.log(
    '║     🔍 TEST COMPLET - DASHBOARD VENDEUR & MODÉRATEUR             ║'
);
console.log(
    '╚════════════════════════════════════════════════════════════════════╝\n'
);

// ============================================================================
// TON TOKEN EST DÉJÀ LÀ - PAS BESOIN DE LE CHANGER !
// ============================================================================
const VENDEUR_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NzQ3N2Y3OGEwMDdlOWJhMjRjNGI1NSIsImlhdCI6MTc2OTI0MTk2OCwiZXhwIjoxNzY5ODQ2NzY4fQ.-1evpOMyVCJdymMXyFxskhzcndjhJq5k5I4Tfsv1ZPM';

// ✅ Vérification corrigée
if (VENDEUR_TOKEN === 'TON_TOKEN_ICI') {
    log('❌ Tu dois remplacer TON_TOKEN_ICI par un vrai token!', 'red');
    log('\n📝 Étapes:', 'yellow');
    log('1. Va sur http://localhost:5173', 'blue');
    log('2. Connecte-toi en tant que vendeur', 'blue');
    log('3. Ouvre la console (F12)', 'blue');
    log('4. Tape: localStorage.getItem("token")', 'blue');
    log('5. Copie le token', 'blue');
    log(
        '6. Ouvre ce fichier et remplace TON_TOKEN_ICI par le token copié',
        'blue'
    );
    log('7. Relance: node test-dashboard-complet.js\n', 'blue');
    process.exit(1);
}

log('✅ Token détecté - Lancement des tests...\n', 'green');

async function testerEndpoint(nom, url, token) {
    log(`\n${'═'.repeat(70)}`, 'cyan');
    log(`📡 TEST: ${nom}`, 'cyan');
    log(`   URL: ${API_URL}${url}`, 'blue');
    log('═'.repeat(70), 'cyan');

    try {
        const response = await axios.get(`${API_URL}${url}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        log(`✅ Statut: ${response.status}`, 'green');

        // Extraire les produits
        let produits = [];
        const data = response.data;

        if (data.data && data.data.produits) {
            produits = data.data.produits;
        } else if (data.data && Array.isArray(data.data)) {
            produits = data.data;
        } else if (data.donnees && Array.isArray(data.donnees)) {
            produits = data.donnees;
        } else if (Array.isArray(data)) {
            produits = data;
        }

        log(`📦 Nombre de produits: ${produits.length}`, 'blue');

        if (produits.length === 0) {
            log('⚠️  Aucun produit trouvé', 'yellow');
            log('   Solutions:', 'yellow');
            log('   1. Ajoute un produit via le dashboard vendeur', 'yellow');
            log(
                '   2. Vérifie que le produit est bien lié à ce vendeur',
                'yellow'
            );
            return;
        }

        // Analyser les 3 premiers produits
        for (const [index, produit] of produits.slice(0, 3).entries()) {
            log(
                `\n   🏷️  Produit ${index + 1}: ${produit.nom || 'Sans nom'}`,
                'magenta'
            );
            log(`   ID: ${produit._id}`, 'blue');
            log(`   Statut: ${produit.statut || 'Non défini'}`, 'blue');

            if (!produit.images || produit.images.length === 0) {
                log(`   ❌ PROBLÈME: Aucune image`, 'red');
                continue;
            }

            log(`   📸 Images (${produit.images.length}):`, 'cyan');

            for (const [imgIndex, img] of produit.images
                .slice(0, 2)
                .entries()) {
                const imgType = typeof img;

                if (imgType === 'string') {
                    if (
                        img.startsWith('http://') ||
                        img.startsWith('https://')
                    ) {
                        log(
                            `   ✅ Image ${imgIndex + 1}: URL ABSOLUE`,
                            'green'
                        );
                        log(`      ${img}`, 'blue');

                        // Tester si l'image charge vraiment
                        try {
                            await axios.get(img, { timeout: 3000 });
                            log(`      ✅ Image accessible`, 'green');
                        } catch (err) {
                            log(`      ❌ Image INACCESSIBLE`, 'red');
                            log(`      Erreur: ${err.message}`, 'red');
                        }
                    } else {
                        log(`   ❌ Image ${imgIndex + 1}: URL RELATIVE`, 'red');
                        log(`      Actuel: ${img}`, 'yellow');
                        log(`      Devrait être: ${BASE_URL}/${img}`, 'green');
                    }
                } else {
                    log(
                        `   ❌ Image ${imgIndex + 1}: Type invalide (${imgType})`,
                        'red'
                    );
                    log(`      Valeur: ${JSON.stringify(img)}`, 'yellow');
                }
            }
        }
    } catch (error) {
        if (error.response) {
            log(`❌ Erreur ${error.response.status}`, 'red');

            if (error.response.status === 401) {
                log('   🔒 Token invalide ou expiré!', 'red');
                log('   Solutions:', 'yellow');
                log('   1. Reconnecte-toi sur http://localhost:5173', 'yellow');
                log(
                    '   2. Récupère un nouveau token avec localStorage.getItem("token")',
                    'yellow'
                );
                log('   3. Remplace le token dans ce script', 'yellow');
            } else if (error.response.status === 403) {
                log(
                    "   🚫 Accès refusé - Ce token n'est pas celui d'un vendeur",
                    'red'
                );
            } else if (error.response.status === 500) {
                log('   💥 Erreur serveur!', 'red');
                log(
                    `   Message: ${error.response.data?.erreur || error.response.data?.message}`,
                    'red'
                );

                if (error.response.data?.stack) {
                    log('\n   Stack trace:', 'yellow');
                    console.log(error.response.data.stack);
                }
            }
        } else {
            log(`❌ Erreur réseau: ${error.message}`, 'red');
        }
    }
}

async function testerTout() {
    log('🚀 Début des tests...\n', 'cyan');

    // Test 1: Mes produits
    await testerEndpoint(
        'Mes produits (vendeur)',
        '/vendeur/produits',
        VENDEUR_TOKEN
    );

    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Produits populaires vendeur
    await testerEndpoint(
        'Produits populaires (vendeur)',
        '/vendeur/produits/populaires',
        VENDEUR_TOKEN
    );

    // Test 3: Ma boutique
    log(`\n${'═'.repeat(70)}`, 'cyan');
    log(`📡 TEST: Ma boutique`, 'cyan');
    log(`   URL: ${API_URL}/vendeur/boutique`, 'blue');
    log('═'.repeat(70), 'cyan');

    try {
        const response = await axios.get(`${API_URL}/vendeur/boutique`, {
            headers: {
                Authorization: `Bearer ${VENDEUR_TOKEN}`,
            },
        });

        log(`✅ Statut: ${response.status}`, 'green');
        log(
            `   Nom: ${response.data.data?.nom} ${response.data.data?.prenom}`,
            'blue'
        );
        log(`   Email: ${response.data.data?.email}`, 'blue');
        log(
            `   Boutique: ${response.data.data?.boutique?.nomBoutique || 'Non défini'}`,
            'blue'
        );
    } catch (error) {
        log(`❌ Erreur: ${error.response?.status || error.message}`, 'red');
    }

    // Résumé final
    log(
        '\n╔════════════════════════════════════════════════════════════════════╗',
        'cyan'
    );
    log(
        '║                        📊 RÉSUMÉ DES TESTS                         ║',
        'cyan'
    );
    log(
        '╚════════════════════════════════════════════════════════════════════╝\n',
        'cyan'
    );

    log(
        '✅ Si tu vois "URL ABSOLUE" partout → Le backend fonctionne!',
        'green'
    );
    log(
        '❌ Si tu vois "URL RELATIVE" → vendeurController.js n\'est pas bien corrigé',
        'red'
    );
    log(
        '❌ Si tu vois "Image INACCESSIBLE" → Problème de route /uploads dans app.js',
        'red'
    );
    log('❌ Si tu vois "Erreur 401" → Token expiré, reconnecte-toi', 'red');
    log(
        '❌ Si tu vois "Erreur 500" → Erreur dans le code du controller',
        'red'
    );

    log('\n💡 Prochaines étapes:', 'yellow');
    log(
        "1. Si tout est ✅ mais les images ne s'affichent toujours pas:",
        'yellow'
    );
    log('   → Ouvre la console du navigateur (F12)', 'yellow');
    log("   → Va sur l'onglet Network", 'yellow');
    log('   → Filtre par "images"', 'yellow');
    log("   → Fais une capture d'écran et envoie-la", 'yellow');
    log('2. Envoie-moi ce rapport complet\n', 'yellow');
}

testerTout().catch(err => {
    log('\n💥 Erreur fatale:', 'red');
    console.error(err);
    process.exit(1);
});
