import React, { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faImage,
    faUpload,
    faCamera,
    faPaste,
    faSearch,
    faTimes,
} from '@fortawesome/free-solid-svg-icons'
import './ImageSearch.scss'

/**
 * Composant de recherche par image avec drag & drop et collage
 * @param {Function} onSearch - Callback déclenché lors de la soumission d'une image
 * @param {Function} onClose - Callback pour fermer le composant
 */
export default function ImageSearch({ onSearch, onClose }) {
    const [imagePreview, setImagePreview] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef(null)

    /**
     * Gère la sélection de fichier
     * @param {Object} e - Événement de changement d'input
     */
    const handleFileSelect = e => {
        const file = e.target.files[0]
        if (file && file.type.match('image.*')) {
            const url = URL.createObjectURL(file)
            setImagePreview(url)
        }
    }

    /**
     * Gère le drag over
     * @param {Object} e - Événement de drag over
     */
    const handleDragOver = e => {
        e.preventDefault()
        setDragOver(true)
    }

    /**
     * Gère le drag leave
     * @param {Object} e - Événement de drag leave
     */
    const handleDragLeave = e => {
        e.preventDefault()
        setDragOver(false)
    }

    /**
     * Gère le drop d'image
     * @param {Object} e - Événement de drop
     */
    const handleDrop = e => {
        e.preventDefault()
        setDragOver(false)

        const files = e.dataTransfer.files
        if (files.length > 0 && files[0].type.match('image.*')) {
            const url = URL.createObjectURL(files[0])
            setImagePreview(url)
        }
    }

    /**
     * Ouvre la boîte de dialogue de sélection de fichier
     */
    const openFileDialog = () => {
        fileInputRef.current?.click()
    }

    /**
     * Soumet l'image pour la recherche
     */
    const handleSubmit = () => {
        if (imagePreview && onSearch) {
            onSearch(imagePreview)
        }
    }

    /**
     * Réinitialise la sélection d'image
     */
    const resetSelection = () => {
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="image-search">
            <div className="image-search-header">
                <h3>Recherche par image</h3>
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
                            <img src={imagePreview} alt="Aperçu de l'image" />
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
                    >
                        <div className="upload-content">
                            <FontAwesomeIcon
                                icon={faUpload}
                                className="upload-icon"
                            />
                            <p className="upload-text">
                                Glissez-déposez une image ici ou cliquez pour
                                parcourir
                            </p>
                            <p className="upload-hint">
                                <FontAwesomeIcon icon={faPaste} />
                                Vous pouvez aussi coller une image (Ctrl+V)
                            </p>
                            <button className="camera-btn">
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
    )
}
