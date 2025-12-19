import asyncHandler from 'express-async-handler';
import StatistiquesService from '../services/statistiquesService.js';
import logger from '../utils/logger.js';
import { genererRapportPDF } from '../utils/genererRapportPDF.js'; 
import { format } from 'date-fns'; // (Nécessaire pour formater le nom du fichier)

/**
 * @desc    Obtenir toutes les statistiques du dashboard
 * @route   GET /api/statistiques/dashboard
 * @access  Private/Admin
 */
export const obtenirStatistiquesDashboard = asyncHandler(async (req, res) => {
    try {
        const statistiques =
            await StatistiquesService.obtenirStatistiquesDashboard();

        res.json({
            succes: true,
            donnees: statistiques,
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500);
        throw new Error(
            'Erreur lors de la récupération des statistiques du dashboard'
        );
    }
});

/**
 * @desc    Obtenir les statistiques globales
 * @route   GET /api/statistiques/globales
 * @access  Private/Admin
 */
export const obtenirStatistiquesGlobales = asyncHandler(async (req, res) => {
    try {
        const statistiques =
            await StatistiquesService.obtenirStatistiquesGlobales();

        res.json({
            succes: true,
            donnees: statistiques,
        });
    } catch (error) {
        logger.error(
            'Erreur lors de la récupération des statistiques globales:',
            error
        );
        res.status(500);
        throw new Error(
            'Erreur lors de la récupération des statistiques globales'
        );
    }
});

/**
 * @desc    Obtenir l'évolution des ventes
 * @route   GET /api/statistiques/evolution-ventes
 * @access  Private/Admin
 */
export const obtenirEvolutionVentes = asyncHandler(async (req, res) => {
    try {
        const jours = parseInt(req.query.jours) || 7;
        const evolution =
            await StatistiquesService.obtenirEvolutionVentes(jours);

        res.json({
            succes: true,
            donnees: evolution,
        });
    } catch (error) {
        logger.error(
            "Erreur lors de la récupération de l'évolution des ventes:",
            error
        );
        res.status(500);
        throw new Error(
            "Erreur lors de la récupération de l'évolution des ventes"
        );
    }
});

/**
 * @desc    Obtenir l'évolution du chiffre d'affaires
 * @route   GET /api/statistiques/evolution-ca
 * @access  Private/Admin
 */
export const obtenirEvolutionCA = asyncHandler(async (req, res) => {
    try {
        const mois = parseInt(req.query.mois) || 12;
        const evolution = await StatistiquesService.obtenirEvolutionCA(mois);

        res.json({
            succes: true,
            donnees: evolution,
        });
    } catch (error) {
        logger.error(
            "Erreur lors de la récupération de l'évolution du CA:",
            error
        );
        res.status(500);
        throw new Error(
            "Erreur lors de la récupération de l'évolution du chiffre d'affaires"
        );
    }
});

/**
 * @desc    Obtenir les produits populaires
 * @route   GET /api/statistiques/produits-populaires
 * @access  Private/Admin
 */
export const obtenirProduitsPopulaires = asyncHandler(async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 10;
        const produits =
            await StatistiquesService.obtenirProduitsPopulaires(limite);

        res.json({
            succes: true,
            donnees: produits,
        });
    } catch (error) {
        logger.error(
            'Erreur lors de la récupération des produits populaires:',
            error
        );
        res.status(500);
        throw new Error(
            'Erreur lors de la récupération des produits populaires'
        );
    }
});

/**
 * @desc    Obtenir les commandes récentes
 * @route   GET /api/statistiques/commandes-recentes
 * @access  Private/Admin
 */
export const obtenirCommandesRecentes = asyncHandler(async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 10;
        const commandes =
            await StatistiquesService.obtenirCommandesRecentes(limite);

        res.json({
            succes: true,
            donnees: commandes,
        });
    } catch (error) {
        logger.error(
            'Erreur lors de la récupération des commandes récentes:',
            error
        );
        res.status(500);
        throw new Error(
            'Erreur lors de la récupération des commandes récentes'
        );
    }
});

/**
 * @desc    Obtenir les nouveaux clients
 * @route   GET /api/statistiques/nouveaux-clients
 * @access  Private/Admin
 */
export const obtenirNouveauxClients = asyncHandler(async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 10;
        const clients =
            await StatistiquesService.obtenirNouveauxClients(limite);

        res.json({
            succes: true,
            donnees: clients,
        });
    } catch (error) {
        logger.error(
            'Erreur lors de la récupération des nouveaux clients:',
            error
        );
        res.status(500);
        throw new Error('Erreur lors de la récupération des nouveaux clients');
    }
});

/**
 * @desc    Obtenir la répartition par catégories
 * @route   GET /api/statistiques/repartition-categories
 * @access  Private/Admin
 */
export const obtenirRepartitionCategories = asyncHandler(async (req, res) => {
    try {
        const repartition =
            await StatistiquesService.obtenirRepartitionCategories();

        res.json({
            succes: true,
            donnees: repartition,
        });
    } catch (error) {
        logger.error(
            'Erreur lors de la récupération de la répartition par catégories:',
            error
        );
        res.status(500);
        throw new Error(
            'Erreur lors de la récupération de la répartition par catégories'
        );
    }
});

/**
 * @desc    Exporter les statistiques en PDF
 * @route   POST /api/statistiques/exporter-pdf
 * @access  Private/Admin
 */
export const exporterStatistiquesPDF = asyncHandler(async (req, res) => {
    try {
        const { dateDebut, dateFin } = req.body;

        // Validation des dates
        if (!dateDebut || !dateFin) {
            res.status(400);
            throw new Error('Les dates de début et de fin sont requises');
        }

        // Récupérer les statistiques
        const statistiques =
            await StatistiquesService.obtenirStatistiquesDashboard();

        // Générer le PDF
        const pdfBuffer = await genererRapportPDF(statistiques, {
            debut: dateDebut,
            fin: dateFin,
        });

        // Nom du fichier
        // Note: L'utilisation de format() implique que 'date-fns' (ou une fonction similaire) est importé en haut
        const nomFichier = `rapport-nody-${format(new Date(dateDebut), 'yyyy-MM-dd')}-${format(new Date(dateFin), 'yyyy-MM-dd')}.pdf`;

        // Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${nomFichier}"`
        );
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);
    } catch (error) {
        logger.error("Erreur lors de l'export PDF:", error);
        // Utiliser 400 si l'erreur vient d'une validation (comme 400 ci-dessus) ou 500 pour les erreurs internes
        if (res.statusCode === 200) {
            res.status(500);
        }
        throw new Error('Erreur lors de la génération du rapport PDF');
    }
});