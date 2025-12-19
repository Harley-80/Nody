import React, { useState } from 'react';
import { formaterMontant, formaterNombre } from '../../utils/formatage';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useDashboardData } from '../../hooks/useDashboardData'; // ✅ IMPORT DU HOOK
import {
    CarteStatistique,
    GraphiqueVentes,
    GraphiqueChiffreAffaires,
    RepartitionCategories,
    TableauProduitsPopulaires,
    TableauCommandesRecentes,
    TableauNouveauxClients,
    IndicateursPerformance,
} from '../../components/admin/dashboard';
import FiltresPeriode from '../../components/admin/dashboard/FiltresPeriode';
import '../../styles/Dashboard.scss';

const AdminDashboard = () => {
    const { addToast } = useToast();

    // États locaux pour la période
    const [periodeActive, setPeriodeActive] = useState('mois');
    const [datesPersonnalisees, setDatesPersonnalisees] = useState(null);
    const [exportEnCours, setExportEnCours] = useState(false);

    // ✅ UTILISER LE HOOK CORRECT
    const { donnees, chargement, erreur, actualiser } = useDashboardData(
        periodeActive,
        datesPersonnalisees
    );

    // ✅ CORRECTION : Gestion du changement de période
    const handleChangePeriode = async (periode, datesPersonnalisees = null) => {
        setPeriodeActive(periode);

        if (periode === 'personnalise' && datesPersonnalisees) {
            setDatesPersonnalisees(datesPersonnalisees);
        } else {
            setDatesPersonnalisees(null);
        }

        addToast({
            type: 'success',
            title: 'Période mise à jour',
            message: `Statistiques chargées pour: ${
                periode === 'aujourdhui'
                    ? "Aujourd'hui"
                    : periode === 'semaine'
                      ? 'Cette semaine'
                      : periode === 'mois'
                        ? 'Ce mois'
                        : periode === 'trimestre'
                          ? 'Ce trimestre'
                          : periode === 'annee'
                            ? 'Cette année'
                            : 'Période personnalisée'
            }`,
        });
    };

    // Export PDF
    const handleExporterPDF = async periode => {
        try {
            setExportEnCours(true);

            const response = await api.post(
                '/statistiques/exporter-pdf',
                {
                    dateDebut: periode.dateDebut,
                    dateFin: periode.dateFin,
                },
                {
                    responseType: 'blob',
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `rapport-nody-${new Date().toISOString().slice(0, 10)}.pdf`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();

            addToast({
                type: 'success',
                title: 'Export réussi',
                message: 'Le rapport PDF a été téléchargé avec succès',
            });
        } catch (error) {
            console.error('Erreur export PDF:', error);
            addToast({
                type: 'error',
                title: 'Erreur',
                message: "Impossible d'exporter le rapport PDF",
            });
        } finally {
            setExportEnCours(false);
        }
    };

    // État de chargement
    if (chargement) {
        return (
            <div className="dashboard-chargement">
                <div className="spinner-wrapper">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p className="mt-3 text-muted">
                        Chargement des statistiques...
                    </p>
                </div>
            </div>
        );
    }

    // État d'erreur
    if (erreur) {
        return (
            <div className="dashboard-erreur">
                <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {erreur}
                    <button
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={actualiser}
                    >
                        <i className="fas fa-sync-alt me-1"></i>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    // Pas de données
    if (!donnees) {
        return (
            <div className="dashboard-vide">
                <i className="fas fa-chart-line"></i>
                <p>Aucune donnée disponible</p>
            </div>
        );
    }

    const { statistiquesGlobales, graphiques, tableaux } = donnees;

    return (
        <div className="admin-dashboard">
            {/* En-tête */}
            <div className="dashboard-header">
                <div className="header-content">
                    <h1>Tableau de Bord</h1>
                    <p className="text-muted">
                        Vue d'ensemble de votre plateforme Nody
                    </p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary btn-modern"
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
                chargement={exportEnCours}
            />

            {/* Cartes de statistiques principales */}
            <div className="stats-grid">
                <CarteStatistique
                    titre="Chiffre d'Affaires"
                    valeur={statistiquesGlobales?.chiffreAffaires?.mois || 0}
                    icone="fas fa-chart-line"
                    couleur="primary"
                    suffixe=" XOF"
                />
                <CarteStatistique
                    titre="Commandes du Mois"
                    valeur={statistiquesGlobales?.commandes?.mois || 0}
                    icone="fas fa-shopping-cart"
                    couleur="success"
                />
                <CarteStatistique
                    titre="Nouveaux Clients"
                    valeur={statistiquesGlobales?.clients?.mois || 0}
                    icone="fas fa-users"
                    couleur="info"
                />
                <CarteStatistique
                    titre="Commandes en Attente"
                    valeur={statistiquesGlobales?.commandes?.enAttente || 0}
                    icone="fas fa-clock"
                    couleur="warning"
                />
            </div>

            {/* Indicateurs de performance */}
            <div className="section-card mt-4">
                <div className="section-header">
                    <h3>Indicateurs de Performance</h3>
                </div>
                <div className="section-body">
                    <IndicateursPerformance
                        performance={statistiquesGlobales?.performance || {}}
                    />
                </div>
            </div>

            {/* Graphiques */}
            <div className="row mt-4">
                <div className="col-lg-6 mb-4">
                    <div className="section-card">
                        <div className="section-header">
                            <h3>
                                <i className="fas fa-chart-line me-2 text-primary"></i>
                                Évolution des Ventes (7 derniers jours)
                            </h3>
                        </div>
                        <div className="section-body">
                            <GraphiqueVentes
                                donnees={graphiques?.evolutionVentes || []}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-lg-6 mb-4">
                    <div className="section-card">
                        <div className="section-header">
                            <h3>
                                <i className="fas fa-chart-bar me-2 text-success"></i>
                                Chiffre d'Affaires (6 derniers mois)
                            </h3>
                        </div>
                        <div className="section-body">
                            <GraphiqueChiffreAffaires
                                donnees={graphiques?.evolutionCA || []}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Répartition par catégories */}
            <div className="row">
                <div className="col-lg-6 mb-4">
                    <div className="section-card">
                        <div className="section-header">
                            <h3>
                                <i className="fas fa-chart-pie me-2 text-info"></i>
                                Ventes par Catégorie
                            </h3>
                        </div>
                        <div className="section-body">
                            <RepartitionCategories
                                donnees={
                                    graphiques?.repartitionCategories || []
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="col-lg-6 mb-4">
                    <div className="section-card">
                        <div className="section-header">
                            <h3>
                                <i className="fas fa-fire me-2 text-danger"></i>
                                Produits Populaires
                            </h3>
                        </div>
                        <div className="section-body p-0">
                            <TableauProduitsPopulaires
                                produits={tableaux?.produitsPopulaires || []}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableaux */}
            <div className="row">
                <div className="col-lg-8 mb-4">
                    <div className="section-card">
                        <div className="section-header">
                            <h3>
                                <i className="fas fa-receipt me-2 text-primary"></i>
                                Commandes Récentes
                            </h3>
                        </div>
                        <div className="section-body p-0">
                            <TableauCommandesRecentes
                                commandes={tableaux?.commandesRecentes || []}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-lg-4 mb-4">
                    <div className="section-card">
                        <div className="section-header">
                            <h3>
                                <i className="fas fa-user-plus me-2 text-success"></i>
                                Nouveaux Clients
                            </h3>
                        </div>
                        <div className="section-body p-0">
                            <TableauNouveauxClients
                                clients={tableaux?.nouveauxClients || []}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistiques rapides */}
            <div className="row">
                <div className="col-md-3">
                    <div className="stat-card-mini bg-gradient-primary">
                        <div className="stat-content">
                            <i className="fas fa-box"></i>
                            <div>
                                <h4>
                                    {formaterNombre(
                                        statistiquesGlobales?.produits
                                            ?.actifs || 0
                                    )}
                                </h4>
                                <span>Produits Actifs</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="stat-card-mini bg-gradient-success">
                        <div className="stat-content">
                            <i className="fas fa-users"></i>
                            <div>
                                <h4>
                                    {formaterNombre(
                                        statistiquesGlobales?.clients?.total ||
                                            0
                                    )}
                                </h4>
                                <span>Clients Totaux</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="stat-card-mini bg-gradient-warning">
                        <div className="stat-content">
                            <i className="fas fa-exclamation-triangle"></i>
                            <div>
                                <h4>
                                    {formaterNombre(
                                        statistiquesGlobales?.produits
                                            ?.stockFaible || 0
                                    )}
                                </h4>
                                <span>Stock Faible</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="stat-card-mini bg-gradient-danger">
                        <div className="stat-content">
                            <i className="fas fa-times-circle"></i>
                            <div>
                                <h4>
                                    {formaterNombre(
                                        statistiquesGlobales?.produits
                                            ?.enRupture || 0
                                    )}
                                </h4>
                                <span>Ruptures de Stock</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
