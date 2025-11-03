// Importation des modules nécessaires
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/roles.js';

// Définition du schéma pour les utilisateurs
const utilisateurSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom est requis'],
            trim: true,
            maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
        },
        prenom: {
            type: String,
            required: [true, 'Le prénom est requis'],
            trim: true,
            maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
        },
        email: {
            type: String,
            required: [true, "L'email est requis"],
            lowercase: true,
            trim: true,
            unique: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Veuillez entrer un email valide',
            ],
        },
        motDePasse: {
            type: String,
            required: [true, 'Le mot de passe est requis'],
            minlength: [
                6,
                'Le mot de passe doit contenir au moins 6 caractères',
            ],
            select: false,
        },
        telephone: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    if (!v) return true; // Téléphone optionnel
                    return /^\+\d{1,15}$/.test(v);
                },
                message:
                    'Le format du téléphone doit être E.164 (ex: +221771234567)',
            },
        },
        genre: {
            type: String,
            enum: ['Homme', 'Femme'],
            required: [true, 'Le genre est requis'],
        },
        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.CLIENT,
            required: true,
        },
        statutVerification: {
            type: String,
            enum: ['en_attente', 'verifie', 'rejete', 'en_revision'],
            default: 'en_attente',
        },
        dateVerification: {
            type: Date,
        },
        raisonRejet: {
            type: String,
        },
        // Champs spécifiques aux vendeurs
        boutique: {
            nomBoutique: String,
            descriptionBoutique: String,
            siteWeb: String,
            logo: String,
            banniere: String,
            politiqueRetour: String,
            conditionsVente: String,
        },
        // Documents de vérification (pour vendeurs et modérateurs)
        documents: [
            {
                type: {
                    type: String,
                    enum: [
                        'piece_identite',
                        'justificatif_domicile',
                        'registre_commerce',
                        'autre',
                    ],
                },
                url: String,
                nomFichier: String,
                dateUpload: {
                    type: Date,
                    default: Date.now,
                },
                statut: {
                    type: String,
                    enum: ['en_attente', 'approuve', 'rejete'],
                    default: 'en_attente',
                },
            },
        ],
        // Informations de contact professionnel
        contactProfessionnel: {
            adresse: {
                rue: String,
                ville: String,
                codePostal: String,
                pays: String,
            },
            telephonePro: String,
            emailPro: String,
        },
        avatar: {
            type: String,
            default: '',
        },
        dateNaissance: {
            type: Date,
        },
        adresses: [
            {
                type: {
                    type: String,
                    enum: ['domicile', 'travail', 'autre'],
                    default: 'domicile',
                },
                rue: String,
                ville: String,
                pays: {
                    type: String,
                    default: '',
                },
                codePostal: String,
                estParDefaut: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        preferences: {
            newsletter: {
                type: Boolean,
                default: true,
            },
            marketing: {
                type: Boolean,
                default: false,
            },
            notifications: {
                type: Boolean,
                default: true,
            },
            langue: {
                type: String,
                default: 'fr',
            },
            devise: {
                type: String,
                default: 'XOF',
            },
        },
        profilsSociaux: {
            google: String,
            facebook: String,
            twitter: String,
        },
        listeSouhaits: [
            {
                produit: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Produit',
                },
                ajouteLe: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        panier: [
            {
                produit: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Produit',
                },
                quantite: {
                    type: Number,
                    default: 1,
                    min: [1, 'La quantité doit être au moins 1'],
                },
                variante: mongoose.Schema.Types.Mixed,
                ajouteLe: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        historiqueCommandes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Commande',
            },
        ],
        pointsFidelite: {
            type: Number,
            default: 0,
            min: [0, 'Les points de fidélité ne peuvent pas être négatifs'],
        },
        emailVerifie: {
            type: Boolean,
            default: false,
        },
        telephoneVerifie: {
            type: Boolean,
            default: false,
        },
        estActif: {
            type: Boolean,
            default: true,
        },
        derniereConnexion: {
            type: Date,
        },
        nombreConnexions: {
            type: Number,
            default: 0,
        },
        jetonReinitialisationMotDePasse: String,
        expirationJetonReinitialisationMotDePasse: Date,
        jetonVerificationEmail: String,
        expirationJetonVerificationEmail: Date,
        // Champs pour l'invitation
        codeInvitation: String,
        invitePar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
        },
        dateInscription: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.motDePasse;
                delete ret.jetonReinitialisationMotDePasse;
                delete ret.expirationJetonReinitialisationMotDePasse;
                delete ret.jetonVerificationEmail;
                delete ret.expirationJetonVerificationEmail;
                return ret;
            },
        },
    }
);

// Index pour améliorer les performances
utilisateurSchema.index({ email: 1 });
utilisateurSchema.index({ role: 1 });
utilisateurSchema.index({ 'adresses.pays': 1 });
utilisateurSchema.index({ createdAt: -1 });
utilisateurSchema.index({ role: 1, statutVerification: 1 });

// Middleware pour hacher le mot de passe avant la sauvegarde
utilisateurSchema.pre('save', async function (next) {
    if (!this.isModified('motDePasse')) return next();

    try {
        const sel = await bcrypt.genSalt(12);
        this.motDePasse = await bcrypt.hash(this.motDePasse, sel);
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware pour nettoyer le téléphone avant sauvegarde
utilisateurSchema.pre('save', function (next) {
    if (this.telephone && this.isModified('telephone')) {
        this.telephone = this.telephone.replace(/[\s\-\(\)\.]/g, '');
    }
    next();
});

// Méthode pour comparer les mots de passe
utilisateurSchema.methods.comparerMotDePasse = async function (
    motDePasseCandidat
) {
    return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

// Méthode pour incrémenter le compteur de connexions
utilisateurSchema.methods.incrementerNombreConnexions = function () {
    this.nombreConnexions += 1;
    this.derniereConnexion = new Date();
    return this.save();
};

// Méthode pour vérifier si l'utilisateur est vérifié selon son rôle
utilisateurSchema.methods.estVerifie = function () {
    if (this.role === ROLES.CLIENT) {
        return this.emailVerifie;
    } else {
        return this.statutVerification === 'verifie' && this.emailVerifie;
    }
};

// Méthode pour obtenir les permissions de l'utilisateur
utilisateurSchema.methods.obtenirPermissions = function () {
    const { PERMISSIONS } = require('../constants/roles');
    return PERMISSIONS[this.role] || [];
};

// Virtual pour le nom complet
utilisateurSchema.virtual('nomComplet').get(function () {
    return `${this.nom} ${this.prenom}`;
});

// Virtual pour le nom de la boutique (si vendeur)
utilisateurSchema.virtual('nomBoutiqueAffichage').get(function () {
    if (
        this.role === ROLES.VENDEUR &&
        this.boutique &&
        this.boutique.nomBoutique
    ) {
        return this.boutique.nomBoutique;
    }
    return this.nomComplet;
});

// Création du modèle Utilisateur
const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);

// Exportation du modèle
export default Utilisateur;
