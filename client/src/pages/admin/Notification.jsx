import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { notificationService } from '../services/notificationService';
import './Notifications.scss';

// Page de gestion des notifications dans l'admin
const Notifications = () => {
    const {
        notifications,
        loading,
        markAsRead,
        deleteNotification,
        markAllAsRead,
    } = useNotifications();
    const [filter, setFilter] = useState('all');
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        filterNotifications();
    }, [notifications, filter]);

    const fetchStats = async () => {
        try {
            const response = await notificationService.getNotificationStats();
            if (response.succes) {
                setStats(response.donnees);
            }
        } catch (error) {
            console.error('Erreur récupération stats:', error);
        }
    };

    // Filtrer les notifications selon le filtre sélectionné
    const filterNotifications = () => {
        let filtered = [...notifications];

        if (filter === 'unread') {
            filtered = filtered.filter(n => !n.lue);
        } else if (filter !== 'all') {
            filtered = filtered.filter(n => n.type === filter);
        }

        setFilteredNotifications(filtered);
    };

    // Formater la date d'une notification
    const formatDate = dateString => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Obtenir le libellé du type de notification
    const getTypeLabel = type => {
        const labels = {
            produit: 'Produits',
            utilisateur: 'Utilisateurs',
            commande: 'Commandes',
            systeme: 'Système',
            demande: 'Demandes',
        };
        return labels[type] || type;
    };

    // Obtenir le libellé de la priorité de notification
    const getPriorityLabel = priority => {
        const labels = {
            urgente: 'Urgente',
            haute: 'Haute',
            normale: 'Normale',
            basse: 'Basse',
        };
        return labels[priority] || priority;
    };

    // Gérer une action groupée sur les notifications
    const handleBulkAction = async action => {
        if (action === 'read') {
            await markAllAsRead();
        } else if (action === 'delete') {
            if (window.confirm('Supprimer toutes les notifications ?')) {
                for (const notification of filteredNotifications) {
                    if (notification._id) {
                        await deleteNotification(notification._id);
                    }
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="notifications-container">
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Chargement des notifications...</p>
                </div>
            </div>
        );
    }

    // Rendu principal de la page
    return (
        <div className="notifications-container">
            <div className="page-header">
                <h1>
                    <i className="fas fa-bell"></i>
                    Notifications
                </h1>
                <div className="header-actions">
                    <button
                        className="btn-refresh"
                        onClick={() => window.location.reload()}
                    >
                        <i className="fas fa-redo"></i>
                        Actualiser
                    </button>
                </div>
            </div>

            {stats && (
                <div className="stats-cards">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-bell"></i>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.total}</h3>
                            <p>Total notifications</p>
                        </div>
                    </div>
                    <div className="stat-card urgent">
                        <div className="stat-icon urgent">
                            <i className="fas fa-exclamation-circle"></i>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.nonLues}</h3>
                            <p>Non lues</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-chart-pie"></i>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.parType?.length || 0}</h3>
                            <p>Catégories</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="notifications-content">
                <div className="filters-section">
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Toutes
                        </button>
                        <button
                            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Non lues
                        </button>
                        <button
                            className={`filter-btn ${filter === 'produit' ? 'active' : ''}`}
                            onClick={() => setFilter('produit')}
                        >
                            Produits
                        </button>
                        <button
                            className={`filter-btn ${filter === 'utilisateur' ? 'active' : ''}`}
                            onClick={() => setFilter('utilisateur')}
                        >
                            Utilisateurs
                        </button>
                    </div>

                    <div className="bulk-actions">
                        <select
                            className="bulk-select"
                            onChange={e => handleBulkAction(e.target.value)}
                            defaultValue=""
                        >
                            <option value="" disabled>
                                Actions groupées
                            </option>
                            <option value="read">Marquer tout comme lu</option>
                            <option value="delete">Supprimer tout</option>
                        </select>
                    </div>
                </div>

                <div className="notifications-list">
                    {filteredNotifications.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-bell-slash"></i>
                            <p>Aucune notification</p>
                            <p className="subtext">
                                {filter === 'unread'
                                    ? "Vous n'avez pas de notifications non lues"
                                    : "Vous n'avez pas de notifications"}
                            </p>
                        </div>
                    ) : (
                        <div className="notifications-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Notification</th>
                                        <th>Priorité</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredNotifications.map(notification => (
                                        <tr
                                            key={
                                                notification._id ||
                                                notification.timestamp
                                            }
                                            className={
                                                notification.lue
                                                    ? 'read'
                                                    : 'unread'
                                            }
                                        >
                                            <td>
                                                <span
                                                    className={`notification-type ${notification.type}`}
                                                >
                                                    <i
                                                        className={`fas fa-${
                                                            notification.type ===
                                                            'produit'
                                                                ? 'box'
                                                                : notification.type ===
                                                                    'utilisateur'
                                                                    ? 'user'
                                                                    : notification.type ===
                                                                        'commande'
                                                                    ? 'shopping-cart'
                                                                    : 'cog'
                                                        }`}
                                                    ></i>
                                                    {getTypeLabel(
                                                        notification.type
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="notification-details">
                                                    <div className="notification-title">
                                                        {notification.titre}
                                                    </div>
                                                    <div className="notification-message">
                                                        {notification.message}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`priority-badge ${notification.priorite || 'normale'}`}
                                                >
                                                    {getPriorityLabel(
                                                        notification.priorite
                                                    )}
                                                </span>
                                            </td>
                                            <td className="notification-date">
                                                {formatDate(
                                                    notification.timestamp ||
                                                        notification.createdAt
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-badge ${notification.lue ? 'read' : 'unread'}`}
                                                >
                                                    {notification.lue
                                                        ? 'Lu'
                                                        : 'Non lu'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="notification-actions">
                                                    {!notification.lue &&
                                                        notification._id && (
                                                            <button
                                                                className="btn-action read"
                                                                onClick={() =>
                                                                    markAsRead(
                                                                        notification._id
                                                                    )
                                                                }
                                                                title="Marquer comme lu"
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                        )}
                                                    <button
                                                        className="btn-action delete"
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    'Supprimer cette notification ?'
                                                                )
                                                            ) {
                                                                deleteNotification(
                                                                    notification._id
                                                                );
                                                            }
                                                        }}
                                                        title="Supprimer"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;