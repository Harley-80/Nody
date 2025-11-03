// Fonction utilitaire pour générer des slugs
const generateSlug = name => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

// Fonction pour trouver une catégorie par slug
export const findCategoryBySlug = (slug, categories = categoriesData) => {
    for (const category of categories) {
        if (category.slug === slug) return category;
        if (category.subcategories) {
            const found = findCategoryBySlug(slug, category.subcategories);
            if (found) return found;
        }
    }
    return null;
};

// Fonction pour obtenir le chemin d'une catégorie
export const getCategoryPath = slug => {
    const path = [];

    const findPath = (
        currentSlug,
        categories = categoriesData,
        currentPath = []
    ) => {
        for (const category of categories) {
            const newPath = [...currentPath, category];
            if (category.slug === currentSlug) {
                path.push(...newPath);
                return true;
            }
            if (
                category.subcategories &&
                findPath(currentSlug, category.subcategories, newPath)
            ) {
                return true;
            }
        }
        return false;
    };

    findPath(slug);
    return path;
};

// Structure complète des catégories avec IDs et slugs
export const categoriesData = [
    // Catégories racines (Niveau 1)
    {
        id: 'root-1',
        name: 'Vêtements homme',
        slug: 'vetements-homme',
        subcategories: [
            {
                id: 'homme-1',
                name: 'Pantalons',
                slug: 'pantalons-homme',
                subcategories: [
                    {
                        id: 'homme-1-1',
                        name: 'Pantalons kaki',
                        slug: 'pantalons-kaki-homme',
                    },
                    {
                        id: 'homme-1-2',
                        name: 'Pantalons décontractés',
                        slug: 'pantalons-decontractes-homme',
                    },
                    {
                        id: 'homme-1-3',
                        name: 'Pantalons droits',
                        slug: 'pantalons-droits-homme',
                    },
                    {
                        id: 'homme-1-4',
                        name: 'Pantalons lin',
                        slug: 'pantalons-lin-homme',
                    },
                    {
                        id: 'homme-1-5',
                        name: 'Joggings',
                        slug: 'joggings-homme',
                    },
                ],
            },
            {
                id: 'homme-2',
                name: 'Pulls',
                slug: 'pulls-homme',
                subcategories: [
                    {
                        id: 'homme-2-1',
                        name: 'Cols roulés',
                        slug: 'cols-roules-homme',
                    },
                    {
                        id: 'homme-2-2',
                        name: 'Pulls imprimés',
                        slug: 'pulls-imprimes-homme',
                    },
                    { id: 'homme-2-3', name: 'Gilets', slug: 'gilets-homme' },
                    {
                        id: 'homme-2-4',
                        name: 'Gilets sans manches',
                        slug: 'gilets-sans-manches-homme',
                    },
                    {
                        id: 'homme-2-5',
                        name: 'Pulls rayés',
                        slug: 'pulls-rayes-homme',
                    },
                    {
                        id: 'homme-2-6',
                        name: 'Pulls',
                        slug: 'pulls-basiques-homme',
                    },
                ],
            },
            {
                id: 'homme-3',
                name: 'Blazers et costumes',
                slug: 'blazers-costumes-homme',
                subcategories: [
                    {
                        id: 'homme-3-1',
                        name: 'Vestes de costume',
                        slug: 'vestes-costume-homme',
                    },
                    {
                        id: 'homme-3-2',
                        name: 'Costumes',
                        slug: 'costumes-homme',
                    },
                    {
                        id: 'homme-3-3',
                        name: 'Costumes croisés',
                        slug: 'costumes-croises-homme',
                    },
                    { id: 'homme-3-4', name: 'Blazers', slug: 'blazers-homme' },
                    {
                        id: 'homme-3-5',
                        name: 'Costumes simple boutonnage',
                        slug: 'costumes-simple-boutonnage-homme',
                    },
                    {
                        id: 'homme-3-6',
                        name: 'Pantalons de costume',
                        slug: 'pantalons-costume-homme',
                    },
                ],
            },
            {
                id: 'homme-4',
                name: 'Ensembles',
                slug: 'ensembles-homme',
                subcategories: [
                    {
                        id: 'homme-4-1',
                        name: 'Ensembles de sport',
                        slug: 'ensembles-sport-homme',
                    },
                    {
                        id: 'homme-4-2',
                        name: 'Costumes tendances',
                        slug: 'costumes-tendances-homme',
                    },
                ],
            },
            {
                id: 'homme-5',
                name: 'Doudounes',
                slug: 'doudounes-homme',
                subcategories: [
                    {
                        id: 'homme-5-1',
                        name: 'Doudounes longues',
                        slug: 'doudounes-longues-homme',
                    },
                    {
                        id: 'homme-5-2',
                        name: 'Doudounes courtes',
                        slug: 'doudounes-courtes-homme',
                    },
                    {
                        id: 'homme-5-3',
                        name: 'Doudounes légères',
                        slug: 'doudounes-legeres-homme',
                    },
                    {
                        id: 'homme-5-4',
                        name: 'Doudounes à capuche',
                        slug: 'doudounes-capuche-homme',
                    },
                ],
            },
            {
                id: 'homme-6',
                name: 'Jeans',
                slug: 'jeans-homme',
                subcategories: [
                    {
                        id: 'homme-6-1',
                        name: 'Jeans',
                        slug: 'jeans-basiques-homme',
                    },
                    {
                        id: 'homme-6-2',
                        name: 'jeans destroy',
                        slug: 'jeans-destroy-homme',
                    },
                    {
                        id: 'homme-6-3',
                        name: 'Jeans effilés',
                        slug: 'jeans-effiles-homme',
                    },
                    {
                        id: 'homme-6-4',
                        name: 'Jeans slim',
                        slug: 'jeans-slim-homme',
                    },
                    {
                        id: 'homme-6-5',
                        name: 'Jeans cargo',
                        slug: 'jeans-cargo-homme',
                    },
                    {
                        id: 'homme-6-6',
                        name: 'Jeans délavés',
                        slug: 'jeans-delaves-homme',
                    },
                    {
                        id: 'homme-6-7',
                        name: 'Jean',
                        slug: 'jean-classique-homme',
                    },
                ],
            },
            {
                id: 'homme-7',
                name: 'Vestes',
                slug: 'vestes-homme',
                subcategories: [
                    {
                        id: 'homme-7-1',
                        name: 'Vestes bomber',
                        slug: 'vestes-bomber-homme',
                    },
                    {
                        id: 'homme-7-2',
                        name: 'Manteaux',
                        slug: 'manteaux-homme',
                    },
                    {
                        id: 'homme-7-3',
                        name: 'Vestes de baseball',
                        slug: 'vestes-baseball-homme',
                    },
                    {
                        id: 'homme-7-4',
                        name: 'Gilet sans manches',
                        slug: 'gilet-sans-manches-homme',
                    },
                    {
                        id: 'homme-7-5',
                        name: 'Vestes en jean',
                        slug: 'vestes-jean-homme',
                    },
                ],
            },
            {
                id: 'homme-8',
                name: 'Shorts',
                slug: 'shorts-homme',
                subcategories: [
                    {
                        id: 'homme-8-1',
                        name: 'Shorts de gym',
                        slug: 'shorts-gym-homme',
                    },
                    {
                        id: 'homme-8-2',
                        name: 'Shorts de surf',
                        slug: 'shorts-surf-homme',
                    },
                    {
                        id: 'homme-8-3',
                        name: 'Shorts en lin',
                        slug: 'shorts-lin-homme',
                    },
                    {
                        id: 'homme-8-4',
                        name: 'Shorts en jean',
                        slug: 'shorts-jean-homme',
                    },
                    {
                        id: 'homme-8-5',
                        name: 'Shorts cargo',
                        slug: 'shorts-cargo-homme',
                    },
                    {
                        id: 'homme-8-6',
                        name: 'Shorts',
                        slug: 'shorts-basiques-homme',
                    },
                ],
            },
            {
                id: 'homme-9',
                name: 'Chemises',
                slug: 'chemises-homme',
                subcategories: [
                    {
                        id: 'homme-9-1',
                        name: 'Chemises cargo',
                        slug: 'chemises-cargo-homme',
                    },
                    {
                        id: 'homme-9-2',
                        name: 'Chemises en lin',
                        slug: 'chemises-lin-homme',
                    },
                    {
                        id: 'homme-9-3',
                        name: 'Chemises vestes',
                        slug: 'chemises-vestes-homme',
                    },
                    {
                        id: 'homme-9-4',
                        name: 'Chemises imprimées ou motifs',
                        slug: 'chemises-imprimees-homme',
                    },
                    {
                        id: 'homme-9-5',
                        name: 'Chemises en jean',
                        slug: 'chemises-jean-homme',
                    },
                    {
                        id: 'homme-9-6',
                        name: 'Chemises unies',
                        slug: 'chemises-unies-homme',
                    },
                ],
            },
            {
                id: 'homme-10',
                name: 'Nouveautés',
                slug: 'nouveautes-homme',
                subcategories: [
                    {
                        id: 'homme-10-1',
                        name: 'Nouveautés sweat ou pull-over',
                        slug: 'nouveautes-sweat-homme',
                    },
                    {
                        id: 'homme-10-2',
                        name: 'Nouveautés pantalons',
                        slug: 'nouveautes-pantalons-homme',
                    },
                    {
                        id: 'homme-10-3',
                        name: 'Nouveautés shorts',
                        slug: 'nouveautes-shorts-homme',
                    },
                    {
                        id: 'homme-10-4',
                        name: 'Nouveautés ensembles',
                        slug: 'nouveautes-ensembles-homme',
                    },
                    {
                        id: 'homme-10-5',
                        name: 'Nouveautés costumes',
                        slug: 'nouveautes-costumes-homme',
                    },
                    {
                        id: 'homme-10-6',
                        name: 'Nouveautés t-shirts',
                        slug: 'nouveautes-t-shirts-homme',
                    },
                ],
            },
            {
                id: 'homme-11',
                name: "Plus d'options d'achats",
                slug: 'plus-options-achats-homme',
                subcategories: [
                    {
                        id: 'homme-11-1',
                        name: 'Meilleures ventes',
                        slug: 'meilleures-ventes-homme',
                    },
                ],
            },
        ],
    },
    {
        id: 'root-2',
        name: 'Vêtements femme',
        slug: 'vetements-femme',
        subcategories: [
            {
                id: 'femme-1',
                name: 'Bas',
                slug: 'bas-femme',
                subcategories: [
                    {
                        id: 'femme-1-1',
                        name: 'Pantalons',
                        slug: 'pantalons-femme',
                    },
                    { id: 'femme-1-2', name: 'Shorts', slug: 'shorts-femme' },
                    { id: 'femme-1-3', name: 'Jupes', slug: 'jupes-femme' },
                    { id: 'femme-1-4', name: 'Jeans', slug: 'jeans-femme' },
                    {
                        id: 'femme-1-5',
                        name: 'collant',
                        slug: 'collants-femme',
                    },
                    {
                        id: 'femme-1-6',
                        name: 'Joggings',
                        slug: 'joggings-femme',
                    },
                ],
            },
            {
                id: 'femme-2',
                name: 'Robes',
                slug: 'robes-femme',
                subcategories: [
                    {
                        id: 'femme-2-1',
                        name: 'Robes tricotées',
                        slug: 'robes-tricotees-femme',
                    },
                    {
                        id: 'femme-2-2',
                        name: 'Robes longues',
                        slug: 'robes-longues-femme',
                    },
                    {
                        id: 'femme-2-3',
                        name: 'Robes à manches longues',
                        slug: 'robes-manches-longues-femme',
                    },
                    {
                        id: 'femme-2-4',
                        name: 'Robes de soirée',
                        slug: 'robes-soiree-femme',
                    },
                    {
                        id: 'femme-2-5',
                        name: 'Robes courtes',
                        slug: 'robes-courtes-femme',
                    },
                    {
                        id: 'femme-2-6',
                        name: 'Robes',
                        slug: 'robes-basiques-femme',
                    },
                ],
            },
            {
                id: 'femme-3',
                name: 'Robes occasion spéciale',
                slug: 'robes-occasion-speciale',
                subcategories: [
                    {
                        id: 'femme-3-1',
                        name: 'Robes bal de promo',
                        slug: 'robes-bal-promo',
                    },
                    {
                        id: 'femme-3-2',
                        name: 'Robes de soirée',
                        slug: 'robes-soiree-speciale',
                    },
                    {
                        id: 'femme-3-3',
                        name: 'Robes africaines',
                        slug: 'robes-africaines',
                    },
                ],
            },
            {
                id: 'femme-4',
                name: 'Grande taille',
                slug: 'grande-taille-femme',
                subcategories: [
                    {
                        id: 'femme-4-1',
                        name: 'Maillots de bain grande taille',
                        slug: 'maillots-bain-grande-taille',
                    },
                    {
                        id: 'femme-4-2',
                        name: "Vêtements d'extérieur grande taille",
                        slug: 'vetements-exterieur-grande-taille',
                    },
                    {
                        id: 'femme-4-3',
                        name: 'Ensembles grande taille',
                        slug: 'ensembles-grande-taille',
                    },
                    {
                        id: 'femme-4-4',
                        name: 'Grandes tailles',
                        slug: 'grandes-tailles',
                    },
                    {
                        id: 'femme-4-5',
                        name: 'Hauts grande taille',
                        slug: 'hauts-grande-taille',
                    },
                ],
            },
            {
                id: 'femme-5',
                name: "Vêtements d'extérieur",
                slug: 'vetements-exterieur-femme',
                subcategories: [
                    {
                        id: 'femme-5-1',
                        name: 'Doudounes',
                        slug: 'doudounes-femme',
                    },
                    {
                        id: 'femme-5-2',
                        name: 'Manteaux en laine et manches longues',
                        slug: 'manteaux-laine-femme',
                    },
                    {
                        id: 'femme-5-3',
                        name: 'Doudounes longues',
                        slug: 'doudounes-longues-femme',
                    },
                    {
                        id: 'femme-5-4',
                        name: 'Doudounes courtes',
                        slug: 'doudounes-courtes-femme',
                    },
                    { id: 'femme-5-5', name: 'Gilets', slug: 'gilets-femme' },
                ],
            },
            {
                id: 'femme-6',
                name: 'Ensembles assortis',
                slug: 'ensembles-assortis-femme',
                subcategories: [
                    {
                        id: 'femme-6-1',
                        name: 'Ensembles pantalons',
                        slug: 'ensembles-pantalons-femme',
                    },
                    {
                        id: 'femme-6-2',
                        name: 'Ensembles shorts',
                        slug: 'ensembles-shorts-femme',
                    },
                    {
                        id: 'femme-6-3',
                        name: 'Ensembles robes',
                        slug: 'ensembles-robes-femme',
                    },
                    {
                        id: 'femme-6-4',
                        name: 'Ensembles pulls',
                        slug: 'ensembles-pulls-femme',
                    },
                ],
            },
            {
                id: 'femme-7',
                name: 'Hauts',
                slug: 'hauts-femme',
                subcategories: [
                    {
                        id: 'femme-7-1',
                        name: 'Chemises et blouses',
                        slug: 'chemises-blouses-femme',
                    },
                    { id: 'femme-7-2', name: 'Tricots', slug: 'tricots-femme' },
                    {
                        id: 'femme-7-3',
                        name: 'Pulls chauds',
                        slug: 'pulls-chauds-femme',
                    },
                    {
                        id: 'femme-7-4',
                        name: 'Pulls à col rond',
                        slug: 'pulls-col-rond-femme',
                    },
                    {
                        id: 'femme-7-5',
                        name: 'T-shirts à manches longues',
                        slug: 't-shirts-manches-longues-femme',
                    },
                    {
                        id: 'femme-7-6',
                        name: 'T-shirts à manches court',
                        slug: 't-shirts-manches-court-femme',
                    },
                    {
                        id: 'femme-7-7',
                        name: 'Cols roulés',
                        slug: 'cols-roules-femme',
                    },
                ],
            },
            {
                id: 'femme-8',
                name: 'Maillots de bain',
                slug: 'maillots-bain-femme',
                subcategories: [
                    {
                        id: 'femme-8-1',
                        name: 'Une pièce',
                        slug: 'maillots-une-piece',
                    },
                    {
                        id: 'femme-8-2',
                        name: 'Bikinis ou tring',
                        slug: 'bikinis-tring',
                    },
                    {
                        id: 'femme-8-3',
                        name: 'Pareos ou pagne',
                        slug: 'pareos-pagne',
                    },
                ],
            },
            {
                id: 'femme-9',
                name: 'Nouveautés',
                slug: 'nouveautes-femme',
                subcategories: [
                    {
                        id: 'femme-9-1',
                        name: 'Nouveautés manteaux',
                        slug: 'nouveautes-manteaux-femme',
                    },
                    {
                        id: 'femme-9-2',
                        name: 'Nouveautés pantalons',
                        slug: 'nouveautes-pantalons-femme',
                    },
                    {
                        id: 'femme-9-3',
                        name: 'Nouveautés vêtements',
                        slug: 'nouveautes-vetements-femme',
                    },
                    {
                        id: 'femme-9-4',
                        name: 'Nouveautés robes',
                        slug: 'nouveautes-robes-femme',
                    },
                    {
                        id: 'femme-9-5',
                        name: 'Nouveautés ensembles',
                        slug: 'nouveautes-ensembles-femme',
                    },
                    {
                        id: 'femme-9-6',
                        name: 'Nouveautés pulls',
                        slug: 'nouveautes-pulls-femme',
                    },
                ],
            },
            {
                id: 'femme-10',
                name: "Plus d'options d'achats",
                slug: 'plus-options-achats-femme',
                subcategories: [
                    {
                        id: 'femme-10-1',
                        name: 'Meilleures ventes',
                        slug: 'meilleures-ventes-femme',
                    },
                ],
            },
        ],
    },
    {
        id: 'root-3',
        name: 'Enfants',
        slug: 'enfants',
        subcategories: [
            {
                id: 'enfant-1',
                name: 'Accessoires enfants',
                slug: 'accessoires-enfants',
                subcategories: [
                    {
                        id: 'enfant-1-1',
                        name: 'Chapeaux, écharpes, gants',
                        slug: 'chapeaux-echarpes-gants-enfants',
                    },
                    {
                        id: 'enfant-1-2',
                        name: 'Sacs enfants',
                        slug: 'sacs-enfants',
                    },
                ],
            },
            {
                id: 'enfant-2',
                name: 'Vêtements enfant',
                slug: 'vetements-enfant',
                subcategories: [
                    {
                        id: 'enfant-2-1',
                        name: 'Chaussure enfant',
                        slug: 'chaussures-vetements-enfant',
                    },
                    { id: 'enfant-2-2', name: 'Polos', slug: 'polos-enfant' },
                    {
                        id: 'enfant-2-3',
                        name: 'T-short',
                        slug: 't-shirts-enfant',
                    },
                    { id: 'enfant-2-4', name: 'Shorts', slug: 'shorts-enfant' },
                    {
                        id: 'enfant-2-5',
                        name: 'Ensembles enfant',
                        slug: 'ensembles-enfant',
                    },
                    {
                        id: 'enfant-2-6',
                        name: 'Chaussettes enfant',
                        slug: 'chaussettes-enfant',
                    },
                    {
                        id: 'enfant-2-7',
                        name: "Vêtements d'extérieur enfant",
                        slug: 'vetements-exterieur-enfant',
                    },
                ],
            },
            {
                id: 'enfant-3',
                name: 'Chaussures enfant',
                slug: 'chaussures-enfant',
                subcategories: [
                    {
                        id: 'enfant-3-1',
                        name: 'Chaussures décontractées',
                        slug: 'chaussures-decontractees-enfant',
                    },
                    {
                        id: 'enfant-3-2',
                        name: 'Bottes enfant',
                        slug: 'bottes-enfant',
                    },
                    {
                        id: 'enfant-3-3',
                        name: 'Basket',
                        slug: 'baskets-enfant',
                    },
                    {
                        id: 'enfant-3-4',
                        name: 'Mocassin',
                        slug: 'mocassins-enfant',
                    },
                    {
                        id: 'enfant-3-5',
                        name: 'Sandales',
                        slug: 'sandales-enfant',
                    },
                ],
            },
            {
                id: 'enfant-4',
                name: "Plus d'options d'achats",
                slug: 'plus-options-achats-enfant',
                subcategories: [
                    {
                        id: 'enfant-4-1',
                        name: 'Meilleures ventes',
                        slug: 'meilleures-ventes-enfant',
                    },
                ],
            },
        ],
    },
    {
        id: 'root-4',
        name: 'Chaussures',
        slug: 'chaussures',
        subcategories: [
            {
                id: 'chaussures-1',
                name: 'Chaussures décontractées',
                slug: 'chaussures-decontractees',
                subcategories: [
                    {
                        id: 'chaussures-1-1',
                        name: 'Bottines femme',
                        slug: 'bottines-femme',
                    },
                    {
                        id: 'chaussures-1-2',
                        name: 'Baskets femme',
                        slug: 'baskets-femme',
                    },
                    {
                        id: 'chaussures-1-3',
                        name: 'Chaussures en toile femme',
                        slug: 'chaussures-toile-femme',
                    },
                    {
                        id: 'chaussures-1-4',
                        name: 'Chaussures de skate femme',
                        slug: 'chaussures-skate-femme',
                    },
                    {
                        id: 'chaussures-1-5',
                        name: 'Chaussures mocassins femme',
                        slug: 'chaussures-mocassins-femme',
                    },
                ],
            },
            {
                id: 'chaussures-2',
                name: 'Bottes femme',
                slug: 'bottes-femme',
                subcategories: [
                    {
                        id: 'chaussures-2-1',
                        name: 'Bottines à lacets femme',
                        slug: 'bottines-lacets-femme',
                    },
                    {
                        id: 'chaussures-2-2',
                        name: 'Nouveautés bottes femme',
                        slug: 'nouveautes-bottes-femme',
                    },
                    {
                        id: 'chaussures-2-3',
                        name: 'Bottes de pluie',
                        slug: 'bottes-pluie',
                    },
                    {
                        id: 'chaussures-2-4',
                        name: 'Bottes hautes',
                        slug: 'bottes-hautes',
                    },
                ],
            },
            {
                id: 'chaussures-3',
                name: 'Chaussures plates',
                slug: 'chaussures-plates',
                subcategories: [
                    {
                        id: 'chaussures-3-1',
                        name: 'Chaussures babies',
                        slug: 'chaussures-babies',
                    },
                    {
                        id: 'chaussures-3-2',
                        name: 'Ballerines',
                        slug: 'ballerines',
                    },
                    {
                        id: 'chaussures-3-3',
                        name: 'Chaussures en cuir',
                        slug: 'chaussures-cuir-plates',
                    },
                    {
                        id: 'chaussures-3-4',
                        name: 'Chaussures compensées',
                        slug: 'chaussures-compensees',
                    },
                ],
            },
            {
                id: 'chaussures-4',
                name: 'Sandales et chaussures homme',
                slug: 'sandales-chaussures-homme',
                subcategories: [
                    {
                        id: 'chaussures-4-1',
                        name: 'Tongs homme',
                        slug: 'tongs-homme',
                    },
                    {
                        id: 'chaussures-4-2',
                        name: 'Sandales en cuir',
                        slug: 'sandales-cuir-homme',
                    },
                    {
                        id: 'chaussures-4-3',
                        name: "Chaussons d'hiver homme",
                        slug: 'chaussons-hiver-homme',
                    },
                    {
                        id: 'chaussures-4-4',
                        name: 'Claquettes en plastique',
                        slug: 'claquettes-plastique',
                    },
                    {
                        id: 'chaussures-4-5',
                        name: 'Sandales sport',
                        slug: 'sandales-sport',
                    },
                ],
            },
            {
                id: 'chaussures-5',
                name: 'Chaussures à talons homme',
                slug: 'chaussures-talons-homme',
                subcategories: [
                    {
                        id: 'chaussures-5-1',
                        name: 'Chaussures à bout rond',
                        slug: 'chaussures-bout-rond',
                    },
                    {
                        id: 'chaussures-5-2',
                        name: 'Talons compensés',
                        slug: 'talons-compenses',
                    },
                    {
                        id: 'chaussures-5-3',
                        name: 'Chaussures à bout pointu',
                        slug: 'chaussures-bout-pointu',
                    },
                    {
                        id: 'chaussures-5-4',
                        name: 'Chaussures à bouts ouverts',
                        slug: 'chaussures-bouts-ouverts',
                    },
                    {
                        id: 'chaussures-5-5',
                        name: 'Talons très haut',
                        slug: 'talons-tres-haut',
                    },
                ],
            },
            {
                id: 'chaussures-6',
                name: "Plus d'options d'achats",
                slug: 'plus-options-achats-chaussures',
                subcategories: [
                    {
                        id: 'chaussures-6-1',
                        name: 'Meilleures ventes',
                        slug: 'meilleures-ventes-chaussures',
                    },
                ],
            },
            {
                id: 'chaussures-7',
                name: 'Chaussures décontractées (bis)',
                slug: 'chaussures-decontractees-bis',
                subcategories: [
                    {
                        id: 'chaussures-7-1',
                        name: 'Mocassins homme',
                        slug: 'mocassins-homme',
                    },
                    {
                        id: 'chaussures-7-2',
                        name: 'Chaussures en toile homme',
                        slug: 'chaussures-toile-homme',
                    },
                    {
                        id: 'chaussures-7-3',
                        name: 'Chaussures en cuir',
                        slug: 'chaussures-cuir-homme',
                    },
                    {
                        id: 'chaussures-7-4',
                        name: 'Baskets décontractées',
                        slug: 'baskets-decontractees',
                    },
                    {
                        id: 'chaussures-7-5',
                        name: 'Chaussures sport',
                        slug: 'chaussures-sport',
                    },
                ],
            },
            {
                id: 'chaussures-8',
                name: 'Accessoires',
                slug: 'accessoires-chaussures',
                subcategories: [
                    {
                        id: 'chaussures-8-1',
                        name: 'Semelles intérieures',
                        slug: 'semelles-interieures',
                    },
                    {
                        id: 'chaussures-8-2',
                        name: 'Housses de chaussures',
                        slug: 'housses-chaussures',
                    },
                    { id: 'chaussures-8-3', name: 'Lacets', slug: 'lacets' },
                    {
                        id: 'chaussures-8-4',
                        name: 'Cirage à chaussures',
                        slug: 'cirage-chaussures',
                    },
                    {
                        id: 'chaussures-8-5',
                        name: 'Kits soin chaussures',
                        slug: 'kits-soin-chaussures',
                    },
                ],
            },
            {
                id: 'chaussures-9',
                name: 'Sandales et chaussons femme',
                slug: 'sandales-chaussons-femme',
                subcategories: [
                    {
                        id: 'chaussures-9-1',
                        name: 'Sandales à talons',
                        slug: 'sandales-talons-femme',
                    },
                    {
                        id: 'chaussures-9-2',
                        name: 'Mules',
                        slug: 'mules-femme',
                    },
                    {
                        id: 'chaussures-9-3',
                        name: 'Sandales à lanières',
                        slug: 'sandales-lanieres-femme',
                    },
                    {
                        id: 'chaussures-9-4',
                        name: 'Tongs femme',
                        slug: 'tongs-femme',
                    },
                    {
                        id: 'chaussures-9-5',
                        name: 'Sandales plates',
                        slug: 'sandales-plates-femme',
                    },
                    {
                        id: 'chaussures-9-6',
                        name: "Chaussons d'hiver femme",
                        slug: 'chaussons-hiver-femme',
                    },
                ],
            },
            {
                id: 'chaussures-10',
                name: 'Bottes homme',
                slug: 'bottes-homme',
                subcategories: [
                    {
                        id: 'chaussures-10-1',
                        name: 'Bottines à lacets homme',
                        slug: 'bottines-lacets-homme',
                    },
                    {
                        id: 'chaussures-10-2',
                        name: 'Chaussures travail et sécurité',
                        slug: 'chaussures-travail-securite',
                    },
                    {
                        id: 'chaussures-10-3',
                        name: 'Bottes en cuir',
                        slug: 'bottes-cuir-homme',
                    },
                    {
                        id: 'chaussures-10-4',
                        name: 'Bottines militaires homme',
                        slug: 'bottines-militaires-homme',
                    },
                ],
            },
            {
                id: 'chaussures-11',
                name: 'Chaussures professionnelles',
                slug: 'chaussures-professionnelles',
                subcategories: [
                    {
                        id: 'chaussures-11-1',
                        name: 'Chaussures derby',
                        slug: 'chaussures-derby',
                    },
                    {
                        id: 'chaussures-11-2',
                        name: 'Chaussures élégantes',
                        slug: 'chaussures-elegantes',
                    },
                    {
                        id: 'chaussures-11-3',
                        name: 'Mocassins',
                        slug: 'mocassins-professionnels',
                    },
                    {
                        id: 'chaussures-11-4',
                        name: 'Chaussures décontractées',
                        slug: 'chaussures-decontractees-pro',
                    },
                ],
            },
        ],
    },
    {
        id: 'root-5',
        name: 'Accessoires',
        slug: 'accessoires',
        subcategories: [
            {
                id: 'accessoires-1',
                name: 'Écharpes et gants',
                slug: 'echarpes-gants',
                subcategories: [
                    {
                        id: 'accessoires-1-1',
                        name: 'Foulards en soie',
                        slug: 'foulards-soie',
                    },
                    {
                        id: 'accessoires-1-2',
                        name: 'Gants tricotés',
                        slug: 'gants-tricotes',
                    },
                    {
                        id: 'accessoires-1-3',
                        name: 'Écharpes en soie',
                        slug: 'echarpes-soie',
                    },
                    {
                        id: 'accessoires-1-4',
                        name: 'Écharpes unies',
                        slug: 'echarpes-unies',
                    },
                    {
                        id: 'accessoires-1-5',
                        name: 'Écharpes cachemire',
                        slug: 'echarpes-cachemire',
                    },
                    {
                        id: 'accessoires-1-6',
                        name: 'Écharpes à carreaux',
                        slug: 'echarpes-carreaux',
                    },
                ],
            },
            {
                id: 'accessoires-2',
                name: 'Chapeaux',
                slug: 'chapeaux',
                subcategories: [
                    {
                        id: 'accessoires-2-1',
                        name: 'Chapeaux fantaisie',
                        slug: 'chapeaux-fantaisie',
                    },
                    {
                        id: 'accessoires-2-2',
                        name: 'Cagoules',
                        slug: 'cagoules',
                    },
                    {
                        id: 'accessoires-2-3',
                        name: 'Chapeaux',
                        slug: 'chapeaux-basiques',
                    },
                    {
                        id: 'accessoires-2-4',
                        name: 'Chapeaux de soleil enfants',
                        slug: 'chapeaux-soleil-enfants',
                    },
                    {
                        id: 'accessoires-2-5',
                        name: 'Casquettes',
                        slug: 'casquettes',
                    },
                ],
            },
            {
                id: 'accessoires-3',
                name: 'Ceintures',
                slug: 'ceintures',
                subcategories: [
                    {
                        id: 'accessoires-3-1',
                        name: 'Chaînes de taille',
                        slug: 'chaines-taille',
                    },
                    {
                        id: 'accessoires-3-2',
                        name: 'Ceintures homme',
                        slug: 'ceintures-homme',
                    },
                    {
                        id: 'accessoires-3-3',
                        name: 'Ceintures mode',
                        slug: 'ceintures-mode',
                    },
                    {
                        id: 'accessoires-3-4',
                        name: 'Accessoires ceinture',
                        slug: 'accessoires-ceinture',
                    },
                    {
                        id: 'accessoires-3-5',
                        name: 'Ceintures féminine',
                        slug: 'ceintures-feminine',
                    },
                ],
            },
            {
                id: 'accessoires-4',
                name: 'Lunettes de soleil',
                slug: 'lunettes-soleil',
                subcategories: [
                    {
                        id: 'accessoires-4-1',
                        name: 'Lunettes de soleil femme',
                        slug: 'lunettes-soleil-femme',
                    },
                    {
                        id: 'accessoires-4-2',
                        name: 'Lunettes de soleil enfants',
                        slug: 'lunettes-soleil-enfants',
                    },
                    {
                        id: 'accessoires-4-3',
                        name: 'Lunettes de soleil polarisées',
                        slug: 'lunettes-soleil-polarisees',
                    },
                    {
                        id: 'accessoires-4-4',
                        name: 'Lunettes de soleil fantaisie',
                        slug: 'lunettes-soleil-fantaisie',
                    },
                    {
                        id: 'accessoires-4-5',
                        name: 'Lunettes de soleil tendance',
                        slug: 'lunettes-soleil-tendance',
                    },
                    {
                        id: 'accessoires-4-6',
                        name: 'Lunettes de soleil cycliste',
                        slug: 'lunettes-soleil-cycliste',
                    },
                ],
            },
            {
                id: 'accessoires-5',
                name: "Plus d'options d'achats",
                slug: 'plus-options-achats-accessoires',
                subcategories: [
                    {
                        id: 'accessoires-5-1',
                        name: 'Meilleures ventes',
                        slug: 'meilleures-ventes-accessoires',
                    },
                ],
            },
            {
                id: 'accessoires-6',
                name: 'Autres accessoires',
                slug: 'autres-accessoires',
                subcategories: [
                    { id: 'accessoires-6-1', name: 'Masques', slug: 'masques' },
                    {
                        id: 'accessoires-6-2',
                        name: 'Noeuds papillon',
                        slug: 'noeuds-papillon',
                    },
                    {
                        id: 'accessoires-6-3',
                        name: 'Mouchoirs en tissu',
                        slug: 'mouchoirs-tissu',
                    },
                    {
                        id: 'accessoires-6-4',
                        name: 'Cravates',
                        slug: 'cravates',
                    },
                    {
                        id: 'accessoires-6-5',
                        name: 'Cannes tendances',
                        slug: 'cannes-tendances',
                    },
                    {
                        id: 'accessoires-6-6',
                        name: 'Bretelles',
                        slug: 'bretelles',
                    },
                    {
                        id: 'accessoires-6-7',
                        name: 'Porte jarretelles',
                        slug: 'porte-jarretelles',
                    },
                ],
            },
            {
                id: 'accessoires-7',
                name: 'Accessoires de tête',
                slug: 'accessoires-tete',
                subcategories: [
                    {
                        id: 'accessoires-7-1',
                        name: 'Pinces à cheveux',
                        slug: 'pinces-cheveux',
                    },
                    {
                        id: 'accessoires-7-2',
                        name: 'Bonnets de nuit',
                        slug: 'bonnets-nuit',
                    },
                    {
                        id: 'accessoires-7-3',
                        name: 'Élastiques et chouchous',
                        slug: 'elastiques-chouchous',
                    },
                    {
                        id: 'accessoires-7-4',
                        name: 'Bandeaux',
                        slug: 'bandeaux',
                    },
                    {
                        id: 'accessoires-7-5',
                        name: 'Barrettes à cheveux',
                        slug: 'barrettes-cheveux',
                    },
                ],
            },
        ],
    },
    {
        id: 'root-6',
        name: 'Sacs, bagages',
        slug: 'sacs-bagages',
        subcategories: [
            {
                id: 'sacs-1',
                name: 'Sac à main',
                slug: 'sac-a-main',
                subcategories: [
                    { id: 'sacs-1-1', name: 'Sacs seau', slug: 'sacs-seau' },
                    { id: 'sacs-1-2', name: 'Sacs Hobo', slug: 'sacs-hobo' },
                    { id: 'sacs-1-3', name: 'Sacs carré', slug: 'sacs-carre' },
                    {
                        id: 'sacs-1-4',
                        name: 'Sacs boston',
                        slug: 'sacs-boston',
                    },
                    {
                        id: 'sacs-1-5',
                        name: 'Sac baguette',
                        slug: 'sac-baguette',
                    },
                    {
                        id: 'sacs-1-6',
                        name: 'Accessoires sacs',
                        slug: 'accessoires-sacs',
                    },
                ],
            },
            {
                id: 'sacs-2',
                name: 'Portefeuille, porte-monnaie',
                slug: 'portefeuille-porte-monnaie',
                subcategories: [
                    {
                        id: 'sacs-2-1',
                        name: 'Portefeuilles homme',
                        slug: 'portefeuilles-homme',
                    },
                    {
                        id: 'sacs-2-2',
                        name: 'Portefeuilles de voyage',
                        slug: 'portefeuilles-voyage',
                    },
                    {
                        id: 'sacs-2-3',
                        name: 'Portefeuilles femme',
                        slug: 'portefeuilles-femme',
                    },
                    {
                        id: 'sacs-2-4',
                        name: 'Porte-cartes de crédit',
                        slug: 'porte-cartes-credit',
                    },
                    {
                        id: 'sacs-2-5',
                        name: 'Portefeuilles cuir homme',
                        slug: 'portefeuilles-cuir-homme',
                    },
                ],
            },
            {
                id: 'sacs-3',
                name: 'Sacs à dos',
                slug: 'sacs-a-dos',
                subcategories: [
                    {
                        id: 'sacs-3-1',
                        name: "Sacs à dos d'affaires",
                        slug: 'sacs-a-dos-affaires',
                    },
                    {
                        id: 'sacs-3-2',
                        name: 'Sacs à dos antivol',
                        slug: 'sacs-a-dos-antivol',
                    },
                    {
                        id: 'sacs-3-3',
                        name: 'Sacs bandoulière',
                        slug: 'sacs-bandouliere',
                    },
                    { id: 'sacs-3-4', name: 'Sacoches', slug: 'sacoches' },
                ],
            },
            {
                id: 'sacs-4',
                name: 'Sac banane',
                slug: 'sac-banane',
                subcategories: [
                    {
                        id: 'sacs-4-1',
                        name: 'Sacs banane en cuir',
                        slug: 'sacs-banane-cuir',
                    },
                    {
                        id: 'sacs-4-2',
                        name: 'Sacs banane à chaîne',
                        slug: 'sacs-banane-chaine',
                    },
                    {
                        id: 'sacs-4-3',
                        name: 'Sacs banane sport',
                        slug: 'sacs-banane-sport',
                    },
                    {
                        id: 'sacs-4-4',
                        name: 'Sacs banane en toile',
                        slug: 'sacs-banane-toile',
                    },
                ],
            },
            {
                id: 'sacs-5',
                name: "Plus d'options d'achats",
                slug: 'plus-options-achats-sacs',
                subcategories: [
                    {
                        id: 'sacs-5-1',
                        name: 'Meilleures ventes',
                        slug: 'meilleures-ventes-sacs',
                    },
                ],
            },
            {
                id: 'sacs-6',
                name: 'Nouveautés',
                slug: 'nouveautes-sacs',
                subcategories: [
                    {
                        id: 'sacs-6-1',
                        name: 'Nouveautés sacs à main',
                        slug: 'nouveautes-sacs-a-main',
                    },
                    {
                        id: 'sacs-6-2',
                        name: 'Nouveautés sacs à dos',
                        slug: 'nouveautes-sacs-a-dos',
                    },
                ],
            },
        ],
    },
    {
        id: 'root-7',
        name: 'Bijouterie',
        slug: 'bijouterie',
        subcategories: [
            {
                id: 'bijoux-1',
                name: 'Bijoux',
                slug: 'bijoux',
                subcategories: [
                    {
                        id: 'bijoux-1-1',
                        name: 'Parures de bijoux',
                        slug: 'parures-bijoux',
                    },
                    {
                        id: 'bijoux-1-2',
                        name: 'Emballages bijoux',
                        slug: 'emballages-bijoux',
                    },
                    {
                        id: 'bijoux-1-3',
                        name: 'Crochets bijoux',
                        slug: 'crochets-bijoux',
                    },
                    {
                        id: 'bijoux-1-4',
                        name: 'Médaillons',
                        slug: 'medaillons',
                    },
                    {
                        id: 'bijoux-1-5',
                        name: 'Chaînes',
                        slug: 'chaines-bijoux',
                    },
                ],
            },
            {
                id: 'bijoux-2',
                name: 'Bagues',
                slug: 'bagues',
                subcategories: [
                    {
                        id: 'bijoux-2-1',
                        name: 'Bague pour femme',
                        slug: 'bague-femme',
                    },
                    {
                        id: 'bijoux-2-2',
                        name: 'Bague pour homme',
                        slug: 'bague-homme',
                    },
                    {
                        id: 'bijoux-2-3',
                        name: 'Bague de mariage',
                        slug: 'bague-mariage',
                    },
                    {
                        id: 'bijoux-2-4',
                        name: 'Bague de couple',
                        slug: 'bague-couple',
                    },
                    {
                        id: 'bijoux-2-5',
                        name: 'Bague connectée',
                        slug: 'bague-connectee',
                    },
                    {
                        id: 'bijoux-2-6',
                        name: 'Bagues chevalières',
                        slug: 'bagues-chevalieres',
                    },
                ],
            },
            {
                id: 'bijoux-3',
                name: 'Autres bijoux',
                slug: 'autres-bijoux',
                subcategories: [
                    {
                        id: 'bijoux-3-1',
                        name: 'Pinces à cravate',
                        slug: 'pinces-cravate',
                    },
                    {
                        id: 'bijoux-3-2',
                        name: 'Parures de bijoux',
                        slug: 'parures-bijoux-autres',
                    },
                    {
                        id: 'bijoux-3-3',
                        name: 'Porte-clés',
                        slug: 'porte-cles-bijoux',
                    },
                    { id: 'bijoux-3-4', name: 'Broches', slug: 'broches' },
                    {
                        id: 'bijoux-3-5',
                        name: 'Bijoux cheveux',
                        slug: 'bijoux-cheveux',
                    },
                ],
            },
            {
                id: 'bijoux-4',
                name: 'Bracelets',
                slug: 'bracelets',
                subcategories: [
                    {
                        id: 'bijoux-4-1',
                        name: 'Bracelets en argent',
                        slug: 'bracelets-argent',
                    },
                    {
                        id: 'bijoux-4-2',
                        name: 'Bracelets moissanite',
                        slug: 'bracelets-moissanite',
                    },
                    {
                        id: 'bijoux-4-3',
                        name: 'Bracelets pierre naturelle',
                        slug: 'bracelets-pierre-naturelle',
                    },
                    {
                        id: 'bijoux-4-4',
                        name: 'Bracelets chaîne',
                        slug: 'bracelets-chaine',
                    },
                    {
                        id: 'bijoux-4-5',
                        name: 'Bracelets en fil',
                        slug: 'bracelets-fil',
                    },
                    {
                        id: 'bijoux-4-6',
                        name: 'Bracelets plaqué or',
                        slug: 'bracelets-plaque-or',
                    },
                ],
            },
            {
                id: 'bijoux-5',
                name: 'Bijoux de corps',
                slug: 'bijoux-corps',
                subcategories: [
                    {
                        id: 'bijoux-5-1',
                        name: "Piercings d'oreille",
                        slug: 'piercings-oreille',
                    },
                    {
                        id: 'bijoux-5-2',
                        name: 'Grills dents',
                        slug: 'grills-dents',
                    },
                    {
                        id: 'bijoux-5-3',
                        name: 'Piercings nombril',
                        slug: 'piercings-nombril',
                    },
                    {
                        id: 'bijoux-5-4',
                        name: 'Chaînes de corps',
                        slug: 'chaines-corps',
                    },
                    {
                        id: 'bijoux-5-5',
                        name: 'Piercings nez',
                        slug: 'piercings-nez',
                    },
                ],
            },
            {
                id: 'bijoux-6',
                name: 'Matériel',
                slug: 'materiel-bijoux',
                subcategories: [
                    {
                        id: 'bijoux-6-1',
                        name: 'Argent',
                        slug: 'argent-materiel',
                    },
                    {
                        id: 'bijoux-6-2',
                        name: 'Argent 925',
                        slug: 'argent-925',
                    },
                    { id: 'bijoux-6-3', name: 'Perles', slug: 'perles' },
                    { id: 'bijoux-6-4', name: 'Or plaqué', slug: 'or-plaque' },
                    {
                        id: 'bijoux-6-5',
                        name: 'Pierres précieuses',
                        slug: 'pierres-precieuses',
                    },
                    {
                        id: 'bijoux-6-6',
                        name: 'Moissanite',
                        slug: 'moissanite',
                    },
                ],
            },
            {
                id: 'bijoux-7',
                name: "Boucles d'oreilles",
                slug: 'boucles-oreilles',
                subcategories: [
                    {
                        id: 'bijoux-7-1',
                        name: "Boucles d'oreilles plaqué or",
                        slug: 'boucles-oreilles-plaque-or',
                    },
                    {
                        id: 'bijoux-7-2',
                        name: "Sets boucles d'oreilles",
                        slug: 'sets-boucles-oreilles',
                    },
                    {
                        id: 'bijoux-7-3',
                        name: "Boucles d'oreilles en argent",
                        slug: 'boucles-oreilles-argent',
                    },
                    { id: 'bijoux-7-4', name: 'Créoles', slug: 'creoles' },
                    {
                        id: 'bijoux-7-5',
                        name: "Boucles d'oreilles en perle",
                        slug: 'boucles-oreilles-perle',
                    },
                    {
                        id: 'bijoux-7-6',
                        name: "Boucles d'oreilles pendantes",
                        slug: 'boucles-oreilles-pendantes',
                    },
                ],
            },
            {
                id: 'bijoux-8',
                name: 'Colliers',
                slug: 'colliers',
                subcategories: [
                    {
                        id: 'bijoux-8-1',
                        name: 'Colliers femme',
                        slug: 'colliers-femme',
                    },
                    {
                        id: 'bijoux-8-2',
                        name: 'Colliers en argent',
                        slug: 'colliers-argent',
                    },
                    {
                        id: 'bijoux-8-3',
                        name: 'Colliers hip-hop',
                        slug: 'colliers-hip-hop',
                    },
                    {
                        id: 'bijoux-8-4',
                        name: 'Colliers de perles',
                        slug: 'colliers-perles',
                    },
                    {
                        id: 'bijoux-8-5',
                        name: 'Colliers homme',
                        slug: 'colliers-homme',
                    },
                    {
                        id: 'bijoux-8-6',
                        name: 'Collier superposé',
                        slug: 'collier-superpose',
                    },
                ],
            },
            {
                id: 'bijoux-9',
                name: 'Montres homme',
                slug: 'montres-homme',
                subcategories: [
                    {
                        id: 'bijoux-9-1',
                        name: 'Montres mécaniques',
                        slug: 'montres-mecaniques-homme',
                    },
                    {
                        id: 'bijoux-9-2',
                        name: 'Montres automatiques',
                        slug: 'montres-automatiques-homme',
                    },
                    {
                        id: 'bijoux-9-3',
                        name: 'Montres à quartz',
                        slug: 'montres-quartz-homme',
                    },
                    {
                        id: 'bijoux-9-4',
                        name: 'Montres digitales',
                        slug: 'montres-digitales-homme',
                    },
                    {
                        id: 'bijoux-9-5',
                        name: 'Montres de sport',
                        slug: 'montres-sport-homme',
                    },
                    {
                        id: 'bijoux-9-6',
                        name: 'Montres de luxe',
                        slug: 'montres-luxe-homme',
                    },
                    {
                        id: 'bijoux-9-7',
                        name: 'Montres vintage',
                        slug: 'montres-vintage-homme',
                    },
                    {
                        id: 'bijoux-9-8',
                        name: 'Montres en cuir',
                        slug: 'montres-cuir-homme',
                    },
                    {
                        id: 'bijoux-9-9',
                        name: 'Bracelets de montres',
                        slug: 'bracelets-montres-homme',
                    },
                    {
                        id: 'bijoux-9-10',
                        name: 'Étuis montre homme',
                        slug: 'etuis-montre-homme',
                    },
                    {
                        id: 'bijoux-9-11',
                        name: 'Enrouleurs de montre',
                        slug: 'enrouleurs-montre-homme',
                    },
                ],
            },
            {
                id: 'bijoux-10',
                name: 'Montres femme',
                slug: 'montres-femme',
                subcategories: [
                    {
                        id: 'bijoux-10-1',
                        name: 'Montres mécaniques',
                        slug: 'montres-mecaniques-femme',
                    },
                    {
                        id: 'bijoux-10-2',
                        name: 'Montres à quartz',
                        slug: 'montres-quartz-femme',
                    },
                    {
                        id: 'bijoux-10-3',
                        name: 'Montres automatiques',
                        slug: 'montres-automatiques-femme',
                    },
                    {
                        id: 'bijoux-10-4',
                        name: 'Montres bracelet',
                        slug: 'montres-bracelet-femme',
                    },
                    {
                        id: 'bijoux-10-5',
                        name: 'Montres en cuir',
                        slug: 'montres-cuir-femme',
                    },
                    {
                        id: 'bijoux-10-6',
                        name: 'Montres de luxe',
                        slug: 'montres-luxe-femme',
                    },
                    {
                        id: 'bijoux-10-7',
                        name: 'Montres vintage',
                        slug: 'montres-vintage-femme',
                    },
                    {
                        id: 'bijoux-10-8',
                        name: 'Montres de sport',
                        slug: 'montres-sport-femme',
                    },
                    {
                        id: 'bijoux-10-9',
                        name: 'Bracelets de montres',
                        slug: 'bracelets-montres-femme',
                    },
                    {
                        id: 'bijoux-10-10',
                        name: 'Etuis montre femme',
                        slug: 'etuis-montre-femme',
                    },
                    {
                        id: 'bijoux-10-11',
                        name: 'Enrouleurs de montre',
                        slug: 'enrouleurs-montre-femme',
                    },
                ],
            },
            {
                id: 'bijoux-11',
                name: 'Montres Connectées',
                slug: 'montres-connectees',
                subcategories: [
                    {
                        id: 'bijoux-11-1',
                        name: 'Montres connectées GPS',
                        slug: 'montres-connectees-gps',
                    },
                    {
                        id: 'bijoux-11-2',
                        name: 'Montres connectées de sport',
                        slug: 'montres-connectees-sport',
                    },
                    {
                        id: 'bijoux-11-3',
                        name: 'Montres connectées pour enfants',
                        slug: 'montres-connectees-enfants',
                    },
                    {
                        id: 'bijoux-11-4',
                        name: 'Montres connectées avec appel et SMS',
                        slug: 'montres-connectees-appel-sms',
                    },
                    {
                        id: 'bijoux-11-5',
                        name: 'Montres connectées avec mesure de la fréquence cardiaque',
                        slug: 'montres-connectees-frequence-cardiaque',
                    },
                ],
            },
            {
                id: 'bijoux-12',
                name: "Plus d'options d'achats",
                slug: 'plus-options-achats-bijoux',
                subcategories: [
                    {
                        id: 'bijoux-12-1',
                        name: 'Meilleures ventes',
                        slug: 'meilleures-ventes-bijoux',
                    },
                ],
            },
            {
                id: 'bijoux-13',
                name: 'Nouveautés',
                slug: 'nouveautes-bijoux',
                subcategories: [
                    {
                        id: 'bijoux-13-1',
                        name: 'Nouveautés porte-clés',
                        slug: 'nouveautes-porte-cles',
                    },
                    {
                        id: 'bijoux-13-2',
                        name: 'Nouveautés montres homme',
                        slug: 'nouveautes-montres-homme',
                    },
                    {
                        id: 'bijoux-13-3',
                        name: 'Nouveautés colliers',
                        slug: 'nouveautes-colliers',
                    },
                    {
                        id: 'bijoux-13-4',
                        name: 'Nouveautés bracelets',
                        slug: 'nouveautes-bracelets',
                    },
                    {
                        id: 'bijoux-13-5',
                        name: 'Nouveautés bagues',
                        slug: 'nouveautes-bagues',
                    },
                    {
                        id: 'bijoux-13-6',
                        name: 'Nouveautés fermoirs',
                        slug: 'nouveautes-fermoirs',
                    },
                ],
            },
        ],
    },
    {
        id: 'root-8',
        name: 'Extensions, perruques',
        slug: 'extensions-perruques',
        subcategories: [
            {
                id: 'extensions-1',
                name: 'Extensions cheveux',
                slug: 'extensions-cheveux',
                subcategories: [
                    {
                        id: 'extensions-1-1',
                        name: 'Extensions à clip',
                        slug: 'extensions-clip',
                    },
                    {
                        id: 'extensions-1-2',
                        name: 'Mèches pour crochets',
                        slug: 'meches-crochets',
                    },
                    {
                        id: 'extensions-1-3',
                        name: 'Extensions cheveux humains',
                        slug: 'extensions-cheveux-humains',
                    },
                    {
                        id: 'extensions-1-4',
                        name: 'Tissages',
                        slug: 'tissages',
                    },
                    {
                        id: 'extensions-1-5',
                        name: 'Mèches avec closures',
                        slug: 'meches-closures',
                    },
                    {
                        id: 'extensions-1-6',
                        name: 'Grosses tresses',
                        slug: 'grosses-tresses',
                    },
                ],
            },
            {
                id: 'extensions-2',
                name: 'Postiches',
                slug: 'postiches',
                subcategories: [
                    { id: 'extensions-2-1', name: 'Toupets', slug: 'toupets' },
                    {
                        id: 'extensions-2-2',
                        name: 'Queues de cheval synthétiques',
                        slug: 'queues-cheval-synthetiques',
                    },
                    {
                        id: 'extensions-2-3',
                        name: 'Chignons synthétiques',
                        slug: 'chignons-synthetiques',
                    },
                    {
                        id: 'extensions-2-4',
                        name: 'Volumateurs capillaires',
                        slug: 'volumateurs-capillaires',
                    },
                    { id: 'extensions-2-5', name: 'Franges', slug: 'franges' },
                    {
                        id: 'extensions-2-6',
                        name: 'Queues de cheval cheveux',
                        slug: 'queues-cheval-cheveux',
                    },
                ],
            },
            {
                id: 'extensions-3',
                name: 'Perruques tendances',
                slug: 'perruques-tendances',
                subcategories: [
                    {
                        id: 'extensions-3-1',
                        name: 'Perruques ondulées',
                        slug: 'perruques-ondulees',
                    },
                    {
                        id: 'extensions-3-2',
                        name: 'Perruques bouclées',
                        slug: 'perruques-bouclees',
                    },
                    {
                        id: 'extensions-3-3',
                        name: 'Perruques en dentelle',
                        slug: 'perruques-dentelle-tendances',
                    },
                    {
                        id: 'extensions-3-4',
                        name: 'Perruques tressées en dentelle',
                        slug: 'perruques-tressees-dentelle',
                    },
                ],
            },
            {
                id: 'extensions-4',
                name: "Plus d'options d'achats",
                slug: 'plus-options-achats-extensions',
                subcategories: [
                    {
                        id: 'extensions-4-1',
                        name: 'Meilleures ventes',
                        slug: 'meilleures-ventes-extensions',
                    },
                ],
            },
            {
                id: 'extensions-5',
                name: 'Accessoires perruques',
                slug: 'accessoires-perruques',
                subcategories: [
                    {
                        id: 'extensions-5-1',
                        name: 'Filets à cheveux',
                        slug: 'filets-cheveux',
                    },
                    {
                        id: 'extensions-5-2',
                        name: 'Supports pour perruque',
                        slug: 'supports-perruque',
                    },
                ],
            },
            {
                id: 'extensions-6',
                name: 'Perruques en dentelle',
                slug: 'perruques-dentelle',
                subcategories: [
                    {
                        id: 'extensions-6-1',
                        name: 'Perruques synthétiques',
                        slug: 'perruques-synthetiques',
                    },
                    {
                        id: 'extensions-6-2',
                        name: 'Perruques naturelles raides',
                        slug: 'perruques-naturelles-raides',
                    },
                    {
                        id: 'extensions-6-3',
                        name: 'Perruques naturelles',
                        slug: 'perruques-naturelles',
                    },
                    {
                        id: 'extensions-6-4',
                        name: 'Perruques en soie à base',
                        slug: 'perruques-soie-base',
                    },
                    {
                        id: 'extensions-6-5',
                        name: 'Perruques Dentelle Handmade',
                        slug: 'perruques-dentelle-handmade',
                    },
                    {
                        id: 'extensions-6-6',
                        name: 'Perruques naturelles (bis)',
                        slug: 'perruques-naturelles-bis',
                    },
                ],
            },
            {
                id: 'extensions-7',
                name: 'Perruques',
                slug: 'perruques',
                subcategories: [
                    {
                        id: 'extensions-7-1',
                        name: 'Perruques bandeau',
                        slug: 'perruques-bandeau',
                    },
                    {
                        id: 'extensions-7-2',
                        name: 'Perruques en U',
                        slug: 'perruques-en-u',
                    },
                    {
                        id: 'extensions-7-3',
                        name: 'Perruques juives',
                        slug: 'perruques-juives',
                    },
                    {
                        id: 'extensions-7-4',
                        name: 'Perruques afro',
                        slug: 'perruques-afro',
                    },
                    {
                        id: 'extensions-7-5',
                        name: 'Perruques coupe Pixie',
                        slug: 'perruques-coupe-pixie',
                    },
                ],
            },
        ],
    },
    {
        id: 'root-9',
        name: 'Sous-vêtements, vêtements de détente',
        slug: 'sous-vetements-detente',
        subcategories: [
            {
                id: 'sousvetements-1',
                name: 'Sous-vêtements homme',
                slug: 'sous-vetements-homme',
                subcategories: [
                    { id: 'sousvetements-1-1', name: 'Boxers', slug: 'boxers' },
                    {
                        id: 'sousvetements-1-2',
                        name: 'Maillots de corps',
                        slug: 'maillots-corps',
                    },
                    {
                        id: 'sousvetements-1-3',
                        name: 'Chaussettes',
                        slug: 'chaussettes-homme',
                    },
                    {
                        id: 'sousvetements-1-4',
                        name: 'Corsets sport hommes',
                        slug: 'corsets-sport-hommes',
                    },
                    {
                        id: 'sousvetements-1-5',
                        name: 'Pyjamas',
                        slug: 'pyjamas-homme',
                    },
                    {
                        id: 'sousvetements-1-6',
                        name: 'Sous-vêtements thermiques',
                        slug: 'sous-vetements-thermiques',
                    },
                ],
            },
            {
                id: 'sousvetements-2',
                name: 'Chaussettes',
                slug: 'chaussettes',
                subcategories: [
                    {
                        id: 'sousvetements-2-1',
                        name: 'Bas',
                        slug: 'bas-chaussettes',
                    },
                    {
                        id: 'sousvetements-2-2',
                        name: "Chaussettes d'hiver",
                        slug: 'chaussettes-hiver',
                    },
                    {
                        id: 'sousvetements-2-3',
                        name: 'Chaussettes chaudes',
                        slug: 'chaussettes-chaudes',
                    },
                    {
                        id: 'sousvetements-2-4',
                        name: 'Chaussettes basses',
                        slug: 'chaussettes-basses',
                    },
                    {
                        id: 'sousvetements-2-5',
                        name: 'Chaussettes JK',
                        slug: 'chaussettes-jk',
                    },
                    {
                        id: 'sousvetements-2-6',
                        name: 'Chaussettes (bis)',
                        slug: 'chaussettes-bis',
                    },
                ],
            },
            {
                id: 'sousvetements-3',
                name: 'Lingerie sculptante',
                slug: 'lingerie-sculptante',
                subcategories: [
                    { id: 'sousvetements-3-1', name: 'Gaines', slug: 'gaines' },
                    {
                        id: 'sousvetements-3-2',
                        name: 'Corsets',
                        slug: 'corsets',
                    },
                    {
                        id: 'sousvetements-3-3',
                        name: 'Culottes sculptantes',
                        slug: 'culottes-sculptantes',
                    },
                    {
                        id: 'sousvetements-3-4',
                        name: 'Body',
                        slug: 'body-sculptant',
                    },
                ],
            },
            {
                id: 'sousvetements-4',
                name: 'Soutien-gorge',
                slug: 'soutien-gorge',
                subcategories: [
                    {
                        id: 'sousvetements-4-1',
                        name: 'Soutien-gorge adhésifs',
                        slug: 'soutien-gorge-adhesifs',
                    },
                    {
                        id: 'sousvetements-4-2',
                        name: 'Brassières sport',
                        slug: 'brassieres-sport',
                    },
                    {
                        id: 'sousvetements-4-3',
                        name: 'Soutien-gorge sans coutures',
                        slug: 'soutien-gorge-sans-coutures',
                    },
                    {
                        id: 'sousvetements-4-4',
                        name: 'Soutien-gorge sans bretelles',
                        slug: 'soutien-gorge-sans-bretelles',
                    },
                    {
                        id: 'sousvetements-4-5',
                        name: 'Soutien-gorge sexy',
                        slug: 'soutien-gorge-sexy',
                    },
                    {
                        id: 'sousvetements-4-6',
                        name: 'Soutien-gorge push-up',
                        slug: 'soutien-gorge-push-up',
                    },
                ],
            },
            {
                id: 'sousvetements-5',
                name: 'Culottes',
                slug: 'culottes',
                subcategories: [
                    {
                        id: 'sousvetements-5-1',
                        name: 'Culottes',
                        slug: 'culottes-basiques',
                    },
                    {
                        id: 'sousvetements-5-2',
                        name: 'Culottes grande taille',
                        slug: 'culottes-grande-taille',
                    },
                    {
                        id: 'sousvetements-5-3',
                        name: 'Strings',
                        slug: 'strings',
                    },
                    {
                        id: 'sousvetements-5-4',
                        name: 'Culottes sexy',
                        slug: 'culottes-sexy',
                    },
                    {
                        id: 'sousvetements-5-5',
                        name: 'Culottes menstruelles',
                        slug: 'culottes-menstruelles',
                    },
                ],
            },
            {
                id: 'sousvetements-6',
                name: 'Détente et sommeil',
                slug: 'detente-sommeil',
                subcategories: [
                    {
                        id: 'sousvetements-6-1',
                        name: 'Chemises de nuit',
                        slug: 'chemises-nuit',
                    },
                    {
                        id: 'sousvetements-6-2',
                        name: 'Ensembles pyjama',
                        slug: 'ensembles-pyjama',
                    },
                    {
                        id: 'sousvetements-6-3',
                        name: "Pyjamas d'hiver",
                        slug: 'pyjamas-hiver',
                    },
                ],
            },
            {
                id: 'sousvetements-7',
                name: 'Nouveautés',
                slug: 'nouveautes-sousvetements',
                subcategories: [
                    {
                        id: 'sousvetements-7-1',
                        name: 'Nouveautés chaussettes',
                        slug: 'nouveautes-chaussettes',
                    },
                    {
                        id: 'sousvetements-7-2',
                        name: 'Nouveautés sous-vêtements',
                        slug: 'nouveautes-sous-vetements',
                    },
                    {
                        id: 'sousvetements-7-3',
                        name: 'Nouveautés pyjamas femme',
                        slug: 'nouveautes-pyjamas-femme',
                    },
                    {
                        id: 'sousvetements-7-4',
                        name: 'Nouveautés pyjamas homme',
                        slug: 'nouveautes-pyjamas-homme',
                    },
                    {
                        id: 'sousvetements-7-5',
                        name: 'Nouveautés sous-vêtements femme',
                        slug: 'nouveautes-sous-vetements-femme',
                    },
                    {
                        id: 'sousvetements-7-6',
                        name: 'Nouveautés chaussettes homme',
                        slug: 'nouveautes-chaussettes-homme',
                    },
                ],
            },
            {
                id: 'sousvetements-8',
                name: "Plus d'options d'achats",
                slug: 'plus-options-achats-sousvetements',
                subcategories: [
                    {
                        id: 'sousvetements-8-1',
                        name: 'Meilleures ventes',
                        slug: 'meilleures-ventes-sousvetements',
                    },
                ],
            },
        ],
    },
];

// Fonction pour obtenir toutes les catégories aplaties (utile pour les recherches)
export const getAllCategoriesFlat = () => {
    const flatCategories = [];

    const flattenCategories = (categories, level = 0) => {
        categories.forEach(category => {
            flatCategories.push({
                ...category,
                level,
            });
            if (category.subcategories) {
                flattenCategories(category.subcategories, level + 1);
            }
        });
    };

    flattenCategories(categoriesData);
    return flatCategories;
};

// Fonction pour rechercher des catégories par terme
export const searchCategories = searchTerm => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const allCategories = getAllCategoriesFlat();

    return allCategories.filter(category =>
        category.name.toLowerCase().includes(term)
    );
};

export default categoriesData;
