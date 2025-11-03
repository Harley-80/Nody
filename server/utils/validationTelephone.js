// Importation des constantes des pays
import { PAYS_PRIORITAIRES, TOUS_LES_PAYS } from '../constants/pays.js';

/**
 * Nettoie un numéro de téléphone en retirant les espaces, tirets, etc.
 * @param {string} numero - Numéro de téléphone à nettoyer
 * @returns {string} Numéro nettoyé
 */
export const nettoyerNumeroTelephone = numero => {
    if (!numero) return '';
    return numero.replace(/[\s\-\(\)\.]/g, '');
};

/**
 * Formate un numéro au format E.164
 * @param {string} indicatif - Indicatif du pays (ex: +221)
 * @param {string} numero - Numéro de téléphone
 * @returns {string} Numéro formaté E.164
 */
export const formaterE164 = (indicatif, numero) => {
    const numeroNettoye = nettoyerNumeroTelephone(numero);
    return `${indicatif}${numeroNettoye}`;
};

/**
 * Valide un numéro de téléphone pour un pays spécifique
 * @param {string} indicatif - Indicatif du pays
 * @param {string} numero - Numéro de téléphone
 * @returns {boolean} True si le numéro est valide
 */
export const validerNumeroPourPays = (indicatif, numero) => {
    const pays = TOUS_LES_PAYS.find(p => p.indicatif === indicatif);
    if (!pays) return false;

    const numeroNettoye = nettoyerNumeroTelephone(numero);
    const numeroSansIndicatif = numeroNettoye.replace(indicatif, '');

    return pays.regex.test(numeroSansIndicatif);
};

/**
 * Valide un numéro de téléphone complet (format E.164)
 * @param {string} telephone - Numéro de téléphone au format E.164
 * @returns {Object} Résultat de la validation
 */
export const validerTelephone = telephone => {
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

/**
 * Nettoie un numéro de téléphone (alias pour compatibilité)
 * @param {string} telephone - Numéro de téléphone à nettoyer
 * @returns {string} Numéro nettoyé
 */
export const nettoyerTelephone = telephone => {
    return nettoyerNumeroTelephone(telephone);
};

// Export par défaut pour compatibilité
export default {
    validerTelephone,
    nettoyerTelephone,
    nettoyerNumeroTelephone,
    formaterE164,
    validerNumeroPourPays,
};
