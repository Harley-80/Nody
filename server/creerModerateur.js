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
                ' Erreur: Variable MONGO_URI non trouvée dans .env'
            );
            console.log('\n Vérifiez que votre fichier .env contient:');
            console.log('   MONGO_URI=mongodb://localhost:27017/nody');
            console.log('   ou');
            console.log(
                '   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nody'
            );
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log(' Connecté à MongoDB');
        console.log(' Base de données:', mongoose.connection.name);
    } catch (error) {
        console.error(' Erreur de connexion MongoDB:', error.message);
        process.exit(1);
    }
};


// CRÉER UN MODÉRATEUR

const creerModerateur = async () => {
    try {
        // Données du modérateur (avec TOUS les champs requis)
        const moderateurData = {
            nom: 'Sarr',
            prenom: 'Modérateur',
            email: 'moderateur@nody.com',
            motDePasse: 'Test123!', // Sera hashé automatiquement par le middleware pre('save')
            genre: 'Homme', //  Champ requis
            role: ROLES.MODERATEUR,
            telephone: '+221771234567',
            estActif: true,
            emailVerifie: true,
            statutVerification: 'verifie',
            dateVerification: new Date(),
            preferences: {
                newsletter: false,
                marketing: false,
                notifications: true,
                langue: 'fr',
                devise: 'XOF',
            },
        };

        console.log(
            `\n Vérification si l'email ${moderateurData.email} existe déjà...`
        );

        // Vérifier si le modérateur existe déjà
        const existeDeja = await Utilisateur.findOne({
            email: moderateurData.email,
        });

        if (existeDeja) {
            console.log('\n  Un utilisateur avec cet email existe déjà');
            console.log('═══════════════════════════════════════');
            console.log(' Email:', existeDeja.email);
            console.log(' ID:', existeDeja._id);
            console.log(' Rôle actuel:', existeDeja.role);
            console.log(' Nom complet:', existeDeja.nomComplet);
            console.log('═══════════════════════════════════════');

            // Proposer de mettre à jour le rôle si ce n'est pas un modérateur
            if (existeDeja.role !== ROLES.MODERATEUR) {
                console.log('\n Mise à jour du rôle en modérateur...');
                existeDeja.role = ROLES.MODERATEUR;
                existeDeja.estActif = true;
                existeDeja.statutVerification = 'verifie';
                existeDeja.emailVerifie = true;
                existeDeja.dateVerification = new Date();
                await existeDeja.save();
                console.log(' Rôle mis à jour avec succès !');

                console.log('\n Identifiants de connexion:');
                console.log('═══════════════════════════════════════');
                console.log(' Email:', existeDeja.email);
                console.log(' Mot de passe: [votre mot de passe actuel]');
                console.log('═══════════════════════════════════════');
            } else {
                console.log(
                    '\n Cet utilisateur est déjà un modérateur actif'
                );
                console.log('\n Vous pouvez vous connecter avec:');
                console.log('═══════════════════════════════════════');
                console.log(' Email:', existeDeja.email);
                console.log(' Mot de passe: [votre mot de passe actuel]');
                console.log('═══════════════════════════════════════');
            }

            return existeDeja;
        }

        console.log(' Email disponible, création en cours...\n');

        // Créer le modérateur (le mot de passe sera hashé automatiquement)
        const moderateur = await Utilisateur.create(moderateurData);

        console.log(' Modérateur créé avec succès !');
        console.log('═══════════════════════════════════════');
        console.log(' Email:', moderateur.email);
        console.log(' Mot de passe:', 'Test123!');
        console.log(' ID:', moderateur._id);
        console.log(' Rôle:', moderateur.role);
        console.log(' Nom complet:', moderateur.nomComplet);
        console.log(' Genre:', moderateur.genre);
        console.log(' Téléphone:', moderateur.telephone);
        console.log(' Statut:', moderateur.statutVerification);
        console.log('═══════════════════════════════════════');
        console.log(
            '\n Vous pouvez maintenant vous connecter avec ces identifiants'
        );
        console.log(' URL de connexion: http://localhost:5173/connexion');
        console.log(
            '🛡  Dashboard modérateur: http://localhost:5173/moderateur/dashboard'
        );

        return moderateur;
    } catch (error) {
        console.error('\n Erreur lors de la création du modérateur:');

        if (error.name === 'ValidationError') {
            console.log('\n Détails des erreurs de validation:');
            Object.keys(error.errors).forEach(key => {
                console.log(`   - ${key}: ${error.errors[key].message}`);
            });
        } else if (error.code === 11000) {
            console.log(
                '\n  Un utilisateur avec cet email existe déjà dans la base de données'
            );
            console.log(
                '   Utilisez MongoDB Compass pour vérifier ou supprimer le doublon'
            );
        } else {
            console.error(error);
        }

        throw error;
    }
};


// EXÉCUTION DU SCRIPT

const main = async () => {
    try {
        console.log('Démarrage du script de création de modérateur...\n');
        await connectDB();
        await creerModerateur();
        console.log('\n Script terminé avec succès');
        process.exit(0);
    } catch (error) {
        console.error("\n Erreur lors de l'exécution du script");
        process.exit(1);
    }
};

main();