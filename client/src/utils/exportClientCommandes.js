import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


export function exporterMesCommandesExcel(commandes) {
    if (!commandes.length) return;

    const rows = commandes.map(cmd => ({
        Client: cmd.client.nom,
        Email: cmd.client.email,
        Adresse: cmd.client.adresse,
        Date: cmd.date,
        Statut: cmd.statut || 'en_attente',
        Total: cmd.total,
        Produits: cmd.produits.map(p => `${p.quantite}x ${p.nom}`).join(', ')
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MesCommandes');

    const blob = new Blob(
        [XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })],
        { type: 'application/octet-stream' }
    );

    saveAs(blob, 'mes_commandes.xlsx');
}
