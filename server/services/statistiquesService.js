import Utilisateur from '../models/utilisateurModel.js';
import Commande from '../models/commandeModel.js';
import Produit from '../models/produitModel.js';
import { ROLES } from '../constants/roles.js';
import {
    startOfDay,
    startOfWeek,
    startOfMonth,
    startOfYear,
    endOfDay,
    subDays,
    subMonths,
    format,
} from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Service de gestion des statistiques avancées
 */
class StatistiquesService {
    /**
     * Obtenir les statistiques globales du dashboard
     */
    static async obtenirStatistiquesGlobales() {
        const maintenant = new Date();
        const debutAujourdhui = startOfDay(maintenant);
        const debutSemaine = startOfWeek(maintenant, { weekStartsOn: 1 });
        const debutMois = startOfMonth(maintenant);
        const debutAnnee = startOfYear(maintenant);

        // Statistiques des commandes
        const [
            commandesAujourdhui,
            commandesSemaine,
            commandesMois,
            commandesAnnee,
            commandesTotales,
            commandesEnAttente,
            commandesParStatut,
        ] = await Promise.all([
            Commande.countDocuments({ createdAt: { $gte: debutAujourdhui } }),
            Commande.countDocuments({ createdAt: { $gte: debutSemaine } }),
            Commande.countDocuments({ createdAt: { $gte: debutMois } }),
            Commande.countDocuments({ createdAt: { $gte: debutAnnee } }),
            Commande.countDocuments(),
            Commande.countDocuments({ statut: 'en_attente' }),
            Commande.aggregate([
                {
                    $group: {
                        _id: '$statut',
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        // Chiffre d'affaires
        const [caAujourdhui, caSemaine, caMois, caAnnee, caTotal] =
            await Promise.all([
                this.calculerChiffreAffaires(debutAujourdhui),
                this.calculerChiffreAffaires(debutSemaine),
                this.calculerChiffreAffaires(debutMois),
                this.calculerChiffreAffaires(debutAnnee),
                this.calculerChiffreAffaires(),
            ]);

        // Statistiques des clients
        const [
            clientsTotal,
            clientsAujourdhui,
            clientsSemaine,
            clientsMois,
            clientsActifs,
        ] = await Promise.all([
            Utilisateur.countDocuments({ role: ROLES.CLIENT }),
            Utilisateur.countDocuments({
                role: ROLES.CLIENT,
                createdAt: { $gte: debutAujourdhui },
            }),
            Utilisateur.countDocuments({
                role: ROLES.CLIENT,
                createdAt: { $gte: debutSemaine },
            }),
            Utilisateur.countDocuments({
                role: ROLES.CLIENT,
                createdAt: { $gte: debutMois },
            }),
            Utilisateur.countDocuments({
                role: ROLES.CLIENT,
                estActif: true,
            }),
        ]);

        // Statistiques des produits
        const [
            produitsTotal,
            produitsActifs,
            produitsEnRupture,
            produitsStockFaible,
        ] = await Promise.all([
            Produit.countDocuments(),
            Produit.countDocuments({ estActif: true }),
            Produit.countDocuments({ quantite: 0 }),
            Produit.countDocuments({
                $expr: { $lte: ['$quantite', '$seuilStockFaible'] },
                quantite: { $gt: 0 },
            }),
        ]);

        // Panier moyen
        const panierMoyen =
            commandesTotales > 0 ? caTotal / commandesTotales : 0;

        // Taux de conversion (simplifié)
        const tauxConversion =
            clientsTotal > 0
                ? ((commandesTotales / clientsTotal) * 100).toFixed(2)
                : 0;

        return {
            chiffreAffaires: {
                aujourdhui: caAujourdhui,
                semaine: caSemaine,
                mois: caMois,
                annee: caAnnee,
                total: caTotal,
            },
            commandes: {
                aujourdhui: commandesAujourdhui,
                semaine: commandesSemaine,
                mois: commandesMois,
                annee: commandesAnnee,
                total: commandesTotales,
                enAttente: commandesEnAttente,
                parStatut: commandesParStatut.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
            },
            clients: {
                total: clientsTotal,
                aujourdhui: clientsAujourdhui,
                semaine: clientsSemaine,
                mois: clientsMois,
                actifs: clientsActifs,
            },
            produits: {
                total: produitsTotal,
                actifs: produitsActifs,
                enRupture: produitsEnRupture,
                stockFaible: produitsStockFaible,
            },
            performance: {
                panierMoyen: Math.round(panierMoyen),
                tauxConversion: parseFloat(tauxConversion),
            },
        };
    }

    /**
     * Calculer le chiffre d'affaires à partir d'une date
     */
    static async calculerChiffreAffaires(dateDebut = null) {
        const match = {
            'paiement.statut': { $in: ['paye', 'autorise'] },
        };

        if (dateDebut) {
            match.createdAt = { $gte: dateDebut };
        }

        const resultat = await Commande.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' },
                },
            },
        ]);

        return resultat.length > 0 ? resultat[0].total : 0;
    }

    /**
     * Obtenir l'évolution des ventes sur les 7 derniers jours
     */
    static async obtenirEvolutionVentes(jours = 7) {
        const dates = [];
        const maintenant = new Date();

        for (let i = jours - 1; i >= 0; i--) {
            const date = subDays(maintenant, i);
            dates.push({
                date: startOfDay(date),
                label: format(date, 'dd MMM', { locale: fr }),
            });
        }

        const resultats = await Promise.all(
            dates.map(async ({ date, label }) => {
                const debut = date;
                const fin = endOfDay(date);

                const [commandes, ca] = await Promise.all([
                    Commande.countDocuments({
                        createdAt: { $gte: debut, $lte: fin },
                    }),
                    this.calculerChiffreAffaires(debut, fin),
                ]);

                return {
                    date: label,
                    commandes,
                    chiffreAffaires: ca,
                };
            })
        );

        return resultats;
    }

    /**
     * Obtenir l'évolution du chiffre d'affaires sur les 12 derniers mois
     */
    static async obtenirEvolutionCA(mois = 12) {
        const dates = [];
        const maintenant = new Date();

        for (let i = mois - 1; i >= 0; i--) {
            const date = subMonths(maintenant, i);
            dates.push({
                debut: startOfMonth(date),
                fin: endOfDay(
                    new Date(date.getFullYear(), date.getMonth() + 1, 0)
                ),
                label: format(date, 'MMM yyyy', { locale: fr }),
            });
        }

        const resultats = await Promise.all(
            dates.map(async ({ debut, fin, label }) => {
                const ca = await Commande.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: debut, $lte: fin },
                            'paiement.statut': { $in: ['paye', 'autorise'] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$total' },
                        },
                    },
                ]);

                return {
                    mois: label,
                    montant: ca.length > 0 ? ca[0].total : 0,
                };
            })
        );

        return resultats;
    }

    /**
     * Obtenir les produits les plus vendus
     */
    static async obtenirProduitsPopulaires(limite = 10) {
        const produits = await Produit.find({ nombreVentes: { $gt: 0 } })
            .sort({ nombreVentes: -1 })
            .limit(limite)
            .select('nom nombreVentes prix images categorie')
            .populate('categorie', 'nom')
            .lean();

        return produits.map(p => ({
            id: p._id,
            nom: p.nom,
            ventes: p.nombreVentes,
            prix: p.prix,
            image: p.images?.[0]?.url || null,
            categorie: p.categorie?.nom || 'Non catégorisé',
        }));
    }

    /**
     * Obtenir les commandes récentes
     */
    static async obtenirCommandesRecentes(limite = 10) {
        const commandes = await Commande.find()
            .sort({ createdAt: -1 })
            .limit(limite)
            .populate('client', 'nom prenom email')
            .select(
                'numeroCommande client total statut paiement.statut createdAt'
            )
            .lean();

        return commandes.map(c => ({
            id: c._id,
            numero: c.numeroCommande,
            client: {
                nom: `${c.client?.prenom || ''} ${c.client?.nom || ''}`.trim(),
                email: c.client?.email || 'N/A',
            },
            montant: c.total,
            statut: c.statut,
            statutPaiement: c.paiement?.statut || 'en_attente',
            date: c.createdAt,
        }));
    }

    /**
     * Obtenir les nouveaux clients
     */
    static async obtenirNouveauxClients(limite = 10) {
        const clients = await Utilisateur.find({ role: ROLES.CLIENT })
            .sort({ createdAt: -1 })
            .limit(limite)
            .select('nom prenom email telephone createdAt')
            .lean();

        return clients.map(c => ({
            id: c._id,
            nom: `${c.prenom} ${c.nom}`,
            email: c.email,
            telephone: c.telephone || 'N/A',
            dateInscription: c.createdAt,
        }));
    }

    /**
     * Obtenir la répartition des ventes par catégorie
     */
    static async obtenirRepartitionCategories() {
        const repartition = await Commande.aggregate([
            { $unwind: '$articles' },
            {
                $lookup: {
                    from: 'produits',
                    localField: 'articles.produit',
                    foreignField: '_id',
                    as: 'produitInfo',
                },
            },
            { $unwind: '$produitInfo' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'produitInfo.categorie',
                    foreignField: '_id',
                    as: 'categorieInfo',
                },
            },
            { $unwind: '$categorieInfo' },
            {
                $group: {
                    _id: '$categorieInfo.nom',
                    ventes: { $sum: '$articles.quantite' },
                    montant: {
                        $sum: {
                            $multiply: ['$articles.prix', '$articles.quantite'],
                        },
                    },
                },
            },
            { $sort: { montant: -1 } },
            { $limit: 10 },
        ]);

        return repartition.map(r => ({
            categorie: r._id,
            ventes: r.ventes,
            montant: Math.round(r.montant),
        }));
    }

    /**
     * Obtenir toutes les statistiques du dashboard en une seule requête
     */
    static async obtenirStatistiquesDashboard() {
        const [
            statistiquesGlobales,
            evolutionVentes,
            evolutionCA,
            produitsPopulaires,
            commandesRecentes,
            nouveauxClients,
            repartitionCategories,
        ] = await Promise.all([
            this.obtenirStatistiquesGlobales(),
            this.obtenirEvolutionVentes(7),
            this.obtenirEvolutionCA(6),
            this.obtenirProduitsPopulaires(10),
            this.obtenirCommandesRecentes(10),
            this.obtenirNouveauxClients(10),
            this.obtenirRepartitionCategories(),
        ]);

        return {
            statistiquesGlobales,
            graphiques: {
                evolutionVentes,
                evolutionCA,
                repartitionCategories,
            },
            tableaux: {
                produitsPopulaires,
                commandesRecentes,
                nouveauxClients,
            },
        };
    }
}

export default StatistiquesService;
