import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import logo from '../../assets/logo/neos-brands-solid.svg';
import './CommandeFacture.scss';
import { useTranslation } from 'react-i18next';
import { formatDateTimeFR } from '../../utils/dateUtils';

// Génère un numéro de facture
const generateInvoiceNumber = id => {
    const year = new Date().getFullYear();
    const serial = String(id).padStart(4, '0');
    return `FA-${year}-${serial}`;
};

export default function CommandeFacture({ commande }) {
    const { t } = useTranslation();
    if (!commande)
        return <div className="text-center py-5">{t('invoice.noData')}</div>;

    const invoiceNumber = generateInvoiceNumber(commande.id);
    const formatDate = formatDateTimeFR;

    const getStatusLabel = status => {
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
                <img
                    src={logo}
                    alt="Logo Nody"
                    height="50"
                    className="facture-logo"
                />
                <div className="facture-info text-end">
                    <h1 className="facture-titre">{t('invoice.title')}</h1>
                    <div className="facture-reference">
                        {t('invoice.invoiceNo', { number: invoiceNumber })}
                    </div>
                    <div className="facture-date">
                        {t('invoice.date')}: {formatDate(commande.date)}
                    </div>
                </div>
            </header>

            {/* Infos client */}
            <section className="client-info mb-4 p-3 bg-light rounded">
                <h2 className="h5 mb-3">{t('invoice.customerInfo')}</h2>
                <div className="row">
                    <div className="col-md-6">
                        <p>
                            <strong>{t('invoice.name')}:</strong>{' '}
                            {commande.client?.nom || t('invoice.notSpecified')}
                        </p>
                        <p>
                            <strong>{t('invoice.email')}:</strong>{' '}
                            {commande.client?.email ||
                                t('invoice.notSpecified')}
                        </p>
                    </div>
                    <div className="col-md-6">
                        <p>
                            <strong>{t('invoice.phone')}:</strong>{' '}
                            {commande.client?.telephone ||
                                t('invoice.notSpecified')}
                        </p>
                        <p>
                            <strong>{t('invoice.address')}:</strong>{' '}
                            {commande.client?.adresse ||
                                t('invoice.notSpecified')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Produits */}
            <section className="produits mb-4">
                <h2 className="h5 mb-3">{t('invoice.orderDetails')}</h2>
                <div className="table-responsive">
                    <table className="table table-bordered small">
                        <thead className="table-light">
                            <tr>
                                <th className="w-50">{t('invoice.product')}</th>
                                <th className="text-center">
                                    {t('invoice.quantity')}
                                </th>
                                <th className="text-end">
                                    {t('invoice.unitPrice')}
                                </th>
                                <th className="text-end">
                                    {t('invoice.total')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {commande.produits?.map((p, idx) => (
                                <tr key={`prod-${idx}`}>
                                    <td>{p.nom}</td>
                                    <td className="text-center">
                                        {p.quantite}
                                    </td>
                                    <td className="text-end">
                                        {p.prix?.toLocaleString('fr-FR')} XOF
                                    </td>
                                    <td className="text-end fw-bold">
                                        {(p.prix * p.quantite)?.toLocaleString(
                                            'fr-FR'
                                        )}{' '}
                                        XOF
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3" className="text-end fw-bold">
                                    {t('invoice.grandTotal')}
                                </td>
                                <td className="text-end fw-bold text-primary">
                                    {commande.total?.toLocaleString('fr-FR')}{' '}
                                    XOF
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>

            {/* Statut + QR */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <div className="status-badge">
                    <span
                        className={`badge ${getStatusClass(commande.statut)}`}
                    >
                        {getStatusLabel(commande.statut)}
                    </span>
                </div>
                <div className="qr-section d-flex align-items-center gap-3">
                    <div className="text-end">
                        <div className="text-muted small">
                            {t('invoice.scanToTrack')}
                        </div>
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
                        <br />
                        {t('invoice.phone')}: +33 785935163 –{' '}
                        {t('invoice.email')}: contact@nody.com
                        <br />
                        {t('invoice.terms')} <strong>www.nody.com/cgv</strong>
                    </p>
                    <p className="mt-2">
                        {t('invoice.generatedOn', {
                            date: formatDateTimeFR(new Date().toISOString()),
                        })}{' '}
                        – {t('invoice.reproductionForbidden')}
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
