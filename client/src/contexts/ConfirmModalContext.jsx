import { createContext, useContext, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal/ConfirmModal';

/**
 * Context pour gérer les modales de confirmation globales
 * Permet d'afficher des confirmations depuis n'importe quel composant
 */
const ConfirmModalContext = createContext();

/**
 * Hook personnalisé pour accéder au contexte de confirmation
 * @throws {Error} Si utilisé en dehors du ConfirmModalProvider
 * @returns {Object} { confirm } - Fonction pour déclencher une confirmation
 */
export const useConfirmModal = () => {
    const context = useContext(ConfirmModalContext);
    if (!context) {
        throw new Error(
            'useConfirmModal doit être utilisé dans un ConfirmModalProvider'
        );
    }
    return context;
};

/**
 * Provider pour les modales de confirmation
 * Wrapper l'application entière pour rendre confirm() accessible partout
 */
export const ConfirmModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState(null);

    /**
     * Affiche une modale de confirmation et retourne une Promise
     * @param {Object} options - Configuration de la modale
     * @param {string} options.title - Titre de la confirmation
     * @param {string} [options.message] - Message détaillé (optionnel)
     * @param {string} [options.variant='default'] - Style : 'danger', 'warning', 'info', 'default'
     * @returns {Promise<boolean>} true si confirmé, false si annulé
     *
     * @example
     * const confirmed = await confirm({
     *   title: "Supprimer ce produit ?",
     *   message: "Cette action est irréversible.",
     *   variant: "danger"
     * });
     */
    const confirm = ({ title, message, variant = 'default' }) => {
        return new Promise(resolve => {
            setModalConfig({
                title,
                message,
                variant,
                onConfirm: () => {
                    setModalConfig(null);
                    resolve(true);
                },
                onCancel: () => {
                    setModalConfig(null);
                    resolve(false);
                },
            });
        });
    };

    return (
        <ConfirmModalContext.Provider value={{ confirm }}>
            {children}
            {modalConfig && <ConfirmModal {...modalConfig} />}
        </ConfirmModalContext.Provider>
    );
};
