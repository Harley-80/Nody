import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import './AdminHeader.scss';

// Composant AdminHeader avec barre de recherche - REFONTE VISUELLE
const AdminHeader = () => {
    const navigate = useNavigate();
    const { unreadCount, notifications, markAsRead, deleteNotification } =
        useNotifications();
    const { user, logout } = useAuth();

    // États pour dropdowns
    const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
    const [menuNotificationsOuvert, setMenuNotificationsOuvert] =
        useState(false);
    const [menuMessagesOuvert, setMenuMessagesOuvert] = useState(false);

    // État pour la recherche
    const [termesRecherche, setTermesRecherche] = useState('');
    const [resultatsRecherche, setResultatsRecherche] = useState([]);
    const [rechercheOuverte, setRechercheOuverte] = useState(false);

    // Refs pour détecter clics externes
    const refProfil = useRef(null);
    const refNotifications = useRef(null);
    const refMessages = useRef(null);
    const refRecherche = useRef(null);

    // Fermer dropdowns au clic externe
    useEffect(() => {
        const handleClickOutside = event => {
            if (
                refProfil.current &&
                !refProfil.current.contains(event.target)
            ) {
                setMenuProfilOuvert(false);
            }
            if (
                refNotifications.current &&
                !refNotifications.current.contains(event.target)
            ) {
                setMenuNotificationsOuvert(false);
            }
            if (
                refMessages.current &&
                !refMessages.current.contains(event.target)
            ) {
                setMenuMessagesOuvert(false);
            }
            if (
                refRecherche.current &&
                !refRecherche.current.contains(event.target)
            ) {
                setRechercheOuverte(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Gestionnaire de recherche
    const handleRecherche = async e => {
        const termes = e.target.value;
        setTermesRecherche(termes);

        if (termes.length < 2) {
            setResultatsRecherche([]);
            setRechercheOuverte(false);
            return;
        }

        // Simuler une recherche
        const resultats = [
            {
                type: 'Commande',
                titre: `Commande #${termes}`,
                url: `/admin/commandes/${termes}`,
                icone: '📦',
            },
            {
                type: 'Client',
                titre: `Client: ${termes}`,
                url: `/admin/clients?search=${termes}`,
                icone: '👤',
            },
            {
                type: 'Produit',
                titre: `Produit: ${termes}`,
                url: `/admin/produits?search=${termes}`,
                icone: '🏷️',
            },
            {
                type: 'Vendeur',
                titre: `Vendeur: ${termes}`,
                url: `/admin/vendeurs?search=${termes}`,
                icone: '👔',
            },
        ].filter(r => r.titre.toLowerCase().includes(termes.toLowerCase()));

        setResultatsRecherche(resultats);
        setRechercheOuverte(resultats.length > 0);
    };

    // Gestionnaire soumission recherche
    const handleSoumissionRecherche = e => {
        e.preventDefault();
        if (termesRecherche.trim()) {
            navigate(
                `/admin/recherche?q=${encodeURIComponent(termesRecherche)}`
            );
            setRechercheOuverte(false);
            setTermesRecherche('');
        }
    };

    // Gestionnaire notification avec marquage comme lu
    const handleNotificationClick = () => {
        setMenuNotificationsOuvert(!menuNotificationsOuvert);
    };

    const handleNotificationItemClick = async notification => {
        if (notification._id && !notification.lue) {
            await markAsRead(notification._id);
        }
        setMenuNotificationsOuvert(false);

        // Navigation selon le type de notification
        if (notification.donneesSupplementaires?.produitId) {
            navigate(
                `/admin/produits/${notification.donneesSupplementaires.produitId}`
            );
        } else if (notification.donneesSupplementaires?.vendeurId) {
            navigate(
                `/admin/vendeurs/${notification.donneesSupplementaires.vendeurId}`
            );
        } else if (notification.type === 'produit') {
            navigate('/moderateur/demandes?type=produit');
        } else if (notification.type === 'utilisateur') {
            navigate('/moderateur/demandes?type=vendeur');
        } else {
            navigate('/admin/notifications');
        }
    };

    // Gestionnaire messages
    const handleMessagesClick = () => {
        setMenuMessagesOuvert(!menuMessagesOuvert);
    };

    // Gestionnaire déconnexion
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/connexion');
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    };

    // Formater la date
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
            day: '2-digit',
            month: 'short',
        });
    };

    // Obtenir l'icône selon le type
    const getNotificationIcon = type => {
        switch (type) {
            case 'produit':
                return '📦';
            case 'utilisateur':
                return '👤';
            case 'commande':
                return '🛒';
            case 'paiement':
                return '💳';
            case 'systeme':
                return '⚙️';
            case 'demande':
                return '📋';
            default:
                return '🔔';
        }
    };

    // Obtenir le titre formaté
    const getNotificationTitle = notification => {
        if (notification.titre) return notification.titre;

        switch (notification.type) {
            case 'produit':
                return notification.donneesSupplementaires?.decision ===
                    'approuve'
                    ? 'Produit approuvé'
                    : 'Produit rejeté';
            case 'utilisateur':
                return notification.donneesSupplementaires?.decision ===
                    'approuve'
                    ? 'Vendeur approuvé'
                    : 'Vendeur rejeté';
            default:
                return 'Notification système';
        }
    };

    // Obtenir le message formaté
    const getNotificationMessage = notification => {
        if (notification.message) return notification.message;

        if (notification.donneesSupplementaires) {
            if (notification.donneesSupplementaires.produitNom) {
                return notification.donneesSupplementaires.decision ===
                    'approuve'
                    ? `Le produit "${notification.donneesSupplementaires.produitNom}" a été approuvé`
                    : `Le produit "${notification.donneesSupplementaires.produitNom}" a été rejeté`;
            }
            if (notification.donneesSupplementaires.vendeurNom) {
                return notification.donneesSupplementaires.decision ===
                    'approuve'
                    ? `Le vendeur "${notification.donneesSupplementaires.vendeurNom}" a été approuvé`
                    : `Le vendeur "${notification.donneesSupplementaires.vendeurNom}" a été rejeté`;
            }
        }

        return 'Nouvelle notification';
    };

    // Supprimer une notification
    const handleDeleteNotification = async (e, notificationId) => {
        e.stopPropagation();
        if (window.confirm('Supprimer cette notification ?')) {
            await deleteNotification(notificationId);
        }
    };

    return (
        <header className="admin-header-refonte">
            {/* SECTION GAUCHE : Logo + Bouton Actualiser */}
            <div className="header-left-refonte">
                <button className="welcome-button">
                    <span className="refresh-icon">👋</span>
                    <span className="refresh-text">
                        Bienvenue sur la Plateforme
                    </span>
                </button>
            </div>

            {/* BARRE DE RECHERCHE CENTRALE */}
            <div className="header-center-refonte" ref={refRecherche}>
                <form
                    className="search-bar-refonte"
                    onSubmit={handleSoumissionRecherche}
                >
                    <span className="search-icon-refonte">🔍</span>
                    <input
                        type="text"
                        placeholder="Rechercher commandes, clients, produits..."
                        value={termesRecherche}
                        onChange={handleRecherche}
                        onFocus={() =>
                            termesRecherche.length >= 2 &&
                            setRechercheOuverte(true)
                        }
                        className="search-input-refonte"
                    />
                    {termesRecherche && (
                        <button
                            type="button"
                            className="btn-clear-refonte"
                            onClick={() => {
                                setTermesRecherche('');
                                setResultatsRecherche([]);
                                setRechercheOuverte(false);
                            }}
                        >
                            ✕
                        </button>
                    )}

                    {/* Dropdown résultats recherche */}
                    {rechercheOuverte && resultatsRecherche.length > 0 && (
                        <div className="search-results-refonte">
                            <div className="results-header">
                                <h4>Résultats de recherche</h4>
                                <span className="results-count">
                                    {resultatsRecherche.length} trouvé(s)
                                </span>
                            </div>
                            <div className="results-list">
                                {resultatsRecherche.map((resultat, index) => (
                                    <div
                                        key={index}
                                        className="search-result-item-refonte"
                                        onClick={() => {
                                            navigate(resultat.url);
                                            setRechercheOuverte(false);
                                            setTermesRecherche('');
                                        }}
                                    >
                                        <span className="result-icon-refonte">
                                            {resultat.icone}
                                        </span>
                                        <div className="result-content-refonte">
                                            <p className="result-titre-refonte">
                                                {resultat.titre}
                                            </p>
                                            <div className="result-footer">
                                                <span className="result-type-refonte">
                                                    {resultat.type}
                                                </span>
                                                <span className="result-action">
                                                    →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* SECTION DROITE : Actions */}
            <div className="header-right-refonte">
                {/* ACTIONS RAPIDES */}
                <div className="quick-actions">
                    <button
                        className="quick-action-btn"
                        onClick={() => navigate('/admin/commandes/nouvelle')}
                        title="Nouvelle commande"
                    >
                        <span className="action-icon">➕</span>
                    </button>
                    <button
                        className="quick-action-btn"
                        onClick={() => navigate('/admin/produits/nouveau')}
                        title="Nouveau produit"
                    >
                        <span className="action-icon">🏷️</span>
                    </button>
                </div>

                {/* NOTIFICATIONS - NOUVEAU SYSTÈME INTÉGRÉ */}
                <div
                    className="header-icon-refonte notification-icon-refonte"
                    ref={refNotifications}
                    onClick={handleNotificationClick}
                >
                    <div className="icon-wrapper">
                        <span className="icon">🔔</span>
                        {unreadCount > 0 && (
                            <span className="badge-refonte">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>

                    {menuNotificationsOuvert && (
                        <div className="dropdown-notifications-refonte">
                            <div className="dropdown-header-refonte">
                                <div className="header-title">
                                    <h4>Notifications</h4>
                                    {unreadCount > 0 && (
                                        <span className="unread-count">
                                            {unreadCount} non lue(s)
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="btn-voir-tout-refonte"
                                    onClick={() => {
                                        setMenuNotificationsOuvert(false);
                                        navigate('/admin/notifications');
                                    }}
                                >
                                    Voir tout
                                </button>
                            </div>
                            <div className="dropdown-body-refonte">
                                {notifications && notifications.length > 0 ? (
                                    notifications
                                        .slice(0, 5)
                                        .map(notification => (
                                            <div
                                                key={
                                                    notification._id ||
                                                    notification.timestamp
                                                }
                                                className={`notification-item-refonte ${!notification.lue ? 'non-lue' : ''}`}
                                                onClick={() =>
                                                    handleNotificationItemClick(
                                                        notification
                                                    )
                                                }
                                            >
                                                <div className="notification-icon-refonte">
                                                    {getNotificationIcon(
                                                        notification.type
                                                    )}
                                                </div>
                                                <div className="notification-content-refonte">
                                                    <div className="notification-header">
                                                        <p className="notification-titre-refonte">
                                                            {getNotificationTitle(
                                                                notification
                                                            )}
                                                        </p>
                                                        {!notification.lue && (
                                                            <span className="new-indicator"></span>
                                                        )}
                                                    </div>
                                                    <p className="notification-message-refonte">
                                                        {getNotificationMessage(
                                                            notification
                                                        )}
                                                    </p>
                                                    <div className="notification-footer-refonte">
                                                        <span className="notification-date-refonte">
                                                            {formatDate(
                                                                notification.timestamp ||
                                                                    notification.createdAt
                                                            )}
                                                        </span>
                                                        {notification._id && (
                                                            <button
                                                                className="btn-delete-notification"
                                                                onClick={e =>
                                                                    handleDeleteNotification(
                                                                        e,
                                                                        notification._id
                                                                    )
                                                                }
                                                                title="Supprimer"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                    {notification
                                                        .donneesSupplementaires
                                                        ?.decision && (
                                                        <span
                                                            className={`decision-badge ${notification.donneesSupplementaires.decision}`}
                                                        >
                                                            {notification
                                                                .donneesSupplementaires
                                                                .decision ===
                                                            'approuve'
                                                                ? '✓ Approuvé'
                                                                : '✗ Rejeté'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">🔔</div>
                                        <p className="empty-text">
                                            Aucune notification
                                        </p>
                                        <p className="empty-subtext">
                                            Les nouvelles notifications
                                            apparaîtront ici
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="dropdown-footer-refonte">
                                <button
                                    className="btn-marquer-tout-lu"
                                    onClick={async () => {
                                        for (const notification of notifications.slice(
                                            0,
                                            5
                                        )) {
                                            if (
                                                notification._id &&
                                                !notification.lue
                                            ) {
                                                await markAsRead(
                                                    notification._id
                                                );
                                            }
                                        }
                                    }}
                                    disabled={unreadCount === 0}
                                >
                                    Marquer tout comme lu
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* MESSAGES */}
                <div
                    className="header-icon-refonte messages-icon-refonte"
                    ref={refMessages}
                    onClick={handleMessagesClick}
                >
                    <div className="icon-wrapper">
                        <span className="icon">💬</span>
                        <span className="badge-refonte">0</span>
                    </div>

                    {menuMessagesOuvert && (
                        <div className="dropdown-messages-refonte">
                            <div className="dropdown-header-refonte">
                                <h4>Messages</h4>
                            </div>
                            <div className="dropdown-body-refonte">
                                <div className="empty-state">
                                    <div className="empty-icon">💬</div>
                                    <p className="empty-text">Aucun message</p>
                                    <p className="empty-subtext">
                                        Les nouveaux messages apparaîtront ici
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* PARAMÈTRES */}
                <div
                    className="header-icon-refonte settings-icon-refonte"
                    onClick={() => navigate('/admin/parametres')}
                >
                    <span className="icon">⚙️</span>
                </div>

                {/* PROFIL UTILISATEUR */}
                <div
                    className="header-profile-refonte"
                    ref={refProfil}
                    onClick={() => setMenuProfilOuvert(!menuProfilOuvert)}
                >
                    <div className="profile-container">
                        <div className="profile-avatar-refonte">
                            <span className="avatar-initials-refonte">
                                {user?.nom
                                    ? user.nom.charAt(0).toUpperCase()
                                    : 'SA'}
                            </span>
                            <span className="status-indicator-refonte online"></span>
                        </div>
                        <div className="profile-info-refonte">
                            <p className="profile-name-refonte">
                                {user?.nom || 'System Admin'}
                            </p>
                            <p className="profile-role-refonte">
                                {user?.role || 'Super Admin'}
                            </p>
                        </div>
                        <span className="dropdown-arrow-refonte">
                            {menuProfilOuvert ? '▲' : '▼'}
                        </span>
                    </div>

                    {menuProfilOuvert && (
                        <div className="dropdown-profile-refonte">
                            <div className="dropdown-user-info-refonte">
                                <div className="user-avatar-refonte">
                                    {user?.nom
                                        ? user.nom.charAt(0).toUpperCase()
                                        : 'SA'}
                                </div>
                                <div className="user-details-refonte">
                                    <p className="user-name-refonte">
                                        {user?.nom || 'System Admin'}
                                    </p>
                                    <p className="user-email-refonte">
                                        {user?.email || 'admin@nody.com'}
                                    </p>
                                    <span className="user-badge-refonte">
                                        {user?.role || 'Super Admin'}
                                    </span>
                                </div>
                            </div>

                            <div className="dropdown-divider-refonte"></div>

                            <div className="dropdown-menu-refonte">
                                <button
                                    className="dropdown-item-refonte"
                                    onClick={() => {
                                        setMenuProfilOuvert(false);
                                        navigate('/admin/profil');
                                    }}
                                >
                                    <span className="item-icon">👤</span>
                                    <span className="item-text">
                                        Mon Profil
                                    </span>
                                </button>
                                <button
                                    className="dropdown-item-refonte"
                                    onClick={() => {
                                        setMenuProfilOuvert(false);
                                        navigate('/admin/parametres');
                                    }}
                                >
                                    <span className="item-icon">⚙️</span>
                                    <span className="item-text">
                                        Paramètres
                                    </span>
                                </button>
                                <button
                                    className="dropdown-item-refonte"
                                    onClick={() => {
                                        setMenuProfilOuvert(false);
                                        navigate('/admin/securite');
                                    }}
                                >
                                    <span className="item-icon">🔒</span>
                                    <span className="item-text">Sécurité</span>
                                </button>

                                <div className="dropdown-divider-refonte"></div>

                                <button
                                    className="dropdown-item-refonte logout-item-refonte"
                                    onClick={handleLogout}
                                >
                                    <span className="item-icon">🚪</span>
                                    <span className="item-text">
                                        Déconnexion
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
