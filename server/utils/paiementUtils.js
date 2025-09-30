/**
 * Utilitaires pour le traitement des paiements
 */
const UtilitairesPaiement = {
    /**
     * Calculer les totaux d'une commande
     * @param {Array} articles - Liste des articles de la commande
     * @param {Number} tauxTaxe - Taux de taxe (par défaut 0.2)
     * @param {Number} coutLivraison - Coût de livraison (par défaut 0)
     * @returns {Object} Totaux calculés
     */
    calculerTotauxCommande(articles, tauxTaxe = 0.2, coutLivraison = 0) {
        const sousTotal = articles.reduce((total, article) => {
            return total + article.prix * article.quantite;
        }, 0);
        const taxe = sousTotal * tauxTaxe;
        const total = sousTotal + taxe + coutLivraison;
        return {
            sousTotal: Math.round(sousTotal * 100) / 100,
            taxe: Math.round(taxe * 100) / 100,
            livraison: coutLivraison,
            total: Math.round(total * 100) / 100,
        };
    },

    /**
     * Valider un numéro de carte de crédit (algorithme de Luhn)
     * @param {String} numeroCarte - Numéro de carte à valider
     * @returns {Boolean} Résultat de la validation
     */
    validerNumeroCarteCredit(numeroCarte) {
        const nettoye = numeroCarte.replace(/\s+/g, '');
        let somme = 0;
        let doitDoubler = false;
        for (let i = nettoye.length - 1; i >= 0; i--) {
            let chiffre = parseInt(nettoye.charAt(i));
            if (doitDoubler) {
                if ((chiffre *= 2) > 9) chiffre -= 9;
            }
            somme += chiffre;
            doitDoubler = !doitDoubler;
        }
        return somme % 10 === 0;
    },

    /**
     * Formater une valeur monétaire
     * @param {Number} montant - Montant à formater
     * @param {String} devise - Devise (par défaut 'EUR')
     * @returns {String} Montant formaté
     */
    formaterDevise(montant, devise = 'EUR') {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: devise,
        }).format(montant);
    },

    /**
     * Générer un ID de transaction
     * @returns {String} ID de transaction généré
     */
    genererIdTransaction() {
        const horodatage = Date.now().toString(36);
        const aleatoire = Math.random().toString(36).substr(2, 5);
        return `txn_${horodatage}_${aleatoire}`.toUpperCase();
    },

    /**
     * Valider une date d'expiration
     * @param {Number} mois - Mois d'expiration
     * @param {Number} annee - Année d'expiration
     * @returns {Boolean} Résultat de la validation
     */
    validerDateExpiration(mois, annee) {
        const maintenant = new Date();
        const anneeActuelle = maintenant.getFullYear();
        const moisActuel = maintenant.getMonth() + 1;
        if (annee < anneeActuelle) return false;
        if (annee === anneeActuelle && mois < moisActuel) return false;
        if (mois < 1 || mois > 12) return false;
        return true;
    },
};

// Exportation des utilitaires
export default UtilitairesPaiement;
