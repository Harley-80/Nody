import { PAYS_PRIORITAIRES, TOUS_LES_PAYS } from '../constants/pays';

export const nettoyerNumeroTelephone = numero => {
    if (!numero) return '';
    return numero.replace(/[\s\-\(\)\.]/g, '');
};

export const formaterE164 = (indicatif, numero) => {
    const numeroNettoye = nettoyerNumeroTelephone(numero);
    return `${indicatif}${numeroNettoye}`;
};

export const validerNumeroPourPays = (indicatif, numero) => {
    const pays = TOUS_LES_PAYS.find(p => p.indicatif === indicatif);
    if (!pays) return false;

    const numeroNettoye = nettoyerNumeroTelephone(numero);
    const numeroSansIndicatif = numeroNettoye.replace(indicatif, '');

    return pays.regex.test(numeroSansIndicatif);
};

export const formaterAffichageTelephone = numeroE164 => {
    if (!numeroE164) return '';

    const pays = TOUS_LES_PAYS.find(p => numeroE164.startsWith(p.indicatif));
    if (!pays) return numeroE164;

    const numeroSansIndicatif = numeroE164.replace(pays.indicatif, '');

    if (pays.code === 'FR') {
        return numeroSansIndicatif.replace(
            /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
            '$1 $2 $3 $4 $5'
        );
    } else if (pays.code === 'US' || pays.code === 'CA') {
        return numeroSansIndicatif.replace(
            /(\d{3})(\d{3})(\d{4})/,
            '($1) $2-$3'
        );
    } else if (pays.code === 'SN') {
        return numeroSansIndicatif.replace(
            /(\d{2})(\d{3})(\d{2})(\d{2})/,
            '$1 $2 $3 $4'
        );
    }

    return numeroSansIndicatif;
};
