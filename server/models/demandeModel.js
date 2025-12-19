// Modèle Mongoose pour l'historique des demandes de validation (produits, vendeurs, etc.)
import mongoose from 'mongoose';

const demandeSchema = new mongoose.Schema(
    {
        // Type de demande (produit ou vendeur)
        type: {
            type: String,
            enum: ['produit', 'vendeur'],
            required: true,
        },

        // ID de l'élément validé (Produit ou Utilisateur)
        elementId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'type',
        },

        // Statut de la demande
        statut: {
            type: String,
            enum: ['en_attente', 'approuve', 'rejete'],
            default: 'en_attente',
        },

        // Modérateur qui a traité la demande
        moderateurId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
        },

        // Motif en cas de rejet
        motif: {
            type: String,
            default: null,
        },

        // Date de traitement de la demande
        dateTraitement: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index pour améliorer les performances des requêtes
demandeSchema.index({ moderateurId: 1, dateTraitement: -1 });
demandeSchema.index({ statut: 1, type: 1 });

const Demande = mongoose.model('Demande', demandeSchema);

export default Demande;