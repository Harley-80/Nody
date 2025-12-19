import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { formaterMontant } from '../../../utils/formatage';
import './GraphiqueVentes.scss';

const GraphiqueChiffreAffaires = ({ donnees }) => {
    if (!donnees || donnees.length === 0) {
        return (
            <div className="graphique-vide">
                <i className="fas fa-chart-bar"></i>
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
                        {payload[0].payload.mois}
                    </p>
                    <p
                        style={{
                            margin: '5px 0 0 0',
                            color: '#10b981',
                            fontWeight: 600,
                        }}
                    >
                        {formaterMontant(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="graphique-ventes">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={donnees}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="mois"
                        stroke="#6b7280"
                        style={{ fontSize: '0.875rem' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '0.875rem' }}
                        tickFormatter={value => `${Math.round(value / 1000)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '0.875rem',
                        }}
                    />
                    <Bar
                        dataKey="montant"
                        fill="#10b981"
                        radius={[8, 8, 0, 0]}
                        name="Chiffre d'affaires"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GraphiqueChiffreAffaires;
