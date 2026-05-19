import mongoose from 'mongoose';

const banniereSchema = new mongoose.Schema(
    {
        // Informations principales
        titre: {
            type: String,
            required: [true, 'Le titre est requis'],
            trim: true,
            maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
        },
        sousTitre: {
            type: String,
            trim: true,
            maxlength: [
                150,
                'Le sous-titre ne peut pas dépasser 150 caractères',
            ],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [
                500,
                'La description ne peut pas dépasser 500 caractères',
            ],
        },

        // Média
        image: {
            type: String,
            required: [true, "L'image est requise"],
        },
        imageMobile: {
            type: String, // Image optimisée pour mobile (optionnel)
        },

        // Appel à l'action
        lien: {
            type: String,
            trim: true,
        },
        texteBouton: {
            type: String,
            trim: true,
            default: 'Découvrir',
            maxlength: [
                30,
                'Le texte du bouton ne peut pas dépasser 30 caractères',
            ],
        },

        // Configuration d'affichage
        type: {
            type: String,
            enum: ['hero', 'promo', 'pub'],
            default: 'hero',
            required: true,
        },
        position: {
            type: String,
            enum: ['haut', 'milieu', 'bas', 'sidebar'],
            default: 'haut',
        },
        ordre: {
            type: Number,
            default: 0,
        },
        alignement: {
            type: String,
            enum: ['left', 'center', 'right'],
            default: 'center',
        },

        // Statut et planification
        estActif: {
            type: Boolean,
            default: true,
        },
        dateDebut: {
            type: Date,
            default: Date.now,
        },
        dateFin: {
            type: Date,
        },

        // Ciblage
        cible: {
            type: String,
            enum: ['tous', 'clients', 'nouveaux', 'vendeurs'],
            default: 'tous',
        },
        categories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Categorie',
            },
        ],

        // Analyses de base
        nombreVues: {
            type: Number,
            default: 0,
        },
        nombreClics: {
            type: Number,
            default: 0,
        },

        // Métadonnées & Validation
        creePar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: true,
        },
        modifiePar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
        },
        statut: {
            type: String,
            enum: ['en_attente', 'approuve', 'rejete', 'expire'],
            default: 'en_attente',
        },
        raisonRejet: {
            type: String,
        },

        // SYSTÈME DE CRÉDITS ET VENTES (AJOUTS)
        coutCredits: {
            type: Number,
            default: 2,
            min: [0, 'Le coût ne peut pas être négatif'],
            validate: {
                validator: Number.isInteger,
                message: 'Le coût doit être un nombre entier',
            },
        },
        // Tracking des ventes attribuées à cette bannière
        ventesAttribuees: [
            {
                commande: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Commande',
                },
                client: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Utilisateur',
                },
                montantFCFA: {
                    type: Number,
                    required: true,
                },
                dateVente: {
                    type: Date,
                    default: Date.now,
                },
                cookieSuiviId: {
                    type: String, // ID du cookie qui a permis l'attribution
                },
            },
        ],

        // Gestion de l'expiration automatique (30 jours après création)
        dateExpiration: {
            type: Date,
            default: function () {
                // Par défaut +30 jours si c'est un vendeur
                return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            },
        },
        estExpiree: {
            type: Boolean,
            default: false,
        },

        // Rôle étendu pour modérateur_marketing
        creationDelegue: {
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

// INDEX 
banniereSchema.index({ type: 1, estActif: 1, statut: 1 });
banniereSchema.index({ ordre: 1 });
banniereSchema.index({ dateDebut: 1, dateFin: 1 });
banniereSchema.index({ creePar: 1 });
banniereSchema.index({ dateExpiration: 1, estExpiree: 1 });
banniereSchema.index({ 'ventesAttribuees.commande': 1 });

// VIRTUELS 
banniereSchema.virtual('tauxClics').get(function () {
    if (this.nombreVues === 0) return 0;
    return ((this.nombreClics / this.nombreVues) * 100).toFixed(2);
});

// Une bannière est considérée en ligne si elle est active, approuvée, dans sa période de validité et non expirée
banniereSchema.virtual('estEnLigne').get(function () {
    const maintenant = new Date();
    const debutValide = !this.dateDebut || this.dateDebut <= maintenant;
    const finValide = !this.dateFin || this.dateFin >= maintenant;
    const nonPerimee =
        !this.dateExpiration || new Date() <= this.dateExpiration;

    // La bannière ne doit pas être marquée comme expirée
    return (
        this.estActif &&
        this.statut === 'approuve' &&
        debutValide &&
        finValide &&
        nonPerimee &&
        !this.estExpiree
    );
});

// Calcul du montant total des ventes attribuées à cette bannière
banniereSchema.virtual('montantTotalVentes').get(function () {
    if (!this.ventesAttribuees || this.ventesAttribuees.length === 0) return 0;
    return this.ventesAttribuees.reduce(
        (total, vente) => total + (vente.montantFCFA || 0),
        0
    );
});

// Nombre de ventes attribuées à cette bannière
banniereSchema.virtual('nombreVentesAttribuees').get(function () {
    return this.ventesAttribuees ? this.ventesAttribuees.length : 0;
});

// Vérifie si la bannière est périmée (date d'expiration dépassée)
banniereSchema.virtual('estPerimee').get(function () {
    if (!this.dateExpiration) return false;
    return new Date() > this.dateExpiration;
});

// Calcule le nombre de jours restants avant l'expiration de la bannière
banniereSchema.virtual('joursRestants').get(function () {
    if (!this.dateExpiration) return null;
    const difference = this.dateExpiration - new Date();
    const jours = Math.ceil(difference / (1000 * 60 * 60 * 24));
    return jours > 0 ? jours : 0;
});

//  MÉTHODES 
banniereSchema.methods.incrementerVues = async function () {
    this.nombreVues += 1;
    return await this.save();
};

// Incrémente le nombre de clics et sauvegarde la bannière
banniereSchema.methods.incrementerClics = async function () {
    this.nombreClics += 1;
    return await this.save();
};

// Attribue une vente à la bannière avec les détails de la commande, du client, du montant et du cookie de suivi
banniereSchema.methods.attribuerVente = async function (
    commandeId,
    clientId,
    montantFCFA,
    cookieId
) {
    this.ventesAttribuees.push({
        commande: commandeId,
        client: clientId,
        montantFCFA,
        cookieSuiviId: cookieId,
        dateVente: new Date(),
    });
    return await this.save();
};

// Vérifie si la bannière est périmée et met à jour son statut en conséquence
banniereSchema.methods.verifierExpiration = async function () {
    if (this.estPerimee && !this.estExpiree) {
        this.estActif = false;
        this.estExpiree = true;
        this.statut = 'expire';
        await this.save();
        return { succes: true, message: 'Bannière expirée' };
    }
    return { succes: false, joursRestants: this.joursRestants };
};

// Prolonge la date d'expiration de la bannière de X jours supplémentaires
banniereSchema.methods.prolongerExpiration = async function (
    joursSupplementaires
) {
    const baseDate = this.dateExpiration || new Date();
    const nouvelleDate = new Date(baseDate);
    nouvelleDate.setDate(nouvelleDate.getDate() + joursSupplementaires);

    this.dateExpiration = nouvelleDate;
    this.estExpiree = false;
    if (this.statut === 'expire') this.statut = 'approuve';

    return await this.save();
};

//  MIDDLEWARES PRÉ-ENREGISTRER 
banniereSchema.pre('save', async function (next) {
    if (this.isNew) {
        const Utilisateur = mongoose.model('Utilisateur');
        const utilisateur = await Utilisateur.findById(this.creePar);

        if (utilisateur) {
            // Restriction Vendeur
            if (utilisateur.role === 'vendeur' && this.type !== 'pub') {
                return next(
                    new Error(
                        'Les vendeurs ne peuvent créer que des bannières publicitaires'
                    )
                );
            }

            // Gestion moderateur_marketing
            if (utilisateur.roleEtendu === 'moderateur_marketing') {
                this.creationDelegue = true;
                this.statut = 'en_attente'; // Force validation Admin
            }

            // Gestion date d'expiration auto
            if (utilisateur.role === 'vendeur') {
                this.dateExpiration = new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                );
            } else if (utilisateur.role === 'admin') {
                this.dateExpiration = null; // Pas d'expiration pour l'admin
            }
        }
    }
    next();
});

export default mongoose.model('Banniere', banniereSchema);