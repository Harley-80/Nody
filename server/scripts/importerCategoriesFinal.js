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
            throw new Error(`Fichier JSON non trouvé : ${jsonPath}`);
        }

        // Lire le fichier JSON
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(
            `Fichier JSON chargé : ${jsonData.length} catégories trouvées`
        );

        // Étape 1: Créer un dictionnaire pour gérer les noms uniques
        const nomsUtilises = new Map(); // Pour suivre les occurrences
        const categoriesMap = new Map(); // Pour stocker les IDs par nom original

        console.log('\nTraitement des catégories...');

        // Première passe : analyser les noms et préparer les noms finaux
        const categoriesAvecNomsFinaux = jsonData.map(cat => {
            const nomOriginal = cat.name;
            let nomFinal = nomOriginal;

            // Compter les occurrences de ce nom
            const occurrences = nomsUtilises.get(nomOriginal) || 0;
            nomsUtilises.set(nomOriginal, occurrences + 1);

            // Si c'est la première occurrence, garder le nom tel quel
            // Les doublons seront gérés lors de la création
            return {
                ...cat,
                nomOriginal,
                nomFinal,
                occurrences,
            };
        });

        // Deuxième passe : créer les catégories avec gestion des doublons
        console.log('\nCréation des catégories...');

        for (const catData of categoriesAvecNomsFinaux) {
            let nomFinal = catData.nomFinal;
            let suffixe = 1;

            // Gestion intelligente des doublons
            if (catData.occurrences > 1) {
                // Si c'est un doublon, ajouter le parent dans le nom
                if (catData.parent) {
                    nomFinal = `${catData.name} (${catData.parent})`;
                } else {
                    // Sinon, ajouter un numéro
                    nomFinal = `${catData.name} ${suffixe}`;
                }
            }

            // Vérifier que le nom final est unique dans notre map temporaire
            while (categoriesMap.has(nomFinal)) {
                suffixe++;
                nomFinal = `${catData.name} ${suffixe}`;
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

            // Stocker dans la map avec le nom original ET le nom final
            categoriesMap.set(catData.name, {
                id: categorie._id,
                nomFinal: nomFinal,
            });

            // Stocker aussi par nom final pour vérifier l'unicité
            categoriesMap.set(nomFinal, {
                id: categorie._id,
                nomOriginal: catData.name,
            });

            console.log(
                `Catégorie créée : ${nomFinal} (niveau ${catData.level})`
            );
        }

        console.log(`\n${jsonData.length} catégories créées avec succès`);

        // Étape 3: Établir les relations parent-enfant
        console.log('\nÉtablissement des relations parent-enfant...');

        for (const catData of jsonData) {
            const categorieInfo = categoriesMap.get(catData.name);

            if (!categorieInfo) {
                console.warn(
                    `⚠️ Catégorie non trouvée dans la map : ${catData.name}`
                );
                continue;
            }

            let parentId = null;

            // Trouver le parent
            if (catData.parent) {
                // Chercher le parent par son nom original
                const parentInfo = categoriesMap.get(catData.parent);
                if (parentInfo) {
                    parentId = parentInfo.id;
                    console.log(
                        `Relation : ${categorieInfo.nomFinal} → ${catData.parent}`
                    );
                } else {
                    console.warn(
                        `⚠️ Parent "${catData.parent}" introuvable pour "${catData.name}"`
                    );
                }
            }

            // Mettre à jour la catégorie avec le parent
            await Categorie.findByIdAndUpdate(categorieInfo.id, {
                parent: parentId,
            });
        }

        // Étape 4: Recalculer les ancêtres et niveaux
        console.log('\nRecalcul des ancêtres et niveaux...');

        const toutesCategories = await Categorie.find({});
        let miseAJourCount = 0;

        for (const categorie of toutesCategories) {
            const ancetres = [];
            let parentId = categorie.parent;
            let niveau = 0;

            // Remonter la hiérarchie pour trouver les ancêtres
            while (parentId) {
                const parent = await Categorie.findById(parentId);
                if (parent) {
                    ancetres.unshift({
                        _id: parent._id,
                        nom: parent.nom,
                        slug: parent.slug,
                    });
                    parentId = parent.parent;
                    niveau++;
                } else {
                    break;
                }
            }

            // Mettre à jour si nécessaire
            if (
                categorie.niveau !== niveau ||
                JSON.stringify(categorie.ancetres) !== JSON.stringify(ancetres)
            ) {
                await Categorie.findByIdAndUpdate(categorie._id, {
                    niveau: niveau,
                    ancetres: ancetres,
                });
                miseAJourCount++;
            }
        }

        console.log(
            `${miseAJourCount} catégories mises à jour avec ancêtres/niveaux`
        );

        // Étape 5: Afficher les statistiques
        const total = await Categorie.countDocuments();
        const racines = await Categorie.countDocuments({ parent: null });
        const niveau1 = await Categorie.countDocuments({ niveau: 1 });
        const niveau2 = await Categorie.countDocuments({ niveau: 2 });
        const niveau3 = await Categorie.countDocuments({ niveau: 3 });
        const niveau4 = await Categorie.countDocuments({ niveau: 4 });

        console.log('\n========================================');
        console.log('✅ IMPORT TERMINÉ AVEC SUCCÈS');
        console.log('========================================');
        console.log(`Total catégories : ${total}`);
        console.log(`Catégories racines (niveau 0) : ${racines}`);
        console.log(`Sous-catégories niveau 1 : ${niveau1}`);
        console.log(`Sous-catégories niveau 2 : ${niveau2}`);
        console.log(`Sous-catégories niveau 3 : ${niveau3}`);
        console.log(`Sous-catégories niveau 4+ : ${niveau4}`);

        // Vérification des doublons
        console.log('\n🔍 Vérification des doublons :');
        const tousNoms = await Categorie.find({}, { nom: 1 }).lean();
        const nomsSet = new Set();
        const doublons = [];

        tousNoms.forEach(cat => {
            if (nomsSet.has(cat.nom)) {
                doublons.push(cat.nom);
            } else {
                nomsSet.add(cat.nom);
            }
        });

        if (doublons.length > 0) {
            console.log(
                `⚠️ Attention : ${doublons.length} doublons détectés :`,
                doublons.slice(0, 10)
            );
        } else {
            console.log('✅ Aucun doublon détecté');
        }

        // Afficher un échantillon de la structure
        console.log('\n🌳 Échantillon de la structure hiérarchique :');
        const categoriesRacines = await Categorie.find({ parent: null })
            .sort({ nom: 1 })
            .limit(5);

        for (const racine of categoriesRacines) {
            await afficherArborescence(racine, 0, 2); // Limiter la profondeur à 2 niveaux
        }

        // Exporter un rapport
        await exporterRapport();

        console.log('\n🎉 Import terminé avec succès !');
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Erreur lors de l'import :", error.message);
        if (error.code === 11000) {
            console.log('💡 Le problème est probablement un index unique.');
            console.log(
                "   Exécutez d'abord : node scripts/supprimerIndexNom.js"
            );
        }
        process.exit(1);
    }
};

