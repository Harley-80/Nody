import React from 'react';
import {
    formaterMontant,
    formaterDate,
    obtenirClasseStatut,
    obtenirTexteStatut,
} from '../../../utils/formatage';
import './TableauDashboard.scss';

const TableauCommandesRecentes = ({ commandes }) => {
    if (!commandes || commandes.length === 0) {
        return (
            <div className="tableau-vide">
                <i className="fas fa-shopping-cart"></i>
                <p>Aucune commande récente</p>
            </div>
        );
    }

    return (
        <div className="tableau-dashboard">
            <div className="tableau-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>N° Commande</th>
                            <th>Client</th>
                            <th className="text-end">Montant</th>
                            <th>Statut</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commandes.map(commande => (
                            <tr
                                key={
                                    commande._id ||
                                    commande.id ||
                                    commande.numero
                                }
                            >
                                {/* Utiliser _id (MongoDB) avec fallbacks */}
                                <td>
                                    <span className="numero-commande">
                                        {commande.numero ||
                                            commande.numeroCommande ||
                                            'N/A'}
                                    </span>
                                </td>
                                <td>
                                    <div className="client-info">
                                        <div className="client-nom">
                                            {commande.client?.nom ||
                                                commande.client?.nomComplet ||
                                                commande.clientNom ||
                                                'Client inconnu'}
                                        </div>
                                        <div className="client-email">
                                            {commande.client?.email ||
                                                commande.clientEmail ||
                                                'N/A'}
                                        </div>
                                    </div>
                                </td>
                                <td className="text-end fw-bold text-success">
                                    {formaterMontant(
                                        commande.montant ||
                                            commande.montantTotal ||
                                            0
                                    )}
                                </td>
                                <td>
                                    <span
                                        className={`badge bg-${obtenirClasseStatut(commande.statut)}`}
                                    >
                                        {obtenirTexteStatut(commande.statut)}
                                    </span>
                                </td>
                                <td className="text-muted">
                                    {formaterDate(
                                        commande.date ||
                                            commande.createdAt ||
                                            commande.dateCommande
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableauCommandesRecentes;
