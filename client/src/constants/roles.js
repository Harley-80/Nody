/**
 * Constantes pour les rôles des utilisateurs dans l'application Nody
 */

export const ROLES = {
    // Rôles principaux
    ADMIN: 'admin',
    MODERATEUR: 'moderateur',
    VENDEUR: 'vendeur',
    CLIENT: 'client',

    // Alias pour la compatibilité
    SUPER_ADMIN: 'admin',
    MODERATOR: 'moderateur',
    SELLER: 'vendeur',
    USER: 'client',
    CUSTOMER: 'client',
};

// Niveaux de permission (hiérarchie des rôles)
export const HIERARCHIE_ROLES = {
    [ROLES.ADMIN]: 4,
    [ROLES.MODERATEUR]: 3,
    [ROLES.VENDEUR]: 2,
    [ROLES.CLIENT]: 1,
};

// Permissions par rôle
export const PERMISSIONS = {
    [ROLES.ADMIN]: [
        'gestion_utilisateurs',
        'gestion_produits',
        'gestion_commandes',
        'gestion_categories',
        'gestion_paiements',
        'gestion_parametres',
        'acces_admin',
        'moderation_contenu',
        'gestion_vendeurs',
        'gestion_stock',
        'gestion_promotions',
        'analytics',
        'export_donnees',
    ],

    [ROLES.MODERATEUR]: [
        'moderation_contenu',
        'gestion_produits',
        'gestion_commandes',
        'gestion_categories',
        'gestion_retours',
        'support_client',
        'validation_contenu',
    ],

    [ROLES.VENDEUR]: [
        'gestion_produits',
        'gestion_stock',
        'gestion_commandes',
        'gestion_promotions',
        'analytics_vendeur',
        'gestion_inventaire',
        'modification_produits',
    ],

    [ROLES.CLIENT]: [
        'achat_produits',
        'gestion_profil',
        'gestion_panier',
        'gestion_wishlist',
        'historique_commandes',
        'evaluation_produits',
        'support_client',
    ],
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
        validationTelephone: false,
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
            'adresse',
        ],
        champsOptionnels: [
            'dateNaissance',
            'genre',
            'siteWeb',
            'descriptionBoutique',
        ],
        validationEmail: true,
        validationTelephone: true,
        approbationManuelle: false,
        codeInvitation: false,
        limiteInscriptions: 'ouverte',
        documentsRequis: ['piece_identite', 'justificatif_domicile'],
    },

    [ROLES.CLIENT]: {
        nom: 'Client',
        description: 'Utilisateur standard pour les achats',
        champsObligatoires: ['nom', 'prenom', 'email', 'motDePasse'],
        champsOptionnels: ['telephone', 'dateNaissance', 'genre', 'adresse'],
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

// Utilitaires pour les rôles
export const RoleUtils = {
    // Vérifier si un utilisateur a un rôle spécifique
    aRole: (utilisateur, role) => {
        return utilisateur?.role === role;
    },

    // Vérifier si un utilisateur a au moins un des rôles
    aUnDesRoles: (utilisateur, roles) => {
        return roles.includes(utilisateur?.role);
    },

    // Vérifier les permissions
    aPermission: (utilisateur, permission) => {
        const permissions = PERMISSIONS[utilisateur?.role] || [];
        return permissions.includes(permission);
    },

    // Obtenir le niveau hiérarchique d'un rôle
    obtenirNiveauRole: role => {
        return HIERARCHIE_ROLES[role] || 0;
    },

    // Vérifier si un rôle a un niveau supérieur ou égal à un autre
    estSuperieurOuEqual: (roleUtilisateur, roleCompare) => {
        const niveauUtilisateur = HIERARCHIE_ROLES[roleUtilisateur] || 0;
        const niveauCompare = HIERARCHIE_ROLES[roleCompare] || 0;
        return niveauUtilisateur >= niveauCompare;
    },

    // Obtenir la configuration d'inscription pour un rôle
    obtenirConfigInscription: role => {
        return CONFIG_INSCRIPTION[role] || CONFIG_INSCRIPTION[ROLES.CLIENT];
    },

    // Rôles disponibles pour l'inscription publique
    rolesInscriptionPublique: () => {
        return [ROLES.CLIENT, ROLES.VENDEUR];
    },

    // Rôles nécessitant une approbation
    rolesAvecApprobation: () => {
        return [ROLES.ADMIN, ROLES.MODERATEUR];
    },

    // Formater un rôle pour l'affichage
    formaterRole: role => {
        const config = CONFIG_INSCRIPTION[role];
        return config ? config.nom : role;
    },
};

// Export par défaut pour une importation facile
export default {
    ROLES,
    HIERARCHIE_ROLES,
    PERMISSIONS,
    CONFIG_INSCRIPTION,
    CODES_INVITATION,
    RoleUtils,
};
