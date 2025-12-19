import React, { useState } from 'react';
import { useNotifications } from '../../../contexts/NotificationContext';
import './CentreNotifications.scss';

// Composant CentreNotifications pour afficher et gérer les notifications
const CentreNotifications = () => {
    const {
        notifications,
        nonLues,
        loading,
        marquerCommeLu,
        supprimerNotification,
        filtrerNotifications,
    } = useNotifications();

    const [filtreActif, setFiltreActif] = useState('toutes');

    // Marquer comme lu avec API
    const handleMarquerLue = async id => {
        await marquerCommeLu(id);
    };

    // Supprimer avec API
    const handleSupprimer = async id => {
        if (
            window.confirm(
                'Êtes-vous sûr de vouloir supprimer cette notification ?'
            )
        ) {
            await supprimerNotification(id);
        }
    };

    // Utiliser filtrerNotifications du contexte
    const notificationsFiltrees = filtrerNotifications(filtreActif);

    if (loading) {
        return (
            <div className="centre-notifications">
                <p>Chargement...</p>
            </div>
        );
    }

    return (
        <div className="centre-notifications">
            <div className="header-notifications">
                <h3>Notifications</h3>
                <div className="filtres">
                    <button
                        className={filtreActif === 'toutes' ? 'actif' : ''}
                        onClick={() => setFiltreActif('toutes')}
                    >
                        Toutes ({notifications.length})
                    </button>
                    <button
                        className={filtreActif === 'non-lues' ? 'actif' : ''}
                        onClick={() => setFiltreActif('non-lues')}
                    >
                        Non lues ({nonLues.length})
                    </button>
                </div>
            </div>

            <div className="liste-notifications">
                {notificationsFiltrees.length === 0 ? (
                    <p className="aucune-notification">Aucune notification</p>
                ) : (
                    notificationsFiltrees.map(notification => (
                        <div
                            key={notification._id}
                            className={`notification-item ${!notification.lue ? 'non-lue' : ''}`}
                        >
                            <div className="notification-contenu">
                                <div className="notification-icone">
                                    {notification.type === 'commande' && ''}
                                    {notification.type === 'paiement' && ''}
                                    {notification.type === 'utilisateur' && ''}
                                    {notification.type === 'systeme' && ''}
                                </div>
                                <div className="notification-texte">
                                    <h4>{notification.titre}</h4>
                                    <p>{notification.message}</p>
                                    <span className="notification-date">
                                        {new Date(
                                            notification.createdAt
                                        ).toLocaleString('fr-FR')}
                                    </span>
                                </div>
                            </div>
                            <div className="notification-actions">
                                {!notification.lue && (
                                    <button
                                        className="btn-marquer-lu"
                                        onClick={() =>
                                            handleMarquerLue(notification._id)
                                        }
                                        title="Marquer comme lu"
                                    ></button>
                                )}
                                <button
                                    className="btn-supprimer"
                                    onClick={() =>
                                        handleSupprimer(notification._id)
                                    }
                                    title="Supprimer"
                                ></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CentreNotifications;
