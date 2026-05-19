import React, { useState } from 'react';
import './GalerieImagesZoom.scss';

export default function GalerieImagesZoom({
    images,
    activeImage,
    setActiveImage,
    nomProduit,
}) {
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

    // Ouvrir la lightbox
    const openLightbox = index => {
        setLightboxIndex(index);
        setShowLightbox(true);
        document.body.style.overflow = 'hidden';
    };

    // Fermer la lightbox
    const closeLightbox = () => {
        setShowLightbox(false);
        document.body.style.overflow = 'auto';
    };

    // Navigation lightbox
    const navigateLightbox = direction => {
        if (direction === 'next') {
            setLightboxIndex(prev => (prev + 1) % images.length);
        } else {
            setLightboxIndex(
                prev => (prev - 1 + images.length) % images.length
            );
        }
    };

    // Gestion du zoom au survol
    const handleMouseMove = e => {
        if (!isZoomed) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setMousePosition({ x, y });
    };

    return (
        <>
            {/* Image principale avec zoom */}
            <div className="galerie-principale">
                <div
                    className={`image-container ${isZoomed ? 'zoomed' : ''}`}
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    onMouseMove={handleMouseMove}
                    onClick={() => openLightbox(images.indexOf(activeImage))}
                >
                    {activeImage ? (
                        <img
                            src={activeImage}
                            alt={nomProduit}
                            className="img-principale"
                            style={
                                isZoomed
                                        ? {
                                            transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                                        }
                                    : {}
                            }
                        />
                    ) : (
                        <div className="image-placeholder">
                            <i className="fas fa-image"></i>
                            <span>Image non disponible</span>
                        </div>
                    )}

                    {/* Icône de zoom */}
                    <div className="zoom-icon">
                        <i className="fas fa-search-plus"></i>
                        <span>Cliquez pour agrandir</span>
                    </div>
                </div>
            </div>

            {/* Miniatures */}
            {images.length > 1 && (
                <div className="galerie-miniatures">
                    {images.map((imgSrc, index) => (
                        <div
                            key={index}
                            className={`miniature ${imgSrc === activeImage ? 'active' : ''}`}
                            onClick={() => setActiveImage(imgSrc)}
                        >
                            <img
                                src={imgSrc}
                                alt={`${nomProduit} - Vue ${index + 1}`}
                                onError={e => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox (modal plein écran) */}
            {showLightbox && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}>
                        <i className="fas fa-times"></i>
                    </button>

                    <div
                        className="lightbox-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={images[lightboxIndex]}
                            alt={`${nomProduit} - Vue ${lightboxIndex + 1}`}
                            className="lightbox-image"
                        />

                        {/* Navigation */}
                        {images.length > 1 && (
                            <>
                                <button
                                    className="lightbox-nav lightbox-prev"
                                    onClick={() => navigateLightbox('prev')}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <button
                                    className="lightbox-nav lightbox-next"
                                    onClick={() => navigateLightbox('next')}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </>
                        )}

                        {/* Indicateur */}
                        <div className="lightbox-indicator">
                            {lightboxIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}