import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const VendeurWebSocketContext = createContext(null);

export const useVendeurWebSocket = () => {
    const context = useContext(VendeurWebSocketContext);
    if (!context) {
        throw new Error(
            'useVendeurWebSocket doit être utilisé dans VendeurWebSocketProvider'
        );
    }
    return context;
};

export const VendeurWebSocketProvider = ({ children }) => {
    const { utilisateur, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connecte, setConnecte] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationsNonLues, setNotificationsNonLues] = useState(0);

    // Connexion au WebSocket
    useEffect(() => {
        // Ne connecter que si utilisateur vendeur authentifié
        if (!utilisateur || utilisateur.role !== 'vendeur' || !token) {
            return;
        }

        const socketInstance = io(
            import.meta.env.VITE_API_URL || 'http://localhost:5000',
            {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
            }
        );

        // Événement de connexion réussie
        socketInstance.on('connexionEtablie', data => {
            console.log('WebSocket connecté :', data);
            setConnecte(true);
            toast.success('Notifications temps réel activées', {
                position: 'bottom-right',
                autoClose: 3000,
            });
        });

        // NOUVELLE COMMANDE
        socketInstance.on('nouvelleCommande', data => {
            console.log('Nouvelle commande reçue :', data);

            toast.success(
                <div>
                    <strong>{data.titre}</strong>
                    <p>{data.message}</p>
                </div>,
                {
                    position: 'top-right',
                    autoClose: 8000,
                    onClick: () => (window.location.href = data.lienAction),
                }
            );

            ajouterNotification(data);
        });

        // MISE À JOUR COMMANDE
        socketInstance.on('commandeMiseAJour', data => {
            console.log('Mise à jour commande :', data);

            toast.info(
                <div>
                    <strong>{data.titre}</strong>
                    <p>{data.message}</p>
                </div>,
                {
                    position: 'top-right',
                    autoClose: 5000,
                    onClick: () => (window.location.href = data.lienAction),
                }
            );

            ajouterNotification(data);
        });

        // ALERTE STOCK FAIBLE
        socketInstance.on('alerteStockFaible', data => {
            console.log('Alerte stock faible :', data);

            toast.warning(
                <div>
                    <strong>{data.titre}</strong>
                    <p>{data.message}</p>
                </div>,
                {
                    position: 'top-right',
                    autoClose: 10000,
                    onClick: () => (window.location.href = data.lienAction),
                }
            );

            ajouterNotification(data);
        });

        // VALIDATION PRODUIT
        socketInstance.on('validationProduit', data => {
            console.log('Validation produit :', data);

            const estApprouve = data.produit?.statut === 'approuve';

            (estApprouve ? toast.success : toast.error)(
                <div>
                    <strong>{data.titre}</strong>
                    <p>{data.message}</p>
                </div>,
                {
                    position: 'top-center',
                    autoClose: 10000,
                    onClick: () => (window.location.href = data.lienAction),
                }
            );

            ajouterNotification(data);
        });

        // VALIDATION VENDEUR
        socketInstance.on('validationVendeur', data => {
            console.log('Validation vendeur :', data);

            const estApprouve = data.decision === 'approuve';

            (estApprouve ? toast.success : toast.error)(
                <div>
                    <strong>{data.titre}</strong>
                    <p>{data.message}</p>
                </div>,
                {
                    position: 'top-center',
                    autoClose: 15000,
                    onClick: () => (window.location.href = data.lienAction),
                }
            );

            ajouterNotification(data);
        });

        // NOUVEAU MESSAGE
        socketInstance.on('nouveauMessage', data => {
            console.log('Nouveau message :', data);

            toast.info(
                <div>
                    <strong>{data.titre}</strong>
                    <p>{data.message}</p>
                </div>,
                {
                    position: 'bottom-right',
                    autoClose: 6000,
                    onClick: () => (window.location.href = data.lienAction),
                }
            );

            ajouterNotification(data);
        });

        // NOUVEL AVIS
        socketInstance.on('nouvelAvis', data => {
            console.log('Nouvel avis :', data);

            toast.info(
                <div>
                    <strong>{data.titre}</strong>
                    <p>{data.message}</p>
                </div>,
                {
                    position: 'bottom-right',
                    autoClose: 6000,
                    onClick: () => (window.location.href = data.lienAction),
                }
            );

            ajouterNotification(data);
        });

        // PAIEMENT REÇU
        socketInstance.on('paiementRecu', data => {
            console.log('Paiement reçu :', data);

            toast.success(
                <div>
                    <strong>{data.titre}</strong>
                    <p>{data.message}</p>
                </div>,
                {
                    position: 'top-right',
                    autoClose: 6000,
                    onClick: () => (window.location.href = data.lienAction),
                }
            );

            ajouterNotification(data);
        });

        // STATISTIQUES MISES À JOUR
        socketInstance.on('statsVendeurMiseAJour', data => {
            console.log('Statistiques mises à jour :', data);
            // Déclencher un événement personnalisé pour les composants qui écoutent
            window.dispatchEvent(
                new CustomEvent('statsVendeurUpdate', { detail: data.stats })
            );
        });

        // Gestion des erreurs
        socketInstance.on('error', error => {
            console.error('Erreur WebSocket :', error);
            toast.error('Erreur de connexion temps réel', {
                position: 'bottom-right',
                autoClose: 5000,
            });
        });

        // Déconnexion
        socketInstance.on('disconnect', raison => {
            console.log('WebSocket déconnecté :', raison);
            setConnecte(false);
        });

        setSocket(socketInstance);

        // Cleanup
        return () => {
            socketInstance.disconnect();
        };
    }, [utilisateur, token]);

    // Fonction pour ajouter une notification
    const ajouterNotification = useCallback(notification => {
        setNotifications(prev =>
            [
                {
                    ...notification,
                    id: Date.now(),
                    lue: false,
                    date: new Date(),
                },
                ...prev,
            ].slice(0, 50)
        ); // Garder max 50 notifications

        setNotificationsNonLues(prev => prev + 1);
    }, []);

    // Marquer une notification comme lue
    const marquerCommeLue = useCallback(notificationId => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId ? { ...notif, lue: true } : notif
            )
        );
        setNotificationsNonLues(prev => Math.max(0, prev - 1));
    }, []);

    // Marquer toutes comme lues
    const marquerToutesCommeLues = useCallback(() => {
        setNotifications(prev => prev.map(notif => ({ ...notif, lue: true })));
        setNotificationsNonLues(0);
    }, []);

    // Supprimer une notification
    const supprimerNotification = useCallback(notificationId => {
        setNotifications(prev =>
            prev.filter(notif => notif.id !== notificationId)
        );
    }, []);

    // Test de notification
    const testerNotification = useCallback(() => {
        if (socket && connecte) {
            socket.emit('testNotification', {
                message: 'Test de notification vendeur',
            });
        }
    }, [socket, connecte]);

    const value = {
        socket,
        connecte,
        notifications,
        notificationsNonLues,
        marquerCommeLue,
        marquerToutesCommeLues,
        supprimerNotification,
        testerNotification,
    };

    return (
        <VendeurWebSocketContext.Provider value={value}>
            {children}
        </VendeurWebSocketContext.Provider>
    );
};

export default VendeurWebSocketContext;