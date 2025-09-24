import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faUserCircle, faBox, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function UserDropdown() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="user-dropdown dropdown">
            <button className="dropdown-toggle" aria-expanded="false">
                <FontAwesomeIcon icon={user.isAdmin ? faUserShield : faUserCircle} />
                <span className="user-name">{user?.name || 'Utilisateur'}</span>
            </button>
            <div className="dropdown-menu">
                {user.isAdmin && (
                    <Link to="/admin" className="dropdown-item">
                        <FontAwesomeIcon icon={faUserShield} /> Administration
                    </Link>
                )}
                <Link to="/profil" className="dropdown-item">
                    <FontAwesomeIcon icon={faUser} /> Mon profil
                </Link>
                <Link to="/commandes" className="dropdown-item">
                    <FontAwesomeIcon icon={faBox} /> Mes commandes
                </Link>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} /> Déconnexion
                </button>
            </div>
        </div>
    );
}