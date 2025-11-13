// Script pour créer Admin, Modérateurs et Vendeurs
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedTousRoles = async () => {
    try {
        console.log(' CRÉATION DE TOUS LES RÔLES UTILISATEURS');
        console.log('='.repeat(50));

        // Exécuter les seeders dans l'ordre
        console.log("\n1. Création de l'Administrateur...");
        await import('./seedAdmin.js');

        console.log('\n2. Création des Modérateurs...');
        await import('./seedModerateurs.js');

        console.log('\n3. Création des Vendeurs...');
        await import('./seedVendeurs.js');

        console.log('\n' + '='.repeat(50));
        console.log(' TOUS LES RÔLES ONT ÉTÉ CRÉÉS AVEC SUCCÈS!');
        console.log('='.repeat(50));

        console.log('\n RÉSUMÉ DES COMPTES CRÉÉS:');
        console.log('- 1 Administrateur (admin@nody.sn)');
        console.log(
            '- 2 Modérateurs (aminata.moderateur@nody.sn, ibrahima.moderateur@nody.sn)'
        );
        console.log('- 3 Vendeurs (dont 1 en attente de vérification)');

        console.log('\n URL de connexion: http://localhost:3000/connexion');
        console.log(
            '\n  IMPORTANT: Changez les mots de passe après la première connexion!'
        );
    } catch (error) {
        console.error(
            '\n Erreur lors de la création des rôles:',
            error.message
        );
    }
};

// Exécuter le script
seedTousRoles();
