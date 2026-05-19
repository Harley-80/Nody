import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

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
║          DIAGNOSTIC - PRODUITS PUBLICS                         ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

async function diagnosticProduitsPublics() {
    try {
        // 1. Tester l'endpoint public des produits
        console.log(
            `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
        );
        console.log(`${colors.cyan}📡 Test: Produits publics${colors.reset}`);
        console.log(`${colors.blue}URL: ${API_URL}/produits${colors.reset}\n`);

        const response = await axios.get(`${API_URL}/produits`);

        console.log(
            `${colors.green}✅ Statut: ${response.status}${colors.reset}`
        );
        console.log(
            `${colors.green}📦 Nombre de produits: ${response.data.data.produits.length}${colors.reset}\n`
        );

        if (response.data.data.produits.length > 0) {
            const produit = response.data.data.produits[0];
            console.log(`${colors.cyan}🔍 Premier produit:${colors.reset}`);
            console.log(`   Nom: ${produit.nom}`);
            console.log(`   ID: ${produit._id}`);
            console.log(`   Statut: ${produit.statut}`);
            console.log(`   Images: ${produit.images?.length || 0}`);

            if (produit.images && produit.images.length > 0) {
                console.log(
                    `\n${colors.green}✅ Image 1: ${produit.images[0]}${colors.reset}`
                );
            }
        } else {
            console.log(
                `${colors.yellow}⚠️  Aucun produit public trouvé${colors.reset}`
            );
        }

        // 2. Vérifier les produits en BD par statut
        console.log(
            `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
        );
        console.log(
            `${colors.cyan}📊 Statistiques par statut${colors.reset}\n`
        );

        const statuts = ['en_attente', 'approuve', 'actif', 'rejete'];

        for (const statut of statuts) {
            try {
                const res = await axios.get(
                    `${API_URL}/produits?statut=${statut}`
                );
                const count = res.data.data?.produits?.length || 0;

                const color =
                    statut === 'actif'
                        ? colors.green
                        : statut === 'approuve'
                          ? colors.blue
                          : statut === 'en_attente'
                            ? colors.yellow
                            : colors.red;

                console.log(
                    `   ${color}${statut.toUpperCase()}: ${count} produit(s)${colors.reset}`
                );
            } catch (error) {
                console.log(
                    `   ${colors.red}${statut.toUpperCase()}: Erreur${colors.reset}`
                );
            }
        }

        // 3. Recommandations
        console.log(
            `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
        );
        console.log(`${colors.yellow}💡 ANALYSE:${colors.reset}\n`);

        if (response.data.data.produits.length === 0) {
            console.log(
                `${colors.red}❌ PROBLÈME: Aucun produit visible sur le site${colors.reset}`
            );
            console.log(`${colors.yellow}
📋 CAUSES POSSIBLES:
1. Les produits validés ont le statut "approuve" au lieu de "actif"
2. Le filtre dans produitsController.js exclut les produits "approuve"
3. Le champ "estActif" est à false

🔧 SOLUTION:
- Vérifier le statut des produits après validation
- Modifier produitsController.js pour inclure "approuve" OU "actif"
- OU changer le statut en "actif" lors de la validation
${colors.reset}`);
        } else {
            console.log(
                `${colors.green}✅ Des produits sont visibles sur le site${colors.reset}`
            );
        }
    } catch (error) {
        console.error(`${colors.red}❌ Erreur:${colors.reset}`, error.message);
    }

    console.log(`\n${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════════════════╗
║                    DIAGNOSTIC TERMINÉ                          ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);
}

diagnosticProduitsPublics();
