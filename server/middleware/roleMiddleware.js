import { ROLES, RoleUtils } from '../constants/roles.js';

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
 * Middleware pour vérifier les permissions
 */
export const verifierPermission = permissionRequise => {
    return (req, res, next) => {
        if (!req.utilisateur) {
            return res.status(401).json({
                succes: false,
                message: 'Non authentifié',
            });
        }

        if (!RoleUtils.aPermission(req.utilisateur, permissionRequise)) {
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

export default {
    verifierRole,
    verifierPermission,
    estAdmin,
    estModerateur,
    estVendeur,
    estClient,
    estVerifie,
};
