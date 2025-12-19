import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './profil.scss';
import OngletInformations from '../components/profil/OngletInformations';
import OngletMotDePasse from '../components/profil/OngletMotDePasse';
import OngletAdresses from '../components/profil/OngletAdresses';
import UploadAvatar from '../components/profil/UploadAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmActions } from '../hooks/useConfirmActions';

const API_BASE_URL = 'http://localhost:5000';

const Profil = () => {
    const { utilisateur, mettreAJourUtilisateur } = useAuth();
    const { afficherToast } = useToast();
    const { confirmDelete, confirmUnsavedChanges } = useConfirmActions();

    const [ongletActif, setOngletActif] = useState('informations');
    const [loading, setLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(
        utilisateur?.avatar || '/images/default-avatar.png'
    );

    // Charger l'avatar au montage
    useEffect(() => {
        if (utilisateur?.avatar) {
            setAvatarUrl(
                utilisateur.avatar.startsWith('http')
                    ? utilisateur.avatar
                    : `${API_BASE_URL}${utilisateur.avatar}`
            );
        }
    }, [utilisateur]);

    // GESTION DE L'UPLOAD D'AVATAR
    const handleAvatarChange = async file => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('avatar', file);

            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_BASE_URL}/api/utilisateurs/profil`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const nouvelAvatar = response.data.donnees.avatar;
            const avatarComplet = nouvelAvatar.startsWith('http')
                ? nouvelAvatar
                : `${API_BASE_URL}${nouvelAvatar}`;

            setAvatarUrl(avatarComplet);
            mettreAJourUtilisateur({
                ...utilisateur,
                avatar: nouvelAvatar,
            });

            afficherToast('Avatar mis à jour avec succès', 'success');
        } catch (error) {
            console.error('Erreur upload avatar:', error);
            afficherToast(
                error.response?.data?.erreur ||
                    "Erreur lors de l'upload de l'avatar",
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    // SUPPRESSION D'AVATAR (NOUVEAU)
    const handleDeleteAvatar = async () => {
        const isConfirmed = await confirmDelete(
            'avatar',
            "l'avatar par défaut"
        );

        if (!isConfirmed) return;

        try {
            setLoading(true);

            const token = localStorage.getItem('token');
            await axios.delete(
                `${API_BASE_URL}/api/utilisateurs/profil/avatar`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const defaultAvatar = '/images/default-avatar.png';
            setAvatarUrl(defaultAvatar);
            mettreAJourUtilisateur({
                ...utilisateur,
                avatar: defaultAvatar,
            });

            afficherToast('Avatar supprimé avec succès', 'success');
        } catch (error) {
            console.error('Erreur suppression avatar:', error);
            afficherToast(
                error.response?.data?.erreur ||
                    "Erreur lors de la suppression de l'avatar",
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    // CHANGEMENT D'ONGLET AVEC VÉRIFICATION
    const handleTabChange = async nouvelOnglet => {
        if (hasUnsavedChanges) {
            const isConfirmed = await confirmUnsavedChanges();
            if (!isConfirmed) return;
        }

        setOngletActif(nouvelOnglet);
        setHasUnsavedChanges(false);
    };

    return (
        <div className="profil-page">
            <div className="profil-container">
                {/* SIDEBAR */}
                <div className="profil-sidebar">
                    <div className="profil-avatar-section">
                        <UploadAvatar
                            avatarUrl={avatarUrl}
                            onAvatarChange={handleAvatarChange}
                            onDeleteAvatar={handleDeleteAvatar}
                            loading={loading}
                        />
                        <h2 className="profil-nom">
                            {utilisateur?.prenom} {utilisateur?.nom}
                        </h2>
                        <p className="profil-email">{utilisateur?.email}</p>
                        <span
                            className={`profil-badge ${utilisateur?.role || 'client'}`}
                        >
                            {utilisateur?.role === 'admin' && '👑 Admin'}
                            {utilisateur?.role === 'moderateur' &&
                                '🛡️ Modérateur'}
                            {utilisateur?.role === 'vendeur' && '🏪 Vendeur'}
                            {utilisateur?.role === 'client' && '🛒 Client'}
                        </span>
                    </div>

                    {/* MENU */}
                    <nav className="profil-menu">
                        <button
                            className={`profil-menu-item ${ongletActif === 'informations' ? 'actif' : ''}`}
                            onClick={() => handleTabChange('informations')}
                        >
                            <i className="fas fa-user"></i>
                            Informations
                        </button>
                        <button
                            className={`profil-menu-item ${ongletActif === 'securite' ? 'actif' : ''}`}
                            onClick={() => handleTabChange('securite')}
                        >
                            <i className="fas fa-lock"></i>
                            Mot de passe
                        </button>
                        <button
                            className={`profil-menu-item ${ongletActif === 'adresses' ? 'actif' : ''}`}
                            onClick={() => handleTabChange('adresses')}
                        >
                            <i className="fas fa-map-marker-alt"></i>
                            Adresses
                        </button>
                    </nav>
                </div>

                {/* CONTENT */}
                <div className="profil-content">
                    {ongletActif === 'informations' && (
                        <OngletInformations
                            onUnsavedChanges={hasChanges =>
                                setHasUnsavedChanges(hasChanges)
                            }
                        />
                    )}
                    {ongletActif === 'securite' && (
                        <OngletMotDePasse
                            onUnsavedChanges={hasChanges =>
                                setHasUnsavedChanges(hasChanges)
                            }
                        />
                    )}
                    {ongletActif === 'adresses' && <OngletAdresses />}
                </div>
            </div>
        </div>
    );
};

export default Profil;
