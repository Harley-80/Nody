import express from 'express';
import {
    obtenirStatistiquesDashboard,
    obtenirStatistiquesGlobales,
    obtenirEvolutionVentes,
    obtenirEvolutionCA,
    obtenirProduitsPopulaires,
    obtenirCommandesRecentes,
    obtenirNouveauxClients,
    obtenirRepartitionCategories,
    exporterStatistiquesPDF,
} from '../controllers/statistiquesController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';

const routeur = express.Router();

// PROTECTION : Toutes les routes nécessitent une authentification admin
routeur.use(proteger);
routeur.use(autoriser('admin'));

// ROUTES PRINCIPALES
/**
 * @desc    Obtenir toutes les statistiques du dashboard en une seule requête
 * @route   GET /api/statistiques/dashboard
 * @access  Private/Admin
 */
routeur.get('/dashboard', obtenirStatistiquesDashboard);

/**
 * @desc    Obtenir les statistiques globales
 * @route   GET /api/statistiques/globales
 * @access  Private/Admin
 */
routeur.get('/globales', obtenirStatistiquesGlobales);

// ROUTES GRAPHIQUES
/**
 * @desc    Obtenir l'évolution des ventes (7 derniers jours par défaut)
 * @route   GET /api/statistiques/evolution-ventes?jours=7
 * @access  Private/Admin
 */
routeur.get('/evolution-ventes', obtenirEvolutionVentes);

/**
 * @desc    Obtenir l'évolution du chiffre d'affaires (12 derniers mois par défaut)
 * @route   GET /api/statistiques/evolution-ca?mois=12
 * @access  Private/Admin
 */
routeur.get('/evolution-ca', obtenirEvolutionCA);

/**
 * @desc    Obtenir la répartition des ventes par catégorie
 * @route   GET /api/statistiques/repartition-categories
 * @access  Private/Admin
 */
routeur.get('/repartition-categories', obtenirRepartitionCategories);

// ROUTES TABLEAUX
/**
 * @desc    Obtenir les produits les plus populaires
 * @route   GET /api/statistiques/produits-populaires?limite=10
 * @access  Private/Admin
 */
routeur.get('/produits-populaires', obtenirProduitsPopulaires);

/**
 * @desc    Obtenir les commandes récentes
 * @route   GET /api/statistiques/commandes-recentes?limite=10
 * @access  Private/Admin
 */
routeur.get('/commandes-recentes', obtenirCommandesRecentes);

/**
 * @desc    Obtenir les nouveaux clients
 * @route   GET /api/statistiques/nouveaux-clients?limite=10
 * @access  Private/Admin
 */
routeur.get('/nouveaux-clients', obtenirNouveauxClients);

// ROUTES EXPORT
/**
 * @desc    Exporter les statistiques en PDF
 * @route   POST /api/statistiques/exporter-pdf
 * @access  Private/Admin
 */
routeur.post('/exporter-pdf', exporterStatistiquesPDF);

export default routeur;