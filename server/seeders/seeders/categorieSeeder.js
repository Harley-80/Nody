// Seeder pour les catégories
import Categorie from '../../models/categorieModel.js';
import { faker } from '@faker-js/faker';

/**
 * Seeder pour peupler la table des catégories
 */
const categorieSeeder = {
    /**
     * Peupler la table des catégories avec des données fictives.
     * Crée des catégories parentes, puis des catégories enfants.
     */
    async peupler() {
        try {
            await Categorie.deleteMany();

            // 1. Créer les catégories parentes
            const NOMBRE_CATEGORIES_PARENTES = 5;
            const nomsCategoriesParentesUniques = new Set();
            while (
                nomsCategoriesParentesUniques.size < NOMBRE_CATEGORIES_PARENTES
            ) {
                nomsCategoriesParentesUniques.add(faker.commerce.department());
            }

            const categoriesParentesData = Array.from(
                nomsCategoriesParentesUniques
            ).map(nom => {
                return {
                    nom: nom,
                    description: faker.lorem.sentence(),
                };
            });

            const categoriesParentesCrees = await Categorie.create(
                categoriesParentesData
            );
            console.log(
                `${categoriesParentesCrees.length} catégories parentes insérées.`
            );

            // 2. Créer les catégories enfants
            const NOMBRE_CATEGORIES_ENFANTS = 15;
            const nomsCategoriesEnfantsUniques = new Set();
            while (
                nomsCategoriesEnfantsUniques.size < NOMBRE_CATEGORIES_ENFANTS
            ) {
                nomsCategoriesEnfantsUniques.add(faker.commerce.productName());
            }

            const idsParents = categoriesParentesCrees.map(cat => cat._id);

            const categoriesEnfantsData = Array.from(
                nomsCategoriesEnfantsUniques
            ).map(nom => {
                return {
                    nom: nom,
                    description: faker.lorem.sentence(),
                    parent: faker.helpers.arrayElement(idsParents), // Associe un parent aléatoire
                };
            });

            const categoriesEnfantsCrees = await Categorie.create(
                categoriesEnfantsData
            );
            console.log(
                `${categoriesEnfantsCrees.length} catégories enfants insérées.`
            );

            const categoriesCrees = [
                ...categoriesParentesCrees,
                ...categoriesEnfantsCrees,
            ];

            console.log(
                `Total de ${categoriesCrees.length} catégories insérées.`
            );
            return categoriesCrees;
        } catch (error) {
            console.error('Erreur lors du peuplement des catégories :', error);
            throw error;
        }
    },

    /**
     * Vider la table des catégories
     */
    async vider() {
        try {
            await Categorie.deleteMany();
            console.log('Toutes les catégories ont été supprimées.');
        } catch (error) {
            console.error(
                'Erreur lors de la suppression des catégories :',
                error
            );
            throw error;
        }
    },
};

export default categorieSeeder;
