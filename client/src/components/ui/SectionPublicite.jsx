import React, { useState, useEffect } from 'react';
import {
    obtenirBannieresActives,
    enregistrerVueBanniere,
    enregistrerClicBanniere,
} from '../../services/banniereService';
import './SectionPublicite.scss';

// Composant pour afficher les bannières publicitaires
const SectionPublicite = ({ position = 'milieu', limite = 3 }) => {
    const [bannieres, setBannieres] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [vuesEnregistrees, setVuesEnregistrees] = useState(new Set());

    useEffect(() => {
        const chargerBannieres = async () => {
            try {
                setIsLoading(true);
                const response = await obtenirBannieresActives('pub', position);

                if (response.succes && response.donnees.length > 0) {
                    // Limiter le nombre de bannières affichées
                    setBannieres(response.donnees.slice(0, limite));
                }
            } catch (err) {
                console.error('Erreur lors du chargement des publicités:', err);
            } finally {
                setIsLoading(false);
            }
        };

        chargerBannieres();
    }, [position, limite]);

    // Enregistrer les vues au montage du composant
    useEffect(() => {
        bannieres.forEach(banniere => {
            if (banniere._id && !vuesEnregistrees.has(banniere._id)) {
                enregistrerVueBanniere(banniere._id);
                setVuesEnregistrees(prev => new Set(prev).add(banniere._id));
            }
        });
    }, [bannieres]);

    // Gérer le clic sur une bannière
    const handleClicBanniere = banniere => {
        if (banniere._id) {
            enregistrerClicBanniere(banniere._id);
        }
    };

    // Ne rien afficher si aucune bannière
    if (!isLoading && bannieres.length === 0) {
        return null;
    }

    // Loading skeleton
    if (isLoading) {
        return (
            <section className="section-publicite">
                <div className="container">
                    <div className="bannieres-grid">
                        {[...Array(limite)].map((_, index) => (
                            <div key={index} className="banniere-card skeleton">
                                <div className="skeleton-image"></div>
                                <div className="skeleton-content">
                                    <div className="skeleton-title"></div>
                                    <div className="skeleton-text"></div>
                                    <div className="skeleton-button"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Affichage des bannières actives 
    return (
        <section className="section-publicite">
            <div className="container">
                {/* En-tête de section */}
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-bullhorn me-2"></i>
                        Nos Partenaires
                    </h2>
                    <p className="section-subtitle">
                        Découvrez les offres exclusives
                    </p>
                </div>

                {/* Grille de bannières */}
                <div
                    className={`bannieres-grid bannieres-grid--${bannieres.length}`}
                >
                    {bannieres.map(banniere => (
                        <div
                            key={banniere._id}
                            className="banniere-card"
                            data-type={banniere.type}
                        >
                            <a
                                href={banniere.lien || '#'}
                                className="banniere-link"
                                target={
                                    banniere.lien?.startsWith('http')
                                        ? '_blank'
                                        : '_self'
                                }
                                rel={
                                    banniere.lien?.startsWith('http')
                                        ? 'noopener noreferrer'
                                        : ''
                                }
                                onClick={() => handleClicBanniere(banniere)}
                            >
                                {/* Image de fond */}
                                <div
                                    className="banniere-image"
                                    style={{
                                        backgroundImage: `url(${banniere.image})`,
                                    }}
                                >
                                    {/* Overlay gradient */}
                                    <div className="banniere-overlay"></div>
                                </div>

                                {/* Contenu textuel */}
                                <div
                                    className={`banniere-content banniere-content--${banniere.alignement || 'left'}`}
                                >
                                    {banniere.titre && (
                                        <h3 className="banniere-title">
                                            {banniere.titre}
                                        </h3>
                                    )}

                                    {banniere.sousTitre && (
                                        <p className="banniere-subtitle">
                                            {banniere.sousTitre}
                                        </p>
                                    )}

                                    {banniere.description && (
                                        <p className="banniere-description">
                                            {banniere.description}
                                        </p>
                                    )}

                                    {banniere.texteBouton && (
                                        <span className="banniere-cta">
                                            {banniere.texteBouton}
                                            <i className="fas fa-arrow-right ms-2"></i>
                                        </span>
                                    )}
                                </div>

                                {/* Badge "Pub" */}
                                <div className="banniere-badge">
                                    <i className="fas fa-ad"></i> Sponsorisé
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SectionPublicite;