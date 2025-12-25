// server/scripts/peuplerBaseDeDonnees.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const peuplerBaseDeDonnees = async () => {
    try {
        console.log('🚀 Démarrage du peuplement de la base de données...\n');

        // Étape 1 : Peupler les catégories
        console.log('📁 Étape 1 : Peuplement des catégories...');
        try {
            await execAsync('node scripts/peuplerCategories.js');
            console.log('✅ Catégories créées avec succès\n');
        } catch (error) {
            console.error(
                '❌ Erreur lors du peuplement des catégories:',
                error.message
            );
            process.exit(1);
        }

        // Étape 2 : Peupler les produits
        console.log('📦 Étape 2 : Peuplement des produits...');
        try {
            await execAsync('node scripts/peuplerProduits.js');
            console.log('✅ Produits créés avec succès\n');
        } catch (error) {
            console.error(
                '❌ Erreur lors du peuplement des produits:',
                error.message
            );
            process.exit(1);
        }

        console.log('🎉 Base de données peuplée avec succès !');
        console.log('👉 Vous pouvez maintenant lancer votre application.');
    } catch (error) {
        console.error('❌ Erreur générale:', error);
        process.exit(1);
    }
};

peuplerBaseDeDonnees();