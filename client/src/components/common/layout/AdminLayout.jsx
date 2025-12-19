import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import './AdminLayout.scss';

const AdminLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="admin-layout-refonte">
            {/* SIDEBAR GAUCHE */}
            <div
                className={`sidebar-container-refonte ${sidebarCollapsed ? 'collapsed' : ''}`}
            >
                <AdminSidebar />
            </div>

            {/* OVERLAY POUR MOBILE */}
            {sidebarCollapsed && (
                <div
                    className="sidebar-overlay-refonte"
                    onClick={toggleSidebar}
                />
            )}

            {/* CONTENU PRINCIPAL */}
            <div className="admin-main-refonte">
                {/* HEADER */}
                <div className="header-container-refonte">
                    <AdminHeader />
                    <button
                        className="sidebar-toggle-refonte"
                        onClick={toggleSidebar}
                    >
                        <span className="toggle-icon">☰</span>
                    </button>
                </div>

                {/* CONTENU DES PAGES */}
                <main className="admin-content-refonte">
                    <div className="content-container-refonte">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
