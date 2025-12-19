import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';

// Obtenir les notifications avec pagination et filtres
const getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limite = 20, type, lue } = req.query;
    const skip = (page - 1) * limite;

    // Construction du filtre de requête
    const filtre = {};

    if (req.utilisateur.role !== 'admin') {
        filtre.$or = [
            { utilisateurId: req.utilisateur._id },
            { utilisateurId: null },
        ];
    }

    if (type) {
        filtre.type = type;
    }

    if (lue !== undefined) {
        filtre.lue = lue === 'true';
    }

    const notifications = await Notification.find(filtre)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limite));

    const total = await Notification.countDocuments(filtre);

    res.json({
        succes: true,
        donnees: {
            notifications,
            pagination: {
                page: parseInt(page),
                limite: parseInt(limite),
                total,
                pages: Math.ceil(total / limite),
            },
        },
    });
});

// Obtenir les notifications non lues
const getUnreadNotifications = asyncHandler(async (req, res) => {
    const filtre = { lue: false };

    if (req.utilisateur.role !== 'admin') {
        filtre.$or = [
            { utilisateurId: req.utilisateur._id },
            { utilisateurId: null },
        ];
    }

    const notifications = await Notification.find(filtre)
        .sort({ createdAt: -1 })
        .limit(20);

    res.json({
        succes: true,
        donnees: notifications,
    });
});

// Marquer une notification comme lue
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, utilisateurId: req.utilisateur._id },
        { lue: true },
        { new: true }
    );

    if (!notification) {
        const adminNotification = await Notification.findOneAndUpdate(
            { _id: id, utilisateurId: null },
            { lue: true },
            { new: true }
        );

        if (!adminNotification) {
            res.status(404);
            throw new Error('Notification non trouvée');
        }

        return res.json({
            succes: true,
            donnees: adminNotification,
            message: 'Notification marquée comme lue',
        });
    }

    res.json({
        succes: true,
        donnees: notification,
        message: 'Notification marquée comme lue',
    });
});

// Marquer toutes les notifications comme lues
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const filtre = { lue: false };

    if (req.utilisateur.role !== 'admin') {
        filtre.$or = [
            { utilisateurId: req.utilisateur._id },
            { utilisateurId: null },
        ];
    }

    const resultat = await Notification.updateMany(filtre, { lue: true });

    res.json({
        succes: true,
        donnees: {
            modifiedCount: resultat.modifiedCount,
        },
        message: `${resultat.modifiedCount} notifications marquées comme lues`,
    });
});

// Supprimer une notification
const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;

    let notification;

    if (req.utilisateur.role === 'admin') {
        notification = await Notification.findByIdAndDelete(id);
    } else {
        notification = await Notification.findOneAndDelete({
            _id: id,
            utilisateurId: req.utilisateur._id,
        });
    }

    if (!notification) {
        res.status(404);
        throw new Error('Notification non trouvée');
    }

    res.json({
        succes: true,
        message: 'Notification supprimée avec succès',
    });
});

// Obtenir les statistiques des notifications
const getNotificationStats = asyncHandler(async (req, res) => {
    const filtre = {};

    if (req.utilisateur.role !== 'admin') {
        filtre.$or = [
            { utilisateurId: req.utilisateur._id },
            { utilisateurId: null },
        ];
    }

    const total = await Notification.countDocuments(filtre);
    const nonLues = await Notification.countDocuments({
        ...filtre,
        lue: false,
    });

    const parType = await Notification.aggregate([
        { $match: filtre },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                nonLues: {
                    $sum: { $cond: [{ $eq: ['$lue', false] }, 1, 0] },
                },
            },
        },
    ]);

    res.json({
        succes: true,
        donnees: {
            total,
            nonLues,
            parType,
        },
    });
});

export {
    getNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getNotificationStats,
};