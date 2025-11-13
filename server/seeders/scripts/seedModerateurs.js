import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const creerModerateurs = async () => {
    console.log('Démarrage de la création des modérateurs...');

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

        // Vérifier si des modérateurs existent déjà
        const moderateursExistants = await Utilisateur.find({
            role: ROLES.MODERATEUR,
        });

        if (moderateursExistants.length > 0) {
            console.log(
                `${moderateursExistants.length} modérateur(s) existent déjà:`
            );
            moderateursExistants.forEach(modo => {
                console.log(`- ${modo.prenom} ${modo.nom} (${modo.email})`);
            });
            await mongoose.connection.close();
            return;
        }

        // Données des modérateurs de test
        const moderateursData = [
            {
                nom: 'Diallo',
                prenom: 'Aminata',
                email: 'aminata.moderateur@nody.sn',
                motDePasse: 'Modo123!',
                telephone: '+221771234568',
                genre: 'Femme',
                role: ROLES.MODERATEUR,
                statutVerification: 'verifie',
                emailVerifie: true,
                estActif: true,
            },
            {
                nom: 'Sarr',
                prenom: 'Ibrahima',
                email: 'ibrahima.moderateur@nody.sn',
                motDePasse: 'Modo123!',
                telephone: '+221761234569',
                genre: 'Homme',
                role: ROLES.MODERATEUR,
                statutVerification: 'verifie',
                emailVerifie: true,
                estActif: true,
            },
        ];

        console.log('Hachage des mots de passe...');
        const sel = await bcrypt.genSalt(12);

        for (let modo of moderateursData) {
            modo.motDePasse = await bcrypt.hash(modo.motDePasse, sel);
        }

        console.log('Création des modérateurs...');
        const moderateurs = await Utilisateur.insertMany(moderateursData);

        // Affichage des résultats
        console.log('\n' + '='.repeat(60));
        console.log('MODÉRATEURS CRÉÉS AVEC SUCCÈS!');
        console.log('='.repeat(60));

        moderateurs.forEach((modo, index) => {
            console.log(`\nModérateur ${index + 1}:`);
            console.log(`- Nom complet: ${modo.prenom} ${modo.nom}`);
            console.log(`- Email: ${modo.email}`);
            console.log(`- Mot de passe: Modo123!`);
            console.log(`- Téléphone: ${modo.telephone}`);
            console.log(`- Rôle: ${modo.role}`);
            console.log(`- Statut: ${modo.statutVerification}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('INFORMATIONS DE CONNEXION:');
        console.log('URL: http://localhost:3000/connexion');
        console.log('Utilisez les identifiants ci-dessus pour vous connecter');
        console.log('='.repeat(60));
    } catch (error) {
        console.error('\nERREUR lors de la création des modérateurs:');
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
creerModerateurs();
