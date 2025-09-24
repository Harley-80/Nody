import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exporterCommandesXLSX(commandes) {
    // We assume 'en_attente' as the default status if it's missing in the data.
    const data = commandes.map(c => ({
        Nom: c.client.nom,
        Email: c.client.email,
        Adresse: c.client.adresse,
        Date: c.date,
        // Ensure Statut is included in the export data with 'en_attente' as fallback
        Statut: c.statut || 'en_attente', 
        Total: `${c.total} XOF`,
        Produits: c.produits.map(p => `${p.quantite} x ${p.nom}`).join(' | ')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commandes");

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });

    saveAs(blob, `commandes_nody_${new Date().toISOString().split('T')[0]}.xlsx`);
}