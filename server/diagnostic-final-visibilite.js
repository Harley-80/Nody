import axios from 'axios';

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
║        DIAGNOSTIC COMPLET - VISIBILITÉ PRODUITS SITE           ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

async function diagnosticComplet() {
    const API_URL = 'http://localhost:5000/api';

    // 1. Test endpoint produits publics
    console.log(
        `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );
    console.log(`${colors.cyan}📡 1. Endpoint Produits Publics${colors.reset}`);
    console.log(`${colors.blue}URL: ${API_URL}/produits${colors.reset}\n`);

    try {
        const response = await axios.get(`${API_URL}/produits`);
        const produits =
            response.data.donnees || response.data.data?.produits || [];

        console.log(
            `${colors.green}✅ Statut: ${response.status}${colors.reset}`
        );
        console.log(
            `${colors.green}📦 Nombre de produits: ${produits.length}${colors.reset}\n`
        );

        if (produits.length > 0) {
            produits.forEach((p, i) => {
                console.log(`${colors.cyan}Produit ${i + 1}:${colors.reset}`);
                console.log(`   Nom: ${p.nom}`);
                console.log(
                    `   Statut: ${colors.green}${p.statut}${colors.reset}`
                );
                console.log(
                    `   estActif: ${p.estActif ? colors.green + 'true' : colors.red + 'false'}${colors.reset}`
                );
                console.log(`   Images: ${p.images?.length || 0}`);
                if (p.images && p.images.length > 0) {
                    console.log(`   URL image 1: ${p.images[0]}`);
                }
                console.log('');
            });
        } else {
            console.log(
                `${colors.red}❌ PROBLÈME: Aucun produit retourné${colors.reset}\n`
            );
        }
    } catch (error) {
        console.log(
            `${colors.red}❌ Erreur: ${error.message}${colors.reset}\n`
        );
    }

    // 2. Test produits populaires
    console.log(
        `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );
    console.log(`${colors.cyan}📡 2. Produits Populaires${colors.reset}`);
    console.log(
        `${colors.blue}URL: ${API_URL}/produits/populaires${colors.reset}\n`
    );

    try {
        const response = await axios.get(`${API_URL}/produits/populaires`);
        const produits = response.data.donnees || [];

        console.log(
            `${colors.green}✅ Statut: ${response.status}${colors.reset}`
        );
        console.log(
            `${colors.green}📦 Nombre: ${produits.length}${colors.reset}\n`
        );
    } catch (error) {
        console.log(
            `${colors.red}❌ Erreur: ${error.message}${colors.reset}\n`
        );
    }

    // 3. Test nouveautés
    console.log(
        `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );
    console.log(`${colors.cyan}📡 3. Nouveautés${colors.reset}`);
    console.log(
        `${colors.blue}URL: ${API_URL}/produits/nouveaux${colors.reset}\n`
    );

    try {
        const response = await axios.get(`${API_URL}/produits/nouveaux`);
        const produits = response.data.donnees || [];

        console.log(
            `${colors.green}✅ Statut: ${response.status}${colors.reset}`
        );
        console.log(
            `${colors.green}📦 Nombre: ${produits.length}${colors.reset}\n`
        );
    } catch (error) {
        console.log(
            `${colors.red}❌ Erreur: ${error.message}${colors.reset}\n`
        );
    }

    // 4. Test frontend (simulation)
    console.log(
        `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );
    console.log(
        `${colors.cyan}📡 4. Test Frontend (http://localhost:5173)${colors.reset}\n`
    );

    try {
        const frontResponse = await axios.get('http://localhost:5173');
        console.log(
            `${colors.green}✅ Frontend actif (status ${frontResponse.status})${colors.reset}\n`
        );
    } catch (error) {
        console.log(`${colors.red}❌ Frontend inaccessible${colors.reset}`);
        console.log(
            `${colors.yellow}⚠️  Lance: cd client && npm run dev${colors.reset}\n`
        );
    }

    // 5. Résumé et recommandations
    console.log(
        `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );
    console.log(
        `${colors.yellow}${colors.bright}📋 RECOMMANDATIONS:${colors.reset}\n`
    );

    console.log(
        `${colors.cyan}1. Vérifie la console du navigateur (F12)${colors.reset}`
    );
    console.log(`   - Va sur http://localhost:5173`);
    console.log(`   - Ouvre F12 > Console`);
    console.log(`   - Cherche des erreurs rouges\n`);

    console.log(
        `${colors.cyan}2. Vérifie l'onglet Network (F12)${colors.reset}`
    );
    console.log(`   - F12 > Network`);
    console.log(`   - Recharge la page`);
    console.log(`   - Cherche la requête vers /api/produits`);
    console.log(`   - Vérifie le statut et la réponse\n`);

    console.log(
        `${colors.cyan}3. Fichiers frontend à vérifier:${colors.reset}`
    );
    console.log(`   - client/src/pages/accueil.jsx`);
    console.log(`   - client/src/pages/Boutique.jsx`);
    console.log(`   - client/src/components/ui/GrilleProduitsAccueil.jsx`);
    console.log(`   - client/src/services/produitsService.js\n`);

    console.log(`${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════════════════╗
║                    DIAGNOSTIC TERMINÉ                          ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);
}

diagnosticComplet();
