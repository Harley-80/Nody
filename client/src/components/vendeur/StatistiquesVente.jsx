import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faChartBar,
    faChartPie,
    faArrowUp,
    faArrowDown,
    faMoneyBillWave,
    faShoppingCart,
    faUsers,
    faBox,
    faStar,
    faEye,
    faPercent,
} from '@fortawesome/free-solid-svg-icons';
import './StatistiquesVente.scss';

const StatistiquesVente = ({ stats, periode = 'mois' }) => {
    const formatCurrency = amount => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = number => {
        return new Intl.NumberFormat('fr-FR').format(number);
    };

    const calculateTrend = (current, previous) => {
        if (previous === 0) return { value: 100, isPositive: true };
        const trend = ((current - previous) / previous) * 100;
        return {
            value: Math.abs(trend).toFixed(1),
            isPositive: trend >= 0,
        };
    };

    const getTrendIcon = isPositive => {
        return isPositive ? faArrowUp : faArrowDown;
    };

    const getTrendClass = isPositive => {
        return isPositive ? 'positive' : 'negative';
    };

    const statCards = [
        {
            id: 'chiffre-affaires',
            titre: "Chiffre d'affaires",
            valeur: formatCurrency(stats?.chiffreAffaires || 0),
            icon: faMoneyBillWave,
            couleur: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            tendance: calculateTrend(
                stats?.chiffreAffaires || 0,
                stats?.chiffreAffairesPrecedent || 0
            ),
            details: `Mois précédent: ${formatCurrency(stats?.chiffreAffairesPrecedent || 0)}`,
        },
        {
            id: 'commandes',
            titre: 'Commandes',
            valeur: formatNumber(stats?.commandesTotal || 0),
            icon: faShoppingCart,
            couleur: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            tendance: calculateTrend(
                stats?.commandesTotal || 0,
                stats?.commandesPrecedent || 0
            ),
            details: `${stats?.commandesMoyennes || 0}/jour en moyenne`,
        },
        {
            id: 'clients',
            titre: 'Nouveaux clients',
            valeur: formatNumber(stats?.nouveauxClients || 0),
            icon: faUsers,
            couleur: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            tendance: calculateTrend(
                stats?.nouveauxClients || 0,
                stats?.clientsPrecedent || 0
            ),
            details: `${stats?.clientsReccurents || 0} clients fidèles`,
        },
        {
            id: 'produits',
            titre: 'Produits vendus',
            valeur: formatNumber(stats?.produitsVendus || 0),
            icon: faBox,
            couleur: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            tendance: calculateTrend(
                stats?.produitsVendus || 0,
                stats?.produitsPrecedent || 0
            ),
            details: `${stats?.produitsEnStock || 0} produits en stock`,
        },
        {
            id: 'taux-conversion',
            titre: 'Taux de conversion',
            valeur: `${(stats?.tauxConversion || 0).toFixed(1)}%`,
            icon: faPercent,
            couleur: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            tendance: calculateTrend(
                stats?.tauxConversion || 0,
                stats?.tauxConversionPrecedent || 0
            ),
            details: `${stats?.vuesTotal || 0} vues totales`,
        },
        {
            id: 'panier-moyen',
            titre: 'Panier moyen',
            valeur: formatCurrency(stats?.panierMoyen || 0),
            icon: faChartLine,
            couleur: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            tendance: calculateTrend(
                stats?.panierMoyen || 0,
                stats?.panierMoyenPrecedent || 0
            ),
            details: `${stats?.produitsParCommande || 0} produits/commande`,
        },
    ];

    return (
        <div className="statistiques-vente">
            {/* En-tête */}
            <div className="stats-header">
                <h2>
                    <FontAwesomeIcon icon={faChartBar} />
                    Statistiques de vente
                </h2>
                <div className="periode-indicator">
                    <span className="periode-label">Période:</span>
                    <span className="periode-value">
                        {periode === 'jour'
                            ? "Aujourd'hui"
                            : periode === 'semaine'
                              ? 'Cette semaine'
                              : periode === 'mois'
                                ? 'Ce mois'
                                : periode === 'trimestre'
                                  ? 'Ce trimestre'
                                  : 'Cette année'}
                    </span>
                </div>
            </div>

            {/* Grille de cartes */}
            <div className="stats-grid">
                {statCards.map(card => (
                    <div
                        key={card.id}
                        className="stat-card"
                        style={{ background: card.couleur }}
                    >
                        <div className="card-decoration">
                            <div className="decoration-circle"></div>
                            <div className="decoration-wave"></div>
                        </div>

                        <div className="card-content">
                            <div className="card-header">
                                <div className="card-icon">
                                    <FontAwesomeIcon icon={card.icon} />
                                </div>
                                <div
                                    className={`tendance-indicator ${getTrendClass(card.tendance.isPositive)}`}
                                >
                                    <FontAwesomeIcon
                                        icon={getTrendIcon(
                                            card.tendance.isPositive
                                        )}
                                    />
                                    <span>{card.tendance.value}%</span>
                                </div>
                            </div>

                            <div className="card-valeur">{card.valeur}</div>
                            <div className="card-titre">{card.titre}</div>

                            <div className="card-details">
                                <span>{card.details}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Graphiques rapides */}
            <div className="stats-graphiques">
                <div className="graphique-section">
                    <div className="section-header">
                        <h3>
                            <FontAwesomeIcon icon={faChartLine} />
                            Évolution des ventes
                        </h3>
                    </div>
                    <div className="graphique-placeholder">
                        <div className="graphique-bars">
                            {Array.from({ length: 7 }).map((_, index) => (
                                <div key={index} className="bar-container">
                                    <div
                                        className="bar"
                                        style={{
                                            height: `${20 + Math.random() * 80}%`,
                                        }}
                                    ></div>
                                    <div className="bar-label">
                                        {
                                            [
                                                'Lun',
                                                'Mar',
                                                'Mer',
                                                'Jeu',
                                                'Ven',
                                                'Sam',
                                                'Dim',
                                            ][index]
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="graphique-section">
                    <div className="section-header">
                        <h3>
                            <FontAwesomeIcon icon={faChartPie} />
                            Répartition des ventes
                        </h3>
                    </div>
                    <div className="pie-chart-placeholder">
                        <div className="pie-chart">
                            <div
                                className="pie-segment"
                                style={{
                                    '--percentage': '40%',
                                    '--color': '#667eea',
                                }}
                            ></div>
                            <div
                                className="pie-segment"
                                style={{
                                    '--percentage': '25%',
                                    '--color': '#f093fb',
                                }}
                            ></div>
                            <div
                                className="pie-segment"
                                style={{
                                    '--percentage': '20%',
                                    '--color': '#4facfe',
                                }}
                            ></div>
                            <div
                                className="pie-segment"
                                style={{
                                    '--percentage': '15%',
                                    '--color': '#43e97b',
                                }}
                            ></div>
                        </div>
                        <div className="pie-legend">
                            <div className="legend-item">
                                <div
                                    className="legend-color"
                                    style={{ background: '#667eea' }}
                                ></div>
                                <span>Vêtements</span>
                            </div>
                            <div className="legend-item">
                                <div
                                    className="legend-color"
                                    style={{ background: '#f093fb' }}
                                ></div>
                                <span>Accessoires</span>
                            </div>
                            <div className="legend-item">
                                <div
                                    className="legend-color"
                                    style={{ background: '#4facfe' }}
                                ></div>
                                <span>Chaussures</span>
                            </div>
                            <div className="legend-item">
                                <div
                                    className="legend-color"
                                    style={{ background: '#43e97b' }}
                                ></div>
                                <span>Autres</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatistiquesVente;