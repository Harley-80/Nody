import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Utilisateur from '../models/utilisateurModel.js';

dotenv.config();

const creerEtVerifier = async () => {
    try {
        console.log('Connexion à MongoDB...');
        await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/nody'
        );
        console.log('✅ MongoDB connecté\n');

        const motDePasseHash = await bcrypt.hash('Test123!', 10);

        const utilisateursTest = [
            {
                nom: 'Diallo',
                prenom: 'Aminata',
                email: 'aminata.diallo@test.sn',
                motDePasse: motDePasseHash,
                role: 'vendeur',
                genre: 'Femme',
                telephone: '+221771234567',
                statutVerification: 'en_attente',
                emailVerifie: false,
                boutique: {
                    nomBoutique: 'Boutique Aminata Fashion',
                    descriptionBoutique:
                        'Mode africaine et accessoires tendance',
                },
            },
            {
                nom: 'Ndiaye',
                prenom: 'Cheikh',
                email: 'cheikh.ndiaye@test.sn',
                motDePasse: motDePasseHash,
                role: 'vendeur',
                genre: 'Homme',
                telephone: '+221772345678',
                statutVerification: 'en_attente',
                emailVerifie: false,
                boutique: {
                    nomBoutique: 'Tech Solutions Sénégal',
                    descriptionBoutique:
                        'Électronique et équipements high-tech',
                },
            },
            {
                nom: 'Sow',
                prenom: 'Fatou',
                email: 'fatou.sow@test.sn',
                motDePasse: motDePasseHash,
                role: 'moderateur',
                genre: 'Femme',
                telephone: '+221773456789',
                statutVerification: 'en_attente',
                emailVerifie: false,
            },
            {
                nom: 'Sarr',
                prenom: 'Ousmane',
                email: 'ousmane.sarr@test.sn',
                motDePasse: motDePasseHash,
                role: 'moderateur',
                genre: 'Homme',
                telephone: '+221774567890',
                statutVerification: 'en_attente',
                emailVerifie: false,
            },
        ];

        console.log('📝 Création et vérification des utilisateurs...\n');

        for (const userData of utilisateursTest) {
            // Supprimer si existe déjà
            await Utilisateur.deleteOne({ email: userData.email });

            // Créer
            const utilisateur = await Utilisateur.create(userData);
            console.log(
                `✅ ${utilisateur.role.toUpperCase()} créé: ${utilisateur.prenom} ${utilisateur.nom}`
            );

            // Vérifier IMMÉDIATEMENT
            const verif = await Utilisateur.findOne({ email: userData.email });
            if (verif) {
                console.log(
                    `   ✓ VÉRIFIÉ: ${verif.email} existe bien (statut: ${verif.statutVerification})`
                );
            } else {
                console.log(
                    `   ❌ ERREUR: ${userData.email} n'existe PAS après création !`
                );
            }
            console.log('');
        }

        // Vérification finale
        const total = await Utilisateur.countDocuments({
            statutVerification: 'en_attente',
            role: { $in: ['vendeur', 'moderateur'] },
        });

        console.log(`\n✅ TOTAL FINAL: ${total} demandes en attente\n`);

        if (total !== 4) {
            console.log(
                '❌ PROBLÈME: Le nombre attendu est 4, mais on a:',
                total
            );
        }

        await mongoose.connection.close();
        console.log('✅ Script terminé');
        process.exit(0);
    } catch (erreur) {
        console.error('❌ Erreur:', erreur);
        await mongoose.connection.close();
        process.exit(1);
    }
};

creerEtVerifier();
