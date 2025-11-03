export const PAYS_PRIORITAIRES = [
    {
        code: 'SN',
        nom: 'Sénégal',
        indicatif: '+221',
        drapeau: '🇸🇳',
        regex: /^(77|76|70|78)\d{7}$/,
    },
    {
        code: 'CI',
        nom: "Côte d'Ivoire",
        indicatif: '+225',
        drapeau: '🇨🇮',
        regex: /^(07|05)\d{8}$/,
    },
    {
        code: 'GA',
        nom: 'Gabon',
        indicatif: '+241',
        drapeau: '🇬🇦',
        regex: /^(0[67])\d{7}$/,
    },
    {
        code: 'CM',
        nom: 'Cameroun',
        indicatif: '+237',
        drapeau: '🇨🇲',
        regex: /^(6[567]|2[23])\d{7,8}$/,
    },
    {
        code: 'FR',
        nom: 'France',
        indicatif: '+33',
        drapeau: '🇫🇷',
        regex: /^[1-9]\d{8}$/,
    },
    {
        code: 'US',
        nom: 'États-Unis',
        indicatif: '+1',
        drapeau: '🇺🇸',
        regex: /^\d{10}$/,
    },
];

export const TOUS_LES_PAYS = [
    ...PAYS_PRIORITAIRES,
    {
        code: 'BE',
        nom: 'Belgique',
        indicatif: '+32',
        drapeau: '🇧🇪',
        regex: /^[1-9]\d{7,8}$/,
    },
    {
        code: 'CA',
        nom: 'Canada',
        indicatif: '+1',
        drapeau: '🇨🇦',
        regex: /^\d{10}$/,
    },
];