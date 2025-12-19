import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationsDropdown from './NotificationsDropdown';
import './NotificationsBell.scss';

// Composant de la cloche de notifications avec badge et dropdown
const NotificationsBell = () => {
    const { unreadCount } = useNotifications();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Gestion du clic en dehors du dropdown pour le fermer
    useEffect(() => {
        const handleClickOutside = event => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Basculer l'affichage du dropdown
    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    // Rendu du composant
    return (
        <div className="notifications-bell-container" ref={dropdownRef}>
            <button
                className="notifications-bell"
                onClick={toggleDropdown}
                aria-label="Notifications"
            >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <NotificationsDropdown onClose={() => setShowDropdown(false)} />
            )}
        </div>
    );
};

export default NotificationsBell;