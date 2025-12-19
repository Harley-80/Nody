import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Schéma pour l'historique des décisions administratives
// Ce modèle enregistre toutes les actions prises par les admins sur les demandes
const historiqueDecisionSchema = new mongoose.Schema(
    {
        // Référence vers l'utilisateur concerné par la décision
        utilisateurCible: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: true,
        },
        // Email de l'utilisateur ciblé pour traçabilité
        emailUtilisateurCible: {
            type: String,
            required: true,
        },
        // Rôle de l'utilisateur ciblé (vendeur, moderateur, etc.)
        roleUtilisateurCible: {
            type: String,
            required: true,
        },
        // Référence vers l'admin qui a pris la décision
        adminDecision: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: true,
        },
        // Email de l'admin pour traçabilité
        emailAdminDecision: {
            type: String,
            required: true,
        },
        // Type de décision prise par l'admin
        typeDecision: {
            type: String,
            enum: ['approbation', 'rejet', 'suspension', 'activation'],
            required: true,
        },
        // Statut avant la décision (ex: 'en_attente')
        ancienStatut: String,
        // Statut après la décision (ex: 'verifie', 'rejete')
        nouveauStatut: String,
        // Raison de la décision (obligatoire pour les rejets)
        raison: String,
        // Détails additionnels (boutique, documents, etc.)
        details: mongoose.Schema.Types.Mixed,
        // Adresse IP de l'admin lors de la décision (pour audit)
        ipAddress: String,
        // User-Agent du navigateur de l'admin (pour audit)
        userAgent: String,
        // Date et heure de la décision
        dateDecision: {
            type: Date,
            default: Date.now,
        },
    },
    {
        // Active les champs createdAt et updatedAt automatiques
        timestamps: true,
    }
);

// Index pour optimiser les recherches fréquentes
// Index sur l'utilisateur ciblé pour afficher son historique rapidement
historiqueDecisionSchema.index({ utilisateurCible: 1 });
// Index sur l'admin pour voir toutes ses décisions
historiqueDecisionSchema.index({ adminDecision: 1 });
// Index sur le type de décision pour filtrer (approbations, rejets, etc.)
historiqueDecisionSchema.index({ typeDecision: 1 });
// Index sur la date pour trier par ordre chronologique décroissant
historiqueDecisionSchema.index({ dateDecision: -1 });
// Index sur l'email de l'utilisateur pour recherche rapide
historiqueDecisionSchema.index({ emailUtilisateurCible: 1 });

// AJOUT DU PLUGIN DE PAGINATION
// Ce plugin ajoute la méthode .paginate() au modèle
// Utilisé dans adminController.js pour paginer l'historique
historiqueDecisionSchema.plugin(mongoosePaginate);

// Méthode statique pour créer une entrée d'historique
// Utilisée dans demandeService.js lors des approbations/rejets
historiqueDecisionSchema.statics.loggerDecision = async function (data) {
    return await this.create(data);
};

// Méthode statique pour récupérer l'historique complet d'un utilisateur
// Retourne toutes les décisions prises sur cet utilisateur, triées par date
historiqueDecisionSchema.statics.obtenirHistoriqueUtilisateur = async function (
    utilisateurId
) {
    return await this.find({ utilisateurCible: utilisateurId })
        .populate('adminDecision', 'nom prenom email')
        .sort({ dateDecision: -1 });
};

// Création du modèle Mongoose
const HistoriqueDecision = mongoose.model(
    'HistoriqueDecision',
    historiqueDecisionSchema
);

// Exportation du modèle pour utilisation dans les controllers et services
export default HistoriqueDecision;