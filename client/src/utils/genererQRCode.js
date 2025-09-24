import { QRCodeCanvas } from 'qrcode.react';

export function genererIdCommande() {
    return 'NODY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function GenererQRCode({ id }) {
    const url = `https://nody.example.com/facture/${id}`;
    return <QRCodeCanvas value={url} size={80} />;
}
