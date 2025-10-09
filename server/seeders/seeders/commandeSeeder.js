// Seeder pour les commandes
import Commande from '../../models/commandeModel.js';
import { faker } from '@faker-js/faker';

/**
 * Seeder pour peupler la table des commandes
 */
const commandeSeeder = {
    /**
     * Peupler la table des commandes avec des données fictives.
     * @param {Array} utilisateurs - La liste des utilisateurs créés.
     * @param {Array} produits - La liste des produits créés.
     */
    async peupler(utilisateurs, produits) {
        try {
            await Commande.deleteMany();

            if (!utilisateurs || utilisateurs.length === 0) {
                throw new Error(
                    'La liste des utilisateurs est vide. Veuillez d’abord peupler les utilisateurs.'
                );
            }
            if (!produits || produits.length === 0) {
                throw new Error(
                    'La liste des produits est vide. Veuillez d’abord peupler les produits.'
                );
            }

            const commandesData = [];
            const NOMBRE_COMMANDES = 40;

            // CORRECTION : Utiliser des valeurs valides pour les enums
            // Alignement complet avec le modèle commandeModel.js
            const statutsValides = [
                'en_attente',
                'confirme',
                'en_cours',
                'expédie',
                'livré',
                'annulé',
            ];
            const methodesPaiementValides = [
                'carte_credit',
                'paypal',
                'stripe',
                'virement_bancaire',
                'paiement_livraison',
                'wave',
                'orange_money',
                'airtel_money',
                'mobicash',
                'cheque',
            ];

            for (let i = 0; i < NOMBRE_COMMANDES; i++) {
                const articlesCommandes = faker.helpers
                    .arrayElements(produits, { min: 1, max: 4 })
                    .map(p => ({
                        produit: p._id,
                        nom: p.nom,
                        quantite: faker.number.int({ min: 1, max: 3 }),
                        prix: p.prix,
                        image: p.images[0]?.url || '',
                    }));

                const sousTotal = articlesCommandes.reduce(
                    (acc, item) => acc + item.quantite * item.prix,
                    0
                );
                const fraisLivraison = faker.number.float({
                    min: 5,
                    max: 20,
                    precision: 0.01,
                });

                commandesData.push({
                    // CORRECTION : Fournir un client
                    client: faker.helpers.arrayElement(utilisateurs)._id,
                    articles: articlesCommandes,
                    adresseLivraison: {
                        adresse: faker.location.streetAddress(),
                        ville: faker.location.city(),
                        codePostal: faker.location.zipCode(),
                        pays: faker.location.country(),
                    },
                    // CORRECTION : Fournir une méthode de paiement
                    paiement: {
                        methode: faker.helpers.arrayElement(
                            methodesPaiementValides
                        ),
                        statut: 'paye',
                    },
                    sousTotal: parseFloat(sousTotal.toFixed(2)),
                    total: parseFloat((sousTotal + fraisLivraison).toFixed(2)),
                    livraison: fraisLivraison,
                    // CORRECTION : Utiliser une valeur d'enum valide
                    statut: faker.helpers.arrayElement(statutsValides),
                });
            }

            const commandesCrees = await Commande.create(commandesData);

            console.log(`${commandesCrees.length} commandes insérées.`);
            return commandesCrees;
        } catch (error) {
            console.error('Erreur lors du peuplement des commandes :', error);
            throw error;
        }
    },

    /**
     * Vider la table des commandes
     */
    async vider() {
        try {
            await Commande.deleteMany();
            console.log('Toutes les commandes ont été supprimées.');
        } catch (error) {
            console.error(
                'Erreur lors de la suppression des commandes :',
                error
            );
            throw error;
        }
    },
};

export default commandeSeeder;
