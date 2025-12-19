import React, { createContext, useContext, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal/ConfirmModal';

const ConfirmContext = createContext();

/**
 * Hook personnalisé pour accéder aux fonctions de confirmation
 * @returns {Object} { confirmDelete, confirmBlock, confirmUnblock, confirm }
 */
export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm doit être utilisé dans un ConfirmProvider');
    }
    return context;
};

/**
 * Provider pour les modales de confirmation
 */
export const ConfirmProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState(null);

    /**
     * Fonction générique de confirmation
     * @param {string} title - Titre de la modale
     * @param {string} message - Message détaillé
     * @param {string} variant - Style : 'danger', 'warning', 'info', 'default'
     * @returns {Promise<boolean>} true si confirmé, false si annulé
     */
    const confirm = (title, message = '', variant = 'default') => {
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

    /**
     * Confirmation de suppression
     * @param {string} title - Titre (ex: "Supprimer Jean Dupont ?")
     * @param {string} message - Message (ex: "Cette action est irréversible")
     * @returns {Promise<boolean>}
     */
    const confirmDelete = (
        title,
        message = 'Cette action est irréversible'
    ) => {
        return confirm(title, message, 'danger');
    };

    /**
     * Confirmation de blocage
     * @param {string} title - Titre (ex: "Bloquer Jean Dupont ?")
     * @param {string} message - Message détaillé
     * @returns {Promise<boolean>}
     */
    const confirmBlock = (title, message = '') => {
        return confirm(title, message, 'warning');
    };

    /**
     * Confirmation de déblocage
     * @param {string} title - Titre (ex: "Débloquer Jean Dupont ?")
     * @param {string} message - Message détaillé
     * @returns {Promise<boolean>}
     */
    const confirmUnblock = (title, message = '') => {
        return confirm(title, message, 'info');
    };

    return (
        <ConfirmContext.Provider
            value={{
                confirm,
                confirmDelete,
                confirmBlock,
                confirmUnblock,
            }}
        >
            {children}
            {modalConfig && <ConfirmModal {...modalConfig} />}
        </ConfirmContext.Provider>
    );
};
