import image1 from '../assets/images/image1.jpeg';
import image2 from '../assets/images/image2.jpeg';
import image3 from '../assets/images/image3.jpeg';

export const carousels = [
    {
        id: 1,
        image: image1,
        title: 'Nouvelle Collection Femme',
        description: "Des looks modernes pour l'été.",
        link: '/produits?search=Femme',
        align: 'text-center',
    },
    {
        id: 2,
        image: image2,
        title: 'Mode Femme Élégante',
        description: 'Inspirez votre style avec notre sélection.',
        link: '/produits?search=femme',
        align: 'text-center',
    },
    {
        id: 3,
        image: image3,
        title: 'Accessoires Tendance',
        description: 'Complétez votre look avec nos nouveautés.',
        link: '/produits?search=femme',
        align: 'text-center',
    },
];
