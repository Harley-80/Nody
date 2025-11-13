// Script pour créer le premier administrateur
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Résolution correcte des chemins pour Windows
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORRECTION : Chemins relatifs depuis le dossier seeders/scripts
const creerAdminInitial = async () => {
    console.log("Démarrage de la création de l'administrateur...");

    try {
        console.log('Import des modules...');

        // CORRECTION : Chemins relatifs corrigés
        // Depuis server/seeders/scripts/ vers server/models/
        const { default: Utilisateur } = await import(
            '../../models/utilisateurModel.js'
        );
        console.log('Modèle utilisateur importé');

        // CORRECTION : Chemin vers constants
        const { ROLES } = await import('../../constants/roles.js');
        console.log('Constantes des rôles importées');

        // CORRECTION : Chemin vers config
        const { default: config } = await import('../../config/env.js');
        console.log('Configuration importée');

        console.log('Connexion à la base de données...');

        // Connexion à MongoDB avec votre base de données
        const dbUri = 'mongodb://localhost:27017/nody_db';
        await mongoose.connect(dbUri);
        console.log('✅ Connecté à MongoDB:', dbUri);

        // Vérifier si un admin existe déjà
        console.log('Vérification des administrateurs existants...');
        const adminExiste = await Utilisateur.findOne({ role: ROLES.ADMIN });

        if (adminExiste) {
            console.log('Un administrateur existe déjà:');
            console.log('Email:', adminExiste.email);
            console.log(
                'Nom:',
                `${adminExiste.prenom} ${adminExiste.nom}`
            );
            console.log('Rôle:', adminExiste.role);
            console.log(
                'Créé le:',
                adminExiste.createdAt.toLocaleDateString()
            );
            await mongoose.connection.close();
            return;
        }

        // Données de l'admin initial
        const adminData = {
            nom: 'Admin',
            prenom: 'System',
            email: 'admin@nody.sn',
            motDePasse: 'Admin123!', // Mot de passe temporaire
            telephone: '+221771234567',
            genre: 'Homme',
            role: ROLES.ADMIN,
            statutVerification: 'verifie',
            emailVerifie: true,
            estActif: true,
        };

        console.log('Hachage du mot de passe...');
        // Hacher le mot de passe
        const sel = await bcrypt.genSalt(12);
        adminData.motDePasse = await bcrypt.hash(adminData.motDePasse, sel);

        console.log("Création de l'administrateur...");
        // Créer l'administrateur
        const admin = await Utilisateur.create(adminData);

        // Affichage des résultats
        console.log('\n' + '='.repeat(60));
        console.log('ADMINISTRATEUR CRÉÉ AVEC SUCCÈS!');
        console.log('='.repeat(60));
        console.log('Email:', admin.email);
        console.log('Mot de passe temporaire: Admin123!');
        console.log('Nom complet:', `${admin.prenom} ${admin.nom}`);
        console.log('Téléphone:', admin.telephone);
        console.log('Rôle:', admin.role);
        console.log('Date de création:', admin.createdAt.toLocaleString());
        console.log('='.repeat(60));
        console.log(
            'IMPORTANT: Changez le mot de passe après la première connexion!'
        );
        console.log('\nVous pouvez maintenant vous connecter avec:');
        console.log('Email: admin@nody.sn');
        console.log('Mot de passe: Admin123!');
        console.log('\nURL de connexion: http://localhost:3000/connexion');
    } catch (error) {
        console.error("\nERREUR lors de la création de l'administrateur:");
        console.error('Message:', error.message);

        // Détails de débogage spécifiques
        if (error.name === 'MongoServerError') {
            if (error.code === 11000) {
                console.error(
                    'Erreur: Un utilisateur avec cet email existe déjà'
                );
            } else {
                console.error('Erreur MongoDB:', error.message);
            }
        } else if (error.code === 'MODULE_NOT_FOUND') {
            console.error('Fichier manquant. Vérifiez la structure:');
            console.error('Structure actuelle:');
            console.error('server/');
            console.error('├── models/utilisateurModel.js');
            console.error('├── constants/roles.js');
            console.error('├── config/env.js');
            console.error('└── seeders/scripts/seedAdmin.js');
        } else if (error.message.includes('connect')) {
            console.error('Erreur de connexion MongoDB:');
            console.error('Vérifiez que MongoDB est démarré');
        }

        console.error('\n Pour debugger, essayez:');
        console.error(
            "   node -e \"console.log(require('path').resolve('./'))\""
        );
    } finally {
        // Fermeture propre de la connexion
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('\n Déconnecté de la base de données');
        }
        console.log('\n Script terminé');
    }
};

// Exécuter le script
creerAdminInitial();
