import asyncHandler from 'express-async-handler';
import Utilisateur from '../models/utilisateurModel.js';
import Produit from '../models/produitModel.js';
import Demande from '../models/demandeModel.js';
import Notification from '../models/Notification.js';
import NotificationService from '../services/notificationService.js';
import { emitNotification } from '../services/websocketService.js';
import vendeurNotificationService from '../services/vendeurNotificationService.js';

// Simulation d'un logger global
const logger = {
    info: message => console.log(`INFO: ${message}`),
    error: (message, error) => console.error(`ERROR: ${message}`, error),
};

// ✅ AJOUT: Fonction pour formater les URLs d'images
const formaterUrlsImages = (produit, baseUrl) => {
    if (!produit || !produit.images) return produit;

    produit.images = produit.images.map(img => {
        // Si c'est déjà une URL absolue, on la garde telle quelle
        if (
            typeof img === 'string' &&
            (img.startsWith('http://') || img.startsWith('https://'))
        ) {
            return img;
        }

        // Si c'est un objet (ancien format), extraire l'URL
        if (typeof img === 'object' && img.url) {
            const imageUrl = img.url;
            if (
                imageUrl.startsWith('http://') ||
                imageUrl.startsWith('https://')
            ) {
                return imageUrl;
            }
            // Chemin relatif
            return `${baseUrl}/${imageUrl.replace(/^\//, '')}`;
        }

        // Si c'est une string relative, construire l'URL complète
        if (typeof img === 'string') {
            return `${baseUrl}/${img.replace(/^\//, '')}`;
        }

        return img;
    });

    return produit;
};

/**
 * Obtenir les statistiques pour le tableau de bord du modérateur
 */
const obtenirStatistiquesModerateurDashboard = asyncHandler(
    async (req, res) => {
        try {
            const demandesEnAttente = await Demande.countDocuments({
                statut: 'en_attente',
            });

            const produitsEnAttente = await Produit.countDocuments({
                statut: 'en_attente',
            });

            const vendeursEnAttente = await Utilisateur.countDocuments({
                role: 'vendeur',
                statutVerification: 'en_attente',
            });

            const utilisateursActifs = await Utilisateur.countDocuments({
                estActif: true,
                role: { $in: ['client', 'vendeur'] },
            });

            const dateDebut = new Date();
            dateDebut.setDate(dateDebut.getDate() - 30);

            const actionsRecentes = await Demande.countDocuments({
                moderateurId: req.utilisateur._id,
                dateTraitement: { $gte: dateDebut },
            });

            res.json({
                succes: true,
                donnees: {
                    demandesEnAttente,
                    produitsEnAttente,
                    vendeursEnAttente,
                    utilisateursActifs,
                    actionsRecentes,
                    moderateur: {
                        nom: req.utilisateur.nom,
                        email: req.utilisateur.email,
                    },
                },
            });
        } catch (error) {
            console.error('Erreur stats modérateur:', error);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors du chargement des statistiques',
            });
        }
    }
);

/**
 * Obtenir les demandes en attente de validation (Produits ou Vendeurs)
 */
