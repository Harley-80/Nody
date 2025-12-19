// resetAdminPassword.js
import mongoose from 'mongoose';
import Utilisateur from './models/utilisateurModel.js';

const reinitialiserMotDePasseAdmin = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/nody_db');
        console.log(' Connecté à MongoDB');

        // Trouver l'admin
        const admin = await Utilisateur.findOne({ email: 'admin@nody.sn' });

        if (!admin) {
            console.log(' Admin non trouvé');
            return;
        }

        console.log(' Réinitialisation du mot de passe...');

        // Changer le mot de passe - le middleware pre('save') va le hacher automatiquement
        admin.motDePasse = 'Admin123!';
        await admin.save();

        console.log(' MOT DE PASSE ADMIN RÉINITIALISÉ AVEC SUCCÈS !');
        console.log(' Email: admin@nody.sn');
        console.log(' Nouveau mot de passe: Admin123!');
        console.log(' Nouveau hash généré automatiquement');

        // Vérification
        const adminApres = await Utilisateur.findOne({
            email: 'admin@nody.sn',
        }).select('+motDePasse');

        const verification = await adminApres.comparerMotDePasse('Admin123!');
        console.log(' Vérification:', verification ? 'SUCCÈS' : 'ÉCHEC');

        if (verification) {
            console.log('\n MAINTENANT VOUS POUVEZ VOUS CONNECTER AVEC:');
            console.log('   Email: admin@nody.sn');
            console.log('   Mot de passe: Admin123!');
        }
    } catch (error) {
        console.error(' Erreur:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n Déconnecté de MongoDB');
    }
};

reinitialiserMotDePasseAdmin();
