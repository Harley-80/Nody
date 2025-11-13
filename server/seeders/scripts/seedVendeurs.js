import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const creerVendeurs = async () => {
    console.log('Démarrage de la création des vendeurs...');

    try {
        console.log('Import des modules...');

        const { default: Utilisateur } = await import(
            '../../models/utilisateurModel.js'
        );
        const { ROLES } = await import('../../constants/roles.js');
        const { default: config } = await import('../../config/env.js');

        console.log('Connexion à la base de données...');
        await mongoose.connect(config.mongodbUri);
        console.log('Connecté à MongoDB');

        // Vérifier si des vendeurs existent déjà
        const vendeursExistants = await Utilisateur.find({
            role: ROLES.VENDEUR,
        });

        if (vendeursExistants.length > 0) {
            console.log(
                `${vendeursExistants.length} vendeur(s) existent déjà:`
            );
            vendeursExistants.forEach(vendeur => {
                console.log(
                    `- ${vendeur.prenom} ${vendeur.nom} (${vendeur.email}) - ${vendeur.boutique?.nomBoutique}`
                );
            });
            await mongoose.connection.close();
            return;
        }

        // Données des vendeurs de test
        const vendeursData = [
            {
                nom: 'Ndiaye',
                prenom: 'Fatou',
                email: 'fatou.vendeur@nody.sn',
                motDePasse: 'Vendeur123!',
                telephone: '+221771234570',
                genre: 'Femme',
                role: ROLES.VENDEUR,
                statutVerification: 'verifie', // Pour tester, on les met directement vérifiés
                emailVerifie: true,
                estActif: true,
                boutique: {
                    nomBoutique: 'Boutique Fatou - Artisanat Local',
                    descriptionBoutique:
                        'Spécialisée dans les produits artisanaux sénégalais et les tissus wax',
                    siteWeb: 'https://boutique-fatou.nody.sn',
                    politiqueRetour: 'Retours acceptés sous 14 jours',
                    conditionsVente: 'Paiement sécurisé, livraison sous 48h',
                },
            },
            {
                nom: 'Diop',
                prenom: 'Moussa',
                email: 'moussa.vendeur@nody.sn',
                motDePasse: 'Vendeur123!',
                telephone: '+221761234571',
                genre: 'Homme',
                role: ROLES.VENDEUR,
                statutVerification: 'verifie',
                emailVerifie: true,
                estActif: true,
                boutique: {
                    nomBoutique: 'Tech Store Moussa',
                    descriptionBoutique:
                        "Vente d'équipements électroniques et accessoires tech",
                    siteWeb: 'https://tech-moussa.nody.sn',
                    politiqueRetour: 'Garantie 1 an sur tous les produits',
                    conditionsVente:
                        'Livraison gratuite à partir de 50.000 XOF',
                },
            },
            {
                nom: 'Gueye',
                prenom: 'Aïcha',
                email: 'aicha.vendeur@nody.sn',
                motDePasse: 'Vendeur123!',
                telephone: '+221781234572',
                genre: 'Femme',
                role: ROLES.VENDEUR,
                statutVerification: 'en_attente', // Un vendeur en attente de vérification
                emailVerifie: true,
                estActif: true,
                boutique: {
                    nomBoutique: 'Cosmétiques Aïcha Nature',
                    descriptionBoutique:
                        'Produits cosmétiques naturels et bio made in Senegal',
                    siteWeb: 'https://cosmetiques-aicha.nody.sn',
                },
            },
        ];

        console.log('Hachage des mots de passe...');
        const sel = await bcrypt.genSalt(12);

        for (let vendeur of vendeursData) {
            vendeur.motDePasse = await bcrypt.hash(vendeur.motDePasse, sel);
        }

        console.log('Création des vendeurs...');
        const vendeurs = await Utilisateur.insertMany(vendeursData);

        // Affichage des résultats
        console.log('\n' + '='.repeat(60));
        console.log('VENDEURS CRÉÉS AVEC SUCCÈS!');
        console.log('='.repeat(60));

        vendeurs.forEach((vendeur, index) => {
            console.log(`\nVendeur ${index + 1}:`);
            console.log(`- Nom complet: ${vendeur.prenom} ${vendeur.nom}`);
            console.log(`- Email: ${vendeur.email}`);
            console.log(`- Mot de passe: Vendeur123!`);
            console.log(`- Boutique: ${vendeur.boutique.nomBoutique}`);
            console.log(`- Statut vérification: ${vendeur.statutVerification}`);
            console.log(`- Site web: ${vendeur.boutique.siteWeb}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('INFORMATIONS DE TEST:');
        console.log('- 2 vendeurs vérifiés (peuvent créer des produits)');
        console.log(
            '- 1 vendeur en attente (doit être approuvé par modérateur)'
        );
        console.log('URL de connexion: http://localhost:3000/connexion');
        console.log('='.repeat(60));
    } catch (error) {
        console.error('\nERREUR lors de la création des vendeurs:');
        console.error('Message:', error.message);

        if (error.name === 'MongoServerError' && error.code === 11000) {
            console.error('Erreur: Un utilisateur avec cet email existe déjà');
        }
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('\n Déconnecté de la base de données');
        }
        console.log('\n Script terminé');
    }
};

// Exécuter le script
creerVendeurs();
