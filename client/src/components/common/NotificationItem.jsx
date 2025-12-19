import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import './NotificationItem.scss';

// Composant d'une notification
const NotificationItem = ({ notification, formatDate, onClose }) => {
    const { markAsRead, deleteNotification } = useNotifications();

    // Gérer le clic sur la notification
    const handleClick = async () => {
        if (!notification.lue && notification._id) {
            await markAsRead(notification._id);
        }
        onClose?.();
    };

    // Gérer la suppression de la notification
    const handleDelete = async e => {
        e.stopPropagation();
        if (notification._id) {
            await deleteNotification(notification._id);
        }
    };

    // Obtenir l'icône et la classe de priorité de la notification
    const getIcon = () => {
        switch (notification.type) {
            case 'produit':
                return notification.titre?.includes('rejeté')
                    ? 'fas fa-times-circle'
                    : 'fas fa-check-circle';
            case 'utilisateur':
                return 'fas fa-user';
            case 'commande':
                return 'fas fa-shopping-cart';
            case 'systeme':
                return 'fas fa-cog';
            default:
                return 'fas fa-bell';
        }
    };

    // Obtenir la classe de priorité de la notification
    const getPriorityClass = () => {
        switch (notification.priorite) {
            case 'urgente':
                return 'urgent';
            case 'haute':
                return 'high';
            case 'normale':
                return 'normal';
            case 'basse':
                return 'low';
            default:
                return 'normal';
        }
    };

    // Obtenir le lien associé à la notification
    const getNotificationLink = () => {
        if (notification.donneesSupplementaires) {
            if (notification.donneesSupplementaires.produitId) {
                return `/admin/produits/${notification.donneesSupplementaires.produitId}`;
            }
            if (notification.donneesSupplementaires.vendeurId) {
                return `/admin/vendeurs/${notification.donneesSupplementaires.vendeurId}`;
            }
            if (notification.donneesSupplementaires.commandeId) {
                return `/admin/commandes/${notification.donneesSupplementaires.commandeId}`;
            }
        }

        if (notification.type === 'produit') {
            return '/moderateur/demandes?type=produit';
        }
        if (notification.type === 'utilisateur') {
            return '/moderateur/demandes?type=vendeur';
        }

        return '#';
    };

    const link = getNotificationLink();

    // Rendu du composant
    return (
        <div
            className={`notification-item ${getPriorityClass()} ${notification.lue ? 'read' : 'unread'}`}
            onClick={handleClick}
        >
            <div className="notification-icon">
                <i className={getIcon()}></i>
            </div>

            <div className="notification-content">
                <div className="notification-header">
                    <h4 className="notification-title">{notification.titre}</h4>
                    <span className="notification-time">
                        {formatDate(
                            notification.timestamp || notification.createdAt
                        )}
                    </span>
                </div>

                <p className="notification-message">{notification.message}</p>

                {notification.donneesSupplementaires && (
                    <div className="notification-data">
                        {notification.donneesSupplementaires.produitNom && (
                            <span className="data-tag">
                                <i className="fas fa-box"></i>
                                {notification.donneesSupplementaires.produitNom}
                            </span>
                        )}
                        {notification.donneesSupplementaires.decision && (
                            <span
                                className={`data-tag decision-${notification.donneesSupplementaires.decision}`}
                            >
                                <i
                                    className={`fas fa-${notification.donneesSupplementaires.decision === 'approuve' ? 'check' : 'times'}`}
                                ></i>
                                {notification.donneesSupplementaires
                                    .decision === 'approuve'
                                    ? 'Approuvé'
                                    : 'Rejeté'}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="notification-actions">
                {link !== '#' ? (
                    <Link
                        to={link}
                        className="btn-action view"
                        onClick={e => e.stopPropagation()}
                    >
                        <i className="fas fa-eye"></i>
                    </Link>
                ) : (
                    <button className="btn-action view disabled" disabled>
                        <i className="fas fa-eye"></i>
                    </button>
                )}

                <button className="btn-action delete" onClick={handleDelete}>
                    <i className="fas fa-trash"></i>
                </button>
            </div>
        </div>
    );
};

export default NotificationItem;