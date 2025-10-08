// models/categorieModel.js
import mongoose from 'mongoose';
import slugify from 'slugify';

const categorieSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom de la catégorie est requis'],
            trim: true,
            maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
        },
        slug: {
            type: String,
            lowercase: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [
                500,
                'La description ne peut pas dépasser 500 caractères',
            ],
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Categorie',
            default: null,
        },
        ancetres: [
            {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Categorie',
                },
                nom: String,
                slug: String,
            },
        ],
        niveau: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Génération automatique du slug avant sauvegarde
categorieSchema.pre('save', async function (next) {
    try {
        if (this.isModified('nom') || !this.slug) {
            const baseSlug = slugify(this.nom, {
                lower: true,
                strict: true,
                locale: 'fr',
            });
            let slug = baseSlug;
            let suffix = 0;
            // Assure un slug unique
            while (
                await this.constructor.exists({ slug, _id: { $ne: this._id } })
            ) {
                suffix++;
                slug = `${baseSlug}-${suffix}`;
            }
            this.slug = slug;
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Index pour optimiser les recherches par parent et niveau
categorieSchema.index({ slug: 1 }, { unique: true }); // Slug doit être globalement unique
categorieSchema.index({ parent: 1 });
categorieSchema.index({ niveau: 1 });

const Categorie = mongoose.model('Categorie', categorieSchema);

export default Categorie;
