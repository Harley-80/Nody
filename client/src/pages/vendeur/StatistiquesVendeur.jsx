import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vendeurService } from '../../services/vendeurService';
import { useToast } from '../../contexts/ToastContext';
import { useDevise } from '../../contexts/DeviseContext';
import { useAuth } from '../../contexts/AuthContext';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import './StatistiquesVendeur.scss';

const StatistiquesVendeur = () => {
    const { addToast } = useToast();
    const { formaterPrix, devise } = useDevise();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [periode, setPeriode] = useState('mois');
    const [statistiques, setStatistiques] = useState({
        chiffreAffaires: 0,
        commandesTotal: 0,
        produitsVendus: 0,
        tauxConversion: 0,
        panierMoyen: 0,
        clientsReccurents: 0,
        produitsEnStock: 0,
        produitsRupture: 0,
        meilleuresCategories: [],
        meilleursProduits: [],
        evolutionVentes: [],
        repartitionStatuts: [],
    });

    useEffect(() => {
        chargerStatistiques();
    }, [periode, user?._id]);

    const chargerStatistiques = async () => {
        try {
            setLoading(true);

            // 1. Récupérer les statistiques principales
            const statsResponse = await vendeurService.obtenirStatistiques();

            // 2. Récupérer les données graphiques
            const evolutionResponse = await vendeurService.obtenirEvolutionVentes({
                periode: periode,
                vendeurId: user?._id,
            });

            // 3. Récupérer les catégories
            const categoriesResponse = await vendeurService.obtenirRepartitionCategories({
                vendeurId: user?._id,
            });

            // 4. Récupérer les produits performants
            const produitsResponse = await vendeurService.obtenirProduitsPerformants({
                vendeurId: user?._id,
                limit: 5,
            });

            // 5. Récupérer la répartition des statuts
            const statutsResponse = await vendeurService.obtenirRepartitionStatuts({
                vendeurId: user?._id,
            });

            setStatistiques({
                ...statsResponse.data,
                evolutionVentes: evolutionResponse.data || [],
                meilleuresCategories: categoriesResponse.data || [],
                meilleursProduits: produitsResponse.data || [],
                repartitionStatuts: statutsResponse.data || [],
            });
        } catch (error) {
            console.error('Erreur chargement statistiques:', error);
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de charger les statistiques',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatNombre = (nombre) => {
        return new Intl.NumberFormat('fr-FR').format(nombre);
    };

    const calculatePourcentage = (actuel, precedent) => {
        if (precedent === 0) return 100;
        return (((actuel - precedent) / precedent) * 100).toFixed(1);
    };

    if (loading) {
        return (
            <div className="statistiques-vendeur">
                <div className="loading-screen">
                    <div className="spinner-analytics">
                        <div className="ring"></div>
                        <div className="ring"></div>
                        <div className="ring"></div>
                    </div>
                    <h3>Analyse des performances...</h3>
                    <p>Chargement des données statistiques</p>
                </div>
            </div>
        );
    }

    return (
        <div className="statistiques-vendeur">
            {/* Header avec sélecteur de période */}
            <div className="analytics-header">
                <div className="header-left">
                    <h1>
                        <span className="icon">📈</span>
                        Analytics Performances
                    </h1>
                    <p className="subtitle">
                        Analyse approfondie de votre activité commerciale
                    </p>
                </div>

                <div className="header-right">
                    <div className="period-selector">
                        <button
                            className={`period-btn ${periode === 'jour' ? 'active' : ''}`}
                            onClick={() => setPeriode('jour')}
                        >
                            Jour
                        </button>
                        <button
                            className={`period-btn ${periode === 'semaine' ? 'active' : ''}`}
                            onClick={() => setPeriode('semaine')}
                        >
                            Semaine
                        </button>
                        <button
                            className={`period-btn ${periode === 'mois' ? 'active' : ''}`}
                            onClick={() => setPeriode('mois')}
                        >
                            Mois
                        </button>
                        <button
                            className={`period-btn ${periode === 'trimestre' ? 'active' : ''}`}
                            onClick={() => setPeriode('trimestre')}
                        >
                            Trimestre
                        </button>
                        <button
                            className={`period-btn ${periode === 'annee' ? 'active' : ''}`}
                            onClick={() => setPeriode('annee')}
                        >
                            Année
                        </button>
                    </div>

                    <button className="btn-export">
                        <span className="icon">📊</span>
                        Exporter Rapport
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card revenue">
                    <div className="kpi-icon">
                        <span className="icon">💰</span>
                    </div>
                    <div className="kpi-content">
                        <h3>{formaterPrix(statistiques.chiffreAffaires)}</h3>
                        <p>Chiffre d'Affaires</p>
                        <div className="kpi-trend positive">
                            <span className="trend-icon">↗</span>
                            <span>+12.5% vs période précédente</span>
                        </div>
                    </div>
                </div>

                <div className="kpi-card orders">
                    <div className="kpi-icon">
                        <span className="icon">📦</span>
                    </div>
                    <div className="kpi-content">
                        <h3>{formatNombre(statistiques.commandesTotal)}</h3>
                        <p>Commandes Traitées</p>
                        <div className="kpi-trend positive">
                            <span className="trend-icon">↗</span>
                            <span>+8.3% vs période précédente</span>
                        </div>
                    </div>
                </div>

                <div className="kpi-card conversion">
                    <div className="kpi-icon">
                        <span className="icon">🎯</span>
                    </div>
                    <div className="kpi-content">
                        <h3>{statistiques.tauxConversion?.toFixed(1)}%</h3>
                        <p>Taux de Conversion</p>
                        <div className="kpi-trend neutral">
                            <span className="trend-icon">→</span>
                            <span>Stable (-0.2%)</span>
                        </div>
                    </div>
                </div>

                <div className="kpi-card basket">
                    <div className="kpi-icon">
                        <span className="icon">🛒</span>
                    </div>
                    <div className="kpi-content">
                        <h3>{formaterPrix(statistiques.panierMoyen)}</h3>
                        <p>Panier Moyen</p>
                        <div className="kpi-trend positive">
                            <span className="trend-icon">↗</span>
                            <span>+5.7% vs période précédente</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Graphiques Principaux */}
            <div className="charts-grid">
                {/* Évolution des ventes */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Évolution des Ventes</h3>
                        <div className="chart-legend">
                            <span className="legend-item">
                                <span className="legend-dot sales"></span>
                                Ventes
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot revenue"></span>
                                Revenu
                            </span>
                        </div>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={statistiques.evolutionVentes}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                                <XAxis dataKey="jour" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #2d3748',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value) => [formatNombre(value), '']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="ventes"
                                    stroke="#00bcd4"
                                    fill="url(#colorVentes)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenu"
                                    stroke="#3f51b5"
                                    fill="url(#colorRevenu)"
                                    strokeWidth={2}
                                />
                                <defs>
                                    <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#00bcd4" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3f51b5" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3f51b5" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Répartition par catégorie */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Répartition par Catégorie</h3>
                        <span className="chart-subtitle">Part des revenus</span>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statistiques.meilleuresCategories}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="valeur"
                                >
                                    {statistiques.meilleuresCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.couleur} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`${value}%`, 'Part']}
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #2d3748',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Tableau des meilleurs produits */}
            <div className="products-table-card">
                <div className="table-header">
                    <h3>Top Produits Performants</h3>
                    <Link to="/vendeur/produits" className="view-all">
                        Voir tous les produits →
                    </Link>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Ventes</th>
                                <th>Revenu</th>
                                <th>Taux de Rotation</th>
                                <th>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statistiques.meilleursProduits.map((produit, index) => (
                                <tr key={index}>
                                    <td>
                                        <div className="product-info">
                                            <div className="product-avatar">
                                                {produit.nom?.charAt(0)}
                                            </div>
                                            <div className="product-details">
                                                <strong>{produit.nom}</strong>
                                                <span className="sku">SKU: PRD-{1000 + index}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="sales-count">
                                            {produit.ventes || 0} unités
                                        </div>
                                    </td>
                                    <td>
                                        <div className="revenue-amount">
                                            {formaterPrix(produit.revenu || 0)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="rotation-rate">
                                            <div className="rotation-bar">
                                                <div
                                                    className="rotation-fill"
                                                    style={{
                                                        width: `${Math.min((produit.ventes || 0) / 2, 100)}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <span>{((produit.ventes || 0) / 2).toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div
                                            className={`performance-badge ${
                                                produit.ventes > 100
                                                    ? 'high'
                                                    : produit.ventes > 50
                                                    ? 'medium'
                                                    : 'low'
                                            }`}
                                        >
                                            {produit.ventes > 100
                                                ? 'Élevée'
                                                : produit.ventes > 50
                                                ? 'Moyenne'
                                                : 'Faible'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Répartition des statuts */}
            <div className="chart-card">
                <div className="chart-header">
                    <h3>Répartition des Statuts de Commande</h3>
                </div>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statistiques.repartitionStatuts}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                            <XAxis dataKey="nom" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #2d3748',
                                    borderRadius: '8px',
                                }}
                            />
                            <Bar dataKey="valeur" name="Nombre">
                                {statistiques.repartitionStatuts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.couleur} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Rapport de performance */}
            <div className="performance-report">
                <div className="report-header">
                    <h3>Rapport de Performance Mensuel</h3>
                    <div className="report-period">Novembre 2024</div>
                </div>

                <div className="report-metrics">
                    <div className="metric-card">
                        <div className="metric-value">A+</div>
                        <div className="metric-label">Note globale</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-value">98%</div>
                        <div className="metric-label">Satisfaction clients</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-value">4.7/5</div>
                        <div className="metric-label">Évaluation produits</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-value">99.2%</div>
                        <div className="metric-label">Taux de livraison</div>
                    </div>
                </div>

                <div className="report-actions">
                    <button className="btn-report btn-download">
                        <span className="icon">📥</span>
                        Télécharger PDF
                    </button>
                    <button className="btn-report btn-share">
                        <span className="icon">🔗</span>
                        Partager rapport
                    </button>
                    <button className="btn-report btn-compare">
                        <span className="icon">📊</span>
                        Comparer périodes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatistiquesVendeur;