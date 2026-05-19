import axios from 'axios';

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════════╗
║          DIAGNOSTIC - IMAGES PANIER                            ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

async function diagnosticPanier() {
    try {
        // Test d'un produit exemple
        const produitId = '6974ebace205f8d87c614af5'; // Mocassin
        const response = await axios.get(
            `http://localhost:5000/api/produits/${produitId}`
        );

        const produit = response.data.donnees || response.data.data;

        console.log(`${colors.green}✅ Produit récupéré${colors.reset}`);
        console.log(`   Nom: ${produit.nom}`);
        console.log(`   Prix: ${produit.prix}`);
        console.log(`   Images: ${produit.images?.length || 0}\n`);

        if (produit.images && produit.images.length > 0) {
            console.log(`${colors.cyan}🖼️  Images:${colors.reset}`);
            produit.images.forEach((img, i) => {
                console.log(`   ${i + 1}. ${img}`);
            });
        }

        console.log(
            `\n${colors.yellow}📋 Structure à vérifier dans le panier:${colors.reset}`
        );
        console.log(`   - Le panier stocke-t-il l'objet produit complet ?`);
        console.log(`   - Ou seulement l'ID du produit ?`);
        console.log(`   - Le composant panier fait-il un fetch des détails ?`);
    } catch (error) {
        console.log(`${colors.red}❌ Erreur: ${error.message}${colors.reset}`);
    }
}

diagnosticPanier();
