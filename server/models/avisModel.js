import mongoose from 'mongoose';

const avisSchema = new mongoose.Schema(
    {
        produit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Produit',
            required: [true, 'Le produit est requis'],
        },
        auteur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: [true, "L'auteur est requis"],
        },
        note: {
            type: Number,
            required: [true, 'La note est requise'],
            min: 1,
            max: 5,
        },
        titre: {
            type: String,
            trim: true,
            maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
        },
        commentaire: {
            type: String,
            required: [true, 'Le commentaire est requis'],
            trim: true,
            minlength: [
                10,
                'Le commentaire doit contenir au moins 10 caractères',
            ],
            maxlength: [
                1000,
                'Le commentaire ne peut pas dépasser 1000 caractères',
            ],
        },
        date: {
            type: Date,
            default: Date.now,
        },
        achatVerifie: {
            type: Boolean,
            default: false,
        },
        estValide: {
            type: Boolean,
            default: true,
        },
        utiles: {
            type: Number,
            default: 0,
        },
        reponseVendeur: {
            texte: String,
            date: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index
avisSchema.index({ produit: 1, auteur: 1 }, { unique: true });
avisSchema.index({ produit: 1, estValide: 1 });
avisSchema.index({ date: -1 });

export default mongoose.model('Avis', avisSchema);