import { api } from './api.js';

// Service de gestion des notifications
export const notificationService = {
    getNotifications: async (params = {}) => {
        try {
            const response = await api.get('/notifications', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération notifications:', error);
            throw error;
        }
    },

    // Récupérer les notifications non lues
    getUnreadNotifications: async () => {
        try {
            const response = await api.get('/notifications/non-lues');
            return response.data;
        } catch (error) {
            console.error('Erreur récupération notifications non lues:', error);
            throw error;
        }
    },

    // Marquer une notification comme lue
    markAsRead: async notificationId => {
        try {
            const response = await api.put(
                `/notifications/${notificationId}/lire`
            );
            return response.data;
        } catch (error) {
            console.error('Erreur marquer comme lu:', error);
            throw error;
        }
    },
    // Marquer toutes les notifications comme lues
    markAllAsRead: async () => {
        try {
            const response = await api.put('/notifications/tout-lire');
            return response.data;
        } catch (error) {
            console.error('Erreur marquer tout comme lu:', error);
            throw error;
        }
    },

    // Supprimer une notification
    deleteNotification: async notificationId => {
        try {
            const response = await api.delete(
                `/notifications/${notificationId}`
            );
            return response.data;
        } catch (error) {
            console.error('Erreur suppression notification:', error);
            throw error;
        }
    },

    // Récupérer les statistiques des notifications
    getNotificationStats: async () => {
        try {
            const response = await api.get('/notifications/stats');
            return response.data;
        } catch (error) {
            console.error('Erreur statistiques notifications:', error);
            throw error;
        }
    },
};