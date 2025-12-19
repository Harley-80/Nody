import 'dotenv/config';
import mongoose from 'mongoose';
import Categorie from './models/categorieModel.js';

const testCategoriesAPI = async () => {
    try {
        console.log('Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connecté\n');

        // 1. Compter les catégories
        const total = await Categorie.countDocuments();
        console.log(`1. Total catégories: ${total}`);

        // 2. Compter par niveau
        const level0 = await Categorie.countDocuments({ level: 0 });
        const level1 = await Categorie.countDocuments({ level: 1 });
        const level2 = await Categorie.countDocuments({ level: 2 });
        console.log(`2. Répartition par niveau:`);
        console.log(`   - Niveau 0 (racines): ${level0}`);
        console.log(`   - Niveau 1: ${level1}`);
        console.log(`   - Niveau 2: ${level2}`);

        // 3. Vérifier quelques catégories spécifiques
        console.log(`\n3. Vérification de catégories spécifiques:`);

        // Vêtements homme (racine)
        const vetementsHomme = await Categorie.findOne({
            name: 'Vêtements homme',
        });
        console.log(
            `   - "Vêtements homme": ${vetementsHomme ? '✓' : '✗'} (niveau: ${vetementsHomme?.level})`
        );

        // Pantalons (niveau 1)
        const pantalons = await Categorie.findOne({ name: 'Pantalons' });
        console.log(
            `   - "Pantalons": ${pantalons ? '✓' : '✗'} (niveau: ${pantalons?.level}, parent: ${pantalons?.parentName})`
        );

        // Pantalons en cuir (niveau 2)
        const pantalonsCuir = await Categorie.findOne({
            name: 'Pantalons en cuir',
        });
        console.log(
            `   - "Pantalons en cuir": ${pantalonsCuir ? '✓' : '✗'} (niveau: ${pantalonsCuir?.level}, parent: ${pantalonsCuir?.parentName})`
        );

        // 4. Vérifier la structure hiérarchique
        console.log(`\n4. Structure hiérarchique de "Vêtements homme":`);
        const racine = await Categorie.findOne({
            name: 'Vêtements homme',
        }).populate('subcategories');

        if (racine) {
            console.log(`   Catégorie racine: ${racine.name}`);

            // Récupérer les sous-catégories de niveau 1
            const enfantsNiveau1 = await Categorie.find({ parent: racine._id });
            console.log(
                `   Sous-catégories (niveau 1): ${enfantsNiveau1.length}`
            );

            if (enfantsNiveau1.length > 0) {
                const premierEnfant = enfantsNiveau1[0];
                console.log(`   Exemple: ${premierEnfant.name}`);

                // Récupérer les sous-catégories de niveau 2 pour cet enfant
                const petitsEnfants = await Categorie.find({
                    parent: premierEnfant._id,
                });
                console.log(
                    `   Sous-sous-catégories pour "${premierEnfant.name}": ${petitsEnfants.length}`
                );
            }
        }

        // 5. Vérifier les slugs
        console.log(`\n5. Vérification des slugs:`);
        const categoriesSansSlug = await Categorie.countDocuments({
            slug: { $exists: false },
        });
        console.log(`   Catégories sans slug: ${categoriesSansSlug}`);

        if (categoriesSansSlug > 0) {
            console.log(
                `   Certaines catégories n'ont pas de slug. Génération des slugs manquants...`
            );

            const categoriesSansSlugList = await Categorie.find({
                slug: { $exists: false },
            });
            for (const cat of categoriesSansSlugList) {
                const baseSlug = cat.name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                let slug = baseSlug;
                let suffix = 0;

                while (
                    await Categorie.exists({ slug, _id: { $ne: cat._id } })
                ) {
                    suffix++;
                    slug = `${baseSlug}-${suffix}`;
                }

                cat.slug = slug;
                await cat.save();
                console.log(`     ✓ Slug généré pour "${cat.name}": ${slug}`);
            }
        }

        // 6. Tester les endpoints API
        console.log(`\n6. Tests des endpoints API:`);
        console.log(`   Pour tester l'API, lancez les commandes suivantes:`);
        console.log(
            `   - GET /api/categories/public      → Catégories pour le frontend`
        );
        console.log(
            `   - GET /api/categories/featured    → Catégories en vedette`
        );
        console.log(
            `   - GET /api/categories             → Toutes catégories (admin)`
        );
        console.log(
            `   - GET /api/categories/slug/vetements-homme → Catégorie spécifique`
        );

        console.log('\nTest terminé avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors du test:', error);
        process.exit(1);
    }
};

testCategoriesAPI();
