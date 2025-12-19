import 'dotenv/config';
import mongoose from 'mongoose';
import Categorie from '../models/categorieModel.js';
import categoriesData from '../seeders/data/categoriesData.js';

const importerCategories = async () => {
    try {
        console.log('Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connecté');

        console.log('Suppression des catégories existantes...');
        await Categorie.deleteMany({});
        console.log('Anciennes catégories supprimées');

        console.log('Import des vraies catégories...');

        const categoriesMap = new Map();
        const categoriesParNiveau = {};

        // Première passe : créer toutes les catégories sans parent
        for (const catData of categoriesData) {
            // Normaliser le nom (utiliser 'nom' si disponible, sinon 'name')
            const nom = catData.nom || catData.name;
            if (!nom) continue;

            // Déterminer le niveau
            let niveau = 0;
            let parentId = null;

            // Si c'est une catégorie racine
            if (!catData.parent) {
                niveau = 0;
                parentId = null;
            }

            const categorie = await Categorie.create({
                nom: nom,
                description:
                    catData.description || `Découvrez tous les produits ${nom}`,
                estActif: true,
                ordre: catData.ordre || 0,
                parent: parentId,
                niveau: niveau,
            });

            // Stocker dans la map pour référence future
            categoriesMap.set(nom, {
                id: categorie._id,
                niveau: niveau,
            });

            console.log(`Catégorie créée : ${nom} (niveau ${niveau})`);
        }

        // Deuxième passe : mettre à jour les relations parent-enfant
        for (const catData of categoriesData) {
            const nom = catData.nom || catData.name;
            const nomParent = catData.parent;

            if (
                nomParent &&
                categoriesMap.has(nom) &&
                categoriesMap.has(nomParent)
            ) {
                const categorieInfo = categoriesMap.get(nom);
                const parentInfo = categoriesMap.get(nomParent);

                await Categorie.findByIdAndUpdate(categorieInfo.id, {
                    parent: parentInfo.id,
                    niveau: parentInfo.niveau + 1,
                });

                console.log(`Relation établie : ${nom} → ${nomParent}`);
            }
        }

        // Troisième passe : générer les slugs et ancêtres
        const toutesCategories = await Categorie.find({});
        for (const categorie of toutesCategories) {
            // Générer le chemin des ancêtres
            const ancetres = [];
            let parentId = categorie.parent;
            let niveauActuel = categorie.niveau;

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
        }

        const total = await Categorie.countDocuments();
        console.log('\n========================================');
        console.log(`IMPORT TERMINÉ : ${total} catégories créées`);
        console.log('========================================\n');

        const parentes = await Categorie.countDocuments({ parent: null });
        const enfants = await Categorie.countDocuments({
            parent: { $ne: null },
        });
        console.log(`Répartition :`);
        console.log(`- Catégories racines : ${parentes}`);
        console.log(`- Sous-catégories : ${enfants}`);

        // Afficher la structure hiérarchique
        console.log('\nStructure hiérarchique :');
        const racines = await Categorie.find({ parent: null }).sort({
            ordre: 1,
        });
        for (const racine of racines) {
            await afficherArborescence(racine, 0);
        }

        process.exit(0);
    } catch (error) {
        console.error("Erreur lors de l'import :", error);
        process.exit(1);
    }
};

async function afficherArborescence(categorie, niveau) {
    const prefix = ' '.repeat(niveau * 2) + (niveau > 0 ? '├─ ' : '');
    console.log(prefix + categorie.nom);

    const enfants = await Categorie.find({ parent: categorie._id }).sort({
        ordre: 1,
    });
    for (const enfant of enfants) {
        await afficherArborescence(enfant, niveau + 1);
    }
}

importerCategories();
