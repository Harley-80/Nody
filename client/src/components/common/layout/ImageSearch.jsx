import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faImage,
    faUpload,
    faCamera,
    faPaste,
    faSearch,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import './ImageSearch.scss';

/**
 * Composant de recherche par image avec drag & drop, collage et capture caméra.
 * @param {Function} onSearch - Callback déclenché lors de la soumission d'une image.
 * @param {Function} onClose - Callback pour fermer le composant.
 */
export default function ImageSearch({ onSearch, onClose }) {
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const processFile = file => {
        if (file && file.type.match('image.*')) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
            setSelectedFile(file);
        }
    };

    const handleFileSelect = e => {
        processFile(e.target.files[0]);
    };

    const handleDragOver = e => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = e => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = e => {
        e.preventDefault();
        setDragOver(false);
        processFile(e.dataTransfer.files[0]);
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = () => {
        if (selectedFile && onSearch) {
            onSearch(selectedFile);
        }
    };

    const resetSelection = () => {
        setImagePreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCameraCapture = () => {
        // Implémentation basique de capture caméra
        // Dans une vraie application, vous utiliseriez l'API MediaDevices
        alert('Fonctionnalité caméra à implémenter');
    };

    // Nettoyage de l'URL de l'objet quand le composant est démonté
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    return (
        <>
            <div className="image-search-overlay" onClick={onClose}></div>
            <div
                className="image-search-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="image-search-title"
            >
                <div className="panel-header">
                    <h3 id="image-search-title">Recherche par image</h3>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Fermer la recherche par image"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="image-search-content">
                    {imagePreview ? (
                        <div className="image-preview-container">
                            <div className="preview-image">
                                <img
                                    src={imagePreview}
                                    alt="Aperçu de l'image"
                                />
                            </div>
                            <div className="preview-actions">
                                <button
                                    className="btn-change"
                                    onClick={resetSelection}
                                >
                                    <FontAwesomeIcon icon={faImage} />
                                    Changer l'image
                                </button>
                                <button
                                    className="btn-search"
                                    onClick={handleSubmit}
                                >
                                    <FontAwesomeIcon icon={faSearch} />
                                    Lancer la recherche
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={openFileDialog}
                            role="button"
                            tabIndex="0"
                        >
                            <div className="upload-content">
                                <FontAwesomeIcon
                                    icon={faUpload}
                                    className="upload-icon"
                                />
                                <p className="upload-text">
                                    Glissez-déposez une image ici ou cliquez
                                    pour parcourir
                                </p>
                                <p className="hint">
                                    <FontAwesomeIcon icon={faPaste} />
                                    Vous pouvez aussi coller une image (Ctrl+V)
                                    dans la barre de recherche
                                </p>
                                <button
                                    type="button"
                                    className="camera-btn"
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleCameraCapture();
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCamera} />
                                    Prendre une photo
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="file-input"
                />
            </div>
        </>
    );
}
