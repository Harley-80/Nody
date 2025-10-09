// Seeder pour les produits
import Produit from '../../models/produitModel.js';
import { faker } from '@faker-js/faker';

/**
 * Seeder pour peupler la table des produits
 */
const produitSeeder = {
    /**
     * Peupler la table des produits avec des données fictives.
     * @param {Array} utilisateurs - La liste des utilisateurs créés.
     * @param {Array} categories - La liste des catégories créées.
     */
    async peupler(utilisateurs, categories) {
        try {
            await Produit.deleteMany();

            if (!utilisateurs || utilisateurs.length === 0) {
                throw new Error(
                    'La liste des utilisateurs est vide. Veuillez d’abord peupler les utilisateurs.'
                );
            }
            if (!categories || categories.length === 0) {
                throw new Error(
                    'La liste des catégories est vide. Veuillez d’abord peupler les catégories.'
                );
            }

            const produitsData = [];
            const NOMBRE_PRODUITS = 50;

            for (let i = 0; i < NOMBRE_PRODUITS; i++) {
                const nomProduit = faker.commerce.productName();
                produitsData.push({
                    nom: nomProduit,
                    description: faker.commerce.productDescription(),
                    prix: faker.commerce.price({ min: 10, max: 200 }),
                    categorie: faker.helpers.arrayElement(categories)._id,
                    stock: faker.number.int({ min: 0, max: 100 }),
                    // CORRECTION : Le champ 'images' attend un tableau d'objets, pas de strings.
                    // Chaque image doit être un objet avec une propriété 'url'.
                    images: [
                        {
                            url: faker.image.urlLoremFlickr({
                                category: 'fashion',
                            }),
                        },
                        {
                            url: faker.image.urlLoremFlickr({
                                category: 'technics',
                            }),
                        },
                    ],
                    createur: faker.helpers.arrayElement(utilisateurs)._id,
                    // Ajoutez d'autres champs selon votre modèle
                });
            }

            // Remplacer insertMany par une boucle de create pour déclencher les hooks (comme la génération du slug)
            const produitsCrees = [];
            for (const data of produitsData) {
                const produit = await Produit.create(data);
                produitsCrees.push(produit);
            }

            console.log(`${produitsCrees.length} produits insérés.`);
            return produitsCrees;
        } catch (error) {
            console.error('Erreur lors du peuplement des produits :', error);
            throw error;
        }
    },

    /**
     * Vider la table des produits
     */
    async vider() {
        try {
            await Produit.deleteMany();
            console.log('Tous les produits ont été supprimés.');
        } catch (error) {
            console.error(
                'Erreur lors de la suppression des produits :',
                error
            );
            throw error;
        }
    },
};

export default produitSeeder;
