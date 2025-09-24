import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/a11y';
import ProductCard from '../produits/ProduitCard';
import './CarrouselAccueil.scss';

export default function CarrouselAccueil({ produits }) {
    if (!produits || produits.length === 0) {
        return <div className="alert alert-info">Aucun produit à afficher</div>;
    }

    return (
        <div className="carrousel-container">
            <Swiper
                modules={[Navigation, Pagination, Autoplay, A11y]}
                spaceBetween={20}
                slidesPerView={1}
                navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                }}
                pagination={{ 
                    clickable: true,
                    dynamicBullets: true 
                }}
                autoplay={{ 
                    delay: 5000,
                    disableOnInteraction: false 
                }}
                a11y={{
                    prevSlideMessage: 'Produit précédent',
                    nextSlideMessage: 'Produit suivant'
                }}
                breakpoints={{
                    576: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    992: { slidesPerView: 4 }
                }}
                className="my-4"
            >
                {produits.map((produit) => (
                    <SwiperSlide key={produit.id}>
                        <ProductCard produit={produit} />
                    </SwiperSlide>
                ))}
                
                <div className="swiper-button-prev"></div>
                <div className="swiper-button-next"></div>
            </Swiper>
        </div>
    );
}