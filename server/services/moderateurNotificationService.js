export const notifierNouveauProduit = async (produit, vendeur) => {
    // Récupérer tous les modérateurs actifs
    const moderateurs = await Utilisateur.find({
        role: 'moderateur',
        estActif: true,
    });

    moderateurs.forEach(async moderateur => {
        await Notification.create({
            type: 'validation_produit',
            titre: 'Nouveau produit à valider',
            message: `Produit "${produit.nom}" soumis par ${vendeur.nom}`,
            utilisateurId: moderateur._id,
            priorite: 'normale',
        });
    });
};
