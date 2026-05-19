import mongoose from 'mongoose';

const suiviSchema = new mongoose.Schema(
    {
        // Cookie unique
        cookieSuiviId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Bannière cliquée
        banniere: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Banniere',
            required: true,
            index: true,
        },

        // Vendeur de la bannière
        vendeur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: true,
            index: true,
        },

        // Client qui a cliqué (optionnel si non connecté)
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
        },

        // IP du client (pour suivi anonyme)
        ipClient: {
            type: String,
        },

        // Agent utilisateur
        userAgent: {
            type: String,
        },

        // Date d'expiration du cookie (7 jours après le clic)
        dateExpiration: {
            type: Date,
            required: true,
            index: true,
            default: function () {
                return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 jours
            },
        },

        // Statut
        estActif: {
            type: Boolean,
            default: true,
            index: true,
        },

        // Conversion (si le client a acheté)
        conversion: {
            aConverti: {
                type: Boolean,
                default: false,
            },
            commande: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Commande',
            },
            montantFCFA: {
                type: Number,
            },
            dateConversion: {
                type: Date,
            },
        },

        // Métadonnées
        source: {
            type: String,
            enum: ['web', 'mobile', 'app'],
            default: 'web',
        },

        page: {
            type: String, // Page où la bannière était affichée
        },
    },
    {
        timestamps: true,
    }
);

// INDEX COMPOSITES
// Index pour retrouver rapidement les suivis actifs d'un client
suiviSchema.index({ client: 1, estActif: 1, dateExpiration: 1 });

// Index pour les cookies expirés à nettoyer
suiviSchema.index({ dateExpiration: 1, estActif: 1 });

// Index pour les conversions
suiviSchema.index({ 'conversion.aConverti': 1, vendeur: 1 });

// VIRTUELS

// Virtual pour vérifier si le cookie est encore valide
suiviSchema.virtual('estValide').get(function () {
    const maintenant = new Date();
    return this.estActif && maintenant < this.dateExpiration;
});

// Virtual pour le temps restant (en jours)
suiviSchema.virtual('joursRestants').get(function () {
    if (!this.estValide) return 0;

    const maintenant = new Date();
    const difference = this.dateExpiration - maintenant;
    const jours = Math.ceil(difference / (1000 * 60 * 60 * 24));

    return jours > 0 ? jours : 0;
});

// MÉTHODES D'INSTANCE
/**
 * Enregistrer une conversion (vente attribuée)
 */
suiviSchema.methods.enregistrerConversion = async function (
    commandeId,
    montantFCFA
) {
    if (this.conversion.aConverti) {
        throw new Error('Ce suivi a déjà une conversion enregistrée');
    }

    if (!this.estValide) {
        throw new Error('Cookie expiré, conversion non attribuable');
    }

    this.conversion = {
        aConverti: true,
        commande: commandeId,
        montantFCFA,
        dateConversion: new Date(),
    };

    this.estActif = false; // Désactiver le suivi après conversion

    await this.save();

    return {
        succes: true,
        message: 'Conversion enregistrée',
        montant: montantFCFA,
    };
};

/**
 * Désactiver le cookie
 */
suiviSchema.methods.desactiver = async function (raison = 'Expiré') {
    this.estActif = false;
    await this.save();

    return {
        succes: true,
        message: `Cookie désactivé: ${raison}`,
    };
};

// MÉTHODES STATIQUES
/**
 * Créer un nouveau suivi avec cookie unique
 */
suiviSchema.statics.creerSuivi = async function (data) {
    const { banniereId, vendeurId, clientId, ipClient, userAgent, page } = data;

    // Générer un cookieSuivi unique
    const cookieSuivi = `suivi_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const suivi = await this.create({
        cookieSuiviId: cookieSuivi,
        banniere: banniereId,
        vendeur: vendeurId,
        client: clientId,
        ipClient,
        userAgent,
        page,
        dateExpiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
    });

    return {
        succes: true,
        cookieSuivi,
        suivi,
    };
};

/**
 * Récupérer le suivi actif d'un client pour un vendeur
 */
suiviSchema.statics.obtenirSuiviActif = async function (
    clientIdOrIP,
    vendeurId
) {
    const query = {
        $or: [{ client: clientIdOrIP }, { ipClient: clientIdOrIP }],
        vendeur: vendeurId,
        estActif: true,
        dateExpiration: { $gt: new Date() },
    };

    return await this.findOne(query).populate('banniere vendeur');
};

/**
 * Nettoyer les suivis expirés
 */
suiviSchema.statics.nettoyerExpires = async function () {
    const maintenant = new Date();

    const result = await this.updateMany(
        {
            dateExpiration: { $lt: maintenant },
            estActif: true,
            'conversion.aConverti': false,
        },
        {
            $set: { estActif: false },
        }
    );

    return {
        succes: true,
        nbDesactives: result.modifiedCount,
        message: `${result.modifiedCount} suivis expirés désactivés`,
    };
};

/**
 * Obtenir les statistiques de conversion pour un vendeur
 */
suiviSchema.statics.obtenirStatsConversion = async function (
    vendeurId,
    dateDebut,
    dateFin
) {
    const query = {
        vendeur: vendeurId,
        'conversion.aConverti': true,
    };

    if (dateDebut) {
        query['conversion.dateConversion'] = { $gte: dateDebut };
    }

    if (dateFin) {
        if (!query['conversion.dateConversion']) {
            query['conversion.dateConversion'] = {};
        }
        query['conversion.dateConversion'].$lte = dateFin;
    }

    const suivis = await this.find(query);

    const stats = {
        totalConversions: suivis.length,
        montantTotal: suivis.reduce(
            (total, s) => total + (s.conversion.montantFCFA || 0),
            0
        ),
        montantMoyen: 0,
    };

    if (stats.totalConversions > 0) {
        stats.montantMoyen = Math.round(
            stats.montantTotal / stats.totalConversions
        );
    }

    return stats;
};

// MIDDLEWARE PRÉ-ENREGISTRER
suiviSchema.pre('save', function (next) {
    // Vérifier que la date d'expiration est dans le futur
    if (this.isNew && this.dateExpiration <= new Date()) {
        return next(new Error("La date d'expiration doit être dans le futur"));
    }

    next();
});

// OPTIONS DE SÉRIALISATION
suiviSchema.set('toJSON', { virtuals: true });
suiviSchema.set('toObject', { virtuals: true });

export default mongoose.model('Suivi', suiviSchema);