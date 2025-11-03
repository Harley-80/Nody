/**
 * Constantes pour les rôles des utilisateurs dans l'application Nody
 */

export const ROLES = {
    // Rôles principaux
    ADMIN: 'admin',
    MODERATEUR: 'moderateur',
    VENDEUR: 'vendeur',
    CLIENT: 'client',
};

// Configuration d'inscription par rôle
export const CONFIG_INSCRIPTION = {
    [ROLES.ADMIN]: {
        nom: 'Administrateur',
        description:
            'Accès complet à toutes les fonctionnalités de la plateforme',
        champsObligatoires: [
            'nom',
            'prenom',
            'email',
            'motDePasse',
            'telephone',
        ],
        champsOptionnels: ['dateNaissance', 'genre'],
        validationEmail: true,
        validationTelephone: true,
        approbationManuelle: true,
        codeInvitation: true,
        limiteInscriptions: 'illimite',
    },

    [ROLES.MODERATEUR]: {
        nom: 'Modérateur',
        description: 'Gestion du contenu et modération de la plateforme',
        champsObligatoires: [
            'nom',
            'prenom',
            'email',
            'motDePasse',
            'telephone',
        ],
        champsOptionnels: ['dateNaissance', 'genre'],
        validationEmail: true,
        validationTelephone: true,
        approbationManuelle: true,
        codeInvitation: true,
        limiteInscriptions: 'restreinte',
    },

    [ROLES.VENDEUR]: {
        nom: 'Vendeur',
        description: 'Gestion des produits et des ventes',
        champsObligatoires: [
            'nom',
            'prenom',
            'email',
            'motDePasse',
            'telephone',
        ],
        champsOptionnels: [
            'dateNaissance',
            'genre',
            'nomBoutique',
            'descriptionBoutique',
            'siteWeb',
        ],
        validationEmail: true,
        validationTelephone: true,
        approbationManuelle: false,
        codeInvitation: false,
        limiteInscriptions: 'ouverte',
    },

    [ROLES.CLIENT]: {
        nom: 'Client',
        description: 'Utilisateur standard pour les achats',
        champsObligatoires: ['nom', 'prenom', 'email', 'motDePasse'],
        champsOptionnels: ['telephone', 'dateNaissance', 'genre'],
        validationEmail: true,
        validationTelephone: false,
        approbationManuelle: false,
        codeInvitation: false,
        limiteInscriptions: 'ouverte',
    },
};

// Codes d'invitation par défaut (pour développement)
export const CODES_INVITATION = {
    [ROLES.ADMIN]: {
        code: 'NODY-ADMIN-2024',
        utilisationsMax: 5,
        expiration: '2024-12-31',
    },
    [ROLES.MODERATEUR]: {
        code: 'NODY-MOD-2024',
        utilisationsMax: 10,
        expiration: '2024-12-31',
    },
};

export default {
    ROLES,
    CONFIG_INSCRIPTION,
    CODES_INVITATION,
};
