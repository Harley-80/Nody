import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import { Link } from 'react-router-dom';
import './NotificationsDropdown.scss';

// Composant du dropdown des notifications
const NotificationsDropdown = ({ onClose }) => {
    const { notifications, unreadCount, loading, markAllAsRead } =
        useNotifications();

    // Gestion de la fermeture du dropdown avec la touche Échap
    useEffect(() => {
        const handleEscape = e => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        // Ajouter et nettoyer l'écouteur d'événement
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    // Formater la date d'une notification
    const formatDate = dateString => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays < 7) return `Il y a ${diffDays} j`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
        });
    };

    // Regrouper les notifications par type
    const getNotificationsByType = () => {
        const grouped = {
            produit: [],
            utilisateur: [],
            systeme: [],
            commande: [],
            autre: [],
        };

        notifications.slice(0, 10).forEach(notification => {
            if (grouped[notification.type]) {
                grouped[notification.type].push(notification);
            } else {
                grouped.autre.push(notification);
            }
        });

        return grouped;
    };

    const groupedNotifications = getNotificationsByType();

    // Rendu du composant
    return (
        <div className="notifications-dropdown">
            <div className="dropdown-header">
                <h3>Notifications</h3>
                <div className="header-actions">
                    {unreadCount > 0 && (
                        <button
                            className="btn-mark-all-read"
                            onClick={handleMarkAllAsRead}
                        >
                            <i className="fas fa-check-double"></i>
                            Tout marquer comme lu
                        </button>
                    )}
                    <button className="btn-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div className="dropdown-body">
                {loading ? (
                    <div className="loading-notifications">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Chargement des notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="empty-notifications">
                        <i className="fas fa-bell-slash"></i>
                        <p>Aucune notification</p>
                        <p className="subtext">
                            Vous serez notifié quand quelque chose se produit
                        </p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {groupedNotifications.produit.length > 0 && (
                            <div className="notification-category">
                                <h4>
                                    <i className="fas fa-box"></i>
                                    Produits
                                </h4>
                                {groupedNotifications.produit.map(
                                    notification => (
                                        <NotificationItem
                                            key={
                                                notification._id ||
                                                notification.timestamp
                                            }
                                            notification={notification}
                                            formatDate={formatDate}
                                            onClose={onClose}
                                        />
                                    )
                                )}
                            </div>
                        )}

                        {groupedNotifications.utilisateur.length > 0 && (
                            <div className="notification-category">
                                <h4>
                                    <i className="fas fa-users"></i>
                                    Utilisateurs
                                </h4>
                                {groupedNotifications.utilisateur.map(
                                    notification => (
                                        <NotificationItem
                                            key={
                                                notification._id ||
                                                notification.timestamp
                                            }
                                            notification={notification}
                                            formatDate={formatDate}
                                            onClose={onClose}
                                        />
                                    )
                                )}
                            </div>
                        )}

                        {groupedNotifications.commande.length > 0 && (
                            <div className="notification-category">
                                <h4>
                                    <i className="fas fa-shopping-cart"></i>
                                    Commandes
                                </h4>
                                {groupedNotifications.commande.map(
                                    notification => (
                                        <NotificationItem
                                            key={
                                                notification._id ||
                                                notification.timestamp
                                            }
                                            notification={notification}
                                            formatDate={formatDate}
                                            onClose={onClose}
                                        />
                                    )
                                )}
                            </div>
                        )}

                        {groupedNotifications.systeme.length > 0 && (
                            <div className="notification-category">
                                <h4>
                                    <i className="fas fa-cog"></i>
                                    Système
                                </h4>
                                {groupedNotifications.systeme.map(
                                    notification => (
                                        <NotificationItem
                                            key={
                                                notification._id ||
                                                notification.timestamp
                                            }
                                            notification={notification}
                                            formatDate={formatDate}
                                            onClose={onClose}
                                        />
                                    )
                                )}
                            </div>
                        )}

                        {groupedNotifications.autre.length > 0 && (
                            <div className="notification-category">
                                <h4>
                                    <i className="fas fa-ellipsis-h"></i>
                                    Autres
                                </h4>
                                {groupedNotifications.autre.map(
                                    notification => (
                                        <NotificationItem
                                            key={
                                                notification._id ||
                                                notification.timestamp
                                            }
                                            notification={notification}
                                            formatDate={formatDate}
                                            onClose={onClose}
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="dropdown-footer">
                <Link to="/notifications" onClick={onClose}>
                    <i className="fas fa-list"></i>
                    Voir toutes les notifications
                </Link>
                <Link to="/parametres/notifications" onClick={onClose}>
                    <i className="fas fa-cog"></i>
                    Paramètres
                </Link>
            </div>
        </div>
    );
};

export default NotificationsDropdown;