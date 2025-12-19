import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService.js';
import { websocketService } from '../services/websocketService.js';

const NotificationContext = createContext();

// Hook personnalisé pour utiliser le contexte des notifications
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            'useNotifications must be used within NotificationProvider'
        );
    }
    return context;
};

// Fournisseur de contexte des notifications
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        fetchNotifications();
        setupWebSocket();

        return () => {
            websocketService.disconnect();
        };
    }, []);

    // Charger les notifications depuis le serveur
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getNotifications();
            if (response.succes) {
                setNotifications(response.donnees.notifications || []);
                updateUnreadCount(response.donnees.notifications || []);
            }
        } catch (error) {
            console.error('Erreur chargement notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mettre à jour le compteur de notifications non lues
    const updateUnreadCount = notifs => {
        const count = notifs.filter(n => !n.lue).length;
        setUnreadCount(count);
    };

    // Configurer la connexion WebSocket pour les notifications en temps réel
    const setupWebSocket = () => {
        websocketService.connect();

        websocketService.on('notification:generique', notification => {
            handleNewNotification(notification);
        });

        websocketService.on('notification:nouveau-produit', notification => {
            handleNewNotification(notification);
        });

        websocketService.on('notification:nouveau-vendeur', notification => {
            handleNewNotification(notification);
        });

        websocketService.on(
            'notification:decision-verification',
            notification => {
                handleNewNotification(notification);
            }
        );

        websocketService.on('connection:established', () => {
            setConnected(true);
        });

        websocketService.on('disconnect', () => {
            setConnected(false);
        });
    };

    // Gérer une nouvelle notification reçue
    const handleNewNotification = notification => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        if (Notification.permission === 'granted') {
            new Notification(notification.titre, {
                body: notification.message,
                icon: '/favicon.ico',
            });
        }
    };

    // Marquer une notification comme lue
    const markAsRead = async notificationId => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n._id === notificationId ? { ...n, lue: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erreur marquer comme lu:', error);
        }
    };

    // Marquer toutes les notifications comme lues
    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Erreur marquer tout comme lu:', error);
        }
    };

    // Supprimer une notification
    const deleteNotification = async notificationId => {
        try {
            await notificationService.deleteNotification(notificationId);
            const notification = notifications.find(
                n => n._id === notificationId
            );
            setNotifications(prev =>
                prev.filter(n => n._id !== notificationId)
            );
            if (notification && !notification.lue) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Erreur suppression notification:', error);
        }
    };

    // Valeur du contexte à fournir
    const value = {
        notifications,
        unreadCount,
        loading,
        connected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    };

    // Rendu du fournisseur de contexte
    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};