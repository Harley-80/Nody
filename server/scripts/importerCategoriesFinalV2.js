import 'dotenv/config';
import mongoose from 'mongoose';
import Categorie from '../models/categorieModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importer = async () => {
    try {
        console.log('🔄 Connexion MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        await Categorie.deleteMany({});
        console.log('✅ Base vidée');

        const rawData = JSON.parse(
            fs.readFileSync(
                path.join(
                    __dirname,
                    '..',
                    'categories_propre_avec_noms_uniques.json'
                ),
                'utf8'
            )
        );

        const nomToId = new Map();

        // ÉTAPE 1 : Créer les 6 racines
        const racines = rawData.filter(cat => cat.parent === null);
        console.log(`🔷 Création des ${racines.length} racines...`);
        for (const cat of racines) {
            const saved = await Categorie.create({
                nom: cat.nom,
                slug: cat.slug,
                description: `Catégorie ${cat.nom}`,
                estActif: true,
                niveau: 0,
                parent: null,
                ancetres: [],
            });
            nomToId.set(cat.nom, saved._id);
            console.log(`  ✅ ${cat.nom}`);
        }

        // ÉTAPE 2 : Créer les niveau 1
        const niveau1 = rawData.filter(cat => cat.niveau === 1);
        console.log(`🔷 Création des ${niveau1.length} catégories niveau 1...`);
        for (const cat of niveau1) {
            const parentId = nomToId.get(cat.parent);
            if (!parentId) {
                console.warn(
                    `⚠️  Parent introuvable pour ${cat.nom}: ${cat.parent}`
                );
                continue;
            }
            const saved = await Categorie.create({
                nom: cat.nom,
                slug: cat.slug,
                description: `Catégorie ${cat.nom}`,
                estActif: true,
                niveau: 1,
                parent: parentId,
                ancetres: [{ _id: parentId, nom: cat.parent, slug: '' }],
            });
            nomToId.set(cat.nom, saved._id);
            console.log(`  ✅ ${cat.nom} → ${cat.parent}`);
        }

        // ÉTAPE 3 : Créer les niveau 2
        const niveau2 = rawData.filter(cat => cat.niveau === 2);
        console.log(`🔷 Création des ${niveau2.length} catégories niveau 2...`);
        for (const cat of niveau2) {
            const parentId = nomToId.get(cat.parent);
            if (!parentId) {
                console.warn(
                    `⚠️  Parent introuvable pour ${cat.nom}: ${cat.parent}`
                );
                continue;
            }
            // Récupérer le parent pour construire les ancêtres
            const parentDoc = await Categorie.findById(parentId);
            const ancetres = parentDoc
                ? [
                      ...parentDoc.ancetres,
                      {
                          _id: parentId,
                          nom: parentDoc.nom,
                          slug: parentDoc.slug,
                      },
                  ]
                : [];
            const saved = await Categorie.create({
                nom: cat.nom,
                slug: cat.slug,
                description: `Catégorie ${cat.nom}`,
                estActif: true,
                niveau: 2,
                parent: parentId,
                ancetres,
            });
            console.log(`  ✅ ${cat.nom} → ${cat.parent}`);
        }

        // Stats finales
        const total = await Categorie.countDocuments();
        const racinesCount = await Categorie.countDocuments({ parent: null });
        console.log('\n✅ IMPORT RÉUSSI');
        console.log(`Total : ${total}`);
        console.log(`Racines : ${racinesCount} (doit être 6)`);

        process.exit(0);
    } catch (err) {
        console.error('❌ ERREUR :', err);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
};

importer();