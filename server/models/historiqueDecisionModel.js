import mongoose from 'mongoose';

// Schéma pour l'historique des décisions administratives
const historiqueDecisionSchema = new mongoose.Schema(
    {
        utilisateurCible: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: true,
        },
        emailUtilisateurCible: {
            type: String,
            required: true,
        },
        roleUtilisateurCible: {
            type: String,
            required: true,
        },
        adminDecision: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: true,
        },
        emailAdminDecision: {
            type: String,
            required: true,
        },
        typeDecision: {
            type: String,
            enum: ['approbation', 'rejet', 'suspension', 'activation'],
            required: true,
        },
        ancienStatut: String,
        nouveauStatut: String,
        raison: String,
        details: mongoose.Schema.Types.Mixed,
        ipAddress: String,
        userAgent: String,
        dateDecision: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index pour optimiser les recherches
historiqueDecisionSchema.index({ utilisateurCible: 1 });
historiqueDecisionSchema.index({ adminDecision: 1 });
historiqueDecisionSchema.index({ typeDecision: 1 });
historiqueDecisionSchema.index({ dateDecision: -1 });
historiqueDecisionSchema.index({ emailUtilisateurCible: 1 });

// Méthode statique pour logger une décision
historiqueDecisionSchema.statics.loggerDecision = async function (data) {
    return await this.create(data);
};

// Méthode pour obtenir l'historique d'un utilisateur
historiqueDecisionSchema.statics.obtenirHistoriqueUtilisateur = async function (
    utilisateurId
) {
    return await this.find({ utilisateurCible: utilisateurId })
        .populate('adminDecision', 'nom prenom email')
        .sort({ dateDecision: -1 });
};

const HistoriqueDecision = mongoose.model(
    'HistoriqueDecision',
    historiqueDecisionSchema
);

export default HistoriqueDecision;
