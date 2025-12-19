import express from 'express';
import {
    getNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getNotificationStats,
} from '../controllers/notificationController.js';
import { proteger } from '../middleware/authMiddleware.js';

// Routeur pour les notifications
const router = express.Router();

// Protection de toutes les routes
router.use(proteger);
router.route('/').get(getNotifications);
router.route('/non-lues').get(getUnreadNotifications);
router.route('/stats').get(getNotificationStats);
router.route('/:id/lire').put(markNotificationAsRead);
router.route('/tout-lire').put(markAllNotificationsAsRead);
router.route('/:id').delete(deleteNotification);

export default router;