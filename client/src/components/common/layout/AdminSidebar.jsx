import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHome,
    faChartLine,
    faClipboardList,
    faStore,
    faUsers,
    faCog,
    faChevronDown,
    faChevronRight,
    faSignOutAlt,
    faBoxes,
    faLayerGroup,
    faShoppingCart,
    faUserShield,
    faUserTie,
    faEnvelope,
    faBell,
    faMessage,
    faGear,
    faBars,
    faTimes,
    faPlus,
    faSearch,
} from '@fortawesome/free-solid-svg-icons';
import useDemandesCount from '@/hooks/useDemandesCount';
import { useAuth } from '@/contexts/AuthContext';
import './AdminSidebar.scss';

export default function AdminSidebar() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { count: demandesCount, loading: demandesLoading } =
        useDemandesCount();

    // États pour les sous-menus dépliables
    const [expandedMenus, setExpandedMenus] = useState({
        boutique: false,
        utilisateurs: false,
        analytics: false,
        settings: false,
    });

    // États pour le mode mobile
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Fonction pour vérifier si un lien est actif
    const isActive = (path, exact = true) => {
        if (exact) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    // Fonction pour toggle un sous-menu
    const toggleMenu = menuKey => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuKey]: !prev[menuKey],
        }));
    };

    // Fonction de déconnexion
    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/admin-login';
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    // Initiales de l'utilisateur pour l'avatar
    const getInitials = name => {
        if (!name) return 'A';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
    };

    // Fonction pour fermer le menu mobile
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div
            className={`admin-sidebar-refonte ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        >
            {/* En-tête avec logo et bouton menu mobile */}
            <div className="sidebar-header-refonte">
                <div className="header-top">
                    <Link to="/admin" className="sidebar-logo-refonte">
                        <div className="logo-wrapper">
                            <div className="logo-icon-refonte">N</div>
                            <div className="logo-text-wrapper">
                                <span className="logo-text-refonte">NODY</span>
                                <span className="logo-subtext">Admin</span>
                            </div>
                        </div>
                    </Link>
                    <button
                        className="mobile-close-btn"
                        onClick={closeMobileMenu}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Statut serveur */}
                <div className="server-status">
                    <div className="status-indicator active"></div>
                    <span className="status-text">Serveur actif</span>
                    <div className="status-badge">99.9%</div>
                </div>
            </div>

            {/* Menu principal */}
            <nav className="sidebar-nav-refonte">
                <div className="nav-section">
                    <h3 className="section-title">GÉNÉRAL</h3>
                    <ul className="nav-menu">
                        <li className="nav-item-refonte">
                            <Link
                                to="/admin"
                                className={`nav-link-refonte ${isActive('/admin') ? 'active' : ''}`}
                                onClick={closeMobileMenu}
                            >
                                <div className="link-content">
                                    <div className="link-icon-wrapper">
                                        <FontAwesomeIcon icon={faHome} />
                                    </div>
                                    <span className="link-text">Dashboard</span>
                                </div>
                                <div className="link-indicator"></div>
                            </Link>
                        </li>

                        <li className="nav-item-refonte">
                            <Link
                                to="/admin/statistiques"
                                className={`nav-link-refonte ${isActive('/admin/statistiques') ? 'active' : ''}`}
                                onClick={closeMobileMenu}
                            >
                                <div className="link-content">
                                    <div className="link-icon-wrapper">
                                        <FontAwesomeIcon icon={faChartLine} />
                                    </div>
                                    <span className="link-text">
                                        Analytiques
                                    </span>
                                </div>
                                <div className="link-indicator"></div>
                            </Link>
                        </li>

                        <li className="nav-item-refonte">
                            <Link
                                to="/admin/demandes"
                                className={`nav-link-refonte ${isActive('/admin/demandes') ? 'active' : ''}`}
                                onClick={closeMobileMenu}
                            >
                                <div className="link-content">
                                    <div className="link-icon-wrapper">
                                        <FontAwesomeIcon
                                            icon={faClipboardList}
                                        />
                                    </div>
                                    <span className="link-text">Demandes</span>
                                    {!demandesLoading && demandesCount > 0 && (
                                        <span className="nav-badge-refonte danger">
                                            {demandesCount}
                                        </span>
                                    )}
                                </div>
                                <div className="link-indicator"></div>
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="nav-section">
                    <h3 className="section-title">BOUTIQUE</h3>
                    <ul className="nav-menu">
                        <li
                            className={`nav-item-refonte ${expandedMenus.boutique ? 'expanded' : ''}`}
                        >
                            <div
                                className="nav-link-refonte has-submenu"
                                onClick={() => toggleMenu('boutique')}
                            >
                                <div className="link-content">
                                    <div className="link-icon-wrapper">
                                        <FontAwesomeIcon icon={faStore} />
                                    </div>
                                    <span className="link-text">Boutique</span>
                                </div>
                                <div className="submenu-toggle">
                                    <FontAwesomeIcon
                                        icon={
                                            expandedMenus.boutique
                                                ? faChevronDown
                                                : faChevronRight
                                        }
                                    />
                                </div>
                            </div>

                            {expandedMenus.boutique && (
                                <div className="submenu-refonte">
                                    <Link
                                        to="/admin/produits"
                                        className={`submenu-link ${isActive('/admin/produits', false) ? 'active' : ''}`}
                                        onClick={closeMobileMenu}
                                    >
                                        <FontAwesomeIcon icon={faBoxes} />
                                        <span>Produits</span>
                                    </Link>
                                    <Link
                                        to="/admin/categories"
                                        className={`submenu-link ${isActive('/admin/categories', false) ? 'active' : ''}`}
                                        onClick={closeMobileMenu}
                                    >
                                        <FontAwesomeIcon icon={faLayerGroup} />
                                        <span>Catégories</span>
                                    </Link>
                                    <Link
                                        to="/admin/commandes"
                                        className={`submenu-link ${isActive('/admin/commandes', false) ? 'active' : ''}`}
                                        onClick={closeMobileMenu}
                                    >
                                        <FontAwesomeIcon
                                            icon={faShoppingCart}
                                        />
                                        <span>Commandes</span>
                                    </Link>
                                </div>
                            )}
                        </li>
                    </ul>
                </div>

                <div className="nav-section">
                    <h3 className="section-title">UTILISATEURS</h3>
                    <ul className="nav-menu">
                        <li
                            className={`nav-item-refonte ${expandedMenus.utilisateurs ? 'expanded' : ''}`}
                        >
                            <div
                                className="nav-link-refonte has-submenu"
                                onClick={() => toggleMenu('utilisateurs')}
                            >
                                <div className="link-content">
                                    <div className="link-icon-wrapper">
                                        <FontAwesomeIcon icon={faUsers} />
                                    </div>
                                    <span className="link-text">
                                        Utilisateurs
                                    </span>
                                </div>
                                <div className="submenu-toggle">
                                    <FontAwesomeIcon
                                        icon={
                                            expandedMenus.utilisateurs
                                                ? faChevronDown
                                                : faChevronRight
                                        }
                                    />
                                </div>
                            </div>

                            {expandedMenus.utilisateurs && (
                                <div className="submenu-refonte">
                                    <Link
                                        to="/admin/clients"
                                        className={`submenu-link ${isActive('/admin/clients', false) ? 'active' : ''}`}
                                        onClick={closeMobileMenu}
                                    >
                                        <FontAwesomeIcon icon={faUsers} />
                                        <span>Clients</span>
                                    </Link>
                                    <Link
                                        to="/admin/vendeurs"
                                        className={`submenu-link ${isActive('/admin/vendeurs', false) ? 'active' : ''}`}
                                        onClick={closeMobileMenu}
                                    >
                                        <FontAwesomeIcon icon={faUserTie} />
                                        <span>Vendeurs</span>
                                    </Link>
                                    <Link
                                        to="/admin/moderateurs"
                                        className={`submenu-link ${isActive('/admin/moderateurs', false) ? 'active' : ''}`}
                                        onClick={closeMobileMenu}
                                    >
                                        <FontAwesomeIcon icon={faUserShield} />
                                        <span>Modérateurs</span>
                                    </Link>
                                </div>
                            )}
                        </li>
                    </ul>
                </div>

                <div className="nav-section">
                    <h3 className="section-title">COMMUNICATION</h3>
                    <ul className="nav-menu">
                        <li className="nav-item-refonte">
                            <Link
                                to="/admin/messages"
                                className={`nav-link-refonte ${isActive('/admin/messages') ? 'active' : ''}`}
                                onClick={closeMobileMenu}
                            >
                                <div className="link-content">
                                    <div className="link-icon-wrapper">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                    </div>
                                    <span className="link-text">Messages</span>
                                    <span className="nav-badge-refonte info">
                                        5
                                    </span>
                                </div>
                                <div className="link-indicator"></div>
                            </Link>
                        </li>

                        <li className="nav-item-refonte">
                            <Link
                                to="/admin/notifications"
                                className={`nav-link-refonte ${isActive('/admin/notifications') ? 'active' : ''}`}
                                onClick={closeMobileMenu}
                            >
                                <div className="link-content">
                                    <div className="link-icon-wrapper">
                                        <FontAwesomeIcon icon={faBell} />
                                    </div>
                                    <span className="link-text">
                                        Notifications
                                    </span>
                                    <span className="nav-badge-refonte warning">
                                        12
                                    </span>
                                </div>
                                <div className="link-indicator"></div>
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="nav-section">
                    <h3 className="section-title">SYSTÈME</h3>
                    <ul className="nav-menu">
                        <li className="nav-item-refonte">
                            <Link
                                to="/admin/parametres"
                                className={`nav-link-refonte ${isActive('/admin/parametres', false) ? 'active' : ''}`}
                                onClick={closeMobileMenu}
                            >
                                <div className="link-content">
                                    <div className="link-icon-wrapper">
                                        <FontAwesomeIcon icon={faGear} />
                                    </div>
                                    <span className="link-text">
                                        Paramètres
                                    </span>
                                </div>
                                <div className="link-indicator"></div>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-section">
                    <div className="section-title">ACTIONS RAPIDES</div>
                    <div className="quick-actions-grid">
                        <Link
                            to="/admin/commandes/nouvelle"
                            className="quick-action-btn-refonte"
                            onClick={closeMobileMenu}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Nouvelle commande</span>
                        </Link>
                        <Link
                            to="/admin/produits/nouveau"
                            className="quick-action-btn-refonte"
                            onClick={closeMobileMenu}
                        >
                            <FontAwesomeIcon icon={faBoxes} />
                            <span>Nouveau produit</span>
                        </Link>
                        <Link
                            to="/admin/recherche-avancee"
                            className="quick-action-btn-refonte"
                            onClick={closeMobileMenu}
                        >
                            <FontAwesomeIcon icon={faSearch} />
                            <span>Recherche avancée</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Pied de page utilisateur */}
            <div className="sidebar-footer-refonte">
                <div className="user-profile-refonte">
                    <div className="user-avatar-refonte">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.nomComplet || 'Admin'}
                                className="avatar-image"
                            />
                        ) : (
                            <div className="avatar-placeholder-refonte">
                                {getInitials(
                                    user?.nomComplet || user?.nom || 'Admin'
                                )}
                            </div>
                        )}
                        <div className="user-status active"></div>
                    </div>
                    <div className="user-info-refonte">
                        <div className="user-main-info">
                            <h4 className="user-name-refonte">
                                {user?.nomComplet ||
                                    `${user?.prenom || ''} ${user?.nom || 'Admin'}`.trim()}
                            </h4>
                            <span className="user-badge-refonte admin">
                                Admin
                            </span>
                        </div>
                        <p className="user-email-refonte">
                            {user?.email || 'admin@nody.com'}
                        </p>
                    </div>
                    <button
                        className="logout-btn-refonte"
                        onClick={handleLogout}
                        title="Se déconnecter"
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                    </button>
                </div>

                {/* Version et copyright */}
                <div className="sidebar-bottom-refonte">
                    <div className="version-info">
                        <span className="version-label">v0.0.0</span>
                        <span className="version-status stable">Stable</span>
                    </div>
                    <p className="copyright-text">
                        © 2025 Nody. Tous droits réservés.
                    </p>
                </div>
            </div>
        </div>
    );
}
