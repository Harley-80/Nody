import Utilisateur from '../models/utilisateurModel.js';
import HistoriqueDecision from '../models/historiqueDecisionModel.js';
import WebSocketService from './websocketService.js';
import NotificationService from './notificationService.js';
import logger from '../utils/logger.js';

export const DemandeService = {
    /**
     * Obtenir les demandes avec filtres avancés
     */
    async obtenirDemandes(filtres = {}) {
        const {
            page = 1,
            limite = 10,
            role,
            statutVerification = 'en_attente',
            dateDebut,
            dateFin,
            recherche,
            tri = 'createdAt',
            ordre = -1,
        } = filtres;

        const query = {
            statutVerification,
            role: { $in: ['vendeur', 'moderateur'] },
        };

        // Filtre par rôle
        if (role && ['vendeur', 'moderateur'].includes(role)) {
            query.role = role;
        }

        // Filtre par date
        if (dateDebut || dateFin) {
            query.createdAt = {};
            if (dateDebut) query.createdAt.$gte = new Date(dateDebut);
            if (dateFin)
                query.createdAt.$lte = new Date(dateFin + 'T23:59:59.999Z');
        }

        // Filtre par recherche
        if (recherche) {
            query.$or = [
                { nom: { $regex: recherche, $options: 'i' } },
                { prenom: { $regex: recherche, $options: 'i' } },
                { email: { $regex: recherche, $options: 'i' } },
                {
                    'boutique.nomBoutique': {
                        $regex: recherche,
                        $options: 'i',
                    },
                },
            ];
        }

        // Options de pagination et tri
        const options = {
            page: parseInt(page),
            limit: parseInt(limite),
            sort: { [tri]: parseInt(ordre) },
            select: '-motDePasse',
        };

        const result = await Utilisateur.paginate(query, options);

        return {
            demandes: result.docs,
            pagination: {
                page: result.page,
                limite: result.limit,
                totalPages: result.totalPages,
                total: result.totalDocs,
                hasNext: result.hasNextPage,
                hasPrev: result.hasPrevPage,
            },
        };
    },

    /**
     * Approuver une demande
     */
    async approuverDemande(
        utilisateurId,
        admin,
        ipAddress = '',
        userAgent = ''
    ) {
        const session = await Utilisateur.startSession();

        // Transaction pour garantir la cohérence des données
        try {
            session.startTransaction();

            const utilisateur =
                await Utilisateur.findById(utilisateurId).session(session);

            if (!utilisateur) {
                throw new Error('Utilisateur non trouvé');
            }

            if (utilisateur.statutVerification !== 'en_attente') {
                throw new Error('Cette demande a déjà été traitée');
            }

            const ancienStatut = utilisateur.statutVerification;

            // Mettre à jour l'utilisateur
            utilisateur.statutVerification = 'verifie';
            utilisateur.emailVerifie = true;
            utilisateur.dateVerification = new Date();
            utilisateur.raisonRejet = undefined;

            await utilisateur.save({ session });

            // Logger la décision
            await HistoriqueDecision.loggerDecision({
                utilisateurCible: utilisateurId,
                emailUtilisateurCible: utilisateur.email,
                roleUtilisateurCible: utilisateur.role,
                adminDecision: admin._id,
                emailAdminDecision: admin.email,
                typeDecision: 'approbation',
                ancienStatut,
                nouveauStatut: 'verifie',
                ipAddress,
                userAgent,
                details: {
                    role: utilisateur.role,
                    boutique: utilisateur.boutique,
                },
            });

            await session.commitTransaction();

            // Notifications
            WebSocketService.notifierApprobationDemande(utilisateur, admin);

            try {
                await NotificationService.envoyerEmailApprobation(utilisateur);
            } catch (emailError) {
                logger.error('Erreur envoi email approbation:', emailError);
            }

            logger.info(
                `Demande approuvée: ${utilisateur.email} par ${admin.email}`
            );

            return utilisateur;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    /**
     * Rejeter une demande
     */
    async rejeterDemande(
        utilisateurId,
        raison,
        admin,
        ipAddress = '',
        userAgent = ''
    ) {
        const session = await Utilisateur.startSession();

        try {
            session.startTransaction();

            const utilisateur =
                await Utilisateur.findById(utilisateurId).session(session);

            if (!utilisateur) {
                throw new Error('Utilisateur non trouvé');
            }

            if (utilisateur.statutVerification !== 'en_attente') {
                throw new Error('Cette demande a déjà été traitée');
            }

            const ancienStatut = utilisateur.statutVerification;

            // Mettre à jour l'utilisateur
            utilisateur.statutVerification = 'rejete';
            utilisateur.dateVerification = new Date();
            utilisateur.raisonRejet = raison;

            await utilisateur.save({ session });

            // Logger la décision
            await HistoriqueDecision.loggerDecision({
                utilisateurCible: utilisateurId,
                emailUtilisateurCible: utilisateur.email,
                roleUtilisateurCible: utilisateur.role,
                adminDecision: admin._id,
                emailAdminDecision: admin.email,
                typeDecision: 'rejet',
                ancienStatut,
                nouveauStatut: 'rejete',
                raison: raison,
                ipAddress,
                userAgent,
                details: {
                    role: utilisateur.role,
                    boutique: utilisateur.boutique,
                },
            });

            await session.commitTransaction();

            // Notifications
            WebSocketService.notifierRejetDemande(utilisateur, admin, raison);

            try {
                await NotificationService.envoyerEmailRejet(
                    utilisateur,
                    raison
                );
            } catch (emailError) {
                logger.error('Erreur envoi email rejet:', emailError);
            }

            logger.info(
                `Demande rejetée: ${utilisateur.email} par ${admin.email}`
            );

            return utilisateur;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    /**
     * Obtenir les statistiques des demandes
     */
    async obtenirStatistiquesDemandes() {
        const [
            totalEnAttente,
            vendeursEnAttente,
            moderateursEnAttente,
            demandesParMois,
            historiqueRecent,
        ] = await Promise.all([
            // Total en attente
            Utilisateur.countDocuments({
                statutVerification: 'en_attente',
                role: { $in: ['vendeur', 'moderateur'] },
            }),

            // Vendeurs en attente
            Utilisateur.countDocuments({
                statutVerification: 'en_attente',
                role: 'vendeur',
            }),

            // Modérateurs en attente
            Utilisateur.countDocuments({
                statutVerification: 'en_attente',
                role: 'moderateur',
            }),

            // Demandes des 6 derniers mois
            Utilisateur.aggregate([
                {
                    $match: {
                        role: { $in: ['vendeur', 'moderateur'] },
                        createdAt: {
                            $gte: new Date(
                                new Date().setMonth(new Date().getMonth() - 6)
                            ),
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            mois: { $month: '$createdAt' },
                            annee: { $year: '$createdAt' },
                            role: '$role',
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.annee': 1, '_id.mois': 1 } },
            ]),

            // Décisions récentes (7 derniers jours)
            HistoriqueDecision.find({
                dateDecision: {
                    $gte: new Date(
                        new Date().setDate(new Date().getDate() - 7)
                    ),
                },
            })
                .populate('adminDecision', 'nom prenom email')
                .sort({ dateDecision: -1 })
                .limit(10),
        ]);

        return {
            totalEnAttente,
            vendeursEnAttente,
            moderateursEnAttente,
            demandesParMois,
            historiqueRecent,
            adminsConnectes: WebSocketService.getConnectedAdminsCount(),
        };
    },

    /**
     * Obtenir l'historique des décisions pour un utilisateur
     */
    async obtenirHistoriqueUtilisateur(utilisateurId) {
        return await HistoriqueDecision.obtenirHistoriqueUtilisateur(
            utilisateurId
        );
    },
};
