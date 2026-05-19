import Produit from '../models/produitModel.js';
import Avis from '../models/avisModel.js';
import Commande from '../models/commandeModel.js';

/**
 * @desc    Obtenir les avis d'un produit
 * @route   GET /api/produits/:id/avis
 * @access  Public
 */
export const obtenirAvisProduit = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que le produit existe
        const produit = await Produit.findById(id);
        if (!produit) {
            return res.status(404).json({
                succes: false,
                message: 'Produit non trouvé',
            });
        }

        // Récupérer les avis
        const avis = await Avis.find({ produit: id, estValide: true })
            .populate('auteur', 'nom prenom avatar')
            .sort({ date: -1 })
            .limit(50);

        // Calculer la note moyenne
        const noteMoyenne =
            avis.length > 0
                ? avis.reduce((acc, a) => acc + a.note, 0) / avis.length
                : 0;

        res.status(200).json({
            succes: true,
            donnees: avis,
            noteMoyenne: noteMoyenne.toFixed(1),
            totalAvis: avis.length,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des avis:', error);
        res.status(500).json({
            succes: false,
            message: 'Erreur lors de la récupération des avis',
            erreur: error.message,
        });
    }
};

/**
 * @desc    Poster un avis sur un produit
 * @route   POST /api/produits/:id/avis
 * @access  Privé (authentifié)
 */
export const posterAvis = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, titre, commentaire } = req.body;
        const utilisateurId = req.utilisateur._id;

        // Validation
        if (!note || !commentaire) {
            return res.status(400).json({
                succes: false,
                message: 'Note et commentaire sont requis',
            });
        }

        if (note < 1 || note > 5) {
            return res.status(400).json({
                succes: false,
                message: 'La note doit être entre 1 et 5',
            });
        }

        // Vérifier que le produit existe
        const produit = await Produit.findById(id);
        if (!produit) {
            return res.status(404).json({
                succes: false,
                message: 'Produit non trouvé',
            });
        }

        // Vérifier si l'utilisateur a déjà laissé un avis
        const avisExistant = await Avis.findOne({
            produit: id,
            auteur: utilisateurId,
        });

        if (avisExistant) {
            return res.status(400).json({
                succes: false,
                message: 'Vous avez déjà laissé un avis pour ce produit',
            });
        }

        // Vérifier si l'utilisateur a acheté le produit
        const aAchete = await Commande.findOne({
            utilisateur: utilisateurId,
            'produits.produit': id,
            statut: { $in: ['livree', 'completee'] },
        });

        // Créer l'avis
        const nouvelAvis = await Avis.create({
            produit: id,
            auteur: utilisateurId,
            note,
            titre,
            commentaire,
            achatVerifie: !!aAchete,
            estValide: true,
        });

        // Mettre à jour les stats du produit
        const tousLesAvis = await Avis.find({ produit: id, estValide: true });
        const noteMoyenne =
            tousLesAvis.reduce((acc, a) => acc + a.note, 0) /
            tousLesAvis.length;

        await Produit.findByIdAndUpdate(id, {
            noteMoyenne: noteMoyenne.toFixed(1),
            nombreAvis: tousLesAvis.length,
        });

        // Populate l'auteur
        await nouvelAvis.populate('auteur', 'nom prenom avatar');

        res.status(201).json({
            succes: true,
            message: 'Avis ajouté avec succès',
            donnees: nouvelAvis,
        });
    } catch (error) {
        console.error("Erreur lors de la création de l'avis:", error);
        res.status(500).json({
            succes: false,
            message: "Erreur lors de la création de l'avis",
            erreur: error.message,
        });
    }
};

/**
 * @desc    Obtenir des produits similaires
 * @route   GET /api/produits/:id/similaires
 * @access  Public
 */
export const obtenirProduitsSimilaires = async (req, res) => {
    try {
        const { id } = req.params;
        const { categorie } = req.query;

        // Récupérer le produit actuel
        const produitActuel = await Produit.findById(id);
        if (!produitActuel) {
            return res.status(404).json({
                succes: false,
                message: 'Produit non trouvé',
            });
        }

        // Construire la requête
        const query = {
            _id: { $ne: id },
            estActif: true,
            statut: 'actif',
        };

        // Filtrer par catégorie
        if (categorie || produitActuel.categorie) {
            query.categorie = categorie || produitActuel.categorie;
        }

        // Récupérer les produits similaires
        let produitsSimilaires = await Produit.find(query)
            .populate('categorie', 'nom slug')
            .populate('vendeur', 'nom boutique.nom')
            .limit(8)
            .sort({ ventes: -1, noteMoyenne: -1 });

        // Si pas assez, élargir la recherche
        if (produitsSimilaires.length < 4) {
            const queryLarge = {
                _id: { $ne: id },
                estActif: true,
                statut: 'actif',
            };

            produitsSimilaires = await Produit.find(queryLarge)
                .populate('categorie', 'nom slug')
                .populate('vendeur', 'nom boutique.nom')
                .limit(8)
                .sort({ ventes: -1, noteMoyenne: -1 });
        }

        // Formater les URLs des images
        produitsSimilaires = produitsSimilaires.map(produit => {
            const produitObj = produit.toObject();
            if (produitObj.images && Array.isArray(produitObj.images)) {
                produitObj.images = produitObj.images.map(img => {
                    if (typeof img === 'string') {
                        return img.startsWith('http')
                            ? img
                            : `${process.env.BASE_URL}${img}`;
                    }
                    return img;
                });
            }
            return produitObj;
        });

        res.status(200).json({
            succes: true,
            donnees: produitsSimilaires,
            total: produitsSimilaires.length,
        });
    } catch (error) {
        console.error('Erreur produits similaires:', error);
        res.status(500).json({
            succes: false,
            message: 'Erreur lors de la récupération des produits similaires',
            erreur: error.message,
        });
    }
};