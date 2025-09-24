export const STATUTS = {
    en_attente: 'En attente',
    en_traitement: 'En traitement',
    expediee: 'Expédiée',
    livree: 'Livrée',
    annulee: 'Annulée',
    remboursee: 'Remboursée',
};

export function getBadgeColor(statut) {
    switch (statut) {
        case 'en_attente':
            return 'bg-secondary';
        case 'en_traitement':
            return 'bg-warning text-dark';
        case 'expediee':
            return 'bg-info';
        case 'livree':
            return 'bg-success';
        case 'annulee':
            return 'bg-danger';
        case 'remboursee':
            return 'bg-dark text-light';
        default:
            return 'bg-light text-light';
    }
}