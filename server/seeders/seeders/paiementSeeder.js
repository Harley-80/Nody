// Seeder pour les paiements
import Paiement from '../../models/paiementModel.js';

/**
 * Seeder pour peupler la table des paiements
 */
const paiementSeeder = {
    /**
     * Générer des données de paiements réalistes
     */
    async genererPaiements(commandes) {
        const paiements = [];
        // AMÉLIORATION : Récupérer les valeurs d'enum directement depuis le modèle
        // pour garantir la cohérence et éviter les erreurs de saisie.
        const methodes = Paiement.schema.path('methodePaiement').enumValues;
        const passerelles =
            Paiement.schema.path('passerellePaiement').enumValues;
        const statuts = Paiement.schema.path('statut').enumValues;

        for (const commande of commandes) {
            const methode =
                methodes[Math.floor(Math.random() * methodes.length)];
            const statut = statuts[Math.floor(Math.random() * statuts.length)];

            paiements.push({
                commande: commande._id,
                client: commande.client, // CORRECTION : Le champ est 'client', pas 'utilisateur'
                montant: commande.total,
                methodePaiement: methode,
                passerellePaiement:
                    passerelles[Math.floor(Math.random() * passerelles.length)], // CORRECTION : Ajout de la passerelle
                statut: statut,
                // CORRECTION : Utiliser une valeur d'enum valide
                datePaiement:
                    statut === 'termine'
                        ? new Date(commande.createdAt.getTime() + 5 * 60 * 1000)
                        : null,
                // CORRECTION : Le modèle attend idTransaction, pas transactionId
                idTransaction: `TXN${Date.now()}${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
            });
        }

        return paiements;
    },

    /**
     * Peupler la table des paiements
     */
    async peupler(commandes) {
        try {
            await Paiement.deleteMany();

            // La vérification est maintenant faite par le seeder principal
            if (!commandes || !commandes.length) {
                throw new Error(
                    'Commandes manquantes pour générer les paiements'
                );
            }

            const paiements = await this.genererPaiements(commandes);
            const paiementsCrees = await Paiement.insertMany(paiements);

            console.log(`${paiementsCrees.length} paiements insérés.`);
            return paiementsCrees;
        } catch (error) {
            console.error('Erreur lors du peuplement des paiements :', error);
            throw error;
        }
    },

    /**
     * Vider la table des paiements
     */
    async vider() {
        try {
            await Paiement.deleteMany();
            console.log('Tous les paiements ont été supprimées.');
        } catch (error) {
            console.error(
                'Erreur lors de la suppression des paiements :',
                error
            );
            throw error;
        }
    },
};

export default paiementSeeder;
