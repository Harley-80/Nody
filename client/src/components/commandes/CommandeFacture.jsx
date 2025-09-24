import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import logo from '../../assets/logo/neos-brands-solid.svg';
import './CommandeFacture.scss';
import { formatDateTimeFR } from '../../utils/dateUtils';

// Génère un numéro de facture
const generateInvoiceNumber = (id) => {
    const year = new Date().getFullYear();
    const serial = String(id).padStart(4, '0');
    return `FA-${year}-${serial}`;
};

export default function CommandeFacture({ commande }) {
    if (!commande) return <div className="text-center py-5">Aucune donnée de commande disponible</div>;

    const invoiceNumber = generateInvoiceNumber(commande.id);
    const formatDate = formatDateTimeFR;

    const getStatusLabel = (status) => {
        const statusMap = {
            en_attente: 'En attente',
            paye: 'Payé',
            expedie: 'Expédié',
            livre: 'Livré',
            annule: 'Annulé',
        };
        return statusMap[status] || status;
    };

    return (
        <div className="facture">
            {/* En-tête */}
            <header className="facture-header d-flex justify-content-between align-items-center mb-4">
                <img src={logo} alt="Logo Nody" height="50" className="facture-logo" />
                <div className="facture-info text-end">
                <h1 className="facture-titre">Facture</h1>
                <div className="facture-reference">N° {invoiceNumber}</div>
                <div className="facture-date">Date : {formatDate(commande.date)}</div>
                </div>
            </header>

            {/* Infos client */}
            <section className="client-info mb-4 p-3 bg-light rounded">
                <h2 className="h5 mb-3">Informations client</h2>
                <div className="row">
                    <div className="col-md-6">
                        <p><strong>Nom :</strong> {commande.client?.nom || 'Non spécifié'}</p>
                        <p><strong>Email :</strong> {commande.client?.email || 'Non spécifié'}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>Téléphone :</strong> {commande.client?.telephone || 'Non spécifié'}</p>
                        <p><strong>Adresse :</strong> {commande.client?.adresse || 'Non spécifié'}</p>
                    </div>
                </div>
            </section>

            {/* Produits */}
            <section className="produits mb-4">
                <h2 className="h5 mb-3">Détails de la commande</h2>
                <div className="table-responsive">
                    <table className="table table-bordered small">
                        <thead className="table-light">
                            <tr>
                                <th className="w-50">Produit</th>
                                <th className="text-center">Qté</th>
                                <th className="text-end">Prix unitaire</th>
                                <th className="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commande.produits?.map((p, idx) => (
                                <tr key={`prod-${idx}`}>
                                    <td>{p.nom}</td>
                                    <td className="text-center">{p.quantite}</td>
                                    <td className="text-end">{p.prix?.toLocaleString('fr-FR')} XOF</td>
                                    <td className="text-end fw-bold">{(p.prix * p.quantite)?.toLocaleString('fr-FR')} XOF</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3" className="text-end fw-bold">Total général</td>
                                <td className="text-end fw-bold text-primary">{commande.total?.toLocaleString('fr-FR')} XOF</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>

            {/* Statut + QR */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <div className="status-badge">
                    <span className={`badge ${getStatusClass(commande.statut)}`}>
                        {getStatusLabel(commande.statut)}
                    </span>
                </div>
                <div className="qr-section d-flex align-items-center gap-3">
                    <div className="text-end">
                        <div className="text-muted small">Scannez pour suivre votre commande</div>
                    </div>
                    <QRCodeSVG
                        value={`https://votre-site.com/suivi-commande/${commande.id}`}
                        size={80}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#000000"
                        aria-label={`QR Code pour le suivi de la commande ${commande.id}`}
                    />
                </div>
            </div>

            {/* Signature + mentions légales */}
            <footer className="mt-5 pt-4 border-top text-center">
                <div className="small text-muted">
                    <p>
                        Nody – Rue-189 GY, Dakar  
                        <br />Tél : +33 785935163 – Email : contact@nody.com   
                        <br />Conditions générales de vente sur <strong>www.nody.com/cgv</strong>
                    </p>
                    <p className="mt-2">
                        Facture émise le {formatDateTimeFR(new Date().toISOString())} – Toute reproduction interdite
                    </p>
                </div>
            </footer>
        </div>
    );
}

function getStatusClass(status) {
    const classes = {
        en_attente: 'bg-warning text-dark',
        paye: 'bg-info text-white',
        expedie: 'bg-primary text-white',
        livre: 'bg-success text-white',
        annule: 'bg-danger text-white',
    };
    return classes[status] || 'bg-secondary text-white';
}