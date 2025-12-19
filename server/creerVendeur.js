import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Utilisateur from './models/utilisateurModel.js';
import { ROLES } from './constants/roles.js';

// Charger les variables d'environnement
dotenv.config();

// CONNEXION À MONGODB
const connectDB = async () => {
    try {
        // Récupérer l'URI MongoDB depuis .env
        const mongoUri =
            process.env.MONGO_URI ||
            process.env.MONGODB_URI ||
            process.env.DATABASE_URL;

        if (!mongoUri) {
            console.error(
                '❌ Erreur: Variable MONGO_URI non trouvée dans .env'
            );
            console.log('\n💡 Vérifiez que votre fichier .env contient:');
            console.log('   MONGO_URI=mongodb://localhost:27017/nody');
            console.log('   ou');
            console.log(
                '   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nody'
            );
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connecté à MongoDB');
        console.log('📊 Base de données:', mongoose.connection.name);
    } catch (error) {
        console.error('❌ Erreur de connexion MongoDB:', error.message);
        process.exit(1);
    }
};

// CRÉER UN VENDEUR
const creerVendeur = async () => {
    try {
        // Données du vendeur (avec TOUS les champs requis)
        const vendeurData = {
            nom: 'Diop',
            prenom: 'Vendeur',
            email: 'vendeur@nody.com',
            motDePasse: 'Test123!', // Sera hashé automatiquement par le middleware pre('save')
            genre: 'Homme', // ⚠️ Champ requis
            role: ROLES.VENDEUR,
            telephone: '+221771234568',
            estActif: true,
            emailVerifie: true,
            statutVerification: 'verifie', // 'en_attente', 'verifie', 'rejete'
            dateVerification: new Date(),
            preferences: {
                newsletter: true,
                marketing: true,
                notifications: true,
                langue: 'fr',
                devise: 'XOF',
            },
            // Informations spécifiques vendeur
            boutique: {
                nomBoutique: 'Ma Boutique Test',
                description: 'Boutique de démonstration pour les tests',
                logo: '',
                banniere: '',
                adresse: {
                    rue: '123 Avenue Test',
                    ville: 'Dakar',
                    region: 'Dakar',
                    codePostal: '12000',
                },
                telephone: '+221771234568',
                email: 'vendeur@nody.com',
                horaires: {
                    lundi: { ouvert: true, debut: '08:00', fin: '18:00' },
                    mardi: { ouvert: true, debut: '08:00', fin: '18:00' },
                    mercredi: { ouvert: true, debut: '08:00', fin: '18:00' },
                    jeudi: { ouvert: true, debut: '08:00', fin: '18:00' },
                    vendredi: { ouvert: true, debut: '08:00', fin: '18:00' },
                    samedi: { ouvert: true, debut: '09:00', fin: '17:00' },
                    dimanche: { ouvert: false, debut: '', fin: '' },
                },
                delaiLivraisonMoyen: '2-5 jours',
                fraisLivraisonStandard: 2000,
                livraisonGratuite: true,
                seuilLivraisonGratuite: 50000,
                modesLivraison: ['Livraison à domicile', 'Point de retrait'],
                modesPaiement: ['Mobile Money', 'Espèces à la livraison'],
            },
        };

        console.log(
            `\n🔍 Vérification si l'email ${vendeurData.email} existe déjà...`
        );

        // Vérifier si le vendeur existe déjà
        const existeDeja = await Utilisateur.findOne({
            email: vendeurData.email,
        });

        if (existeDeja) {
            console.log('\n⚠️  Un utilisateur avec cet email existe déjà');
            console.log('═══════════════════════════════════════');
            console.log('📧 Email:', existeDeja.email);
            console.log('🆔 ID:', existeDeja._id);
            console.log('👤 Rôle actuel:', existeDeja.role);
            console.log('📝 Nom complet:', existeDeja.nomComplet);
            console.log('═══════════════════════════════════════');

            // Proposer de mettre à jour le rôle si ce n'est pas un vendeur
            if (existeDeja.role !== ROLES.VENDEUR) {
                console.log('\n🔄 Mise à jour du rôle en vendeur...');
                existeDeja.role = ROLES.VENDEUR;
                existeDeja.estActif = true;
                existeDeja.statutVerification = 'verifie';
                existeDeja.emailVerifie = true;
                existeDeja.dateVerification = new Date();

                // Ajouter les informations boutique si elles n'existent pas
                if (!existeDeja.boutique) {
                    existeDeja.boutique = vendeurData.boutique;
                }

                await existeDeja.save();
                console.log('✅ Rôle mis à jour avec succès !');

                console.log('\n🔑 Identifiants de connexion:');
                console.log('═══════════════════════════════════════');
                console.log('📧 Email:', existeDeja.email);
                console.log('🔒 Mot de passe: [votre mot de passe actuel]');
                console.log('═══════════════════════════════════════');
            } else {
                console.log('\n✅ Cet utilisateur est déjà un vendeur actif');
                console.log('\n🔑 Vous pouvez vous connecter avec:');
                console.log('═══════════════════════════════════════');
                console.log('📧 Email:', existeDeja.email);
                console.log('🔒 Mot de passe: [votre mot de passe actuel]');
                console.log('═══════════════════════════════════════');
            }

            return existeDeja;
        }

        console.log('✅ Email disponible, création en cours...\n');

        // Créer le vendeur (le mot de passe sera hashé automatiquement)
        const vendeur = await Utilisateur.create(vendeurData);

        console.log('✅ Vendeur créé avec succès !');
        console.log('═══════════════════════════════════════════════════');
        console.log('📧 Email:', vendeur.email);
        console.log('🔒 Mot de passe:', 'Test123!');
        console.log('🆔 ID:', vendeur._id);
        console.log('👤 Rôle:', vendeur.role);
        console.log('📝 Nom complet:', vendeur.nomComplet);
        console.log('⚧️  Genre:', vendeur.genre);
        console.log('📱 Téléphone:', vendeur.telephone);
        console.log('✔️  Statut:', vendeur.statutVerification);
        console.log(
            '🏪 Boutique:',
            vendeur.boutique?.nomBoutique || 'Non définie'
        );
        console.log('═══════════════════════════════════════════════════');
        console.log(
            '\n🎉 Vous pouvez maintenant vous connecter avec ces identifiants'
        );
        console.log('🌐 URL de connexion: http://localhost:5173/connexion');
        console.log(
            '🏪 Dashboard vendeur: http://localhost:5173/vendeur/dashboard'
        );
        console.log(
            '📦 Ajouter un produit: http://localhost:5173/vendeur/ajouter-produit'
        );
        console.log(
            '🏬 Ma boutique: http://localhost:5173/vendeur/ma-boutique'
        );

        return vendeur;
    } catch (error) {
        console.error('\n❌ Erreur lors de la création du vendeur:');

        if (error.name === 'ValidationError') {
            console.log('\n📋 Détails des erreurs de validation:');
            Object.keys(error.errors).forEach(key => {
                console.log(`   - ${key}: ${error.errors[key].message}`);
            });
        } else if (error.code === 11000) {
            console.log(
                '\n⚠️  Un utilisateur avec cet email existe déjà dans la base de données'
            );
            console.log(
                '💡 Utilisez MongoDB Compass pour vérifier ou supprimer le doublon'
            );

            // Afficher le champ dupliqué
            const duplicatedField = Object.keys(error.keyPattern)[0];
            console.log(`📌 Champ dupliqué: ${duplicatedField}`);
        } else {
            console.error(error);
        }

        throw error;
    }
};

// EXÉCUTION DU SCRIPT
const main = async () => {
    try {
        console.log('\n🚀 Démarrage du script de création de vendeur...\n');
        await connectDB();
        await creerVendeur();
        console.log('\n✅ Script terminé avec succès');
        console.log('═══════════════════════════════════════════════════\n');
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Erreur lors de l'exécution du script");
        process.exit(1);
    }
};

main();