import React, { useEffect } from 'react';
import './ConfirmModal.scss';

/**
 * Configuration des variantes de modale
 * Chaque variante définit : icône, couleur, textes des boutons
 */
const variantConfig = {
    danger: {
        icon: '🗑️',
        color: '#dc2626',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
    },
    warning: {
        icon: '⚠️',
        color: '#f59e0b',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
    },
    info: {
        icon: 'ℹ️',
        color: '#3b82f6',
        confirmText: 'Continuer',
        cancelText: 'Annuler',
    },
    default: {
        icon: '❓',
        color: '#6b7280',
        confirmText: 'OK',
        cancelText: 'Annuler',
    },
};

/**
 * Composant Modal de Confirmation
 * @param {Object} props
 * @param {string} props.title - Titre de la confirmation
 * @param {string} [props.message] - Message détaillé (optionnel)
 * @param {string} props.variant - Type de modale (danger/warning/info/default)
 * @param {Function} props.onConfirm - Callback de confirmation
 * @param {Function} props.onCancel - Callback d'annulation
 */
const ConfirmModal = ({ title, message, variant, onConfirm, onCancel }) => {
    const config = variantConfig[variant] || variantConfig.default;

    // Gestion du clavier (Esc = Annuler, Enter = Confirmer)
    useEffect(() => {
        const handleKeyDown = e => {
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter') onConfirm();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onConfirm, onCancel]);

    return (
        <div
            className="confirm-modal-overlay"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
        >
            <div
                className="confirm-modal"
                onClick={e => e.stopPropagation()}
                style={{ borderTop: `4px solid ${config.color}` }}
            >
                <div
                    className="confirm-modal-icon"
                    style={{ color: config.color }}
                >
                    {config.icon}
                </div>

                <h3 id="confirm-modal-title" className="confirm-modal-title">
                    {title}
                </h3>

                {message && <p className="confirm-modal-message">{message}</p>}

                <div className="confirm-modal-actions">
                    <button
                        className="confirm-modal-btn confirm-modal-btn-cancel"
                        onClick={onCancel}
                        aria-label="Annuler l'action"
                    >
                        {config.cancelText}
                    </button>
                    <button
                        className="confirm-modal-btn confirm-modal-btn-confirm"
                        onClick={onConfirm}
                        style={{ backgroundColor: config.color }}
                        aria-label="Confirmer l'action"
                        autoFocus
                    >
                        {config.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
