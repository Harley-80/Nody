// server/scripts/peuplerProduits.js
import mongoose from 'mongoose';
import Produit from '../models/produitModel.js';
import Categorie from '../models/categorieModel.js';
import { fakerFR as faker } from '@faker-js/faker';

const peuplerProduits = async () => {
    try {
        // Connexion à MongoDB
        await mongoose.connect('mongodb://localhost:27017/nody');
        console.log('✅ Connecté à MongoDB');

        // Vérifier les catégories
        const categories = await Categorie.find();
        console.log(`📊 ${categories.length} catégories trouvées`);

        if (categories.length === 0) {
            console.error(
                "❌ Aucune catégorie trouvée. Veuillez d'abord peupler les catégories."
            );
            console.log('💡 Exécutez : node scripts/peuplerCategories.js');
            process.exit(1);
        }

        // Séparer catégories principales et sous-catégories
        const categoriesPrincipales = categories.filter(
            cat => cat.niveau === 0
        );
        const sousCategories = categories.filter(cat => cat.niveau === 1);

        // Supprimer les anciens produits
        await Produit.deleteMany({});
        console.log('🗑️  Anciens produits supprimés.');

        // Créer 100 produits fictifs
        const produits = [];
        const vendeurId = new mongoose.Types.ObjectId(); // ID vendeur fictif

        const marques = [
            'Nody Fashion',
            'African Elegance',
            'Modern Style',
            'Urban Wear',
            'Premium Collection',
        ];
        const etiquettes = [
            'nouveau',
            'tendance',
            'populaire',
            'exclusif',
            'limited',
            'bestseller',
            'soldes',
        ];
        const couleurs = [
            'Noir',
            'Blanc',
            'Bleu',
            'Rouge',
            'Vert',
            'Jaune',
            'Violet',
            'Rose',
            'Gris',
            'Marron',
        ];
        const tailles = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

        for (let i = 0; i < 100; i++) {
            const categorie = faker.helpers.arrayElement(categoriesPrincipales);
            const sousCategorie = faker.helpers.arrayElement(
                sousCategories.filter(
                    sc => sc.parent.toString() === categorie._id.toString()
                )
            );

            const prix = faker.number.int({ min: 1000, max: 50000 });
            const prixComparaison = faker.datatype.boolean(0.3)
                ? prix * 1.3
                : null; // 30% de produits en promo

            const produit = {
                nom: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                prix: prix,
                prixComparaison: prixComparaison,
                quantite: faker.number.int({ min: 0, max: 200 }),
                seuilStockFaible: 5,
                categorie: categorie._id,
                sousCategorie: sousCategorie?._id,
                vendeur: vendeurId,
                statut: faker.helpers.arrayElement([
                    'actif',
                    'actif',
                    'actif',
                    'en_attente',
                ]), // 75% actifs
                marque: faker.helpers.arrayElement(marques),
                images: [
                    {
                        url: faker.image.urlLoremFlickr({
                            category: 'fashion',
                            width: 800,
                            height: 600,
                        }),
                        alt: faker.commerce.productName(),
                        estPrincipale: true,
                    },
                    {
                        url: faker.image.urlLoremFlickr({
                            category: 'clothing',
                            width: 800,
                            height: 600,
                        }),
                        alt: faker.commerce.productName(),
                        estPrincipale: false,
                    },
                ],
                etiquettes: faker.helpers.arrayElements(
                    etiquettes,
                    faker.number.int({ min: 1, max: 3 })
                ),
                couleurs: faker.helpers.arrayElements(
                    couleurs,
                    faker.number.int({ min: 1, max: 3 })
                ),
                tailles: faker.helpers.arrayElements(
                    tailles,
                    faker.number.int({ min: 1, max: 4 })
                ),
                caracteristiques: [
                    {
                        nom: 'Matériau',
                        valeur: faker.helpers.arrayElement([
                            'Coton',
                            'Polyester',
                            'Laine',
                            'Soie',
                            'Denim',
                        ]),
                    },
                    { nom: 'Origine', valeur: faker.location.country() },
                    { nom: 'Entretien', valeur: 'Lavage à la main recommandé' },
                ],
                evaluations: {
                    moyenne: faker.number.float({
                        min: 3.0,
                        max: 5.0,
                        fractionDigits: 1,
                    }),
                    nombre: faker.number.int({ min: 0, max: 200 }),
                },
                estActif: true,
                estNouveau: faker.datatype.boolean(0.2), // 20% de nouveaux produits
                estEnVedette: faker.datatype.boolean(0.15), // 15% en vedette
                estMeilleureVente: faker.datatype.boolean(0.1), // 10% meilleures ventes
                nombreVentes: faker.number.int({ min: 0, max: 500 }),
                nombreVues: faker.number.int({ min: 100, max: 10000 }),
                createdAt: faker.date.between({
                    from: '2024-01-01',
                    to: new Date(),
                }),
                updatedAt: new Date(),
            };

            // Ajouter des avis pour certains produits
            if (faker.datatype.boolean(0.7)) {
                // 70% des produits ont des avis
                const nombreAvis = faker.number.int({ min: 1, max: 10 });
                produit.avis = [];

                for (let j = 0; j < nombreAvis; j++) {
                    produit.avis.push({
                        utilisateur: new mongoose.Types.ObjectId(),
                        note: faker.number.int({ min: 3, max: 5 }),
                        commentaire: faker.lorem.paragraph(),
                        estVerifie: faker.datatype.boolean(0.8),
                    });
                }
            }

            produits.push(produit);
        }

        // Insérer les produits
        await Produit.insertMany(produits);
        console.log(`✅ ${produits.length} produits créés avec succès !`);

        // Statistiques
        const stats = await Produit.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    actifs: {
                        $sum: { $cond: [{ $eq: ['$statut', 'actif'] }, 1, 0] },
                    },
                    enAttente: {
                        $sum: {
                            $cond: [{ $eq: ['$statut', 'en_attente'] }, 1, 0],
                        },
                    },
                    stockTotal: { $sum: '$quantite' },
                    ventesTotal: { $sum: '$nombreVentes' },
                    prixMoyen: { $avg: '$prix' },
                },
            },
        ]);

        console.log('\n📊 Statistiques produits :');
        console.log(`├─ Total produits : ${stats[0]?.total || 0}`);
        console.log(`├─ Produits actifs : ${stats[0]?.actifs || 0}`);
        console.log(`├─ Produits en attente : ${stats[0]?.enAttente || 0}`);
        console.log(`├─ Stock total : ${stats[0]?.stockTotal || 0} unités`);
        console.log(`├─ Ventes totales : ${stats[0]?.ventesTotal || 0}`);
        console.log(
            `└─ Prix moyen : ${Math.round(stats[0]?.prixMoyen || 0)} XOF`
        );

        // Produits par catégorie
        const produitsParCategorie = await Produit.aggregate([
            { $group: { _id: '$categorie', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categorieInfo',
                },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);

        console.log('\n🏷️  Top catégories :');
        produitsParCategorie.forEach((item, index) => {
            console.log(
                `${index + 1}. ${item.categorieInfo[0]?.nom || 'Inconnu'} : ${item.count} produits`
            );
        });

        console.log('\n🎉 Base de données peuplée avec succès !');
        console.log(
            '🌐 Votre site est maintenant prêt avec des données réalistes !'
        );

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du peuplement des produits:', error);
        process.exit(1);
    }
};

peuplerProduits();