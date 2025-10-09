// Données des produits pour le peuplement de la base de données
const produitsData = [
    {
        nom: 'T-shirt Homme Basique',
        description: 'T-shirt en coton de haute qualité',
        prix: 2.0,
        prixPromo: 1.0,
        enStock: true,
        quantiteStock: 50,
        images: ['tshirt1.jpg', 'tshirt2.jpg'],
        caracteristiques: {
            matiere: 'Coton 100%',
            couleur: 'Blanc',
            taille: 'M',
            marque: 'Nody Mode',
        },
        notes: 4.5,
        nombreAvis: 47,
        tags: ['tshirt', 'basique', 'homme', 'coton'],
    },
    {
        nom: 'Jean Slim Homme',
        description: 'Jean slim moderne et confortable',
        prix: 15.0,
        enStock: true,
        quantiteStock: 50,
        images: ['jean1.jpg', 'jean2.jpg'],
        caracteristiques: {
            matiere: 'Denim',
            couleur: 'Bleu',
            taille: '32',
            marque: 'Nody Denim',
        },
        notes: 4.2,
        nombreAvis: 23,
        tags: ['jean', 'slim', 'homme', 'denim'],
    },
    // ... ajouter plus de produits
];

export default produitsData;
