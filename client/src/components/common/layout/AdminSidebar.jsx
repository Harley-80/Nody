import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
        { path: '/admin/produits', label: 'Produits', icon: 'fas fa-box' },
        { path: '/admin/clients', label: 'Clients', icon: 'fas fa-users' },
        {
            path: '/admin/commandes',
            label: 'Commandes',
            icon: 'fas fa-shopping-cart',
        },
        { path: '/admin/categories', label: 'Catégories', icon: 'fas fa-tags' },
    ];

    return (
        <div className="sidebar-sticky pt-3">
            <ul className="nav flex-column">
                {menuItems.map(item => (
                    <li key={item.path} className="nav-item">
                        <Link
                            to={item.path}
                            className={`nav-link text-white ${
                                location.pathname === item.path ? 'active' : ''
                            }`}
                        >
                            <i className={`${item.icon} me-2`}></i>
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Section déconnexion */}
            <div className="mt-4 pt-3 border-top">
                <Link to="/" className="nav-link text-white">
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Retour au site
                </Link>
            </div>
        </div>
    );
};

export default AdminSidebar;