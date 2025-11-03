import React, { useState, useEffect } from 'react';
import { PAYS_PRIORITAIRES, TOUS_LES_PAYS } from '../../constants/pays';
import {
    validerNumeroPourPays,
    formaterE164,
    nettoyerNumeroTelephone,
} from '../../utils/formatTelephone';
import './ChampTelephone.scss';

const ChampTelephone = ({
    value = '',
    onChange,
    onValidation,
    required = false,
    disabled = false,
    className = '',
}) => {
    const [indicatif, setIndicatif] = useState('+221');
    const [numero, setNumero] = useState('');
    const [paysSelectionne, setPaysSelectionne] = useState(
        PAYS_PRIORITAIRES[0]
    );
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        if (value) {
            const pays = TOUS_LES_PAYS.find(p => value.startsWith(p.indicatif));
            if (pays) {
                setIndicatif(pays.indicatif);
                setPaysSelectionne(pays);
                const numeroSansIndicatif = value.replace(pays.indicatif, '');
                setNumero(numeroSansIndicatif);
            }
        }
    }, [value]);

    const gererChangementPays = event => {
        const nouvelIndicatif = event.target.value;
        const nouveauPays = TOUS_LES_PAYS.find(
            p => p.indicatif === nouvelIndicatif
        );

        setIndicatif(nouvelIndicatif);
        setPaysSelectionne(nouveauPays);
        setErreur('');

        if (numero) {
            validerEtEmettre(nouvelIndicatif, numero);
        }
    };

    const gererChangementNumero = event => {
        const nouveauNumero = event.target.value;
        setNumero(nouveauNumero);

        if (nouveauNumero) {
            validerEtEmettre(indicatif, nouveauNumero);
        } else {
            setErreur('');
            onChange?.('');
            onValidation?.(false);
        }
    };

    const validerEtEmettre = (indicatifValue, numeroValue) => {
        const estValide = validerNumeroPourPays(indicatifValue, numeroValue);

        if (estValide) {
            setErreur('');
            const numeroE164 = formaterE164(indicatifValue, numeroValue);
            onChange?.(numeroE164);
            onValidation?.(true);
        } else {
            setErreur(`Format invalide pour ${paysSelectionne.nom}`);
            onChange?.('');
            onValidation?.(false);
        }
    };

    return (
        <div className={`champ-telephone ${className}`}>
            <label className="champ-telephone__label">
                Numéro de téléphone {required && '*'}
            </label>

            <div className="champ-telephone__groupe">
                <div className="champ-telephone__indicatif">
                    <select
                        value={indicatif}
                        onChange={gererChangementPays}
                        disabled={disabled}
                        className="champ-telephone__select"
                    >
                        <option value="">Sélectionner</option>
                        {PAYS_PRIORITAIRES.map(pays => (
                            <option key={pays.code} value={pays.indicatif}>
                                {pays.drapeau} {pays.nom} ({pays.indicatif})
                            </option>
                        ))}
                        <option disabled>---</option>
                        {TOUS_LES_PAYS.filter(
                            p => !PAYS_PRIORITAIRES.includes(p)
                        ).map(pays => (
                            <option key={pays.code} value={pays.indicatif}>
                                {pays.drapeau} {pays.nom} ({pays.indicatif})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="champ-telephone__numero">
                    <input
                        type="tel"
                        value={numero}
                        onChange={gererChangementNumero}
                        placeholder={`Ex: ${paysSelectionne.code === 'SN' ? '77 123 45 67' : '06 12 34 56 78'}`}
                        disabled={disabled || !indicatif}
                        className="champ-telephone__input"
                    />
                </div>
            </div>

            {erreur && <div className="champ-telephone__erreur">{erreur}</div>}

            {indicatif && numero && !erreur && (
                <div className="champ-telephone__validation">
                    ✓ Format valide pour {paysSelectionne.nom}
                </div>
            )}
        </div>
    );
};

export default ChampTelephone;
