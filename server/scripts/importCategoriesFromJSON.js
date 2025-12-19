import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Categorie from '../models/categorieModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importCategoriesFromJSON = async () => {
    try {
        console.log('Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connecté');

        // Lire le fichier JSON
        const jsonPath = path.join(__dirname, '..', '..', 'categories.json');
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        const categoriesFromJSON = JSON.parse(jsonData);

        console.log(`Chargement de ${categoriesFromJSON.length} catégories...`);

        // Supprimer les catégories existantes
        console.log('Suppression des catégories existantes...');
        await Categorie.deleteMany({});
        console.log('Anciennes catégories supprimées');

        // Créer un map pour trouver les catégories par nom
        const categoryMap = new Map();
        const categoriesToCreate = [];

        // D'abord, créer toutes les catégories racines
        const rootCategories = categoriesFromJSON.filter(
            cat => cat.parent === null
        );

        for (const catData of rootCategories) {
            const category = await Categorie.create({
                name: catData.name,
                slug: catData.slug,
                level: catData.level || 0,
                description: `Découvrez notre collection de ${catData.name.toLowerCase()}`,
                isActive: true,
                order: 0,
            });

            categoryMap.set(catData.name, category._id);
            categoriesToCreate.push({
                ...catData,
                _id: category._id,
                mongoId: category._id,
            });

            console.log(`✓ Racine créée : ${catData.name}`);
        }

        // Ensuite, créer les catégories de niveau 1
        const level1Categories = categoriesFromJSON.filter(
            cat => cat.parent !== null && cat.level === 1
        );

        for (const catData of level1Categories) {
            const parentId = categoryMap.get(catData.parent);

            if (!parentId) {
                console.warn(
                    `Parent "${catData.parent}" introuvable pour "${catData.name}"`
                );
                continue;
            }

            const category = await Categorie.create({
                name: catData.name,
                slug: catData.slug,
                parent: parentId,
                parentName: catData.parent,
                level: 1,
                description: `Découvrez notre collection de ${catData.name.toLowerCase()}`,
                isActive: true,
                order: 0,
            });

            categoryMap.set(catData.name, category._id);
            categoriesToCreate.push({
                ...catData,
                _id: category._id,
                mongoId: category._id,
            });

            console.log(
                `✓ Niveau 1 créée : ${catData.name} (parent: ${catData.parent})`
            );
        }

        // Ensuite, créer les catégories de niveau 2
        const level2Categories = categoriesFromJSON.filter(
            cat => cat.parent !== null && cat.level === 2
        );

        for (const catData of level2Categories) {
            const parentId = categoryMap.get(catData.parent);

            if (!parentId) {
                console.warn(
                    `Parent "${catData.parent}" introuvable pour "${catData.name}"`
                );
                continue;
            }

            const category = await Categorie.create({
                name: catData.name,
                slug: catData.slug,
                parent: parentId,
                parentName: catData.parent,
                level: 2,
                description: `Découvrez notre collection de ${catData.name.toLowerCase()}`,
                isActive: true,
                order: 0,
            });

            categoryMap.set(catData.name, category._id);

            console.log(
                `✓ Niveau 2 créée : ${catData.name} (parent: ${catData.parent})`
            );
        }

        const total = await Categorie.countDocuments();
        console.log('\n========================================');
        console.log(`IMPORT TERMINÉ : ${total} catégories créées`);
        console.log('========================================\n');

        // Afficher les statistiques
        const racines = await Categorie.countDocuments({ parent: null });
        const niveau1 = await Categorie.countDocuments({ level: 1 });
        const niveau2 = await Categorie.countDocuments({ level: 2 });

        console.log(`Répartition par niveau :`);
        console.log(`- Racines (niveau 0) : ${racines}`);
        console.log(`- Niveau 1 : ${niveau1}`);
        console.log(`- Niveau 2 : ${niveau2}`);
        console.log(`- Total : ${total}`);

        process.exit(0);
    } catch (error) {
        console.error("Erreur lors de l'import :", error);
        process.exit(1);
    }
};

importCategoriesFromJSON();
