import 'dotenv/config';
import mongoose from 'mongoose';
import Categorie from '../models/categorieModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importerCategories = async () => {
    try {
        console.log('Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connecté');

        console.log('Suppression des catégories existantes...');
        await Categorie.deleteMany({});
        console.log('Anciennes catégories supprimées');

        console.log('Lecture du fichier JSON...');
        const jsonPath = path.join(__dirname, '..', 'categories.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`${jsonData.length} catégories à importer`);

        // Étape 1: Créer un map pour stocker les IDs par nom original
        const categoriesMap = new Map();
        const categoriesInserees = [];

        console.log('\nCréation des catégories...');

        // Créer toutes les catégories sans parent d'abord
        for (const catData of jsonData) {
            // Vérifier les doublons de noms
            let nomFinal = catData.name;
            let suffixe = 1;

            while (categoriesMap.has(nomFinal)) {
                nomFinal = `${catData.name}_${suffixe}`;
                suffixe++;
            }

            const categorie = new Categorie({
                nom: nomFinal,
                slug:
                    catData.slug || nomFinal.toLowerCase().replace(/\s+/g, '-'),
                description: `Catégorie ${nomFinal}`,
                niveau: catData.level || 0,
                estActif: true,
                ordre: 0,
                parent: null,
                ancetres: [],
            });

            await categorie.save();

            categoriesMap.set(catData.name, {
                id: categorie._id,
                nom: nomFinal,
            });

            categoriesInserees.push({
                id: categorie._id,
                nomOriginal: catData.name,
                parentNom: catData.parent,
            });

            console.log(`✓ ${nomFinal}`);
        }

        console.log(`\n${jsonData.length} catégories créées`);

        // Étape 2: Établir les relations parent-enfant
        console.log('\nMise à jour des relations parent-enfant...');

        let relationsEtablies = 0;
        for (const cat of categoriesInserees) {
            if (cat.parentNom) {
                const parentInfo = categoriesMap.get(cat.parentNom);
                if (parentInfo) {
                    await Categorie.findByIdAndUpdate(cat.id, {
                        parent: parentInfo.id,
                    });
                    relationsEtablies++;

                    if (relationsEtablies % 50 === 0) {
                        console.log(
                            `  ${relationsEtablies} relations établies...`
                        );
                    }
                }
            }
        }

        console.log(`✓ ${relationsEtablies} relations établies`);

        // Étape 3: Recalculer les niveaux (simplifié)
        console.log('\nCalcul des niveaux...');

        // Mettre à jour les niveaux en fonction du JSON original
        for (const catData of jsonData) {
            const categorieInfo = categoriesMap.get(catData.name);
            if (categorieInfo) {
                await Categorie.findByIdAndUpdate(categorieInfo.id, {
                    niveau: catData.level || 0,
                });
            }
        }

        console.log('✓ Niveaux mis à jour');

        // Statistiques finales
        const total = await Categorie.countDocuments();
        const racines = await Categorie.countDocuments({ parent: null });

        console.log('\n========================================');
        console.log('✅ IMPORT TERMINÉ AVEC SUCCÈS');
        console.log('========================================');
        console.log(`Total catégories : ${total}`);
        console.log(`Catégories racines : ${racines}`);

        // Afficher un échantillon
        console.log('\nÉchantillon des catégories racines :');
        const sampleRacines = await Categorie.find({ parent: null })
            .limit(5)
            .sort({ nom: 1 });

        sampleRacines.forEach(racine => {
            console.log(`  - ${racine.nom}`);
        });

        console.log('\n🎉 Import terminé !');
        console.log('\nPour tester :');
        console.log('1. Redémarrer le serveur : npm run dev');
        console.log('2. Accéder à : http://localhost:5000/api/categories');
        console.log('3. Vérifier dans MongoDB Compass');

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Erreur lors de l'import :", error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

importerCategories();
