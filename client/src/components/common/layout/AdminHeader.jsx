import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const AdminHeader = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar navbar-dark bg-dark sticky-top">
            <div className="container-fluid">
                <button
                    className="navbar-toggler d-md-none"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#sidebarMenu"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <span className="navbar-brand mb-0 h1">
                    <i className="fas fa-crown me-2"></i>
                    Administration Nody
                </span>

                <div className="d-flex align-items-center">
                    <span className="text-white me-3">
                        <i className="fas fa-user me-1"></i>
                        {user?.prenom} {user?.nom}
                    </span>
                    <button
                        className="btn btn-outline-light btn-sm"
                        onClick={logout}
                    >
                        <i className="fas fa-sign-out-alt me-1"></i>
                        Déconnexion
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default AdminHeader;
