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

        console.log('Import des catégories corrigées...');

        // Étape 1: Normaliser et préparer les données
        const donneesNormalisees = categoriesData.map(cat => {
            // Normaliser: utiliser 'nom' si disponible, sinon 'name'
            const nom = cat.nom || cat.name;

            // Pour les doublons, nous allons gérer les suffixes plus tard
            return {
                nom: nom,
                nomOriginal: nom, // Garder le nom original
                parentNom: cat.parent,
                description: cat.description || `Découvrez ${nom}`,
                ordre: cat.ordre || 0,
            };
        });

        // Étape 2: Créer toutes les catégories avec gestion des doublons
        const categoriesMap = new Map(); // Pour stocker les IDs par nom
        const categoriesCreees = []; // Pour stocker les objets créés
        const nomsUtilises = new Map(); // Pour compter les occurrences de chaque nom

        console.log('\nCréation des catégories...');

        // D'abord, compter les occurrences de chaque nom
        for (const donnee of donneesNormalisees) {
            const count = nomsUtilises.get(donnee.nom) || 0;
            nomsUtilises.set(donnee.nom, count + 1);
        }

        // Ensuite, créer les catégories
        for (const donnee of donneesNormalisees) {
            // Vérifier si ce nom a des doublons
            const occurrences = nomsUtilises.get(donnee.nom);

            let nomFinal = donnee.nom;
            // Si plus d'une occurrence et que ce n'est pas la première, ajouter un suffixe
            if (occurrences > 1) {
                // Pour "Pulls" dans "Pulls" -> "Pulls (sous-catégorie)"
                if (donnee.nom === 'Pulls' && donnee.parentNom === 'Pulls') {
                    nomFinal = 'Pulls (sous-catégorie)';
                }
                // Pour "Robes" dans "Robes" -> "Robes (sous-catégorie)"
                else if (
                    donnee.nom === 'Robes' &&
                    donnee.parentNom === 'Robes'
                ) {
                    nomFinal = 'Robes (sous-catégorie)';
                }
                // Pour "Shorts" dans "Shorts" -> "Shorts (sous-catégorie)"
                else if (
                    donnee.nom === 'Shorts' &&
                    donnee.parentNom === 'Shorts'
                ) {
                    nomFinal = 'Shorts (sous-catégorie)';
                }
                // Pour "Chaussettes" -> différencier par parent
                else if (donnee.nom === 'Chaussettes') {
                    if (donnee.parentNom === 'Sous-vêtements homme') {
                        nomFinal = 'Chaussettes homme';
                    } else if (
                        donnee.parentNom ===
                        'Sous-vêtements, vêtements de détente'
                    ) {
                        nomFinal = 'Chaussettes femme';
                    }
                }
                // Pour "Costumes" -> différencier
                else if (donnee.nom === 'Costumes') {
                    if (donnee.parentNom === 'Blazers et costumes') {
                        nomFinal = 'Costumes complets';
                    } else if (donnee.parentNom === 'Ensembles') {
                        nomFinal = 'Costumes tendances';
                    }
                }
            }

            const categorie = await Categorie.create({
                nom: nomFinal,
                description: donnee.description,
                estActif: true,
                ordre: donnee.ordre,
                parent: null, // Sera mis à jour plus tard
                niveau: 0, // Sera mis à jour plus tard
            });

            // Stocker dans la map avec le nom original comme clé
            categoriesMap.set(donnee.nomOriginal, {
                id: categorie._id,
                nomFinal: nomFinal,
            });

            categoriesCreees.push({
                id: categorie._id,
                nomOriginal: donnee.nomOriginal,
                nomFinal: nomFinal,
                parentNom: donnee.parentNom,
            });

            console.log(`Catégorie créée : ${nomFinal}`);
        }

        // Étape 3: Établir les relations parent-enfant
        console.log('\nÉtablissement des relations parent-enfant...');

        for (const categorie of categoriesCreees) {
            if (categorie.parentNom) {
                const parentInfo = categoriesMap.get(categorie.parentNom);

                if (parentInfo) {
                    await Categorie.findByIdAndUpdate(categorie.id, {
                        parent: parentInfo.id,
                    });

                    console.log(
                        `Relation : ${categorie.nomFinal} → ${parentInfo.nomFinal}`
                    );
                } else {
                    console.warn(
                        `Parent "${categorie.parentNom}" introuvable pour "${categorie.nomFinal}"`
                    );
                }
            }
        }

        // Étape 4: Calculer les niveaux et ancêtres
        console.log('\nCalcul des niveaux et ancêtres...');

        const toutesCategories = await Categorie.find({});

        for (const categorie of toutesCategories) {
            let niveau = 0;
            const ancetres = [];
            let parentId = categorie.parent;

            // Calculer le niveau
            while (parentId) {
                niveau++;
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

            // Mettre à jour niveau et ancêtres
            await Categorie.findByIdAndUpdate(categorie._id, {
                niveau: niveau,
                ancetres: ancetres,
            });

            // Regénérer le slug pour être sûr qu'il est unique
            await Categorie.findByIdAndUpdate(
                categorie._id,
                {
                    $set: { slug: null },
                },
                { runValidators: false }
            );

            // Sauvegarder pour déclencher le pre-save hook
            const catToSave = await Categorie.findById(categorie._id);
            await catToSave.save();
        }

        // Étape 5: Afficher les statistiques
        const total = await Categorie.countDocuments();
        const parentes = await Categorie.countDocuments({ parent: null });
        const enfants = await Categorie.countDocuments({
            parent: { $ne: null },
        });

        console.log('\n========================================');
        console.log('IMPORT TERMINÉ AVEC SUCCÈS');
        console.log('========================================');
        console.log(`Total catégories : ${total}`);
        console.log(`Catégories racines : ${parentes}`);
        console.log(`Sous-catégories : ${enfants}`);

        // Afficher quelques catégories problématiques pour vérification
        console.log('\nVérification des catégories problématiques :');

        const categoriesProblematiques = [
            'Pulls',
            'Robes',
            'Shorts',
            'Chaussettes',
            'Costumes',
        ];

        for (const nom of categoriesProblematiques) {
            const cats = await Categorie.find({ nom: new RegExp(nom, 'i') });
            if (cats.length > 0) {
                console.log(`\n${nom} : ${cats.length} occurrence(s)`);
                cats.forEach(cat => {
                    const parent = cat.parent ? 'avec parent' : 'racine';
                    console.log(`  - ${cat.nom} (${parent})`);
                });
            }
        }

        // Afficher la structure hiérarchique
        console.log('\nStructure hiérarchique des catégories racines :');
        const racines = await Categorie.find({ parent: null }).sort({
            ordre: 1,
            nom: 1,
        });

        for (const racine of racines) {
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
        ordre: 1,
        nom: 1,
    });

    for (const enfant of enfants) {
        await afficherArborescence(enfant, niveau + 1);
    }
}

importerCategories();
