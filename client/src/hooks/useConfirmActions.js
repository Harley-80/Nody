import { useConfirmModal } from '../contexts/ConfirmModalContext';

/**
 * Hook personnalisé pour les confirmations fréquentes
 * Centralise les messages et configurations des modales
 */
export const useConfirmActions = () => {
    const { confirm } = useConfirmModal();

    /**
     * Confirmation de suppression générique
     * @param {string} type - Type d'entité (produit, client, catégorie, etc.)
     * @param {string} nom - Nom de l'entité à supprimer
     * @returns {Promise<boolean>}
     */
    const confirmDelete = async (type = 'élément', nom = '') => {
        return await confirm({
            title: `Supprimer ${nom ? `"${nom}"` : `ce ${type}`} ?`,
            message: `Cette action est irréversible. ${nom ? `Le ${type} "${nom}"` : `Cet ${type}`} sera définitivement supprimé.`,
            variant: 'danger',
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
        });
    };

    /**
     * Confirmation de blocage d'utilisateur
     * @param {string} nom - Nom de l'utilisateur
     * @returns {Promise<boolean>}
     */
    const confirmBlock = async (nom = '') => {
        return await confirm({
            title: `Bloquer ${nom ? `"${nom}"` : 'cet utilisateur'} ?`,
            message: `${nom ? `L'utilisateur "${nom}"` : 'Cet utilisateur'} ne pourra plus se connecter ni passer de commandes.`,
            variant: 'warning',
            confirmText: 'Bloquer',
            cancelText: 'Annuler',
        });
    };

    /**
     * Confirmation de déblocage d'utilisateur
     * @param {string} nom - Nom de l'utilisateur
     * @returns {Promise<boolean>}
     */
    const confirmUnblock = async (nom = '') => {
        return await confirm({
            title: `Débloquer ${nom ? `"${nom}"` : 'cet utilisateur'} ?`,
            message: `${nom ? `L'utilisateur "${nom}"` : 'Cet utilisateur'} pourra à nouveau accéder à son compte.`,
            variant: 'info',
            confirmText: 'Débloquer',
            cancelText: 'Annuler',
        });
    };

    /**
     * Confirmation d'annulation de commande
     * @param {string} numeroCommande - Numéro de la commande
     * @returns {Promise<boolean>}
     */
    const confirmCancelOrder = async (numeroCommande = '') => {
        return await confirm({
            title: `Annuler la commande ${numeroCommande ? `#${numeroCommande}` : ''} ?`,
            message: `Le client sera notifié de l'annulation. Cette action peut nécessiter un remboursement.`,
            variant: 'warning',
            confirmText: 'Annuler la commande',
            cancelText: 'Conserver',
        });
    };

    /**
     * Renommé en confirmApproveRequest (au lieu de confirmApprove)
     * Confirmation d'approbation de demande d'inscription
     * @param {string} role - Rôle demandé (vendeur, modérateur)
     * @param {string} nom - Nom du demandeur
     * @returns {Promise<boolean>}
     */
    const confirmApproveRequest = async (role = '', nom = '') => {
        const roleLabel =
            role === 'vendeur'
                ? 'vendeur'
                : role === 'moderateur'
                  ? 'modérateur'
                  : 'ce rôle';

        return await confirm({
            title: `Approuver ${nom ? `"${nom}"` : 'cette demande'} ?`,
            message: `${nom ? `"${nom}"` : 'Cet utilisateur'} obtiendra les droits de ${roleLabel} et pourra accéder à son espace dédié.`,
            variant: 'info',
            confirmText: 'Approuver',
            cancelText: 'Annuler',
        });
    };

    /**
     * Renommé en confirmRejectRequest (au lieu de confirmReject)
     * Confirmation de rejet de demande d'inscription
     * @param {string} role - Rôle demandé (vendeur, modérateur)
     * @param {string} nom - Nom du demandeur
     * @returns {Promise<boolean>}
     */
    const confirmRejectRequest = async (role = '', nom = '') => {
        const roleLabel =
            role === 'vendeur'
                ? 'vendeur'
                : role === 'moderateur'
                  ? 'modérateur'
                  : 'ce rôle';

        return await confirm({
            title: `Rejeter la demande de ${nom || 'cet utilisateur'} ?`,
            message: `La demande de ${roleLabel} sera définitivement refusée. L'utilisateur en sera notifié par email avec la raison du rejet.`,
            variant: 'danger',
            confirmText: 'Rejeter',
            cancelText: 'Annuler',
        });
    };

    /**
     * Confirmation de suspension de compte
     * @param {string} nom - Nom de l'utilisateur
     * @returns {Promise<boolean>}
     */
    const confirmSuspend = async (nom = '') => {
        return await confirm({
            title: `Suspendre ${nom ? `"${nom}"` : 'ce compte'} ?`,
            message: `L'accès sera temporairement bloqué. Vous pourrez réactiver ce compte plus tard.`,
            variant: 'warning',
            confirmText: 'Suspendre',
            cancelText: 'Annuler',
        });
    };

    /**
     * Confirmation de réactivation de compte
     * @param {string} nom - Nom de l'utilisateur
     * @returns {Promise<boolean>}
     */
    const confirmReactivate = async (nom = '') => {
        return await confirm({
            title: `Réactiver ${nom ? `"${nom}"` : 'ce compte'} ?`,
            message: `L'utilisateur pourra à nouveau accéder à son compte et reprendre ses activités.`,
            variant: 'info',
            confirmText: 'Réactiver',
            cancelText: 'Annuler',
        });
    };

    /**
     * Confirmation d'archivage
     * @param {string} type - Type d'entité
     * @param {string} nom - Nom de l'entité
     * @returns {Promise<boolean>}
     */
    const confirmArchive = async (type = 'élément', nom = '') => {
        return await confirm({
            title: `Archiver ${nom ? `"${nom}"` : `ce ${type}`} ?`,
            message: `${nom ? `Le ${type} "${nom}"` : `Cet ${type}`} sera déplacé dans les archives et ne sera plus visible.`,
            variant: 'warning',
            confirmText: 'Archiver',
            cancelText: 'Annuler',
        });
    };

    /**
     * Confirmation de changement de statut en masse
     * @param {number} count - Nombre d'éléments sélectionnés
     * @param {string} nouveauStatut - Nouveau statut (actif, inactif, etc.)
     * @returns {Promise<boolean>}
     */
    const confirmBulkStatusChange = async (count = 0, nouveauStatut = '') => {
        return await confirm({
            title: `Modifier ${count} élément(s) ?`,
            message: `Les éléments sélectionnés passeront au statut "${nouveauStatut}".`,
            variant: nouveauStatut === 'inactif' ? 'warning' : 'info',
            confirmText: 'Confirmer',
            cancelText: 'Annuler',
        });
    };

    /**
     * Confirmation de suppression en masse
     * @param {number} count - Nombre d'éléments sélectionnés
     * @param {string} type - Type d'entités (produits, clients, etc.)
     * @returns {Promise<boolean>}
     */
    const confirmBulkDelete = async (count = 0, type = 'éléments') => {
        return await confirm({
            title: `Supprimer ${count} ${type} ?`,
            message: `Cette action est irréversible. Les ${count} ${type} sélectionné(s) seront définitivement supprimés.`,
            variant: 'danger',
            confirmText: `Supprimer ${count} ${type}`,
            cancelText: 'Annuler',
        });
    };

    /**
     * Confirmation avant de quitter avec modifications non sauvegardées
     * @returns {Promise<boolean>}
     */
    const confirmUnsavedChanges = async () => {
        return await confirm({
            title: 'Modifications non sauvegardées',
            message:
                'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ?',
            variant: 'warning',
            confirmText: 'Quitter sans sauvegarder',
            cancelText: 'Rester sur la page',
        });
    };

    /**
     * Confirmation de changement de rôle
     * @param {string} nom - Nom de l'utilisateur
     * @param {string} nouveauRole - Nouveau rôle
     * @returns {Promise<boolean>}
     */
    const confirmRoleChange = async (nom = '', nouveauRole = '') => {
        return await confirm({
            title: `Changer le rôle de ${nom || 'cet utilisateur'} ?`,
            message: `${nom ? `"${nom}"` : 'Cet utilisateur'} deviendra ${nouveauRole}. Cette action modifiera ses permissions.`,
            variant: 'warning',
            confirmText: 'Changer le rôle',
            cancelText: 'Annuler',
        });
    };

    /**
     * Fonction générique pour les actions personnalisées
     * @param {Object} config - Configuration de la confirmation
     * @returns {Promise<boolean>}
     */
    const confirmAction = async config => {
        return await confirm(config);
    };

    // Export des bonnes fonctions
    return {
        confirmDelete,
        confirmBlock,
        confirmUnblock,
        confirmCancelOrder,
        confirmApproveRequest,
        confirmRejectRequest,
        confirmSuspend,
        confirmReactivate,
        confirmArchive,
        confirmBulkStatusChange,
        confirmBulkDelete,
        confirmUnsavedChanges,
        confirmRoleChange,
        confirmAction,
    };
};
