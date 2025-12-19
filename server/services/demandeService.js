import Utilisateur from '../models/utilisateurModel.js';
import HistoriqueDecision from '../models/historiqueDecisionModel.js';
import NotificationService from './notificationService.js';
import logger from '../utils/logger.js';

export const DemandeService = {
    async obtenirDemandes(filtres = {}) {
        try {
            const {
                page = 1,
                limite = 10,
                role,
                statutVerification,
                dateDebut,
                dateFin,
                recherche,
                tri = 'createdAt',
                ordre = -1,
                estActif,
            } = filtres;

            const query = {
                role: { $in: ['vendeur', 'moderateur'] },
            };

            if (statutVerification) {
                query.statutVerification = statutVerification;
            }

            if (typeof estActif === 'boolean') {
                query.estActif = estActif;
            }

            if (role && ['vendeur', 'moderateur'].includes(role)) {
                query.role = role;
            }

            if (dateDebut || dateFin) {
                query.createdAt = {};
                if (dateDebut) {
                    query.createdAt.$gte = new Date(dateDebut);
                }
                if (dateFin) {
                    const dateLimite = new Date(dateFin);
                    dateLimite.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = dateLimite;
                }
            }

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

            console.log(
                '[DemandeService] Query MongoDB:',
                JSON.stringify(query, null, 2)
            );

            const pageInt = parseInt(page);
            const limiteInt = parseInt(limite);
            const skip = (pageInt - 1) * limiteInt;

            const demandes = await Utilisateur.find(query)
                .select('-motDePasse')
                .sort({ [tri]: parseInt(ordre) })
                .limit(limiteInt)
                .skip(skip)
                .lean();

            const total = await Utilisateur.countDocuments(query);

            console.log('[DemandeService] Resultat pagination manuelle:', {
                total,
                docs: demandes.length,
                page: pageInt,
                totalPages: Math.ceil(total / limiteInt),
            });

            return {
                demandes,
                pagination: {
                    page: pageInt,
                    limite: limiteInt,
                    totalPages: Math.ceil(total / limiteInt),
                    total,
                    hasNext: pageInt < Math.ceil(total / limiteInt),
                    hasPrev: pageInt > 1,
                },
            };
        } catch (erreur) {
            console.error('[DemandeService] Erreur obtenirDemandes:', erreur);
            throw new Error(
                'Erreur lors de la recuperation des demandes: ' + erreur.message
            );
        }
    },

    async approuverDemande(
        utilisateurId,
        admin,
        ipAddress = '',
        userAgent = ''
    ) {
        try {
            const utilisateur = await Utilisateur.findById(utilisateurId);
            if (!utilisateur) {
                throw new Error('Utilisateur non trouve');
            }

            if (utilisateur.statutVerification !== 'en_attente') {
                throw new Error('Cette demande a deja ete traitee');
            }

            const ancienStatut = utilisateur.statutVerification;

            utilisateur.statutVerification = 'verifie';
            utilisateur.emailVerifie = true;
            utilisateur.dateVerification = new Date();
            utilisateur.raisonRejet = undefined;

            await utilisateur.save();

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

            try {
                await NotificationService.envoyerEmailApprobation(utilisateur);
            } catch (emailError) {
                logger.error('Erreur envoi email approbation:', emailError);
            }

            logger.info(
                `Demande approuvee: ${utilisateur.email} par ${admin.email}`
            );

            return utilisateur;
        } catch (error) {
            logger.error('Erreur approbation demande:', error);
            throw error;
        }
    },

    async rejeterDemande(
        utilisateurId,
        raison,
        admin,
        ipAddress = '',
        userAgent = ''
    ) {
        try {
            const utilisateur = await Utilisateur.findById(utilisateurId);
            if (!utilisateur) {
                throw new Error('Utilisateur non trouve');
            }

            if (utilisateur.statutVerification !== 'en_attente') {
                throw new Error('Cette demande a deja ete traitee');
            }

            const ancienStatut = utilisateur.statutVerification;

            utilisateur.statutVerification = 'rejete';
            utilisateur.dateVerification = new Date();
            utilisateur.raisonRejet = raison;

            await utilisateur.save();

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

            try {
                await NotificationService.envoyerEmailRejet(
                    utilisateur,
                    raison
                );
            } catch (emailError) {
                logger.error('Erreur envoi email rejet:', emailError);
            }

            logger.info(
                `Demande rejetee: ${utilisateur.email} par ${admin.email} - Raison: ${raison}`
            );

            return utilisateur;
        } catch (error) {
            logger.error('Erreur rejet demande:', error);
            throw error;
        }
    },

    async obtenirStatistiquesDemandes() {
        const [
            totalEnAttente,
            vendeursEnAttente,
            moderateursEnAttente,
            demandesParMois,
            historiqueRecent,
        ] = await Promise.all([
            Utilisateur.countDocuments({
                statutVerification: 'en_attente',
                role: { $in: ['vendeur', 'moderateur'] },
            }),
            Utilisateur.countDocuments({
                statutVerification: 'en_attente',
                role: 'vendeur',
            }),
            Utilisateur.countDocuments({
                statutVerification: 'en_attente',
                role: 'moderateur',
            }),
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
            adminsConnectes: 0,
        };
    },

    async obtenirHistoriqueUtilisateur(utilisateurId) {
        return await HistoriqueDecision.obtenirHistoriqueUtilisateur(
            utilisateurId
        );
    },
};
