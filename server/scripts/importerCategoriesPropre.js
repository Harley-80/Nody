import 'dotenv/config';
import mongoose from 'mongoose';
import Categorie from '../models/categorieModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importerCategoriesPropre = async () => {
    let categoriesMap = new Map(); // nom → ObjectId

    try {
        console.log('🔄 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connecté');

        console.log('🗑️  Suppression des catégories existantes...');
        await Categorie.deleteMany({});
        console.log('✅ Anciennes catégories supprimées');

        console.log('📂 Lecture du fichier JSON (sans _id)...');
        const jsonPath = path.join(__dirname, '..', 'categories_propre.json');

        if (!fs.existsSync(jsonPath)) {
            throw new Error(`Fichier JSON non trouvé : ${jsonPath}`);
        }

        const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`📄 ${rawData.length} catégories chargées`);

        // Première passe : créer toutes les catégories (sans parent)
        console.log('\n🆕 Création des catégories (sans parents)...');
        for (const catData of rawData) {
            const newCat = new Categorie({
                nom: catData.nom,
                slug: catData.slug,
                description: `Catégorie ${catData.nom}`,
                parent: null,
                niveau: catData.niveau,
                estActif: true,
                enVedette: false,
                ordre: 0,
                ancetres: [],
            });

            const saved = await newCat.save();
            categoriesMap.set(catData.nom, saved._id);
            console.log(`  ✅ ${catData.nom}`);
        }

        // Deuxième passe : mettre à jour les parents
        console.log('\n🔗 Mise à jour des relations parent-enfant...');
        for (const catData of rawData) {
            if (catData.parent) {
                const parentId = categoriesMap.get(catData.parent);
                if (!parentId) {
                    console.warn(
                        `⚠️  Parent introuvable : ${catData.parent} pour ${catData.nom}`
                    );
                    continue;
                }
                await Categorie.findOneAndUpdate(
                    { nom: catData.nom },
                    { parent: parentId }
                );
            }
        }

        // Recalcul des ancêtres et niveaux
        console.log('\n🧬 Recalcul des ancêtres...');
        const allCategories = await Categorie.find({}).lean();
        const catMap = new Map(
            allCategories.map(cat => [cat._id.toString(), cat])
        );
        let updateCount = 0;

        for (const cat of allCategories) {
            const ancetres = [];
            let currentId = cat.parent;
            let depth = 0;

            while (currentId && depth < 10) {
                const parentCat = allCategories.find(
                    c => c._id.toString() === currentId.toString()
                );
                if (!parentCat) break;

                ancetres.unshift({
                    _id: parentCat._id,
                    nom: parentCat.nom,
                    slug: parentCat.slug,
                });

                currentId = parentCat.parent;
                depth++;
            }

            if (
                cat.niveau !== depth ||
                JSON.stringify(cat.ancetres) !== JSON.stringify(ancetres)
            ) {
                await Categorie.findByIdAndUpdate(cat._id, {
                    niveau: depth,
                    ancetres: ancetres,
                });
                updateCount++;
            }
        }

        console.log(`✅ ${updateCount} catégories mises à jour`);

        // Stats finales
        const total = await Categorie.countDocuments();
        const racines = await Categorie.countDocuments({ parent: null });
        const niv1 = await Categorie.countDocuments({ niveau: 1 });
        const niv2 = await Categorie.countDocuments({ niveau: 2 });
        const niv3plus = await Categorie.countDocuments({
            niveau: { $gte: 3 },
        });

        console.log('\n📊 RÉSUMÉ FINAL :');
        console.log('================================');
        console.log(`Total catégories      : ${total}`);
        console.log(`Racines (niveau 0)    : ${racines}`);
        console.log(`Niveau 1              : ${niv1}`);
        console.log(`Niveau 2              : ${niv2}`);
        console.log(`Niveau 3+             : ${niv3plus}`);
        console.log('================================');

        if (niv3plus === 0) {
            console.log('✅ Structure conforme aux 3 niveaux max');
        }

        console.log('\n🎉 Import terminé avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERREUR :', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
};

importerCategoriesPropre();