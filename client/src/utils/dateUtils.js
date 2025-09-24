/**
 * Retourne une date/heure au format français complet :
 */
export function formatDateTimeFR(dateStr) {
    if (!dateStr) return 'Date inconnue';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Date invalide';

    const jour = d.toLocaleDateString('fr-FR');
    const heures = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${jour} à ${heures}h${minutes}`;
}