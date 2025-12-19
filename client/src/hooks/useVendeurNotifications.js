import { useState, useEffect } from 'react';
import { useVendeurWebSocket } from '../contexts/VendeurWebSocketContext';
import notificationService from '../services/notificationService';

export const useVendeurNotifications = () => {
    const {
        connecte,
        notifications: notificationsTempsReel,
        notificationsNonLues,
        marquerCommeLue,
        marquerToutesCommeLues,
        supprimerNotification,
    } = useVendeurWebSocket();

    const [notificationsDB, setNotificationsDB] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    // Charger les notifications depuis la DB au montage
    useEffect(() => {
        chargerNotifications();
    }, []);

    // Fonction pour charger les notifications depuis la DB
    const chargerNotifications = async () => {
        try {
            setChargement(true);
            const response = await notificationService.getNotifications();

            if (response.succes) {
                setNotificationsDB(response.notifications || []);
            }
        } catch (err) {
            console.error('Erreur chargement notifications :', err);
            setErreur(err.message);
        } finally {
            setChargement(false);
        }
    };

    // Fusionner notifications DB + temps réel
    const toutesNotifications = [
        ...notificationsTempsReel,
        ...notificationsDB.filter(
            dbNotif =>
                !notificationsTempsReel.some(
                    rtNotif => rtNotif._id === dbNotif._id
                )
        ),
    ].sort(
        (a, b) =>
            new Date(b.dateCreation || b.date) -
            new Date(a.dateCreation || a.date)
    );

    // Compter les notifications non lues
    const totalNonLues = toutesNotifications.filter(n => !n.lue).length;

    // Marquer comme lue (DB + temps réel)
    const marquerLue = async notificationId => {
        try {
            // Marquer en temps réel
            marquerCommeLue(notificationId);

            // Marquer en DB si c'est une notification DB
            const estNotifDB = notificationsDB.some(
                n => n._id === notificationId
            );
            if (estNotifDB) {
                await notificationService.marquerCommeLue(notificationId);
                setNotificationsDB(prev =>
                    prev.map(n =>
                        n._id === notificationId ? { ...n, lue: true } : n
                    )
                );
            }
        } catch (err) {
            console.error('Erreur marquage notification :', err);
        }
    };

    // Marquer toutes comme lues
    const marquerToutesLues = async () => {
        try {
            marquerToutesCommeLues();

            // Marquer toutes en DB
            const idsNonLues = notificationsDB
                .filter(n => !n.lue)
                .map(n => n._id);
            await Promise.all(
                idsNonLues.map(id => notificationService.marquerCommeLue(id))
            );

            setNotificationsDB(prev => prev.map(n => ({ ...n, lue: true })));
        } catch (err) {
            console.error('Erreur marquage toutes notifications :', err);
        }
    };

    // Supprimer notification
    const supprimer = async notificationId => {
        try {
            supprimerNotification(notificationId);

            // Supprimer en DB si c'est une notification DB
            const estNotifDB = notificationsDB.some(
                n => n._id === notificationId
            );
            if (estNotifDB) {
                await notificationService.supprimerNotification(notificationId);
                setNotificationsDB(prev =>
                    prev.filter(n => n._id !== notificationId)
                );
            }
        } catch (err) {
            console.error('Erreur suppression notification :', err);
        }
    };

    // Filtrer les notifications par type
    const filtrerParType = type => {
        return toutesNotifications.filter(n => n.type === type);
    };

    // Obtenir les notifications récentes (dernières 24h)
    const notificationsRecentes = () => {
        const hier = new Date();
        hier.setDate(hier.getDate() - 1);

        return toutesNotifications.filter(n => {
            const date = new Date(n.dateCreation || n.date);
            return date >= hier;
        });
    };

    return {
        // État
        notifications: toutesNotifications,
        notificationsNonLues: totalNonLues,
        chargement,
        erreur,
        connecte,

        // Actions
        chargerNotifications,
        marquerCommeLue: marquerLue,
        marquerToutesCommeLues: marquerToutesLues,
        supprimerNotification: supprimer,

        // Utilitaires
        filtrerParType,
        notificationsRecentes,

        // Statistiques
        stats: {
            total: toutesNotifications.length,
            nonLues: totalNonLues,
            lues: toutesNotifications.length - totalNonLues,
            parType: {
                commandes: filtrerParType('commande').length,
                validations: filtrerParType('validation').length,
                alertes: filtrerParType('alerte').length,
                messages: filtrerParType('message').length,
                avis: filtrerParType('avis').length,
                paiements: filtrerParType('paiement').length,
            },
        },
    };
};

export default useVendeurNotifications;