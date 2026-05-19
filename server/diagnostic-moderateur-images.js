import axios from 'axios';
import 'dotenv/config';

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Couleurs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

console.log(`${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════════════════╗
║        DIAGNOSTIC MODÉRATEUR - PROBLÈME D'IMAGES               ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

// ÉTAPE 1: Récupérer le token modérateur
const MODERATEUR_TOKEN = process.argv[2];

if (!MODERATEUR_TOKEN || MODERATEUR_TOKEN === 'TON_TOKEN_ICI') {
    console.log(
        `${colors.red}${colors.bright}❌ ERREUR: Token manquant!${colors.reset}\n`
    );
    console.log(`${colors.yellow}📋 INSTRUCTIONS:${colors.reset}`);
    console.log(`1. Va sur http://localhost:5173`);
    console.log(`2. Connecte-toi en tant que MODÉRATEUR`);
    console.log(`3. Ouvre la console (F12)`);
    console.log(`4. Tape: localStorage.getItem("token")`);
    console.log(`5. Copie le token (commence par eyJ...)`);
    console.log(`6. Relance ce script:\n`);
    console.log(
        `   ${colors.cyan}node diagnostic-moderateur-images.js "eyJton_token_ici..."${colors.reset}\n`
    );
    process.exit(1);
}

console.log(`${colors.green}✅ Token détecté${colors.reset}`);
console.log(`${colors.cyan}📡 Début des tests...${colors.reset}\n`);

// Configuration axios
const axiosConfig = {
    headers: {
        Authorization: `Bearer ${MODERATEUR_TOKEN}`,
        'Content-Type': 'application/json',
    },
};

// ÉTAPE 2: Tester les endpoints modérateur
async function testerEndpointsModerateur() {
    const endpoints = [
        {
            nom: 'Produits en attente',
            url: `${API_URL}/moderateur/produits?statut=en_attente`,
            description: 'Liste des produits à modérer',
        },
        {
            nom: 'Tous les produits',
            url: `${API_URL}/moderateur/produits`,
            description: 'Tous les produits visibles par le modérateur',
        },
        {
            nom: 'Statistiques modérateur',
            url: `${API_URL}/moderateur/statistiques`,
            description: 'Statistiques du dashboard modérateur',
        },
    ];

    for (const endpoint of endpoints) {
        console.log(
            `${colors.blue}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
        );
        console.log(`${colors.cyan}📡 Test: ${endpoint.nom}${colors.reset}`);
        console.log(`${colors.blue}URL: ${endpoint.url}${colors.reset}`);
        console.log(
            `${colors.yellow}Description: ${endpoint.description}${colors.reset}\n`
        );

        try {
            const response = await axios.get(endpoint.url, axiosConfig);

            console.log(
                `${colors.green}✅ Statut: ${response.status}${colors.reset}`
            );

            // Analyser la structure des données
            const data = response.data;

            if (data.succes && data.data) {
                // Cas 1: Liste de produits
                if (Array.isArray(data.data.produits)) {
                    const produits = data.data.produits;
                    console.log(
                        `${colors.green}📦 Nombre de produits: ${produits.length}${colors.reset}\n`
                    );

                    if (produits.length > 0) {
                        const premierProduit = produits[0];
                        console.log(
                            `${colors.cyan}🔍 Analyse du premier produit:${colors.reset}`
                        );
                        console.log(`   Nom: ${premierProduit.nom}`);
                        console.log(`   ID: ${premierProduit._id}`);
                        console.log(`   Statut: ${premierProduit.statut}`);

                        // ⚠️ PARTIE CRITIQUE - Analyser les images
                        console.log(
                            `\n${colors.yellow}${colors.bright}🖼️  ANALYSE DES IMAGES:${colors.reset}`
                        );

                        if (!premierProduit.images) {
                            console.log(
                                `   ${colors.red}❌ Pas de champ 'images'${colors.reset}`
                            );
                        } else if (!Array.isArray(premierProduit.images)) {
                            console.log(
                                `   ${colors.red}❌ 'images' n'est pas un tableau: ${typeof premierProduit.images}${colors.reset}`
                            );
                        } else if (premierProduit.images.length === 0) {
                            console.log(
                                `   ${colors.red}❌ Tableau 'images' vide${colors.reset}`
                            );
                        } else {
                            console.log(
                                `   ${colors.green}✅ Nombre d'images: ${premierProduit.images.length}${colors.reset}\n`
                            );

                            // ✅ CORRECTION: Utiliser for...of au lieu de forEach
                            for (
                                let index = 0;
                                index < premierProduit.images.length;
                                index++
                            ) {
                                const img = premierProduit.images[index];
                                console.log(
                                    `   ${colors.cyan}Image ${index + 1}:${colors.reset}`
                                );

                                // Détecter le type
                                const typeImage = typeof img;
                                console.log(`      Type: ${typeImage}`);

                                if (typeImage === 'string') {
                                    // C'est une URL
                                    console.log(`      URL: ${img}`);

                                    // Vérifier le format
                                    if (
                                        img.startsWith('http://') ||
                                        img.startsWith('https://')
                                    ) {
                                        console.log(
                                            `      ${colors.green}✅ Format: URL ABSOLUE${colors.reset}`
                                        );

                                        // Tester l'accessibilité
                                        try {
                                            const imgResponse =
                                                await axios.head(img);
                                            console.log(
                                                `      ${colors.green}✅ Image accessible (${imgResponse.status})${colors.reset}`
                                            );
                                        } catch (error) {
                                            console.log(
                                                `      ${colors.red}❌ Image INACCESSIBLE: ${error.response?.status || error.code}${colors.reset}`
                                            );
                                        }
                                    } else if (
                                        img.startsWith('/uploads/') ||
                                        img.startsWith('uploads/')
                                    ) {
                                        console.log(
                                            `      ${colors.red}❌ Format: URL RELATIVE${colors.reset}`
                                        );
                                        console.log(
                                            `      ${colors.yellow}⚠️  Le backend devrait retourner une URL absolue!${colors.reset}`
                                        );
                                    } else {
                                        console.log(
                                            `      ${colors.red}❌ Format: INCONNU${colors.reset}`
                                        );
                                    }
                                } else if (typeImage === 'object') {
                                    // Ancien format objet
                                    console.log(
                                        `      ${colors.yellow}⚠️  Format OBJET (ancien format):${colors.reset}`
                                    );
                                    console.log(
                                        `      Structure: ${JSON.stringify(img, null, 2)}`
                                    );

                                    if (img.url) {
                                        console.log(
                                            `      URL extraite: ${img.url}`
                                        );

                                        if (
                                            img.url.startsWith('http://') ||
                                            img.url.startsWith('https://')
                                        ) {
                                            console.log(
                                                `      ${colors.green}✅ Format: URL ABSOLUE${colors.reset}`
                                            );
                                        } else {
                                            console.log(
                                                `      ${colors.red}❌ Format: URL RELATIVE${colors.reset}`
                                            );
                                        }
                                    }
                                } else {
                                    console.log(
                                        `      ${colors.red}❌ Type non géré: ${typeImage}${colors.reset}`
                                    );
                                }

                                console.log('');
                            }
                        }
                    } else {
                        console.log(
                            `${colors.yellow}⚠️  Aucun produit trouvé${colors.reset}`
                        );
                    }
                } else if (Array.isArray(data.data)) {
                    // Cas 2: Tableau direct
                    console.log(
                        `${colors.green}📦 Nombre d'éléments: ${data.data.length}${colors.reset}`
                    );
                } else {
                    // Cas 3: Objet (ex: statistiques)
                    console.log(
                        `${colors.cyan}📊 Données reçues:${colors.reset}`
                    );
                    console.log(JSON.stringify(data.data, null, 2));
                }
            } else {
                console.log(
                    `${colors.yellow}⚠️  Structure de réponse inattendue${colors.reset}`
                );
                console.log(JSON.stringify(data, null, 2));
            }
        } catch (error) {
            console.log(
                `${colors.red}❌ Erreur: ${error.response?.status || error.code}${colors.reset}`
            );

            if (error.response) {
                console.log(
                    `${colors.red}Message: ${error.response.data?.message || 'Erreur serveur'}${colors.reset}`
                );

                if (error.response.status === 401) {
                    console.log(
                        `${colors.yellow}⚠️  Token invalide ou expiré - reconnecte-toi${colors.reset}`
                    );
                } else if (error.response.status === 403) {
                    console.log(
                        `${colors.yellow}⚠️  Accès refusé - vérifie les permissions${colors.reset}`
                    );
                } else if (error.response.status === 404) {
                    console.log(
                        `${colors.yellow}⚠️  Route non trouvée - vérifie l'URL${colors.reset}`
                    );
                }
            }
        }

        console.log('');
    }
}

