import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from "../../../contexts/AuthContext";
import { Navigate } from 'react-router-dom';

export default function AdminLayout() {
    const { user } = useAuth();
    const location = useLocation();

    if (!user?.isAdmin) {
        return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }

    const navItems = [
        { path: '/admin', label: 'Commandes', icon: 'bi-list-check' },
        { path: '/admin/produits', label: 'Produits', icon: 'bi-box-seam' },
        { path: '/admin/clients', label: 'Clients', icon: 'bi-people' },
    ];

    return (
        <div className="admin-layout">
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                <div className="container-fluid">
                    <Link className="navbar-brand fw-bold" to="/admin">
                        <i className="bi bi-speedometer2 me-2"></i>
                        Admin Nody
                    </Link>
                    
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    
                    <div className="collapse navbar-collapse" id="adminNav">
                        <ul className="navbar-nav me-auto">
                            {navItems.map(item => (
                                <li key={item.path} className="nav-item">
                                    <Link
                                        className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                                        to={item.path}
                                    >
                                        <i className={`bi ${item.icon} me-2`}></i>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <Link to="/" className="btn btn-outline-light btn-sm">
                            <i className="bi bi-house me-2"></i>
                            Retour au site
                        </Link>
                    </div>
                </div>
            </nav>
            
            <main className="container-fluid py-4">
                <Outlet />
            </main>
        </div>
    );
}