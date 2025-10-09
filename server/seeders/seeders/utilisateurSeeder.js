// Seeder pour les utilisateurs
import Utilisateur from '../../models/utilisateurModel.js';
import { faker } from '@faker-js/faker';

/**
 * Seeder pour peupler la table des utilisateurs
 */
const utilisateurSeeder = {
    /**
     * Peupler la table des utilisateurs
     */
    async peupler() {
        try {
            await Utilisateur.deleteMany();

            const utilisateursData = [];
            const NOMBRE_UTILISATEURS = 20; // Vous pouvez ajuster ce nombre
            const genresValides = ['homme', 'femme'];

            for (let i = 0; i < NOMBRE_UTILISATEURS; i++) {
                utilisateursData.push({
                    nom: faker.person.lastName(),
                    prenom: faker.person.firstName(), // Ajout du prénom manquant
                    email: faker.internet.email().toLowerCase(),
                    motDePasse: 'password123', // Le modèle s'occupera du hachage
                    genre: faker.helpers.arrayElement(genresValides), // Utilisation d'une valeur valide
                    role: i === 0 ? 'admin' : 'client', // Le premier utilisateur sera un admin
                    // Ajoutez d'autres champs requis par votre modèle ici
                });
            }

            const utilisateursCrees = await Utilisateur.insertMany(
                utilisateursData
            );

            console.log(`${utilisateursCrees.length} utilisateurs insérés.`);
            return utilisateursCrees;
        } catch (error) {
            console.error(
                'Erreur lors du peuplement des utilisateurs :',
                error
            );
            throw error;
        }
    },

    /**
     * Vider la table des utilisateurs
     */
    async vider() {
        try {
            await Utilisateur.deleteMany();
            console.log('Tous les utilisateurs ont été supprimés.');
        } catch (error) {
            console.error(
                'Erreur lors de la suppression des utilisateurs :',
                error
            );
            throw error;
        }
    },
};

export default utilisateurSeeder;