const obtenirDemandes = asyncHandler(async (req, res) => {
    const {
        type = 'produit',
        statut = 'en_attente',
        page = 1,
        limite = 20,
    } = req.query;

    try {
        let filtre = {};
        const skip = (parseInt(page) - 1) * parseInt(limite);
        const limit = parseInt(limite);

        let demandes, total;

        if (type === 'produit') {
            filtre.statut = statut;
            total = await Produit.countDocuments(filtre);
            demandes = await Produit.find(filtre)
                .populate('vendeur', 'nom email entreprise')
                .populate('categorie', 'nom')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            demandes = demandes.map(produit =>
                formaterUrlsImages(produit, baseUrl)
            );
        } else if (type === 'vendeur') {
            filtre.role = 'vendeur';
            filtre.statutVerification = statut;
            total = await Utilisateur.countDocuments(filtre);
            demandes = await Utilisateur.find(filtre)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select(
                    'nom email entreprise siret telephone statutVerification createdAt kbis'
                );
        }

        res.json({
            succes: true,
            donnees: {
                demandes,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Erreur récupération demandes:', error);
        res.status(500).json({
            succes: false,
            message: 'Erreur lors du chargement des demandes',
        });
    }
});

/**
 * Valider ou rejeter un produit
 */
const validerProduit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { decision, motif } = req.body;

    if (!['approuve', 'rejete'].includes(decision)) {
        return res.status(400).json({
            succes: false,
            message: 'Décision invalide (approuve ou rejete)',
        });
    }

    try {
        const produit = await Produit.findById(id).populate(
            'vendeur',
            'nom email prenom'
        );

        if (!produit) {
            return res.status(404).json({
                succes: false,
                message: 'Produit non trouvé',
            });
        }

        if (produit.statut !== 'en_attente') {
            return res.status(400).json({
                succes: false,
                message: 'Ce produit a déjà été traité',
            });
        }

        produit.statut = decision === 'approuve' ? 'actif' : 'rejete';
        produit.raisonRejet = decision === 'rejete' ? motif : undefined;
        produit.moderateur = req.utilisateur._id;
        produit.dateValidation = new Date();

        await produit.save();

        // 1. Notifier le vendeur via le service spécialisé
        if (produit.vendeur?._id) {
            try {
                await vendeurNotificationService.notifierValidationProduit(
                    produit.vendeur._id,
                    produit,
                    decision,
                    motif
                );
            } catch (notifError) {
                logger.error(
                    'Erreur notification vendeur produit :',
                    notifError
                );
            }
        }

        // 2. Historisation de l'action
        await Demande.create({
            type: 'produit',
            elementId: produit._id,
            statut: decision,
            moderateurId: req.utilisateur._id,
            motif: motif || null,
            dateTraitement: new Date(),
        });

        // 3. Notifications internes et temps réel
        const notificationAdmin = {
            type: 'produit',
            titre:
                decision === 'approuve' ? 'Produit approuvé' : 'Produit rejeté',
            message: `Le produit "${produit.nom}" a été ${decision} par ${req.utilisateur.nom}`,
            priorite: 'normale',
        };

        emitNotification(notificationAdmin, 'role:admin');

        // ✅ AJOUT: Formater les URLs d'images avant de renvoyer
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const produitFormate = formaterUrlsImages(produit.toObject(), baseUrl);

        res.json({
            succes: true,
            message: `Produit ${decision} avec succès`,
            donnees: produitFormate,
        });
    } catch (error) {
        console.error('Erreur validation produit:', error);
        res.status(500).json({
            succes: false,
            message: 'Erreur validation produit',
        });
    }
});

/**
 * Valider ou rejeter un vendeur (Statut: verifie ou rejete)
 */
const validerVendeur = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { decision, motif } = req.body;

    console.log('--- DEBUG validerVendeur ---');
    console.log('ID vendeur:', id);
    console.log('Decision:', decision);
    console.log('Motif:', motif);

    if (!['approuve', 'rejete'].includes(decision)) {
        return res.status(400).json({
            succes: false,
            message: 'Décision invalide (approuve ou rejete)',
        });
    }

    try {
        const vendeur = await Utilisateur.findOne({ _id: id, role: 'vendeur' });
        console.log('Vendeur trouvé:', vendeur ? 'OUI' : 'NON');

        if (!vendeur) {
            return res.status(404).json({
                succes: false,
                message: 'Vendeur non trouvé',
            });
        }

        if (
            vendeur.statutVerification &&
            vendeur.statutVerification !== 'en_attente'
        ) {
            return res.status(400).json({
                succes: false,
                message: 'Ce vendeur a déjà été traité',
            });
        }

        // CORRECTION : Mapper 'approuve' vers 'verifie' pour correspondre au schéma
        vendeur.statutVerification =
            decision === 'approuve' ? 'verifie' : 'rejete';
        vendeur.raisonRejet = decision === 'rejete' ? motif : undefined;
        vendeur.dateVerification = new Date();

        if (decision === 'approuve') {
            vendeur.estActif = true;
        }

        console.log(
            'Avant save - statutVerification:',
            vendeur.statutVerification
        );
        await vendeur.save();
        console.log('Vendeur sauvegardé avec succès');

        // Notifier le vendeur via le service dédié
        try {
            await vendeurNotificationService.notifierValidationVendeur(
                vendeur._id,
                decision,
                motif
            );
        } catch (notifError) {
            logger.error(
                'Erreur notification validation vendeur :',
                notifError
            );
        }

        // Création de l'historique
        await Demande.create({
            type: 'vendeur',
            elementId: vendeur._id,
            statut: decision,
            moderateurId: req.utilisateur._id,
            motif: motif || null,
            dateTraitement: new Date(),
        });

        // Notification Admin temps réel
        const notificationAdmin = {
            type: 'utilisateur',
            titre:
                decision === 'approuve' ? 'Vendeur approuvé' : 'Vendeur rejeté',
            message: `Le vendeur "${vendeur.entreprise || vendeur.nom}" a été traité par ${req.utilisateur.nom}`,
            priorite: 'normale',
        };
        emitNotification(notificationAdmin, 'role:admin');

        // Notification temps réel spécifique pour le vendeur
        emitNotification(
            {
                type: 'utilisateur',
                titre:
                    decision === 'approuve'
                        ? 'Compte approuvé'
                        : 'Demande rejetée',
                message:
                    decision === 'approuve'
                        ? 'Votre compte vendeur est actif.'
                        : `Motif: ${motif}`,
                priorite: decision === 'approuve' ? 'normale' : 'haute',
            },
            `user:${vendeur._id}`
        );

        // Envoi d'email via service de notification
        try {
            if (vendeur.email) {
                if (decision === 'approuve') {
                    await NotificationService.envoyerEmailApprobation(vendeur);
                } else {
                    await NotificationService.envoyerEmailRejet(vendeur, motif);
                }
            }
        } catch (emailError) {
            console.error('Erreur envoi email au vendeur:', emailError);
        }

        res.json({
            succes: true,
            message: `Vendeur ${vendeur.statutVerification} avec succès`,
            donnees: vendeur,
        });
    } catch (error) {
        console.error('ERREUR COMPLÈTE validerVendeur:', error);
        res.status(500).json({
            succes: false,
            message:
                'Erreur lors de la validation du vendeur: ' + error.message,
            details:
                process.env.NODE_ENV === 'development'
                    ? error.errors
                    : undefined,
        });
    }
});

