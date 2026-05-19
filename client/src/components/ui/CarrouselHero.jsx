import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
    Navigation,
    Pagination,
    Autoplay,
    EffectFade,
    A11y,
} from 'swiper/modules';
import {
    obtenirBannieresActives,
    enregistrerVueBanniere,
    enregistrerClicBanniere,
} from '../../services/banniereService';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import './CarrouselHero.scss';

// Composant CarrouselHero pour afficher les bannières dans la section hero
const CarrouselHero = () => {
    const [slides, setSlides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vuesEnregistrees, setVuesEnregistrees] = useState(new Set());

    // Charger les bannières depuis l'API
    useEffect(() => {
        const chargerBannieres = async () => {
            try {
                setIsLoading(true);
                const response = await obtenirBannieresActives('hero', 'haut');

                if (response.succes && response.donnees.length > 0) {
                    setSlides(response.donnees);
                } else {
                    // Fallback vers des slides par défaut si aucune bannière
                    setSlides([]);
                }
                setError(null);
            } catch (err) {
                console.error('Erreur lors du chargement des bannières:', err);
                setError('Impossible de charger les bannières');
                setSlides([]); // Fallback vers un état vide
            } finally {
                setIsLoading(false);
            }
        };

        chargerBannieres();
    }, []);

    // Enregistrer une vue lorsque le slide devient visible
    const handleSlideChange = swiper => {
        const slideActuel = slides[swiper.activeIndex];

        if (
            slideActuel &&
            slideActuel._id &&
            !vuesEnregistrees.has(slideActuel._id)
        ) {
            enregistrerVueBanniere(slideActuel._id);
            setVuesEnregistrees(prev => new Set(prev).add(slideActuel._id));
        }
    };

    // Enregistrer un clic lorsque l'utilisateur clique sur le CTA
    const handleClicBanniere = banniere => {
        if (banniere._id) {
            enregistrerClicBanniere(banniere._id);
        }
    };

    // État de chargement
    if (isLoading) {
        return (
            <div className="carrousel-hero">
                <div className="carrousel-hero__loading">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Si aucune bannière n'est disponible
    if (slides.length === 0) {
        return (
            <div className="carrousel-hero">
                <div className="carrousel-hero__empty">
                    <div className="empty-state">
                        <i className="fas fa-images fa-3x text-muted mb-3"></i>
                        <p className="text-muted">
                            Aucune bannière disponible pour le moment
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Affichage du carrousel avec les bannières
    return (
        <div className="carrousel-hero">
            <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectFade, A11y]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{
                    clickable: true,
                    dynamicBullets: true,
                }}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                }}
                loop={slides.length > 1}
                speed={800}
                onSlideChange={handleSlideChange}
                onInit={swiper => handleSlideChange(swiper)}
                className="hero-swiper"
            >
                {slides.map(slide => (
                    <SwiperSlide key={slide._id}>
                        <div className="hero-slide">
                            {/* Image de fond */}
                            <div
                                className="hero-slide__image"
                                style={{
                                    backgroundImage: `url(${slide.image})`,
                                }}
                            >
                                {/* Overlay gradient */}
                                <div className="hero-slide__overlay"></div>
                            </div>

                            {/* Contenu textuel */}
                            <div
                                className={`hero-slide__content hero-slide__content--${slide.alignement || 'center'}`}
                            >
                                <div className="container">
                                    <div className="content-wrapper">
                                        {slide.titre && (
                                            <h1
                                                className="hero-slide__title animate__animated animate__fadeInUp"
                                                data-swiper-parallax="-300"
                                            >
                                                {slide.titre}
                                            </h1>
                                        )}

                                        {slide.sousTitre && (
                                            <h2
                                                className="hero-slide__subtitle animate__animated animate__fadeInUp animate__delay-1s"
                                                data-swiper-parallax="-200"
                                            >
                                                {slide.sousTitre}
                                            </h2>
                                        )}

                                        {slide.description && (
                                            <p
                                                className="hero-slide__description animate__animated animate__fadeInUp animate__delay-2s"
                                                data-swiper-parallax="-100"
                                            >
                                                {slide.description}
                                            </p>
                                        )}

                                        {slide.lien && slide.texteBouton && (
                                            <a
                                                href={slide.lien}
                                                className="hero-slide__cta btn btn-primary btn-lg animate__animated animate__fadeInUp animate__delay-3s"
                                                onClick={() =>
                                                    handleClicBanniere(slide)
                                                }
                                            >
                                                {slide.texteBouton}
                                                <i className="fas fa-arrow-right ms-2"></i>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Badge nombre de slides */}
            {slides.length > 1 && (
                <div className="hero-slide__counter">
                    <span>{slides.length} bannières</span>
                </div>
            )}
        </div>
    );
};

export default CarrouselHero;