import React, { useState, useEffect, useRef } from 'react';
import { useAnalytiquesData } from '../../hooks/useAnalytiquesData';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import FiltresPeriode from '../../components/admin/dashboard/FiltresPeriode';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './Statistiques.scss';

// Enregistrement des composants Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Composant principal pour la page des statistiques admin
const Statistiques = () => {
    const [periodeActive, setPeriodeActive] = useState('mois');
    const [datesPersonnalisees, setDatesPersonnalisees] = useState(null);
    const { donnees, chargement, erreur, actualiser } = useAnalytiquesData(
        periodeActive,
        datesPersonnalisees
    );
    const { addToast } = useToast();

    // CORRECTION: Mémoriser les dernières données valides pour éviter la disparition
    const dernieresDonneesValides = useRef(null);

    // DEBUG : Afficher la structure complète des données
    useEffect(() => {
        console.log('[Statistiques.jsx] donnees:', donnees);
        console.log('[Statistiques.jsx] chargement:', chargement);
        console.log('[Statistiques.jsx] erreur:', erreur);

        if (donnees) {
            console.log(
                '[Statistiques.jsx] statistiquesGlobales:',
                donnees.statistiquesGlobales
            );
            console.log('[Statistiques.jsx] graphiques:', donnees.graphiques);
            console.log('[Statistiques.jsx] tableaux:', donnees.tableaux);

            // CORRECTION: Sauvegarder les données valides
            if (Object.keys(donnees).length > 0) {
                dernieresDonneesValides.current = donnees;
                console.log(
                    '[Statistiques.jsx] Données sauvegardées dans la ref'
                );
            }
        } else {
            console.error('[Statistiques.jsx] DONNEES NULLES ou UNDEFINED');
            console.trace(
                "[Statistiques.jsx] Trace de l'appel qui a causé donnees=null"
            );
        }
    }, [donnees, chargement, erreur]);

    // Gestion du changement de période
    const handleChangePeriode = async (periode, dates = null) => {
        setPeriodeActive(periode);
        setDatesPersonnalisees(dates);

        const periodesLabels = {
            aujourdhui: "Aujourd'hui",
            semaine: 'Cette semaine',
            mois: 'Ce mois',
            trimestre: 'Ce trimestre',
            annee: 'Cette année',
            personnalise: 'Période personnalisée',
        };

        addToast({
            type: 'success',
            title: 'Période mise à jour',
            message: `Affichage des analytiques pour: ${periodesLabels[periode]}`,
        });
    };

    // Export PDF
    const handleExporterPDF = async periode => {
        try {
            addToast({
                type: 'info',
                title: 'Export en cours',
                message: 'Génération du rapport PDF...',
            });

            const response = await api.post(
                '/admin/statistiques/exporter-pdf',
                {
                    dateDebut: periode.dateDebut,
                    dateFin: periode.dateFin,
                },
                {
                    responseType: 'blob',
                }
            );

            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `analytiques-nody-${new Date().toISOString().slice(0, 10)}.pdf`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();

            addToast({
                type: 'success',
                title: 'Export réussi',
                message: 'Le rapport PDF a été téléchargé',
            });
        } catch (error) {
            console.error('Erreur export PDF:', error);
            addToast({
                type: 'error',
                title: 'Erreur',
                message: "Impossible d'exporter le rapport PDF",
            });
        }
    };

    // Formater les montants
    const formaterMontant = montant => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
        }).format(montant || 0);
    };

    // Formater les pourcentages
    const formaterPourcentage = valeur => {
        return `${parseFloat(valeur || 0).toFixed(2)}%`;
    };

    // CORRECTION: Utiliser les données actuelles ou les dernières valides
    const donneesAffichees = donnees || dernieresDonneesValides.current;

    // DEBUG: Tracer l'état avant chaque condition
    console.log('[Statistiques.jsx] État actuel:', {
        chargement,
        erreur,
        donnees: !!donnees,
        donneesAffichees: !!donneesAffichees,
    });

    if (chargement && !donneesAffichees) {
        console.log('[Statistiques.jsx] Affichage spinner de chargement');
        return (
            <div className="statistiques-container">
                <div className="loading-state">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p>Chargement des analytiques...</p>
                </div>
            </div>
        );
    }

    if (erreur && !donneesAffichees) {
        console.log('[Statistiques.jsx] Affichage erreur:', erreur);
        return (
            <div className="statistiques-container">
                <div className="error-state">
                    <i className="fas fa-exclamation-triangle"></i>
                    <h3>Erreur de chargement</h3>
                    <p>{erreur}</p>
                    <button className="btn btn-primary" onClick={actualiser}>
                        <i className="fas fa-sync-alt me-2"></i>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    if (!donneesAffichees) {
        console.log('[Statistiques.jsx] Affichage "Aucune donnée disponible"');
        console.trace(
            "[Statistiques.jsx] Trace de l'appel qui a causé !donneesAffichees"
        );
        return (
            <div className="statistiques-container">
                <div className="empty-state">
                    <i className="fas fa-chart-line"></i>
                    <p>Aucune donnée disponible</p>
                </div>
            </div>
        );
    }

    console.log('[Statistiques.jsx] Affichage des données complètes');

    const { statistiquesGlobales, graphiques, tableaux } = donneesAffichees;

    // Configuration du graphique d'évolution des ventes
    const dataEvolutionVentes = {
        labels:
            graphiques?.evolutionVentes?.map(v => {
                const date = new Date(v.date);
                return date.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                });
            }) || [],
        datasets: [
            {
                label: 'Ventes',
                data: graphiques?.evolutionVentes?.map(v => v.ventes) || [],
                borderColor: '#16213e',
                backgroundColor: 'rgba(22, 33, 62, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#16213e',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
        ],
    };

    // Configuration du graphique CA
    const dataEvolutionCA = {
        labels: graphiques?.evolutionCA?.map(ca => ca.mois) || [],
        datasets: [
            {
                label: "Chiffre d'Affaires",
                data: graphiques?.evolutionCA?.map(ca => ca.montant) || [],
                backgroundColor: '#16213e',
                borderColor: '#16213e',
                borderWidth: 1,
                borderRadius: 8,
            },
        ],
    };

    // Configuration du graphique répartition catégories
    const dataRepartitionCategories = {
        labels: graphiques?.repartitionCategories?.map(c => c.nom) || [],
        datasets: [
            {
                label: 'Ventes par catégorie',
                data:
                    graphiques?.repartitionCategories?.map(c => c.valeur) || [],
                backgroundColor: [
                    '#16213e',
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6',
                ],
                borderColor: '#fff',
                borderWidth: 3,
            },
        ],
    };

    // Options communes pour les graphiques
    const optionsGraphique = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif",
                    },
                    padding: 15,
                    usePointStyle: true,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(22, 33, 62, 0.95)',
                titleFont: {
                    size: 14,
                    weight: 'bold',
                },
                bodyFont: {
                    size: 13,
                },
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    font: {
                        size: 11,
                    },
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: {
                        size: 11,
                    },
                },
            },
        },
    };

    const optionsDonut = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    font: {
                        size: 12,
                    },
                    padding: 15,
                    usePointStyle: true,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(22, 33, 62, 0.95)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = formaterMontant(context.parsed);
                        return `${label}: ${value}`;
                    },
                },
            },
        },
    };

    return (
        <div className="statistiques-container">
            {/* En-tête */}
            <div className="statistiques-header">
                <div className="header-content">
                    <h1>
                        <i className="fas fa-chart-line me-3"></i>
                        Analytiques
                    </h1>
                    <p className="text-muted">
                        Vue d'ensemble détaillée de la plateforme Nody
                    </p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-outline"
                        onClick={actualiser}
                        disabled={chargement}
                    >
                        <i className="fas fa-sync-alt me-2"></i>
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Filtres de période */}
            <FiltresPeriode
                onChangePeriode={handleChangePeriode}
                onExporterPDF={handleExporterPDF}
                chargement={false}
            />

            {/* Cartes de statistiques principales */}
            <div className="stats-grid">
                <div className="stat-card stat-card-primary">
                    <div className="stat-icon">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-content">
                        <h3>Total Utilisateurs</h3>
                        <p className="stat-value">
                            {statistiquesGlobales?.clients?.total || 0}
                        </p>
                        <span className="stat-badge success">
                            <i className="fas fa-arrow-up"></i>+
                            {statistiquesGlobales?.clients?.nouveauxPeriode ||
                                0}{' '}
                            cette période
                        </span>
                    </div>
                </div>

                <div className="stat-card stat-card-warning">
                    <div className="stat-icon">
                        <i className="fas fa-shopping-cart"></i>
                    </div>
                    <div className="stat-content">
                        <h3>Commandes</h3>
                        <p className="stat-value">
                            {statistiquesGlobales?.commandes?.total || 0}
                        </p>
                        <span className="stat-badge warning">
                            <i className="fas fa-clock"></i>
                            {statistiquesGlobales?.commandes?.enAttente || 0} en
                            attente
                        </span>
                    </div>
                </div>

                <div className="stat-card stat-card-success">
                    <div className="stat-icon">
                        <i className="fas fa-coins"></i>
                    </div>
                    <div className="stat-content">
                        <h3>Chiffre d'Affaires</h3>
                        <p className="stat-value">
                            {formaterMontant(
                                statistiquesGlobales?.chiffreAffaires?.total
                            )}
                        </p>
                        <span className="stat-badge success">
                            <i className="fas fa-chart-line"></i>
                            Période actuelle
                        </span>
                    </div>
                </div>

                <div className="stat-card stat-card-info">
                    <div className="stat-icon">
                        <i className="fas fa-percentage"></i>
                    </div>
                    <div className="stat-content">
                        <h3>Taux de Conversion</h3>
                        <p className="stat-value">
                            {formaterPourcentage(
                                statistiquesGlobales?.performance
                                    ?.tauxConversion
                            )}
                        </p>
                        <span className="stat-badge info">
                            <i className="fas fa-chart-pie"></i>
                            Performance
                        </span>
                    </div>
                </div>
            </div>

            {/* Indicateurs de performance supplémentaires */}
            <div className="row mt-4">
                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="mini-stat-card">
                        <div className="mini-stat-icon bg-primary">
                            <i className="fas fa-box"></i>
                        </div>
                        <div className="mini-stat-content">
                            <p className="mini-stat-label">Produits Actifs</p>
                            <h4 className="mini-stat-value">
                                {statistiquesGlobales?.produits?.actifs || 0}
                            </h4>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="mini-stat-card">
                        <div className="mini-stat-icon bg-warning">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <div className="mini-stat-content">
                            <p className="mini-stat-label">Stock Faible</p>
                            <h4 className="mini-stat-value">
                                {statistiquesGlobales?.produits?.stockFaible ||
                                    0}
                            </h4>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="mini-stat-card">
                        <div className="mini-stat-icon bg-danger">
                            <i className="fas fa-times-circle"></i>
                        </div>
                        <div className="mini-stat-content">
                            <p className="mini-stat-label">Ruptures</p>
                            <h4 className="mini-stat-value">
                                {statistiquesGlobales?.produits?.enRupture || 0}
                            </h4>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="mini-stat-card">
                        <div className="mini-stat-icon bg-success">
                            <i className="fas fa-shopping-bag"></i>
                        </div>
                        <div className="mini-stat-content">
                            <p className="mini-stat-label">Panier Moyen</p>
                            <h4 className="mini-stat-value">
                                {formaterMontant(
                                    statistiquesGlobales?.performance
                                        ?.panierMoyen
                                )}
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Graphiques */}
            <div className="row mt-4">
                {/* Évolution des ventes */}
                <div className="col-lg-8 mb-4">
                    <div className="card card-modern">
                        <div className="card-header">
                            <h3>
                                <i className="fas fa-chart-line me-2"></i>
                                Évolution des Ventes (7 derniers jours)
                            </h3>
                        </div>
                        <div className="card-body">
                            <div
                                className="chart-wrapper"
                                style={{ height: '350px' }}
                            >
                                {graphiques?.evolutionVentes?.length > 0 ? (
                                    <Line
                                        data={dataEvolutionVentes}
                                        options={optionsGraphique}
                                    />
                                ) : (
                                    <div className="empty-chart">
                                        <i className="fas fa-chart-line"></i>
                                        <p>
                                            Aucune donnée de ventes disponible
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Répartition par catégories */}
                <div className="col-lg-4 mb-4">
                    <div className="card card-modern">
                        <div className="card-header">
                            <h3>
                                <i className="fas fa-chart-pie me-2"></i>
                                Répartition Catégories
                            </h3>
                        </div>
                        <div className="card-body">
                            <div
                                className="chart-wrapper"
                                style={{ height: '350px' }}
                            >
                                {graphiques?.repartitionCategories?.length >
                                0 ? (
                                    <Doughnut
                                        data={dataRepartitionCategories}
                                        options={optionsDonut}
                                    />
                                ) : (
                                    <div className="empty-chart">
                                        <i className="fas fa-chart-pie"></i>
                                        <p>Aucune donnée de catégories</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chiffre d'affaires */}
            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card card-modern">
                        <div className="card-header">
                            <h3>
                                <i className="fas fa-chart-bar me-2"></i>
                                Chiffre d'Affaires (6 derniers mois)
                            </h3>
                        </div>
                        <div className="card-body">
                            <div
                                className="chart-wrapper"
                                style={{ height: '350px' }}
                            >
                                {graphiques?.evolutionCA?.length > 0 ? (
                                    <Bar
                                        data={dataEvolutionCA}
                                        options={{
                                            ...optionsGraphique,
                                            plugins: {
                                                ...optionsGraphique.plugins,
                                                tooltip: {
                                                    ...optionsGraphique.plugins
                                                        .tooltip,
                                                    callbacks: {
                                                        label: function (
                                                            context
                                                        ) {
                                                            return `CA: ${formaterMontant(
                                                                context.parsed.y
                                                            )}`;
                                                        },
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                ) : (
                                    <div className="empty-chart">
                                        <i className="fas fa-chart-bar"></i>
                                        <p>
                                            Aucune donnée de chiffre d'affaires
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableaux */}
            <div className="row">
                {/* Produits populaires */}
                <div className="col-lg-6 mb-4">
                    <div className="card card-modern">
                        <div className="card-header">
                            <h3>
                                <i className="fas fa-fire me-2"></i>
                                Produits Populaires
                            </h3>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>Produit</th>
                                            <th className="text-center">
                                                Vendus
                                            </th>
                                            <th className="text-end">Revenu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableaux?.produitsPopulaires?.length >
                                        0 ? (
                                            tableaux.produitsPopulaires.map(
                                                (produit, index) => (
                                                    <tr
                                                        key={
                                                            produit._id ||
                                                            produit.id ||
                                                            index
                                                        }
                                                    >
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="product-icon">
                                                                    <i className="fas fa-box"></i>
                                                                </div>
                                                                <span className="ms-2">
                                                                    {
                                                                        produit.nom
                                                                    }
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge bg-primary">
                                                                {
                                                                    produit.totalVendu
                                                                }
                                                            </span>
                                                        </td>
                                                        <td className="text-end fw-bold">
                                                            {formaterMontant(
                                                                produit.revenu
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="text-center py-4"
                                                >
                                                    <div className="empty-table">
                                                        <i className="fas fa-inbox"></i>
                                                        <p>
                                                            Aucun produit
                                                            populaire
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Commandes récentes */}
                <div className="col-lg-6 mb-4">
                    <div className="card card-modern">
                        <div className="card-header">
                            <h3>
                                <i className="fas fa-receipt me-2"></i>
                                Commandes Récentes
                            </h3>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>N° Commande</th>
                                            <th>Client</th>
                                            <th className="text-end">
                                                Montant
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableaux?.commandesRecentes?.length >
                                        0 ? (
                                            tableaux.commandesRecentes.map(
                                                (commande, index) => (
                                                    <tr
                                                        key={
                                                            commande._id ||
                                                            commande.id ||
                                                            index
                                                        }
                                                    >
                                                        <td>
                                                            <span className="text-primary fw-bold">
                                                                {
                                                                    commande.numeroCommande
                                                                }
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {
                                                                commande.client
                                                                    ?.nom
                                                            }{' '}
                                                            {
                                                                commande.client
                                                                    ?.prenom
                                                            }
                                                        </td>
                                                        <td className="text-end fw-bold">
                                                            {formaterMontant(
                                                                commande.montantTotal ||
                                                                    commande.total
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="text-center py-4"
                                                >
                                                    <div className="empty-table">
                                                        <i className="fas fa-inbox"></i>
                                                        <p>
                                                            Aucune commande
                                                            récente
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nouveaux clients */}
            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card card-modern">
                        <div className="card-header">
                            <h3>
                                <i className="fas fa-user-plus me-2"></i>
                                Nouveaux Clients
                            </h3>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Date d'inscription</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableaux?.nouveauxClients?.length >
                                        0 ? (
                                            tableaux.nouveauxClients.map(
                                                (client, index) => (
                                                    <tr
                                                        key={
                                                            client._id ||
                                                            client.email ||
                                                            index
                                                        }
                                                    >
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="user-avatar">
                                                                    {client.nom?.charAt(
                                                                        0
                                                                    )}
                                                                    {client.prenom?.charAt(
                                                                        0
                                                                    )}
                                                                </div>
                                                                <span className="ms-2">
                                                                    {client.nom}{' '}
                                                                    {
                                                                        client.prenom
                                                                    }
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>{client.email}</td>
                                                        <td>
                                                            {new Date(
                                                                client.createdAt
                                                            ).toLocaleDateString(
                                                                'fr-FR',
                                                                {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                }
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="text-center py-4"
                                                >
                                                    <div className="empty-table">
                                                        <i className="fas fa-inbox"></i>
                                                        <p>
                                                            Aucun nouveau client
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistiques;
