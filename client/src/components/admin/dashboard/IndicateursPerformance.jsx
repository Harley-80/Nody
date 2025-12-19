import React from 'react';
import { formaterMontant, formaterPourcentage } from '../../../utils/formatage';
import './IndicateursPerformance.scss';

const IndicateursPerformance = ({ performance }) => {
    if (!performance) {
        return null;
    }

    const indicateurs = [
        {
            label: 'Panier Moyen',
            valeur: formaterMontant(performance.panierMoyen),
            icone: 'fas fa-shopping-basket',
            couleur: 'primary',
        },
        {
            label: 'Taux de Conversion',
            valeur: formaterPourcentage(performance.tauxConversion),
            icone: 'fas fa-chart-line',
            couleur: 'success',
        },
    ];

    return (
        <div className="indicateurs-performance">
            {indicateurs.map((indicateur, index) => (
                <div
                    key={index}
                    className={`indicateur indicateur-${indicateur.couleur}`}
                >
                    <div className="indicateur-icone">
                        <i className={indicateur.icone}></i>
                    </div>
                    <div className="indicateur-info">
                        <div className="indicateur-label">
                            {indicateur.label}
                        </div>
                        <div className="indicateur-valeur">
                            {indicateur.valeur}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default IndicateursPerformance;
