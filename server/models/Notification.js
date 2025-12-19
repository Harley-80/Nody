import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                'commande',
                'paiement',
                'utilisateur',
                'systeme',
                'demande',
                'validation_produit',
                'validation_vendeur',
                'signalement',
                'message',
                'alerte',
                'avis',
                'stock',
            ],
            required: true,
            default: 'systeme',
        },
        titre: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        lue: {
            type: Boolean,
            default: false,
        },
        utilisateurId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: true,
        },
        donneesSupplementaires: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        priorite: {
            type: String,
            enum: ['basse', 'normale', 'haute', 'urgente'],
            default: 'normale',
        },
    },
    {
        timestamps: true,
    }
);

// Index pour améliorer les performances
notificationSchema.index({ lue: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ utilisateurId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;