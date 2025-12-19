import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import './GraphiqueVentes.scss';

// Composant pour afficher le graphique des ventes dans le dashboard admin
const GraphiqueVentes = ({ donnees }) => {
    if (!donnees || donnees.length === 0) {
        return (
            <div className="graphique-vide">
                <i className="fas fa-chart-line"></i>
                <p>Aucune donnée disponible</p>
            </div>
        );
    }

    return (
        <div className="graphique-ventes">
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={donnees}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: '0.875rem' }}
                    />
                    <YAxis stroke="#6b7280" style={{ fontSize: '0.875rem' }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        labelStyle={{ fontWeight: 600, color: '#1f2937' }}
                    />
                    <Legend
                        wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '0.875rem',
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="commandes"
                        stroke="#667eea"
                        strokeWidth={3}
                        dot={{ fill: '#667eea', r: 5 }}
                        activeDot={{ r: 7 }}
                        name="Commandes"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GraphiqueVentes;
