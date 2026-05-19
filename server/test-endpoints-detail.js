import axios from 'axios';
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

async function testerAvecDetails(endpoint, nom) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📡 TEST: ${nom}`);
    console.log(`   URL: ${API_URL}${endpoint}`);
    console.log('='.repeat(70));

    try {
        const response = await axios.get(`${API_URL}${endpoint}`);
        console.log(`✅ Statut: ${response.status}`);
        console.log(
            `📦 Données reçues:`,
            JSON.stringify(response.data, null, 2)
        );
    } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);

        if (error.response) {
            console.log(`   Statut: ${error.response.status}`);
            console.log(`   Message: ${error.response.statusText}`);
            console.log(
                `   Données:`,
                JSON.stringify(error.response.data, null, 2)
            );
        }
    }
}

async function test() {
    console.log(
        '\n╔════════════════════════════════════════════════════════════════════╗'
    );
    console.log(
        '║           🔍 TEST DÉTAILLÉ DES ENDPOINTS AVEC ERREUR 500          ║'
    );
    console.log(
        '╚════════════════════════════════════════════════════════════════════╝'
    );

    await testerAvecDetails('/admin/produits', 'Admin - Liste produits');
    await testerAvecDetails('/vendeur/produits', 'Vendeur - Mes produits');
    await testerAvecDetails(
        '/produits/69747ba0ad4e96aafed97147',
        'Produit unique'
    );
}

test().catch(console.error);