// ÉTAPE 3: Tester l'accès direct aux images
async function testerAccesImages() {
    console.log(
        `${colors.blue}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );
    console.log(
        `${colors.cyan}🖼️  Test d'accès direct aux images${colors.reset}\n`
    );

    const imageTest =
        'http://localhost:5000/uploads/produits/produit_1769251936580_7j6xxxucg.jpg';

    try {
        const response = await axios.get(imageTest, {
            responseType: 'arraybuffer',
        });
        console.log(
            `${colors.green}✅ Image accessible directement${colors.reset}`
        );
        console.log(`   URL: ${imageTest}`);
        console.log(`   Content-Type: ${response.headers['content-type']}`);
        console.log(
            `   Taille: ${(response.data.length / 1024).toFixed(2)} KB`
        );
    } catch (error) {
        console.log(`${colors.red}❌ Image inaccessible${colors.reset}`);
        console.log(`   URL: ${imageTest}`);
        console.log(`   Erreur: ${error.code || error.response?.status}`);
    }
}

// EXÉCUTION
(async () => {
    try {
        await testerEndpointsModerateur();
        await testerAccesImages();

        console.log(`${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════════════════╗
║                    DIAGNOSTIC TERMINÉ                          ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

        console.log(`${colors.yellow}📋 PROCHAINES ÉTAPES:${colors.reset}`);
        console.log(`1. Copie TOUT le résultat ci-dessus`);
        console.log(`2. Envoie-le au mentor`);
        console.log(
            `3. Le mentor te dira quel controller modérateur corriger\n`
        );
    } catch (error) {
        console.error(
            `${colors.red}Erreur fatale:${colors.reset}`,
            error.message
        );
        process.exit(1);
    }
})();
