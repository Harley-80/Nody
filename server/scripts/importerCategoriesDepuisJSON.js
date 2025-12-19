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

        // Chemin vers votre fichier JSON
        const jsonPath = path.join(__dirname, '..', 'categories.json');

        if (!fs.existsSync(jsonPath)) {
            console.error(`Fichier JSON non trouvé : ${jsonPath}`);
            console.log("Création d'un fichier JSON de test...");
            // Créer un fichier JSON de test basé sur vos données
            await creerFichierJSONTest(jsonPath);
        }

        // Lire le fichier JSON
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(
            `Fichier JSON chargé : ${jsonData.length} catégories trouvées`
        );

        // Créer un map pour stocker les IDs par nom (pour les relations)
        const categoriesMap = new Map();

        console.log('\nImport des catégories...');

        // Étape 1: Créer toutes les catégories
        for (const catData of jsonData) {
            // Vérifier si la catégorie existe déjà (gestion des doublons)
            let nomFinal = catData.name;
            let suffixe = 1;

            while (categoriesMap.has(nomFinal)) {
                nomFinal = `${catData.name} (${suffixe})`;
                suffixe++;
            }

            const categorie = await Categorie.create({
                nom: nomFinal,
                slug: catData.slug,
                description: `Catégorie ${nomFinal}`,
                niveau: catData.level || 0,
                estActif: true,
                ordre: 0,
                parent: null, // À définir après
                ancetres: [],
            });

            // Stocker dans la map avec le nom comme clé
            categoriesMap.set(catData.name, {
                id: categorie._id,
                nom: nomFinal,
                slug: categorie.slug,
                parent: catData.parent,
            });

            console.log(
                `Catégorie créée : ${nomFinal} (niveau ${catData.level})`
            );
        }

        console.log(`\n${jsonData.length} catégories créées avec succès`);

        // Étape 2: Établir les relations parent-enfant
        console.log('\nÉtablissement des relations parent-enfant...');

        for (const catData of jsonData) {
            const categorieInfo = categoriesMap.get(catData.name);

            if (!categorieInfo) {
                console.warn(
                    `Catégorie non trouvée dans la map : ${catData.name}`
                );
                continue;
            }

            let parentId = null;

            // Trouver le parent
            if (catData.parent) {
                // Chercher le parent par son nom
                const parentInfo = categoriesMap.get(catData.parent);
                if (parentInfo) {
                    parentId = parentInfo.id;
                    console.log(
                        `Relation : ${catData.name} → ${catData.parent}`
                    );
                } else {
                    console.warn(
                        `Parent "${catData.parent}" introuvable pour "${catData.name}"`
                    );
                }
            }

            // Mettre à jour la catégorie avec le parent
            await Categorie.findByIdAndUpdate(categorieInfo.id, {
                parent: parentId,
            });
        }

        // Étape 3: Calculer les ancêtres pour chaque catégorie
        console.log('\nCalcul des ancêtres...');

        const toutesCategories = await Categorie.find({});

        for (const categorie of toutesCategories) {
            const ancetres = [];
            let parentId = categorie.parent;

            // Remonter la hiérarchie
            while (parentId) {
                const parent = await Categorie.findById(parentId);
                if (parent) {
                    ancetres.unshift({
                        _id: parent._id,
                        nom: parent.nom,
                        slug: parent.slug,
                    });
                    parentId = parent.parent;
                } else {
                    break;
                }
            }

            // Mettre à jour les ancêtres
            await Categorie.findByIdAndUpdate(categorie._id, {
                ancetres: ancetres,
            });

            // Recalculer le niveau à partir de la hiérarchie
            const niveau = ancetres.length;
            await Categorie.findByIdAndUpdate(categorie._id, {
                niveau: niveau,
            });
        }

        // Étape 4: Afficher les statistiques
        const total = await Categorie.countDocuments();
        const racines = await Categorie.countDocuments({ parent: null });
        const niveau1 = await Categorie.countDocuments({ niveau: 1 });
        const niveau2 = await Categorie.countDocuments({ niveau: 2 });
        const niveau3 = await Categorie.countDocuments({ niveau: 3 });

        console.log('\n========================================');
        console.log('IMPORT TERMINÉ AVEC SUCCÈS');
        console.log('========================================');
        console.log(`Total catégories : ${total}`);
        console.log(`Catégories racines : ${racines}`);
        console.log(`Niveau 1 : ${niveau1}`);
        console.log(`Niveau 2 : ${niveau2}`);
        console.log(`Niveau 3+ : ${niveau3}`);

        // Afficher la structure hiérarchique
        console.log('\nStructure hiérarchique :');
        const categoriesRacines = await Categorie.find({ parent: null }).sort({
            nom: 1,
        });

        for (const racine of categoriesRacines) {
            await afficherArborescence(racine, 0);
        }

        console.log('\nImport terminé avec succès !');
        process.exit(0);
    } catch (error) {
        console.error("Erreur lors de l'import :", error);
        process.exit(1);
    }
};

async function afficherArborescence(categorie, niveau) {
    const prefix = '  '.repeat(niveau) + (niveau > 0 ? '├─ ' : '');
    console.log(`${prefix}${categorie.nom} (niveau ${categorie.niveau})`);

    const enfants = await Categorie.find({ parent: categorie._id }).sort({
        nom: 1,
    });

    for (const enfant of enfants) {
        await afficherArborescence(enfant, niveau + 1);
    }
}

async function creerFichierJSONTest(jsonPath) {
    // Créer un fichier JSON de test basé sur vos données
    const testData = [
        {
            name: 'Vêtements homme',
            parent: null,
            slug: 'vetements-homme',
            level: 0,
        },
        {
            name: 'Pantalons',
            parent: 'Vêtements homme',
            slug: 'pantalons-homme',
            level: 1,
        },
        {
            name: 'Pantalons kaki',
            parent: 'Pantalons',
            slug: 'pantalons-kaki-homme',
            level: 2,
        },
        {
            name: 'Vêtements femme',
            parent: null,
            slug: 'vetements-femme',
            level: 0,
        },
        {
            name: 'Robes',
            parent: 'Vêtements femme',
            slug: 'robes-femme',
            level: 1,
        },
        {
            name: 'Accessoires',
            parent: null,
            slug: 'accessoires',
            level: 0,
        },
    ];

    fs.writeFileSync(jsonPath, JSON.stringify(testData, null, 2));
    console.log(`Fichier JSON de test créé : ${jsonPath}`);
    return testData;
}

importerCategories();