/**
 * Obtenir la liste des utilisateurs (clients et vendeurs)
 */
const obtenirUtilisateurs = asyncHandler(async (req, res) => {
    const { role, page = 1, limite = 20, recherche = '' } = req.query;

    try {
        const filtre = { role: { $in: ['client', 'vendeur'] } };

        if (role && ['client', 'vendeur'].includes(role)) {
            filtre.role = role;
        }

        if (recherche) {
            filtre.$or = [
                { nom: { $regex: recherche, $options: 'i' } },
                { email: { $regex: recherche, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limite);
        const limit = parseInt(limite);

        const utilisateurs = await Utilisateur.find(filtre)
            .select('nom email role estActif createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Utilisateur.countDocuments(filtre);

        res.json({
            succes: true,
            donnees: {
                utilisateurs,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        res.status(500).json({
            succes: false,
            message: 'Erreur chargement utilisateurs',
        });
    }
});

/**
 * Modifier le statut actif d'un utilisateur (Bannissement/Activation)
 */
const modifierStatutUtilisateur = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { estActif } = req.body;

    if (typeof estActif !== 'boolean') {
        return res
            .status(400)
            .json({ succes: false, message: 'estActif doit être un booléen' });
    }

    try {
        const utilisateur = await Utilisateur.findById(id);

        if (!utilisateur) {
            return res
                .status(404)
                .json({ succes: false, message: 'Utilisateur non trouvé' });
        }

        if (['admin', 'moderateur'].includes(utilisateur.role)) {
            return res.status(403).json({
                succes: false,
                message: 'Action interdite sur le staff',
            });
        }

        utilisateur.estActif = estActif;
        await utilisateur.save();

        res.json({
            succes: true,
            message: `Utilisateur ${estActif ? 'activé' : 'désactivé'}`,
            donnees: utilisateur,
        });
    } catch (error) {
        res.status(500).json({
            succes: false,
            message: 'Erreur modification statut',
        });
    }
});

/**
 * Obtenir l'historique des actions du modérateur connecté
 */
const obtenirHistorique = asyncHandler(async (req, res) => {
    const { page = 1, limite = 20 } = req.query;

    try {
        const skip = (parseInt(page) - 1) * parseInt(limite);
        const limit = parseInt(limite);

        const historique = await Demande.find({
            moderateurId: req.utilisateur._id,
        })
            .populate('elementId')
            .sort({ dateTraitement: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Demande.countDocuments({
            moderateurId: req.utilisateur._id,
        });

        res.json({
            succes: true,
            donnees: {
                historique,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ succes: false, message: 'Erreur historique' });
    }
});

export {
    obtenirStatistiquesModerateurDashboard,
    obtenirDemandes,
    validerProduit,
    validerVendeur,
    obtenirUtilisateurs,
    modifierStatutUtilisateur,
    obtenirHistorique,
};
