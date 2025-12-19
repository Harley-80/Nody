import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Utilisateur from '../models/utilisateurModel.js';

dotenv.config();

const utilisateursTest = [
    {
        nom: 'Diallo',
        prenom: 'Amadou',
        email: 'amadou.diallo@test.com',
        motDePasse: 'Test123!',
        genre: 'Homme',
        role: 'vendeur',
        telephone: '+221701234567',
        statutVerification: 'en_attente',
        emailVerifie: false,
        boutique: {
            nomBoutique: 'Boutique Amadou',
            descriptionBoutique: 'Vente de produits variés',
        },
    },
    {
        nom: 'Ndiaye',
        prenom: 'Fatou',
        email: 'fatou.ndiaye@test.com',
        motDePasse: 'Test123!',
        genre: 'Femme',
        role: 'vendeur',
        telephone: '+221702345678',
        statutVerification: 'en_attente',
        emailVerifie: false,
        boutique: {
            nomBoutique: 'Boutique Fatou',
            descriptionBoutique: 'Vente de produits artisanaux',
        },
    },
    {
        nom: 'Sarr',
        prenom: 'Mamadou',
        email: 'mamadou.sarr@test.com',
        motDePasse: 'Test123!',
        genre: 'Homme',
        role: 'moderateur',
        telephone: '+221703456789',
        statutVerification: 'en_attente',
        emailVerifie: false,
    },
    {
        nom: 'Sow',
        prenom: 'Aïssatou',
        email: 'aissatou.sow@test.com',
        motDePasse: 'Test123!',
        genre: 'Femme',
        role: 'moderateur',
        telephone: '+221704567890',
        statutVerification: 'en_attente',
        emailVerifie: false,
    },
];

async function creerUtilisateursTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connexion MongoDB etablie');

        await Utilisateur.deleteMany({
            email: {
                $in: utilisateursTest.map(u => u.email),
            },
        });
        console.log('Anciens utilisateurs de test supprimes: 0');

        let compteurVendeurs = 0;
        let compteurModerateurs = 0;

        for (const userData of utilisateursTest) {
            const utilisateur = new Utilisateur(userData);
            await utilisateur.save();

            if (userData.role === 'vendeur') {
                compteurVendeurs++;
                console.log(
                    `Vendeur ${compteurVendeurs} cree: ${userData.email} (Mot de passe: ${userData.motDePasse})`
                );
            } else {
                compteurModerateurs++;
                console.log(
                    `Moderateur ${compteurModerateurs} cree: ${userData.email} (Mot de passe: ${userData.motDePasse})`
                );
            }
        }

        console.log('\n--- RESUME ---');
        console.log(`Total demandes en attente: ${utilisateursTest.length}`);
        console.log(`Vendeurs en attente: ${compteurVendeurs}`);
        console.log(`Moderateurs en attente: ${compteurModerateurs}`);

        const verification = await Utilisateur.countDocuments({
            statutVerification: 'en_attente',
            role: { $in: ['vendeur', 'moderateur'] },
        });
        console.log(
            `\nVerification MongoDB: ${verification} demandes en attente`
        );

        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error.message);
        process.exit(1);
    }
}

creerUtilisateursTest();
