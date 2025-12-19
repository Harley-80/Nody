import Produit from '../models/produitModel.js';

export async function rechercherProduitsParImage(imageBuffer) {
    try {
        // Recherche basée sur les métadonnées d'image
        // (nécessite que les produits aient des tags bien renseignés)

        // Pour l'instant, retourner les produits les mieux notés avec images
        const produits = await Produit.find({
            image: { $exists: true, $ne: null },
            note: { $gte: 3.5 },
        })
            .populate('categorie')
            .sort({ note: -1, nombreAvis: -1 })
            .limit(20);

        return produits.map(p => ({
            ...p.toObject(),
            scoreRecherche: p.note * 20, // Score basique
        }));
    } catch (error) {
        console.error('Erreur recherche image:', error);
        return [];
    }
}
