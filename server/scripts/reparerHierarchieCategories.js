import 'dotenv/config';
import mongoose from 'mongoose';
import Categorie from '../models/categorieModel.js';

const reparerHierarchie = async () => {
    try {
        console.log('🚀 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connecté');

        // Récupérer toutes les catégories
        const categories = await Categorie.find({});
        console.log(`📊 Total catégories: ${categories.length}`);

        // Map pour stocker les IDs par nom
        const categoriesMap = new Map();
        categories.forEach(cat => {
            categoriesMap.set(cat.nom, cat._id);
        });

        console.log('🔄 Réparation de la hiérarchie...');

        // Fonction pour définir le parent d'une catégorie
        const setParent = async (nomCategorie, nomParent) => {
            const categorie = await Categorie.findOne({ nom: nomCategorie });
            const parent = await Categorie.findOne({ nom: nomParent });

            if (categorie && parent) {
                // Vérifier qu'on ne crée pas de cycle
                if (categorie._id.toString() === parent._id.toString()) {
                    console.log(
                        `⚠️  Impossible: ${nomCategorie} ne peut pas être son propre parent`
                    );
                    return;
                }

                // Vérifier si le parent n'est pas déjà un enfant
                let current = parent;
                while (current.parent) {
                    current = await Categorie.findById(current.parent);
                    if (
                        current &&
                        current._id.toString() === categorie._id.toString()
                    ) {
                        console.log(
                            `⚠️  Cycle détecté: ${nomParent} est déjà un enfant de ${nomCategorie}`
                        );
                        return;
                    }
                }

                // Mettre à jour le parent
                categorie.parent = parent._id;
                categorie.niveau = parent.niveau + 1;
                await categorie.save();

                // Mettre à jour le chemin
                await categorie.actualiserChemin();
                await categorie.save();

                console.log(
                    `✅ ${nomCategorie} → ${nomParent} (niveau: ${categorie.niveau})`
                );
            } else {
                console.log(
                    `❌ Catégorie ou parent introuvable: ${nomCategorie} → ${nomParent}`
                );
            }
        };

        // Exemples de relations (ajoutez toutes vos relations ici)
        // Vêtements homme
        await setParent('Pantalons', 'Vêtements homme');
        await setParent('Pulls', 'Vêtements homme');
        await setParent('Blazers et costumes', 'Vêtements homme');
        // ... ajoutez toutes les relations

        // Vérifier la hiérarchie
        const categoriesParNiveau = await Categorie.aggregate([
            { $group: { _id: '$niveau', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        console.log('\n🎉 RÉPARATION TERMINÉE !');
        console.log('📈 Nouvelle répartition par niveau:');
        categoriesParNiveau.forEach(stat => {
            console.log(`   Niveau ${stat._id}: ${stat.count} catégories`);
        });

        process.exit(0);
    } catch (error) {
        console.error('💥 ERREUR:', error);
        process.exit(1);
    }
};

reparerHierarchie();
