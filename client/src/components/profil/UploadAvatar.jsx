import React, { useState, useRef } from 'react';
import profilService from '../../services/profilService';
import './UploadAvatar.scss';

const UploadAvatar = ({ avatarActuel, onAvatarChange }) => {
    const [preview, setPreview] = useState(avatarActuel || null);
    const [uploading, setUploading] = useState(false);
    const [erreur, setErreur] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = async e => {
        const file = e.target.files[0];

        if (!file) return;

        // Validation du fichier
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ];
        if (!allowedTypes.includes(file.type)) {
            setErreur('Format non supporté. Utilisez JPG, PNG, GIF ou WebP');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErreur('La taille du fichier ne doit pas dépasser 5 MB');
            return;
        }

        // Afficher la prévisualisation
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload du fichier
        try {
            setUploading(true);
            setErreur(null);

            const response = await profilService.uploadAvatar(file);

            if (response.succes) {
                // Mettre à jour l'avatar dans le composant parent
                onAvatarChange(response.avatar);

                // Mettre à jour le localStorage
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.avatar = response.avatar;
                localStorage.setItem('user', JSON.stringify(user));
            }
        } catch (err) {
            console.error('Erreur upload avatar:', err);
            setErreur(
                err.response?.data?.erreur || 'Erreur lors du téléchargement'
            );
            setPreview(avatarActuel);
        } finally {
            setUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="upload-avatar-container">
            <div className="avatar-preview" onClick={triggerFileInput}>
                {preview ? (
                    <img
                        src={
                            preview.startsWith('http')
                                ? preview
                                : `http://localhost:5000${preview}`
                        }
                        alt="Avatar"
                    />
                ) : (
                    <div className="avatar-placeholder">
                        <i className="fas fa-user"></i>
                    </div>
                )}

                <div className="avatar-overlay">
                    {uploading ? (
                        <div className="spinner-small"></div>
                    ) : (
                        <i className="fas fa-camera"></i>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            <button
                className="btn-change-avatar"
                onClick={triggerFileInput}
                disabled={uploading}
            >
                {uploading ? 'Téléchargement...' : 'Changer la photo'}
            </button>

            {erreur && <div className="alert alert-danger mt-2">{erreur}</div>}

            <p className="upload-info">JPG, PNG, GIF ou WebP. Max 5 MB.</p>
        </div>
    );
};

export default UploadAvatar;
