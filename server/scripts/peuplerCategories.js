// server/scripts/peuplerCategories.js
import mongoose from 'mongoose';
import Categorie from '../models/categorieModel.js';
import { fakerFR as faker } from '@faker-js/faker';

const categoriesData = [
    {
        nom: 'Mode Homme',
        description: 'Vêtements et accessoires pour hommes',
        niveau: 0,
        ordre: 1,
    },
    {
        nom: 'Mode Femme',
        description: 'Vêtements et accessoires pour femmes',
        niveau: 0,
        ordre: 2,
    },
    {
        nom: 'Mode Enfant',
        description: 'Vêtements et accessoires pour enfants',
        niveau: 0,
        ordre: 3,
    },
    {
        nom: 'Accessoires',
        description: 'Accessoires de mode et bijoux',
        niveau: 0,
        ordre: 4,
    },
    {
        nom: 'Électronique',
        description: 'Appareils électroniques et gadgets',
        niveau: 0,
        ordre: 5,
    },
    {
        nom: 'Maison & Déco',
        description: 'Articles pour la maison et décoration',
        niveau: 0,
        ordre: 6,
    },
    {
        nom: 'Beauté & Santé',
        description: 'Produits de beauté et santé',
        niveau: 0,
        ordre: 7,
    },
    {
        nom: 'Sports & Loisirs',
        description: 'Articles de sport et loisirs',
        niveau: 0,
        ordre: 8,
    },
];

const peuplerCategories = async () => {
    try {
        // Connexion à MongoDB
        await mongoose.connect('mongodb://localhost:27017/nody');
        console.log('✅ Connecté à MongoDB');

        // Supprimer les anciennes catégories
        await Categorie.deleteMany({});
        console.log('🗑️  Anciennes catégories supprimées');

        // Créer les catégories principales
        const categoriesPrincipales =
            await Categorie.insertMany(categoriesData);
        console.log(
            `✅ ${categoriesPrincipales.length} catégories principales créées`
        );

        // Créer des sous-catégories pour chaque catégorie principale
        const sousCategoriesData = [];

        categoriesPrincipales.forEach(categorie => {
            // Créer 3-5 sous-catégories par catégorie principale
            const nombreSousCategories = faker.number.int({ min: 3, max: 5 });

            for (let i = 0; i < nombreSousCategories; i++) {
                const nomSousCategorie = faker.commerce.department();

                sousCategoriesData.push({
                    nom: nomSousCategorie,
                    description: `Sous-catégorie de ${categorie.nom} - ${faker.commerce.productDescription()}`,
                    parent: categorie._id,
                    niveau: 1,
                    ordre: i + 1,
                    estActif: true,
                });
            }
        });

        // Insérer les sous-catégories
        const sousCategories = await Categorie.insertMany(sousCategoriesData);
        console.log(`✅ ${sousCategories.length} sous-catégories créées`);

        // Total des catégories
        const totalCategories = await Categorie.countDocuments();
        console.log(`📊 Total : ${totalCategories} catégories dans la base`);

        // Afficher l'arbre des catégories
        const categoriesArbre = await Categorie.aggregate([
            { $match: { parent: null } },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: 'parent',
                    as: 'sousCategories',
                },
            },
            { $sort: { ordre: 1 } },
        ]);

        console.log('\n🌳 Arbre des catégories :');
        categoriesArbre.forEach(cat => {
            console.log(`\n├─ ${cat.nom}`);
            cat.sousCategories?.forEach((sousCat, index) => {
                const prefix =
                    index === cat.sousCategories.length - 1 ? '└─' : '├─';
                console.log(`   ${prefix} ${sousCat.nom}`);
            });
        });

        console.log('\n🎉 Catégories peuplées avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du peuplement des catégories:', error);
        process.exit(1);
    }
};

peuplerCategories();