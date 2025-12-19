import React from 'react';
import CountUp from 'react-countup';
import './CarteStatistique.scss';

// Composant pour afficher une carte statistique dans le dashboard admin
const CarteStatistique = ({
    titre,
    valeur,
    icone,
    couleur,
    tendance,
    suffixe = '',
    prefix = '',
}) => {
    return (
        <div className={`carte-statistique carte-${couleur}`}>
            <div className="carte-contenu">
                <div className="carte-icone">
                    <i className={icone}></i>
                </div>
                <div className="carte-info">
                    <h3 className="carte-valeur">
                        {prefix}
                        <CountUp
                            end={valeur}
                            duration={2}
                            separator=" "
                            decimals={prefix === '' && suffixe === '' ? 0 : 0}
                        />
                        {suffixe}
                    </h3>
                    <p className="carte-titre">{titre}</p>
                    {tendance && (
                        <span
                            className={`carte-tendance tendance-${tendance.direction}`}
                        >
                            <i
                                className={`fas fa-arrow-${tendance.direction === 'up' ? 'up' : 'down'}`}
                            ></i>
                            {tendance.valeur}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CarteStatistique;
