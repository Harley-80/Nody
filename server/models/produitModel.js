// Importation de mongoose pour la gestion de la base de données MongoDB
import mongoose from 'mongoose';

// Définition du schéma pour les produits
const produitSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom du produit est requis'],
            trim: true,
            maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères'],
        },
        description: {
            type: String,
            required: [true, 'La description du produit est requise'],
            maxlength: [
                2000,
                'La description ne peut pas dépasser 2000 caractères',
            ],
        },
        prix: {
            type: Number,
            required: [true, 'Le prix du produit est requis'],
            min: [0, 'Le prix ne peut pas être négatif'],
        },
        prixComparaison: {
            type: Number,
            min: [0, 'Le prix de comparaison ne peut pas être négatif'],
        },
        cout: {
            type: Number,
            min: [0, 'Le coût ne peut pas être négatif'],
        },
        sku: {
            type: String,
            unique: true,
            sparse: true,
        },
        codeBarres: {
            type: String,
            unique: true,
            sparse: true,
        },
        quantite: {
            type: Number,
            required: [true, 'La quantité est requise'],
            min: [0, 'La quantité ne peut pas être négative'],
            default: 0,
        },
        seuilStockFaible: {
            type: Number,
            default: 5,
            min: [0, 'Le seuil de stock faible ne peut pas être négatif'],
        },
        poids: {
            type: Number,
            min: [0, 'Le poids ne peut pas être négatif'],
        },
        dimensions: {
            longueur: Number,
            largeur: Number,
            hauteur: Number,
        },
        categorie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Categorie',
            required: [true, 'La catégorie du produit est requise'],
        },
        sousCategorie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Categorie',
        },
        marque: {
            type: String,
            trim: true,
        },
        vendeur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
        },
        images: [
            {
                url: String,
                alt: String,
                estPrincipale: { type: Boolean, default: false },
            },
        ],
        variantes: [
            {
                nom: String,
                options: [
                    {
                        nom: String,
                        prix: Number,
                        quantite: Number,
                        sku: String,
                    },
                ],
            },
        ],
        etiquettes: [String],
        couleurs: [String],
        tailles: [String],
        materiaux: [String],
        caracteristiques: [
            {
                nom: String,
                valeur: String,
            },
        ],
        specifications: [
            {
                nom: String,
                valeur: String,
            },
        ],
        evaluations: {
            moyenne: {
                type: Number,
                default: 0,
                min: [0, 'La note moyenne ne peut pas être inférieure à 0'],
                max: [5, 'La note moyenne ne peut pas dépasser 5'],
            },
            nombre: {
                type: Number,
                default: 0,
            },
        },
        avis: [
            {
                utilisateur: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Utilisateur',
                },
                note: {
                    type: Number,
                    required: true,
                    min: 1,
                    max: 5,
                },
                commentaire: String,
                images: [String],
                estVerifie: {
                    type: Boolean,
                    default: false,
                },
                creeLe: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        seo: {
            titre: String,
            description: String,
            motsCles: [String],
        },
        estActif: {
            type: Boolean,
            default: true,
        },
        estEnVedette: {
            type: Boolean,
            default: false,
        },
        estNouveau: {
            type: Boolean,
            default: false,
        },
        estMeilleureVente: {
            type: Boolean,
            default: false,
        },
        nombreVentes: {
            type: Number,
            default: 0,
        },
        nombreVues: {
            type: Number,
            default: 0,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
        },
        meta: {
            creeLe: {
                type: Date,
                default: Date.now,
            },
            misAJourLe: {
                type: Date,
                default: Date.now,
            },
            publieLe: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual pour le statut du stock
produitSchema.virtual('statutStock').get(function () {
    if (this.quantite === 0) return 'rupture_stock';
    if (this.quantite <= this.seuilStockFaible) return 'stock_faible';
    return 'en_stock';
});

// Virtual pour le pourcentage de réduction
produitSchema.virtual('pourcentageRemise').get(function () {
    if (this.prixComparaison && this.prixComparaison > this.prix) {
        return Math.round(
            ((this.prixComparaison - this.prix) / this.prixComparaison) * 100
        );
    }
    return 0;
});

// Middleware pour générer le slug
produitSchema.pre('save', function (next) {
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

// Middleware pour mettre à jour la note moyenne
produitSchema.pre('save', function (next) {
    if (this.avis && this.avis.length > 0) {
        const total = this.avis.reduce((sum, avis) => sum + avis.note, 0);
        this.evaluations.moyenne = total / this.avis.length;
        this.evaluations.nombre = this.avis.length;
    }
    next();
});

// Index pour les recherches
produitSchema.index({ nom: 'text', description: 'text', etiquettes: 'text' });
produitSchema.index({ categorie: 1, estActif: 1 });
produitSchema.index({ prix: 1 });
produitSchema.index({ 'evaluations.moyenne': -1 });
produitSchema.index({ nombreVentes: -1 });
produitSchema.index({ creeLe: -1 });
produitSchema.index({ slug: 1 });

// Création du modèle Produit
const Produit = mongoose.model('Produit', produitSchema);

// Exportation du modèle
export default Produit;
