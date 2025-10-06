// Importation de mongoose pour la gestion de la base de données MongoDB
import mongoose from 'mongoose';

// Définition du schéma pour les commandes
const commandeSchema = new mongoose.Schema(
    {
        numeroCommande: {
            type: String,
            required: true,
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: [true, 'Le client est requis'],
        },
        articles: [
            {
                produit: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Produit',
                    required: [true, 'Le produit est requis'],
                },
                nom: {
                    type: String,
                    required: true,
                },
                prix: {
                    type: Number,
                    required: [true, 'Le prix est requis'],
                    min: [0, 'Le prix ne peut pas être négatif'],
                },
                quantite: {
                    type: Number,
                    required: [true, 'La quantité est requise'],
                    min: [1, 'La quantité doit être au moins 1'],
                },
                variante: mongoose.Schema.Types.Mixed,
                image: String,
                sku: String,
            },
        ],
        sousTotal: {
            type: Number,
            required: [true, 'Le sous-total est requis'],
            min: [0, 'Le sous-total ne peut pas être négatif'],
        },
        taxe: {
            type: Number,
            default: 0,
            min: [0, 'La taxe ne peut pas être négative'],
        },
        livraison: {
            type: Number,
            default: 0,
            min: [0, 'Les frais de livraison ne peuvent pas être négatifs'],
        },
        remise: {
            type: Number,
            default: 0,
            min: [0, 'La remise ne peut pas être négative'],
        },
        total: {
            type: Number,
            required: [true, 'Le total est requis'],
            min: [0, 'Le total ne peut pas être négatif'],
        },
        devise: {
            type: String,
            enum: ['XOF', 'XAF', 'EUR'],
            default: 'XOF',
            uppercase: true,
        },
        adresseLivraison: {
            prenom: String,
            nom: String,
            rue: String,
            ville: String,
            pays: String,
            codePostal: String,
            telephone: String,
        },
        adresseFacturation: {
            prenom: String,
            nom: String,
            rue: String,
            ville: String,
            pays: String,
            codePostal: String,
            telephone: String,
        },
        methodeLivraison: {
            nom: String,
            transporteur: String,
            numeroSuivi: String,
            dateLivraisonEstimee: Date,
            cout: Number,
        },
        paiement: {
            methode: {
                type: String,
                enum: [
                    'carte_credit',
                    'paypal',
                    'stripe',
                    'virement_bancaire',
                    'paiement_livraison',
                    'wave',
                    'orange_money',
                    'airtel_money',
                    'mobicash',
                ],
                required: [true, 'La méthode de paiement est requise'],
            },
            statut: {
                type: String,
                enum: [
                    'en_attente',
                    'autorise',
                    'paye',
                    'echoue',
                    'rembourse',
                    'partiellement_rembourse',
                ],
                default: 'en_attente',
            },
            idTransaction: String,
            datePaiement: Date,
            montantRemboursement: {
                type: Number,
                default: 0,
                min: [
                    0,
                    'Le montant du remboursement ne peut pas être négatif',
                ],
            },
        },
        statut: {
            type: String,
            enum: [
                'en_attente',
                'confirme',
                'en_cours',
                'expédie',
                'livré',
                'annulé',
                'retourne',
                'rembourse',
            ],
            default: 'en_attente',
        },
        historiqueStatut: [
            {
                statut: String,
                changeLe: {
                    type: Date,
                    default: Date.now,
                },
                note: String,
                changePar: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Utilisateur',
                },
            },
        ],
        notes: [
            {
                note: String,
                creeLe: {
                    type: Date,
                    default: Date.now,
                },
                creePar: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Utilisateur',
                },
                estInterne: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        notesClient: String,
        etiquettes: [String],
        metadonnees: mongoose.Schema.Types.Mixed,
        dateLivraisonEstimee: Date,
        dateLivraisonReelle: Date,
        raisonAnnulation: String,
        raisonRetour: String,
        raisonRemboursement: String,
        estCadeau: {
            type: Boolean,
            default: false,
        },
        messageCadeau: String,
        pointsFideliteGagnes: {
            type: Number,
            default: 0,
            min: [0, 'Les points de fidélité ne peuvent pas être négatifs'],
        },
        pointsFideliteUtilises: {
            type: Number,
            default: 0,
            min: [
                0,
                'Les points de fidélité utilisés ne peuvent pas être négatifs',
            ],
        },
        adresseIP: String,
        userAgent: String,
        scoreFraude: {
            type: Number,
            default: 0,
            min: [0, 'Le score de fraude ne peut pas être négatif'],
        },
        estFraude: {
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

// Virtual pour le nombre d'articles
commandeSchema.virtual('nombreArticles').get(function () {
    return this.articles.reduce(
        (total, article) => total + article.quantite,
        0
    );
});

// Virtual pour le statut de paiement
commandeSchema.virtual('estPaye').get(function () {
    return (
        this.paiement.statut === 'paye' || this.paiement.statut === 'autorise'
    );
});

// Middleware pour générer le numéro de commande avant la validation
commandeSchema.pre('validate', async function (next) {
    if (this.isNew && !this.numeroCommande) {
        const count = await mongoose.model('Commande').countDocuments();
        const date = new Date();
        const annee = date.getFullYear();
        const mois = (date.getMonth() + 1).toString().padStart(2, '0');
        const jour = date.getDate().toString().padStart(2, '0');
        this.numeroCommande = `NODY-${annee}${mois}${jour}-${(count + 1)
            .toString()
            .padStart(6, '0')}`;
    }
    next();
});

// Middleware pour mettre à jour l'historique des statuts
commandeSchema.pre('save', function (next) {
    if (this.isModified('statut')) {
        this.historiqueStatut.push({
            statut: this.statut,
            changeLe: new Date(),
            note: `Statut changé en ${this.statut}`,
        });
    }
    next();
});

// Index pour les recherches
commandeSchema.index({ numeroCommande: 1 });
commandeSchema.index({ client: 1 });
commandeSchema.index({ statut: 1 });
commandeSchema.index({ 'paiement.statut': 1 });
commandeSchema.index({ creeLe: -1 });
commandeSchema.index({ 'adresseLivraison.pays': 1 });

// Création du modèle Commande
const Commande = mongoose.model('Commande', commandeSchema);

// Exportation du modèle
export default Commande;
