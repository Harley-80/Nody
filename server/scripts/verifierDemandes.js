// Script de vérification des demandes en attente
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Utilisateur from '../models/utilisateurModel.js';

dotenv.config();

const verifierDemandes = async () => {
    try {
        console.log('Connexion à MongoDB...');
        await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/nody'
        );
        console.log('✅ Connecté\n');

        // Compter TOUTES les demandes en attente
        const total = await Utilisateur.countDocuments({
            statutVerification: 'en_attente',
            role: { $in: ['vendeur', 'moderateur'] },
        });

        console.log(`📊 TOTAL demandes en attente: ${total}\n`);

        // Récupérer toutes les demandes
        const demandes = await Utilisateur.find({
            statutVerification: 'en_attente',
            role: { $in: ['vendeur', 'moderateur'] },
        }).select(
            'nom prenom email role telephone statutVerification createdAt'
        );

        console.log('📋 LISTE COMPLÈTE DES DEMANDES:\n');
        demandes.forEach((d, i) => {
            console.log(`${i + 1}. ${d.prenom} ${d.nom}`);
            console.log(`   Email: ${d.email}`);
            console.log(`   Rôle: ${d.role}`);
            console.log(`   Statut: ${d.statutVerification}`);
            console.log(`   Téléphone: ${d.telephone || 'N/A'}`);
            console.log(
                `   Créé le: ${d.createdAt?.toLocaleDateString('fr-FR') || 'N/A'}`
            );
            console.log('');
        });

        // Vérifier spécifiquement les 4 nouveaux utilisateurs
        console.log('🔍 VÉRIFICATION DES 4 NOUVEAUX UTILISATEURS:\n');
        const emails = [
            'aminata.diallo@test.sn',
            'cheikh.ndiaye@test.sn',
            'fatou.sow@test.sn',
            'ousmane.sarr@test.sn',
        ];

        for (const email of emails) {
            const user = await Utilisateur.findOne({ email });
            if (user) {
                console.log(`✅ ${email} EXISTE`);
                console.log(`   Statut: ${user.statutVerification}`);
                console.log(`   Rôle: ${user.role}`);
            } else {
                console.log(`❌ ${email} N'EXISTE PAS`);
            }
            console.log('');
        }

        await mongoose.connection.close();
        console.log('✅ Vérification terminée');
        process.exit(0);
    } catch (erreur) {
        console.error('❌ Erreur:', erreur);
        await mongoose.connection.close();
        process.exit(1);
    }
};

verifierDemandes();
