// Importation de mongoose pour la gestion de la base de données MongoDB
import mongoose from 'mongoose';

// Définition du schéma pour les paiements
const paiementSchema = new mongoose.Schema(
    {
        commande: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Commande',
            required: [true, 'La commande est requise'],
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: [true, 'Le client est requis'],
        },
        montant: {
            type: Number,
            required: [true, 'Le montant est requis'],
            min: [0, 'Le montant ne peut pas être négatif'],
        },
        devise: {
            type: String,
            enum: ['XOF', 'XAF', 'EUR'],
            default: 'XOF',
            uppercase: true,
        },
        methodePaiement: {
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
        passerellePaiement: {
            type: String,
            enum: [
                'stripe',
                'paypal',
                'banque',
                'espece',
                'wave',
                'orange_money',
                'airtel_money',
                'mobicash',
            ],
            required: [true, 'La passerelle de paiement est requise'],
        },
        statut: {
            type: String,
            enum: [
                'en_attente',
                'en_cours',
                'autorise',
                'termine',
                'echoue',
                'annule',
                'rembourse',
                'partiellement_rembourse',
            ],
            default: 'en_attente',
        },
        idTransaction: {
            type: String,
            unique: true,
            sparse: true,
        },
        reponsePasserelle: mongoose.Schema.Types.Mixed,
        remboursements: [
            {
                montant: {
                    type: Number,
                    required: true,
                    min: [
                        0,
                        'Le montant du remboursement ne peut pas être négatif',
                    ],
                },
                raison: String,
                traiteLe: {
                    type: Date,
                    default: Date.now,
                },
                traitePar: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Utilisateur',
                },
                idRemboursementPasserelle: String,
            },
        ],
        detailsFacturation: {
            prenom: String,
            nom: String,
            email: String,
            telephone: String,
            adresse: {
                rue: String,
                ville: String,
                pays: String,
                codePostal: String,
            },
        },
        detailsCarte: {
            derniersChiffres: String,
            marque: String,
            moisExpiration: Number,
            anneeExpiration: Number,
            pays: String,
        },
        verificationFraude: {
            score: {
                type: Number,
                default: 0,
                min: [0, 'Le score de fraude ne peut pas être négatif'],
            },
            details: mongoose.Schema.Types.Mixed,
            estSignale: {
                type: Boolean,
                default: false,
            },
        },
        metadonnees: mongoose.Schema.Types.Mixed,
        adresseIP: String,
        userAgent: String,
        messageErreur: String,
        nombreTentatives: {
            type: Number,
            default: 0,
            min: [0, 'Le nombre de tentatives ne peut pas être négatif'],
        },
        prochaineTentativeLe: Date,
        estTest: {
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

// Virtual pour le montant total remboursé
paiementSchema.virtual('montantTotalRembourse').get(function () {
    return this.remboursements.reduce(
        (total, remboursement) => total + remboursement.montant,
        0
    );
});

// Virtual pour vérifier si le paiement est complètement remboursé
paiementSchema.virtual('estEntierementRembourse').get(function () {
    return this.montantTotalRembourse >= this.montant;
});

// Index pour les recherches
paiementSchema.index({ idTransaction: 1 });
paiementSchema.index({ commande: 1 });
paiementSchema.index({ client: 1 });
paiementSchema.index({ statut: 1 });
paiementSchema.index({ methodePaiement: 1 });
paiementSchema.index({ creeLe: -1 });
paiementSchema.index({ 'detailsFacturation.email': 1 });

// Création du modèle Paiement
const Paiement = mongoose.model('Paiement', paiementSchema);

// Exportation du modèle
export default Paiement;
