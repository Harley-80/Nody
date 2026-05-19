import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import mongoosePaginate from 'mongoose-paginate-v2';
import { ROLES } from '../constants/roles.js';

// SCHÉMA UTILISATEUR 
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
                    if (!v) return true;
                    return /^\+\d{1,15}$/.test(v);
                },
                message: 'Le format du téléphone doit être E.164',
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
            enum: ['en_attente', 'verifie', 'rejete', 'approuve'],
            default: 'en_attente',
        },
        dateVerification: {
            type: Date,
        },
        raisonRejet: {
            type: String,
        },
        // Champs spécifiques aux vendeurs (Boutique)
        boutique: {
            nomBoutique: String,
            descriptionBoutique: String,
            siteWeb: String,
            logo: String,
            banniere: String,
            politiqueRetour: String,
            conditionsVente: String,
        },
        // CHAMPS : SYSTÈME DE CRÉDITS BANNIÈRES (POUR VENDEURS)
        creditsBannieres: {
            type: Number,
            default: 5,
            min: [0, 'Les crédits ne peuvent pas être négatifs'],
            validate: {
                validator: Number.isInteger,
                message: 'Les crédits doivent être un nombre entier',
            },
        },
        historiqueCredits: [
            {
                type: {
                    type: String,
                    enum: ['credit', 'debit', 'bonus', 'penalite'],
                    required: true,
                },
                montant: {
                    type: Number,
                    required: true,
                },
                raison: {
                    type: String,
                    required: true,
                },
                banniereId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Banniere',
                },
                soldeApres: {
                    type: Number,
                    required: true,
                },
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        statistiquesBannieres: {
            totalBannieresCreees: { type: Number, default: 0 },
            bannieresApprouvees: { type: Number, default: 0 },
            bannieresRejetees: { type: Number, default: 0 },
            totalVentesAttribuees: { type: Number, default: 0 },
            montantTotalVentes: { type: Number, default: 0 },
            dernierBonusVentes: { type: Date },
        },
        // CHAMPS : DÉLÉGATION DE RÔLE MARKETING (POUR MODÉRATEURS)
        roleEtendu: {
            type: String,
            enum: ['', 'moderateur_marketing'],
            default: '',
        },
        delegationPar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
        },
        dateDelegation: {
            type: Date,
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
            newsletter: { type: Boolean, default: true },
            marketing: { type: Boolean, default: false },
            notifications: { type: Boolean, default: true },
            langue: { type: String, default: 'fr' },
            devise: { type: String, default: 'XOF' },
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
        dateInscription: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
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

// INDEXES 
utilisateurSchema.index({ email: 1 });
utilisateurSchema.index({ role: 1 });
utilisateurSchema.index({ 'adresses.pays': 1 });
utilisateurSchema.index({ createdAt: -1 });
utilisateurSchema.index({ role: 1, statutVerification: 1 });
utilisateurSchema.plugin(mongoosePaginate);

// MIDDLEWARES PRÉ-ENREGISTRER

// Hachage du mot de passe
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

// Nettoyage téléphone et Crédits initiaux
utilisateurSchema.pre('save', function (next) {
    // Téléphone
    if (this.telephone && this.isModified('telephone')) {
        this.telephone = this.telephone.replace(/[\s\-\(\)\.]/g, '');
    }

    // Crédits vendeurs à l'inscription
    if (
        this.isNew &&
        this.role === ROLES.VENDEUR &&
        (this.creditsBannieres === undefined || this.creditsBannieres === 5)
    ) {
        this.creditsBannieres = 5;
    }
    next();
});

// MÉTHODES D'INSTANCE 
utilisateurSchema.methods.comparerMotDePasse = async function (
    motDePasseCandidat
) {
    return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

// Gestion des connexions
utilisateurSchema.methods.incrementerNombreConnexions = function () {
    this.nombreConnexions += 1;
    this.derniereConnexion = new Date();
    return this.save();
};

// Vérification du compte
utilisateurSchema.methods.estVerifie = function () {
    if (this.role === ROLES.CLIENT) {
        return this.emailVerifie;
    } else {
        return this.statutVerification === 'verifie' && this.emailVerifie;
    }
};

// Gestion des crédits
utilisateurSchema.methods.crediterPoints = async function (
    montant,
    raison,
    banniereId = null
) {
    this.creditsBannieres += montant;
    this.historiqueCredits.push({
        type: 'credit',
        montant,
        raison,
        banniereId,
        soldeApres: this.creditsBannieres,
    });
    return await this.save();
};

// Débiter des points avec vérification de solde
utilisateurSchema.methods.debiterPoints = async function (
    montant,
    raison,
    banniereId = null
) {
    if (this.creditsBannieres < montant) {
        throw new Error('Crédits insuffisants');
    }
    this.creditsBannieres -= montant;
    this.historiqueCredits.push({
        type: 'debit',
        montant: -montant,
        raison,
        banniereId,
        soldeApres: this.creditsBannieres,
    });
    return await this.save();
};

// Vérification de la possibilité de créer une bannière
utilisateurSchema.methods.peutCreerBanniere = function () {
    const COUT_BANNIERE = 2;
    return this.creditsBannieres >= COUT_BANNIERE;
};

// Gestion Délégation
utilisateurSchema.methods.deleguerRoleMarketing = async function (adminId) {
    if (this.role !== ROLES.MODERATEUR && this.role !== 'moderateur') {
        throw new Error('Seul un modérateur peut recevoir cette délégation');
    }
    this.roleEtendu = 'moderateur_marketing';
    this.delegationPar = adminId;
    this.dateDelegation = Date.now();
    return await this.save();
};

// Révocation de la délégation
utilisateurSchema.methods.revoquerDelegation = async function () {
    this.roleEtendu = '';
    this.delegationPar = null;
    this.dateDelegation = null;
    return await this.save();
};

// VIRTUELS 
utilisateurSchema.virtual('nomComplet').get(function () {
    return `${this.nom} ${this.prenom}`;
});

// Affichage du nom de la boutique pour les vendeurs, sinon le nom complet
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

// MODÈLE
const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);

export default Utilisateur;