import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Exporte la liste des commandes au format XLSX
 * @param {Array} commandes - Liste des commandes à exporter
 */
export function exporterCommandesXLSX(commandes) {
    const data = commandes.map(c => ({
        Nom: c.client.nom,
        Email: c.client.email,
        Adresse: c.client.adresse,
        Date: c.date,
        // Ensure Statut is included in the export data with 'en_attente' as fallback
        Statut: c.statut || 'en_attente',
        Total: `${c.total} XOF`,
        Produits: c.produits.map(p => `${p.quantite} x ${p.nom}`).join(' | '),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commandes');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });

    saveAs(
        blob,
        `commandes_nody_${new Date().toISOString().split('T')[0]}.xlsx`
    );
}

/**
 * Exporte la liste des clients au format XLSX
 * @param {Array} clients - Liste des clients à exporter
 */
export function exporterClients(clients) {
    // Préparer les données pour l'export
    const data = clients.map(client => ({
        Prénom: client.prenom || '',
        Nom: client.nom || '',
        Email: client.email || '',
        Téléphone: client.telephone || 'Non renseigné',
        "Date d'inscription": new Date(
            client.dateInscription
        ).toLocaleDateString('fr-FR'),
        Statut: client.bloque ? 'Bloqué' : 'Actif',
        Adresse: client.adresse || 'Non renseignée',
        Ville: client.ville || '',
        Pays: client.pays || '',
    }));

    // Créer la feuille Excel
    const ws = XLSX.utils.json_to_sheet(data);

    // Définir la largeur des colonnes
    ws['!cols'] = [
        { wch: 15 }, // Prénom
        { wch: 15 }, // Nom
        { wch: 30 }, // Email
        { wch: 15 }, // Téléphone
        { wch: 18 }, // Date d'inscription
        { wch: 10 }, // Statut
        { wch: 30 }, // Adresse
        { wch: 15 }, // Ville
        { wch: 15 }, // Pays
    ];

    // Créer le classeur
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');

    // Générer le buffer et créer le blob
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Télécharger le fichier avec la date du jour
    const dateExport = new Date().toISOString().split('T')[0];
    saveAs(blob, `clients_nody_${dateExport}.xlsx`);
}

/**
 * Exporte les données au format CSV
 * @param {Array} data - Données à exporter
 * @param {string} filename - Nom du fichier de sortie
 */
export function exporterCSV(data, filename) {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
}
