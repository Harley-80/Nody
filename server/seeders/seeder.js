// Importation des modules
import mongoose from 'mongoose';
import 'dotenv/config'; // Utilisation de l'import direct pour charger les variables d'environnement
import chalk from 'chalk'; // Améliore la lisibilité des logs

// Importation des seeders
import {
    utilisateurSeeder,
    categorieSeeder,
    produitSeeder,
    commandeSeeder,
    paiementSeeder,
} from './seeders/index.js';

/**
 * Connexion à la base de données MongoDB
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(chalk.green('MongoDB connecté avec succès.'));
    } catch (error) {
        console.error('Erreur de connexion MongoDB :', error.message);
        process.exit(1);
    }
};

/**
 * Fonction principale pour importer toutes les données
 */
const importerDonnees = async () => {
    try {
        console.log(
            chalk.blue('Début du peuplement de la base de données...\n')
        );

        // 1. Peupler les utilisateurs
        console.log(chalk.yellow('Peuplement des utilisateurs...'));
        const utilisateurs = await utilisateurSeeder.peupler();

        // 2. Peupler les catégories
        console.log(chalk.yellow('Peuplement des catégories...'));
        const categories = await categorieSeeder.peupler();

        // 3. Peupler les produits
        console.log(chalk.yellow('Peuplement des produits...'));
        const produits = await produitSeeder.peupler(utilisateurs, categories);

        // 4. Peupler les commandes
        console.log(chalk.yellow('Peuplement des commandes...'));
        const commandes = await commandeSeeder.peupler(utilisateurs, produits);

        // 5. Peupler les paiements
        console.log(chalk.yellow('Peuplement des paiements...'));
        const paiements = await paiementSeeder.peupler(commandes);

        console.log(
            chalk.green.bold(
                '\n✅ Peuplement de la base de données terminé avec succès !'
            )
        );
        console.log(
            chalk.cyan(`
    Statistiques :
        - Utilisateurs: ${utilisateurs.length}
        - Catégories:   ${categories.length}
        - Produits:     ${produits.length}
        - Commandes:    ${commandes.length}
        - Paiements:    ${paiements.length}
        `)
        );
    } catch (error) {
        console.error('Erreur lors du peuplement des données :', error);
        process.exit(1);
    }
};

/**
 * Fonction pour détruire toutes les données
 */
const detruireDonnees = async () => {
    try {
        console.log(chalk.red('Destruction de toutes les données...'));

        // Vider dans l'ordre inverse des dépendances
        await paiementSeeder.vider();
        await commandeSeeder.vider();
        await produitSeeder.vider();
        await categorieSeeder.vider();
        await utilisateurSeeder.vider();

        console.log(chalk.green.bold('Toutes les données ont été détruites.'));
    } catch (error) {
        console.error('Erreur lors de la destruction des données :', error);
        process.exit(1);
    }
};

// Exécution du script
const executer = async () => {
    await connectDB();

    const action = process.argv[2]; // ex: --import, --destroy
    const cible = process.argv[3]; // ex: utilisateurs, categories

    const seeders = {
        utilisateurs: utilisateurSeeder,
        categories: categorieSeeder,
        produits: produitSeeder,
        commandes: commandeSeeder,
        paiements: paiementSeeder,
    };

    try {
        if (action === '--import') {
            if (cible && seeders[cible]) {
                console.log(
                    chalk.yellow(`Peuplement de la collection : ${cible}...`)
                );
                await seeders[cible].peupler();
                console.log(
                    chalk.green.bold(
                        `✅ Collection ${cible} peuplée avec succès.`
                    )
                );
            } else if (!cible) {
                await importerDonnees(); // Comportement par défaut : tout importer
            } else {
                throw new Error(`Cible '${cible}' non reconnue.`);
            }
        } else if (action === '--destroy') {
            if (cible && seeders[cible]) {
                console.log(
                    chalk.red(
                        `Suppression des données de la collection : ${cible}...`
                    )
                );
                await seeders[cible].vider();
                console.log(
                    chalk.green.bold(`Collection ${cible} vidée avec succès.`)
                );
            } else if (!cible) {
                await detruireDonnees();
            } else {
                throw new Error(`Cible '${cible}' non reconnue.`);
            }
        } else {
            console.log(
                chalk.yellow(`
    UTILISATION DU SEEDER NODY :
    -------------------------
    Action globale :
      npm run seed            (Peuple toutes les collections)
      npm run seed:destroy    (Vide toutes les collections)

    Action ciblée (exemples) :
      npm run seed:categories
      npm run seed:destroy produits

    Cibles disponibles : ${Object.keys(seeders).join(', ')}
            `)
            );
        }
    } catch (error) {
        console.error(
            chalk.red.bold("\nErreur lors de l'exécution du seeder :"),
            error
        );
        process.exit(1);
    }
};

// Gestion des erreurs non catchées
process.on('unhandledRejection', err => {
    console.error(chalk.red.bold('Erreur non gérée :'), err);
    process.exit(1);
});

executer();
