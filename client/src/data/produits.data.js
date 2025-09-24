export const produitsMock = [
    {
        id: 1,
        nom: 'Chemise Homme',
        prix: 18000,
        images: [
            'https://s.alicdn.com/@sc04/kf/H4b9eeacb0d394254af49007acf9aa464s.jpg_720x720q50.jpg',
            'https://via.placeholder.com/600x600?text=Chemise+Homme+Vue2', // Exemple d'image supplémentaire
            'https://via.placeholder.com/600x600?text=Chemise+Homme+Vue3', // Exemple d'image supplémentaire
        ],
        image: 'https://s.alicdn.com/@sc04/kf/H4b9eeacb0d394254af49007acf9aa464s.jpg_720x720q50.jpg', // Garder pour la carte si vous voulez
        description: "Chemise hawaïenne d'été pour hommes, avec imprimé de plantes tropicales, respirante, décontractée",
        status: 'Nouveau',
        isNew: true,
        variations: [
            { type: 'taille', options: ['S', 'M', 'L', 'XL'] },
            { type: 'couleur', options: ['Blanc', 'Bleu', 'Vert'] }
        ],
        stock: 50,
        categories: 'Mode Homme/Vêtements ', // catégorie et sous-catégorie
    },
    {
        id: 2,
        nom: 'Costumes Élégants',
        prix: 25000,
        images: [
            'https://s.alicdn.com/@sc04/kf/Hf2ae7ff79fb54a0d95974fd6f48068ddk.jpg_720x720q50.jpg',
            'https://via.placeholder.com/600x600?text=Costume+Femme+Vue2', // Exemple
        ],
        image: 'https://s.alicdn.com/@sc04/kf/Hf2ae7ff79fb54a0d95974fd6f48068ddk.jpg_720x720q50.jpg',
        description: "Nouveautés dames élégant couleur unie costumes ensemble pour femmes Blazer et pantalon ensemble costumes d'affaires pour les femmes.",
        status: 'Promo',
        isPromotion: true,
        variations: [
            { type: 'taille', options: ['S', 'M', 'L', 'XL'] },
            { type: 'couleur', options: ['blanc', 'Gris', 'Bleu Marine'] }
        ],
        stock: 30,
        categories: 'Mode Femme/Costumes & Accessoires',
    },
    {
        id: 3,
        nom: 'Sac à main Femme',
        prix: 25000,
        images: [
            'https://s.alicdn.com/@sc04/kf/HTB1IdUYX5DxK1Rjy1zcq6yGeXXab.jpg_720x720q50.jpg',
            'https://via.placeholder.com/600x600?text=Sac+Femme+Vue2', // Exemple
        ],
        image: 'https://s.alicdn.com/@sc04/kf/HTB1IdUYX5DxK1Rjy1zcq6yGeXXab.jpg_720x720q50.jpg',
        description: "Sacs à main pour dames élégante femme à la mode.",
        isPromotion: true,
        variations: [
            { type: 'couleur', options: ['Rouge', 'Noir', 'Beige'] }
        ],
        stock: 20,
        categories: 'Mode Femme/ Sacs à main et portefeuilles',
    },
    {
        id: 4,
        nom: 'Montre Unisexe Luxe',
        prix: 30000,
        images: [
            'https://s.alicdn.com/@sc04/kf/He09ac05dc70d42158dc1da5a3b242f4cl.jpg_720x720q50.jpg',
            'https://via.placeholder.com/600x600?text=Montre+Vue2', // Exemple
        ],
        image: 'https://s.alicdn.com/@sc04/kf/He09ac05dc70d42158dc1da5a3b242f4cl.jpg_720x720q50.jpg',
        description: 'Bracelet acier inoxydable, mouvement suisse précis, étanche 50m. Un classique intemporel.',
        status: null,
        variations: [
            { type: 'couleur', options: ['Or', 'Noir', 'Beige'] }
        ],
        stock: 15,
        categories: 'Montres/ Montres Unisexe',
    },
    {
        id: 5,
        nom: 'Chaussures Enfant Stylées',
        prix: 5000,
        images: [
            'https://s.alicdn.com/@sc04/kf/H08db848742614c65a3233a501c75e6e9F.png_720x720q50.jpg',
            'https://via.placeholder.com/600x600?text=Chaussures+Enfant+Vue2', // Exemple
        ],
        image: 'https://s.alicdn.com/@sc04/kf/H08db848742614c65a3233a501c75e6e9F.png_720x720q50.jpg',
        description: "Baskets tendance de couleur, nouveau Design.",
        status: 'Exclusif',
        variations: [
            { type: 'taille', options: ['28', '29', '30', '31', '32'] },
            { type: 'couleur', options: ['blanc', 'Gris', 'Noir'] }
        ],
        stock: 40,
        categories: 'Mode Enfant/ Basket',
    },
    {
        id: 6,
        nom: "Short d'été homme",
        prix: 2500,
        images: [
            'https://img.joomcdn.net/7feb3d6bbb1e56af42331976c044436e10c029ba_original.jpeg',
            'https://m.media-amazon.com/images/I/61-wNrffJEL._UY350_.jpg', // Exemple
        ],
        image: 'https://img.joomcdn.net/7feb3d6bbb1e56af42331976c044436e10c029ba_original.jpeg',
        description: "Short d'été décontracté en coton pour Homme, surdimensionné.",
        status: 'Nouveautés',
        variations: [
            { type: 'taille', options: ['S', 'M', 'L', 'XL'] },
            { type: 'couleur', options: ['blanc', 'Gris', 'Noir'] }
        ],
        stock: 40,
        categories: 'Mode Homme/Vêtements ',
    },
    {
        id: 7,
        nom: "Robe d'éte Femmes",
        prix: 4000,
        images: [
            'https://m.media-amazon.com/images/I/71pVX-GANAL._UY1000_.jpg',
            'https://www.cdiscount.com/pdt2/1/8/6/1/700x700/mp62691186/rw/robe-femme-d-ete-boheme-robe-floral-sundress-halte.jpg', // Exemple
        ],
        image: 'https://m.media-amazon.com/images/I/71pVX-GANAL._UY1000_.jpg',
        description: "Robes de plage sans Manches Décontracté avec Poches Blanc Floral.",
        status: 'Nouveautés',
        variations: [
            { type: 'taille', options: ['S', 'M', 'L', 'XL'] },
            { type: 'couleur', options: ['blanc', 'Gris', 'Noir'] }
        ],
        stock: 40,
        categories: 'Mode Femmes/ Vêtements',
    },
    {
        id: 8,
        nom: ' Vêtements femme printemps - été',
        prix: 5000,
        images: [
            'https://www.cdiscount.com/pdt2/4/3/6/3/700x700/mp62039436/rw/ensemble-de-vetements-nouveaux-vetements-femme-pri.jpg',
            'https://images.coinafrique.com/5444317_uploaded_image1_1753621276.jpg', // Exemple
        ],
        image: 'https://www.cdiscount.com/pdt2/4/3/6/3/700x700/mp62039436/rw/ensemble-de-vetements-nouveaux-vetements-femme-pri.jpg',
        description: "Ensemble court femme printemps - été.",
        status: 'Nouveautés',
        variations: [
            { type: 'taille', options: ['S', 'M', 'L', 'XL'] },
            { type: 'couleur', options: ['blanc', 'Gris', 'Noir'] }
        ],
        stock: 40,
        categories: 'Mode Femme/ Vêtements',
    },
];
