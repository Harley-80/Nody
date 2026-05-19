import mongoose from 'mongoose';

const MONGODB_URI =
    'mongodb+srv://admin_nody:AdminNody0025@nody-cluster.bzm0vhd.mongodb.net/nody_db?retryWrites=true&w=majority&appName=nody-cluster';

const produitSchema = new mongoose.Schema({}, { strict: false });
const Produit = mongoose.model('Produit', produitSchema);

async function corrigerProduitsExistants() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');

        // Association manuelle des fichiers aux produits
        const corrections = [
            {
                produitId: '694cfcdbf174632de7ae4222', // Montre-bracelet Quartz
                images: [
                    {
                        url: 'produit_1765222759291_ruftw2kxb.jpg',
                        alt: 'Montre-bracelet Quartz',
                        estPrincipale: true,
                    },
                    {
                        url: 'produit_1765261507824_5d4rk6ybn.jpg',
                        alt: 'Montre-bracelet Quartz - Vue 2',
                        estPrincipale: false,
                    },
                ],
            },
            {
                produitId: '694d225fcd669a32f42f13a4', // Mocassin
                images: [
                    {
                        url: 'produit_1765201154914_f3ygto6it.jpg',
                        alt: 'Mocassin',
                        estPrincipale: true,
                    },
                    {
                        url: 'produit_1766024126873_cglfxxzk7.jpg',
                        alt: 'Mocassin - Vue 2',
                        estPrincipale: false,
                    },
                ],
            },
        ];

        console.log('🔧 Correction des produits existants...\n');

        for (const correction of corrections) {
            const produit = await Produit.findById(correction.produitId);

            if (!produit) {
                console.log(`❌ Produit ${correction.produitId} introuvable`);
                continue;
            }

            console.log(`📦 Produit: ${produit.nom}`);
            console.log(
                `   Avant: ${produit.images?.length || 0} image(s) sans URL`
            );

            produit.images = correction.images;
            await produit.save();

            console.log(
                `   ✅ Après: ${produit.images.length} image(s) avec URLs`
            );
            produit.images.forEach((img, i) => {
                console.log(
                    `      ${i + 1}. ${img.url} ${img.estPrincipale ? '(principale)' : ''}`
                );
            });
            console.log();
        }

        console.log('✅ Correction terminée!\n');

        // Vérification
        console.log('🔍 Vérification finale...\n');
        const produits = await Produit.find({});

        for (const p of produits) {
            const hasUrls = p.images?.every(img => img.url);
            const status = hasUrls ? '✅' : '❌';
            console.log(
                `${status} ${p.nom}: ${p.images?.length || 0} image(s)`
            );
            if (hasUrls && p.images.length > 0) {
                p.images.forEach(img => console.log(`   - ${img.url}`));
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ Déconnecté de MongoDB');
    } catch (error) {
        console.error('❌ Erreur:', error);
        await mongoose.disconnect();
    }
}

corrigerProduitsExistants();
