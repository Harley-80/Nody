import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Utilisateur from '../models/utilisateurModel.js';

dotenv.config();

const diagnosticStatut = async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/nody'
        );
        console.log('✅ Connecté\n');

        // Récupérer TOUS les vendeurs et modérateurs
        const tous = await Utilisateur.find({
            role: { $in: ['vendeur', 'moderateur'] },
        }).select('nom prenom email role statutVerification createdAt');

        console.log(
            `📊 TOTAL vendeurs + modérateurs (sans filtre statut): ${tous.length}\n`
        );

        tous.forEach((u, i) => {
            console.log(`${i + 1}. ${u.prenom} ${u.nom}`);
            console.log(`   Email: ${u.email}`);
            console.log(`   Rôle: ${u.role}`);
            console.log(
                `   Statut: "${u.statutVerification}" (type: ${typeof u.statutVerification})`
            );
            console.log(`   Date: ${u.createdAt?.toLocaleDateString('fr-FR')}`);
            console.log('');
        });

        // Test AVEC filtre en_attente
        const enAttente = await Utilisateur.find({
            role: { $in: ['vendeur', 'moderateur'] },
            statutVerification: 'en_attente',
        }).select('nom prenom email role statutVerification');

        console.log(
            `📊 TOTAL avec filtre statutVerification='en_attente': ${enAttente.length}\n`
        );

        enAttente.forEach((u, i) => {
            console.log(
                `${i + 1}. ${u.prenom} ${u.nom} - ${u.role} - ${u.statutVerification}`
            );
        });

        // Test avec mongoose-paginate-v2
        console.log('\n📊 TEST AVEC MONGOOSE-PAGINATE-V2:\n');

        const resultPaginate = await Utilisateur.paginate(
            {
                role: { $in: ['vendeur', 'moderateur'] },
                statutVerification: 'en_attente',
            },
            {
                page: 1,
                limit: 20,
                sort: { createdAt: -1 },
                select: '-motDePasse',
            }
        );

        console.log(`Total Docs: ${resultPaginate.totalDocs}`);
        console.log(`Docs retournés: ${resultPaginate.docs.length}`);
        console.log(`Page: ${resultPaginate.page}`);
        console.log(`Total Pages: ${resultPaginate.totalPages}`);
        console.log('');

        resultPaginate.docs.forEach((u, i) => {
            console.log(`${i + 1}. ${u.prenom} ${u.nom} - ${u.role}`);
        });

        await mongoose.connection.close();
        process.exit(0);
    } catch (erreur) {
        console.error('❌ Erreur:', erreur);
        await mongoose.connection.close();
        process.exit(1);
    }
};

diagnosticStatut();
