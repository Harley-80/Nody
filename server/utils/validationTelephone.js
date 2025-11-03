const PAYS_PRIORITAIRES = [
    {
        code: 'SN',
        nom: 'Sénégal',
        indicatif: '+221',
        regex: /^(77|76|70|78)\d{7}$/,
    },
    {
        code: 'CI',
        nom: "Côte d'Ivoire",
        indicatif: '+225',
        regex: /^(07|05)\d{8}$/,
    },
    {
        code: 'GA',
        nom: 'Gabon',
        indicatif: '+241',
        regex: /^(0[67])\d{7}$/,
    },
    {
        code: 'CM',
        nom: 'Cameroun',
        indicatif: '+237',
        regex: /^(6[567]|2[23])\d{7,8}$/,
    },
    {
        code: 'FR',
        nom: 'France',
        indicatif: '+33',
        regex: /^[1-9]\d{8}$/,
    },
    {
        code: 'US',
        nom: 'États-Unis',
        indicatif: '+1',
        regex: /^\d{10}$/,
    },
];

const validerTelephone = telephone => {
    if (!telephone) {
        return { valide: false, erreur: 'Le numéro de téléphone est requis' };
    }

    // Vérifier le format E.164 de base
    if (!/^\+\d{1,15}$/.test(telephone)) {
        return { valide: false, erreur: 'Format E.164 invalide' };
    }

    // Trouver le pays par l'indicatif
    const pays = PAYS_PRIORITAIRES.find(p => telephone.startsWith(p.indicatif));
    if (!pays) {
        return { valide: false, erreur: 'Indicatif pays non supporté' };
    }

    // Extraire le numéro sans indicatif
    const numeroSansIndicatif = telephone.replace(pays.indicatif, '');

    // Valider avec la regex du pays
    if (!pays.regex.test(numeroSansIndicatif)) {
        return {
            valide: false,
            erreur: `Format invalide pour ${pays.nom}. Exemple: ${pays.code === 'SN' ? '771234567' : '0612345678'}`,
        };
    }

    return { valide: true, pays: pays.nom };
};

const nettoyerTelephone = telephone => {
    if (!telephone) return '';
    return telephone.replace(/[\s\-\(\)\.]/g, '');
};

module.exports = {
    validerTelephone,
    nettoyerTelephone,
    PAYS_PRIORITAIRES,
};
