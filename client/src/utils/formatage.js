/**
 * Formater un montant en XOF
 */
export const formaterMontant = (montant, devise = 'XOF') => {
    if (!montant && montant !== 0) return '0 XOF';

    const montantFormate = new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(montant);

    return `${montantFormate} ${devise}`;
};

/**
 * Formater un nombre
 */
export const formaterNombre = nombre => {
    if (!nombre && nombre !== 0) return '0';

    return new Intl.NumberFormat('fr-FR').format(nombre);
};

/**
 * Formater une date
 */
export const formaterDate = (date, format = 'court') => {
    if (!date) return 'N/A';

    const dateObj = new Date(date);

    if (format === 'court') {
        return dateObj.toLocaleDateString('fr-FR');
    }

    if (format === 'complet') {
        return dateObj.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    if (format === 'heure') {
        return dateObj.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return dateObj.toLocaleDateString('fr-FR');
};

/**
 * Formater un pourcentage
 */
export const formaterPourcentage = (valeur, decimales = 2) => {
    if (!valeur && valeur !== 0) return '0%';
    return `${parseFloat(valeur).toFixed(decimales)}%`;
};

/**
 * Obtenir la classe CSS selon le statut de commande
 */
export const obtenirClasseStatut = statut => {
    const classes = {
        en_attente: 'warning',
        confirme: 'info',
        en_cours: 'primary',
        expédie: 'info',
        livré: 'success',
        annulé: 'danger',
        retourne: 'secondary',
        rembourse: 'dark',
    };

    return classes[statut] || 'secondary';
};

/**
 * Obtenir le texte du statut de commande
 */
export const obtenirTexteStatut = statut => {
    const textes = {
        en_attente: 'En attente',
        confirme: 'Confirmée',
        en_cours: 'En cours',
        expédie: 'Expédiée',
        livré: 'Livrée',
        annulé: 'Annulée',
        retourne: 'Retournée',
        rembourse: 'Remboursée',
    };

    return textes[statut] || statut;
};

/**
 * Tronquer un texte
 */
export const tronquerTexte = (texte, longueur = 50) => {
    if (!texte) return '';
    if (texte.length <= longueur) return texte;
    return `${texte.substring(0, longueur)}...`;
};
