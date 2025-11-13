import { ROLES } from '../constants/roles.js';

/**
 * Middleware pour vérifier les rôles
 */
export const verifierRole = rolesAutorises => {
    return (req, res, next) => {
        if (!req.utilisateur) {
            return res.status(401).json({
                succes: false,
                message: 'Non authentifié',
            });
        }

        if (!rolesAutorises.includes(req.utilisateur.role)) {
            return res.status(403).json({
                succes: false,
                message: 'Accès non autorisé pour votre rôle',
            });
        }

        next();
    };
};

/**
 * Middleware pour vérifier les permissions basiques
 */
export const verifierPermission = permissionRequise => {
    return (req, res, next) => {
        if (!req.utilisateur) {
            return res.status(401).json({
                succes: false,
                message: 'Non authentifié',
            });
        }

        // Logique de base pour les permissions
        // Nous pouvons étendre cette logique selon nos besoins
        const permissionsParRole = {
            [ROLES.ADMIN]: ['tous'],
            [ROLES.MODERATEUR]: [
                'moderer_contenu',
                'gerer_utilisateurs',
                'voir_statistiques',
            ],
            [ROLES.VENDEUR]: [
                'gerer_produits',
                'voir_ventes',
                'gerer_commandes',
            ],
            [ROLES.CLIENT]: ['acheter', 'commenter', 'noter'],
        };

        const permissionsUtilisateur =
            permissionsParRole[req.utilisateur.role] || [];

        if (
            !permissionsUtilisateur.includes('tous') &&
            !permissionsUtilisateur.includes(permissionRequise)
        ) {
            return res.status(403).json({
                succes: false,
                message: `Permission "${permissionRequise}" requise`,
            });
        }

        next();
    };
};

// Middlewares spécifiques par rôle
export const estAdmin = verifierRole([ROLES.ADMIN]);
export const estModerateur = verifierRole([ROLES.ADMIN, ROLES.MODERATEUR]);
export const estVendeur = verifierRole([
    ROLES.ADMIN,
    ROLES.MODERATEUR,
    ROLES.VENDEUR,
]);
export const estClient = verifierRole([
    ROLES.ADMIN,
    ROLES.MODERATEUR,
    ROLES.VENDEUR,
    ROLES.CLIENT,
]);

// Vérification de la vérification du compte (pour vendeurs)
export const estVerifie = (req, res, next) => {
    if (!req.utilisateur) {
        return res.status(401).json({
            succes: false,
            message: 'Non authentifié',
        });
    }

    if (
        req.utilisateur.role === ROLES.VENDEUR &&
        req.utilisateur.statutVerification !== 'verifie'
    ) {
        return res.status(403).json({
            succes: false,
            message:
                'Votre compte vendeur doit être vérifié pour accéder à cette fonctionnalité',
        });
    }

    next();
};

// Vérification que l'utilisateur peut gérer du contenu
export const peutModerer = verifierPermission('moderer_contenu');
export const peutGererProduits = verifierPermission('gerer_produits');
export const peutVoirStatistiques = verifierPermission('voir_statistiques');

// Vérification que l'utilisateur est propriétaire de la ressource
export const estProprietaire = (modele, champId = '_id') => {
    return async (req, res, next) => {
        try {
            const resource = await modele.findById(req.params.id);

            if (!resource) {
                return res.status(404).json({
                    succes: false,
                    message: 'Ressource non trouvée',
                });
            }

            // Vérifier si l'utilisateur est admin ou modérateur (accès complet)
            if (
                [ROLES.ADMIN, ROLES.MODERATEUR].includes(req.utilisateur.role)
            ) {
                return next();
            }

            // Vérifier si l'utilisateur est propriétaire de la ressource
            const proprietaireId = resource[champId]
                ? resource[champId].toString()
                : resource.toString();

            if (proprietaireId !== req.utilisateur._id.toString()) {
                return res.status(403).json({
                    succes: false,
                    message:
                        'Accès non autorisé - Vous devez être propriétaire de cette ressource',
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                succes: false,
                message: 'Erreur lors de la vérification de propriété',
            });
        }
    };
};

// Vérification que l'utilisateur peut accéder à ses propres données
export const peutAccederPropresDonnees = (paramId = 'id') => {
    return (req, res, next) => {
        const requestedUserId = req.params[paramId];

        // Admin et modérateur peuvent accéder à toutes les données
        if ([ROLES.ADMIN, ROLES.MODERATEUR].includes(req.utilisateur.role)) {
            return next();
        }

        // Les autres utilisateurs ne peuvent accéder qu'à leurs propres données
        if (requestedUserId !== req.utilisateur._id.toString()) {
            return res.status(403).json({
                succes: false,
                message:
                    "Accès non autorisé - Vous ne pouvez accéder qu'à vos propres données",
            });
        }

        next();
    };
};

// Vérification du statut du compte
export const compteActif = (req, res, next) => {
    if (!req.utilisateur.estActif) {
        return res.status(403).json({
            succes: false,
            message:
                "Votre compte est suspendu. Veuillez contacter l'administrateur.",
        });
    }
    next();
};

// Combinaison de middlewares pour les cas courants
export const vendeurVerifie = [estVendeur, estVerifie, compteActif];
export const moderateurActif = [estModerateur, compteActif];
export const adminActif = [estAdmin, compteActif];

export default {
    verifierRole,
    verifierPermission,
    estAdmin,
    estModerateur,
    estVendeur,
    estClient,
    estVerifie,
    peutModerer,
    peutGererProduits,
    peutVoirStatistiques,
    estProprietaire,
    peutAccederPropresDonnees,
    compteActif,
    vendeurVerifie,
    moderateurActif,
    adminActif,
};
