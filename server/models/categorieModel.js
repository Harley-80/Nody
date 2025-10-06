// Importation de mongoose pour la gestion de la base de données MongoDB
import mongoose from 'mongoose';

// Définition du schéma pour les catégories
const categorieSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom de la catégorie est requis'],
            trim: true,
            maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Categorie',
            default: null,
        },
        slug: {
            type: String,
            lowercase: true,
        },
        description: {
            type: String,
            maxlength: [
                500,
                'La description ne peut pas dépasser 500 caractères',
            ],
        },
        image: {
            type: String,
            default: '',
        },
        estActif: {
            type: Boolean,
            default: true,
        },
        ordre: {
            type: Number,
            default: 0,
        },
        enVedette: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual pour les sous-catégories
categorieSchema.virtual('sousCategories', {
    ref: 'Categorie',
    localField: '_id',
    foreignField: 'parent',
});

// Virtual pour le chemin complet de la catégorie
categorieSchema.virtual('chemin').get(function () {
    return this.parent ? `${this.parent.chemin} > ${this.nom}` : this.nom;
});

// Middleware pour générer le slug avant la sauvegarde
categorieSchema.pre('save', function (next) {
    if (this.isModified('nom')) {
        this.slug = this.nom
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
    next();
});

// Index pour améliorer les performances des requêtes
categorieSchema.index({ nom: 1, parent: 1 }, { unique: true });
categorieSchema.index({ parent: 1 });
categorieSchema.index({ slug: 1 });
categorieSchema.index({ estActif: 1 });

// Création du modèle Categorie
const Categorie = mongoose.model('Categorie', categorieSchema);

// Exportation du modèle
export default Categorie;
