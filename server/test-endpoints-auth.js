import axios from 'axios';
import 'dotenv/config';

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// ⚠️ REMPLACE CE TOKEN PAR UN VRAI TOKEN D'UN VENDEUR CONNECTÉ
// Tu peux le récupérer dans localStorage du navigateur après connexion
const VENDEUR_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // À REMPLACER!

async function testerAvecAuth() {
    console.log('🔐 Test endpoints protégés\n');

    try {
        // Test 1: Produits vendeur
        console.log('📡 Test: /api/vendeur/produits');
        const response = await axios.get(`${API_URL}/vendeur/produits`, {
            headers: {
                Authorization: `Bearer ${VENDEUR_TOKEN}`,
            },
        });

        console.log('✅ Statut:', response.status);
        const produits = response.data.donnees || response.data.data || [];
        console.log('📦 Nombre de produits:', produits.length);

        if (produits.length > 0) {
            const premier = produits[0];
            console.log('\n🏷️ Premier produit:');
            console.log('Nom:', premier.nom);
            console.log('Images:', premier.images);
            console.log('URL image 1:', premier.images?.[0]);

            // Vérifier si c'est une URL absolue ou relative
            if (premier.images?.[0]) {
                const isAbsolute = premier.images[0].startsWith('http');
                console.log(
                    `\n${isAbsolute ? '✅' : '❌'} URL ${isAbsolute ? 'ABSOLUE' : 'RELATIVE'}`
                );

                if (!isAbsolute) {
                    console.log("⚠️ PROBLÈME TROUVÉ: L'URL est relative!");
                    console.log('Actuel:', premier.images[0]);
                    console.log(
                        'Devrait être:',
                        `${BASE_URL}/${premier.images[0]}`
                    );
                }
            }
        }
    } catch (error) {
        console.error('❌ Erreur:', error.response?.status || error.message);
        if (error.response?.status === 401) {
            console.log('\n⚠️ Token invalide ou expiré');
            console.log('📝 Comment obtenir un token:');
            console.log(
                '1. Connecte-toi en tant que vendeur sur http://localhost:5173'
            );
            console.log('2. Ouvre la console (F12) et tape:');
            console.log('   localStorage.getItem("token")');
            console.log(
                '3. Copie le token et remplace VENDEUR_TOKEN dans ce script'
            );
        }
    }
}

testerAvecAuth();
