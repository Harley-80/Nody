import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Générer un rapport PDF des statistiques
 */
export const genererRapportPDF = async (statistiques, periode) => {
    return new Promise((resolve, reject) => {
        try {
            // Créer un nouveau document PDF
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
            });

            // Buffer pour stocker le PDF
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // En-tête
            doc.fontSize(24)
                .fillColor('#667eea')
                .text('NODY - Rapport Statistiques', { align: 'center' });

            doc.moveDown(0.5);

            doc.fontSize(12)
                .fillColor('#6b7280')
                .text(
                    `Période: ${format(new Date(periode.debut), 'dd MMMM yyyy', { locale: fr })} - ${format(new Date(periode.fin), 'dd MMMM yyyy', { locale: fr })}`,
                    { align: 'center' }
                );

            doc.moveDown(1);
            doc.strokeColor('#e5e7eb')
                .lineWidth(2)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();
            doc.moveDown(1);

            // Section 1: Statistiques Globales
            doc.fontSize(16).fillColor('#1f2937').text('Statistiques Globales');
            doc.moveDown(0.5);

            const stats = statistiques.statistiquesGlobales;

            // Tableau des statistiques
            const statsData = [
                [
                    "Chiffre d'Affaires Total",
                    `${formatMontant(stats.chiffreAffaires.total)} XOF`,
                ],
                [
                    'CA du Mois',
                    `${formatMontant(stats.chiffreAffaires.mois)} XOF`,
                ],
                ['Commandes Totales', stats.commandes.total.toString()],
                ['Commandes du Mois', stats.commandes.mois.toString()],
                ['Commandes en Attente', stats.commandes.enAttente.toString()],
                ['Clients Totaux', stats.clients.total.toString()],
                ['Nouveaux Clients (Mois)', stats.clients.mois.toString()],
                ['Produits Actifs', stats.produits.actifs.toString()],
                ['Produits en Rupture', stats.produits.enRupture.toString()],
            ];

            let y = doc.y;
            statsData.forEach((row, index) => {
                if (index % 2 === 0) {
                    doc.rect(50, y - 5, 495, 25).fillAndStroke(
                        '#f8fafc',
                        '#e5e7eb'
                    );
                }

                doc.fillColor('#374151')
                    .fontSize(11)
                    .text(row[0], 60, y, { width: 300, continued: false });

                doc.fillColor('#1f2937')
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text(row[1], 350, y, { width: 180, align: 'right' });

                doc.font('Helvetica');
                y += 25;
            });

            doc.moveDown(2);

            // Section 2: Performance
            doc.fontSize(16)
                .fillColor('#1f2937')
                .text('Indicateurs de Performance');
            doc.moveDown(0.5);

            doc.fontSize(11)
                .fillColor('#374151')
                .text(`Panier Moyen: `, { continued: true })
                .fillColor('#10b981')
                .font('Helvetica-Bold')
                .text(`${formatMontant(stats.performance.panierMoyen)} XOF`);

            doc.font('Helvetica')
                .fillColor('#374151')
                .text(`Taux de Conversion: `, { continued: true })
                .fillColor('#10b981')
                .font('Helvetica-Bold')
                .text(`${stats.performance.tauxConversion}%`);

            doc.moveDown(2);

            // Section 3: Top 5 Produits Populaires
            if (statistiques.tableaux?.produitsPopulaires?.length > 0) {
                doc.fontSize(16)
                    .fillColor('#1f2937')
                    .font('Helvetica')
                    .text('Top 5 Produits Populaires');
                doc.moveDown(0.5);

                statistiques.tableaux.produitsPopulaires
                    .slice(0, 5)
                    .forEach((produit, index) => {
                        y = doc.y;

                        doc.rect(50, y - 5, 495, 30).fillAndStroke(
                            index % 2 === 0 ? '#ffffff' : '#f8fafc',
                            '#e5e7eb'
                        );

                        // Rang
                        doc.circle(65, y + 7, 12).fillAndStroke(
                            '#667eea',
                            '#667eea'
                        );
                        doc.fillColor('#ffffff')
                            .fontSize(10)
                            .font('Helvetica-Bold')
                            .text((index + 1).toString(), 60, y + 2, {
                                width: 10,
                                align: 'center',
                            });

                        // Nom du produit
                        doc.fillColor('#1f2937')
                            .fontSize(11)
                            .font('Helvetica')
                            .text(produit.nom, 85, y + 2, {
                                width: 250,
                                ellipsis: true,
                            });

                        // Ventes
                        doc.fillColor('#667eea')
                            .fontSize(10)
                            .text(`${produit.ventes} ventes`, 350, y + 2);

                        // Prix
                        doc.fillColor('#10b981')
                            .fontSize(10)
                            .text(
                                `${formatMontant(produit.prix)} XOF`,
                                450,
                                y + 2,
                                {
                                    width: 90,
                                    align: 'right',
                                }
                            );

                        doc.moveDown(1.5);
                    });

                doc.moveDown(1);
            }

            // Section 4: Ventes par Catégorie
            if (statistiques.graphiques?.repartitionCategories?.length > 0) {
                doc.addPage();

                doc.fontSize(16)
                    .fillColor('#1f2937')
                    .font('Helvetica')
                    .text('Répartition par Catégorie');
                doc.moveDown(0.5);

                statistiques.graphiques.repartitionCategories.forEach(
                    (cat, index) => {
                        y = doc.y;

                        if (index % 2 === 0) {
                            doc.rect(50, y - 5, 495, 25).fillAndStroke(
                                '#f8fafc',
                                '#e5e7eb'
                            );
                        }

                        doc.fillColor('#374151')
                            .fontSize(11)
                            .text(cat.categorie, 60, y, { width: 200 });

                        doc.fillColor('#667eea').text(
                            `${cat.ventes} ventes`,
                            270,
                            y,
                            { width: 100 }
                        );

                        doc.fillColor('#10b981')
                            .font('Helvetica-Bold')
                            .text(`${formatMontant(cat.montant)} XOF`, 390, y, {
                                width: 150,
                                align: 'right',
                            });

                        doc.font('Helvetica');
                        y += 25;
                    }
                );
            }

            // Pied de page
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);

                doc.fontSize(9)
                    .fillColor('#9ca3af')
                    .text(
                        `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} - Page ${i + 1} sur ${pages.count}`,
                        50,
                        doc.page.height - 50,
                        { align: 'center', width: 495 }
                    );
            }

            // Finaliser le PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Formater un montant
 */
const formatMontant = montant => {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(montant);
};
