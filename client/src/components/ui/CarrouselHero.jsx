import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import 'swiper/css/a11y';
import './CarrouselHero.scss';

import slide1 from '../../assets/images/slide1.jpeg';
import slide2 from '../../assets/images/slide2.jpeg';
import slide3 from '../../assets/images/slide3.jpeg';

const images = [slide1, slide2, slide3];

export default function CarrouselHero() {
    return (
        <div className="carrousel-hero">
            <Swiper
                modules={[Autoplay, Pagination, Navigation, EffectFade, A11y]}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: true,
                    renderBullet: (index, className) => {
                        return `<span class="${className}"><span class="bullet-inner"></span></span>`;
                    }
                }}
                navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                }}
                effect="fade"
                fadeEffect={{
                    crossFade: true
                }}
                loop={true}
                speed={800}
                a11y={{
                    prevSlideMessage: 'Slide précédente',
                    nextSlideMessage: 'Slide suivante',
                    paginationBulletMessage: 'Aller à la slide {{index}}'
                }}
            >
                {images.map((img, i) => (
                    <SwiperSlide key={i}>
                        {/* Structure demandée avec image-container, overlay et content */}
                        <div className="image-container">
                            <img 
                                src={img} 
                                alt={`Slide ${i + 1}`} 
                                className="slide-image" 
                                loading={i === 0 ? 'eager' : 'lazy'}
                            />
                        </div>
                        <div className="slide-overlay"></div>
                        <div className="slide-content">
                            <h2 className="slide-title">Découvrez Nody - Élégance Moderne {i + 1}</h2>
                            <p className="slide-text">
                                Des collections exclusives pour exprimer votre style unique.
                                {i === 0 && " Explorez notre ensemble en lain pour trouver de l'inspiration pour votre prochaine tenue."}
                                {i === 1 && " La qualité rencontre le design innovant."}
                                {i === 2 && " Votre garde-robe n'attend que ça !"}
                            </p>
                            <button className="btn btn-light slide-button">Découvrir Maintenant</button>
                        </div>
                    </SwiperSlide>
                ))}
                <div className="swiper-button-prev"></div>
                <div className="swiper-button-next"></div>
            </Swiper>
        </div>
    );
}