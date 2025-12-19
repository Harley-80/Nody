import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

// Importer le modèle Utilisateur
import Utilisateur from '../models/utilisateurModel.js';

// Fonction pour créer l'admin
async function creerAdminPrincipal() {
    try {
        console.log('CRÉATION DU COMPTE ADMINISTRATEUR');
        // Connexion à MongoDB
        console.log('Connexion à MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connecté à MongoDB\n');

        // Vérifier si l'admin existe déjà
        const adminExistant = await Utilisateur.findOne({
            email: 'admin@nody.sn',
        });

        if (adminExistant) {
            console.log('Un administrateur existe déjà:');
            console.log('Email:', adminExistant.email);
            console.log('Rôle:', adminExistant.role);
            console.log('Statut:', adminExistant.statutVerification);
            console.log('\nPour réinitialiser le mot de passe, supprimez');
            console.log("d'abord ce compte depuis MongoDB Atlas.\n");
            process.exit(0);
        }

        // Créer le nouvel administrateur
        console.log('Création du compte administrateur...\n');

        const admin = new Utilisateur({
            nom: 'Admin',
            prenom: 'System',
            email: 'admin@nody.sn',
            motDePasse: 'Admin123!',
            telephone: '+221770000000',
            genre: 'Homme',
            role: 'admin',
            statutVerification: 'verifie',
            emailVerifie: true,
            estActif: true,
            preferences: {
                langue: 'fr',
                devise: 'XOF',
            },
        });

        await admin.save();

        console.log('✅ ADMINISTRATEUR CRÉÉ AVEC SUCCÈS !');
        console.log('Informations de connexion:');
        console.log('------------------------------------------');
        console.log('Email     : admin@nody.sn');
        console.log('Mot de passe : Admin123!');
        console.log('Rôle      : Super Admin');
        console.log('------------------------------------------\n');
        console.log('IMPORTANT: Changez ce mot de passe après');
        console.log('la première connexion pour des raisons');
        console.log('de sécurité.\n');
        console.log('URL de connexion:');
        console.log('http://localhost:5173/admin-login\n');
        console.log('========================================');
    } catch (erreur) {
        console.error('\nERREUR:', erreur.message);
        console.error('\nDétails:', erreur);
    } finally {
        await mongoose.connection.close();
        console.log('\nConnexion MongoDB fermée');
        process.exit(0);
    }
}

// Exécuter le script
creerAdminPrincipal();