async function afficherArborescence(categorie, niveau, maxProfondeur = 3) {
    if (niveau > maxProfondeur) return;

    const prefix = '  '.repeat(niveau) + (niveau > 0 ? '├─ ' : '');
    console.log(`${prefix}${categorie.nom} (niveau ${categorie.niveau})`);

    if (niveau < maxProfondeur) {
        const enfants = await Categorie.find({ parent: categorie._id })
            .sort({ nom: 1 })
            .limit(3); // Limiter à 3 enfants par niveau

        for (const enfant of enfants) {
            await afficherArborescence(enfant, niveau + 1, maxProfondeur);
        }

        const totalEnfants = await Categorie.countDocuments({
            parent: categorie._id,
        });
        if (totalEnfants > 3) {
            console.log(
                `${'  '.repeat(niveau + 1)}... et ${totalEnfants - 3} autres`
            );
        }
    }
}

async function exporterRapport() {
    try {
        const rapportPath = path.join(
            __dirname,
            '..',
            'rapport_categories.txt'
        );

        let rapport = "=== RAPPORT D'IMPORT CATÉGORIES ===\n\n";
        rapport += `Date : ${new Date().toLocaleString()}\n`;

        const total = await Categorie.countDocuments();
        const racines = await Categorie.countDocuments({ parent: null });

        rapport += `\n📊 STATISTIQUES :\n`;
        rapport += `Total catégories : ${total}\n`;
        rapport += `Catégories racines : ${racines}\n`;

        for (let i = 1; i <= 5; i++) {
            const count = await Categorie.countDocuments({ niveau: i });
            rapport += `Niveau ${i} : ${count}\n`;
        }

        // Liste des catégories racines avec leurs enfants
        rapport += `\n🌳 STRUCTURE HIÉRARCHIQUE :\n`;
        const categoriesRacines = await Categorie.find({ parent: null }).sort({
            nom: 1,
        });

        for (const racine of categoriesRacines) {
            rapport += `\n${racine.nom} :\n`;
            const enfants = await Categorie.find({ parent: racine._id })
                .sort({ nom: 1 })
                .limit(10);

            enfants.forEach(enfant => {
                rapport += `  ├─ ${enfant.nom}\n`;

                // Petits-enfants
                Categorie.find({ parent: enfant._id })
                    .sort({ nom: 1 })
                    .limit(3)
                    .then(petitsEnfants => {
                        petitsEnfants.forEach(petitEnfant => {
                            rapport += `  │  ├─ ${petitEnfant.nom}\n`;
                        });
                    });
            });

            const totalEnfants = await Categorie.countDocuments({
                parent: racine._id,
            });
            if (totalEnfants > 10) {
                rapport += `  └─ ... et ${totalEnfants - 10} autres\n`;
            }
        }

        fs.writeFileSync(rapportPath, rapport, 'utf8');
        console.log(`\n📄 Rapport exporté : ${rapportPath}`);
    } catch (error) {
        console.log("⚠️ Impossible d'exporter le rapport :", error.message);
    }
}

importerCategories();
