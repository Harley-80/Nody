import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { formaterMontant } from '../../../utils/formatage';
import './GraphiqueVentes.scss';

const COULEURS = [
    '#667eea',
    '#10b981',
    '#f59e0b',
    '#3b82f6',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#06b6d4',
];

const RepartitionCategories = ({ donnees }) => {
    if (!donnees || donnees.length === 0) {
        return (
            <div className="graphique-vide">
                <i className="fas fa-chart-pie"></i>
                <p>Aucune donnée disponible</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div
                    style={{
                        backgroundColor: 'white',
                        padding: '10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                >
                    <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
                        {payload[0].name}
                    </p>
                    <p
                        style={{
                            margin: '5px 0 0 0',
                            color: payload[0].payload.fill,
                            fontWeight: 600,
                        }}
                    >
                        {formaterMontant(payload[0].value)}
                    </p>
                    <p
                        style={{
                            margin: '5px 0 0 0',
                            color: '#6b7280',
                            fontSize: '0.875rem',
                        }}
                    >
                        {payload[0].payload.ventes} ventes
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="graphique-ventes">
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={donnees}
                        dataKey="montant"
                        nameKey="categorie"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                    >
                        {donnees.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COULEURS[index % COULEURS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{
                            fontSize: '0.875rem',
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RepartitionCategories;
