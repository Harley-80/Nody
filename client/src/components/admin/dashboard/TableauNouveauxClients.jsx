import React from 'react';
import { formaterDate } from '../../../utils/formatage';
import './TableauDashboard.scss';

const TableauNouveauxClients = ({ clients }) => {
    if (!clients || clients.length === 0) {
        return (
            <div className="tableau-vide">
                <i className="fas fa-users"></i>
                <p>Aucun nouveau client</p>
            </div>
        );
    }

    return (
        <div className="tableau-dashboard">
            <div className="tableau-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Inscription</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => {
                            // Construire le nom complet depuis nom + prenom
                            const nomComplet = client.prenom
                                ? `${client.prenom} ${client.nom}`
                                : client.nom || client.nomComplet || 'N/A';

                            return (
                                <tr key={client._id || client.email}>
                                    <td>
                                        <div className="client-info">
                                            <div className="client-avatar">
                                                <i className="fas fa-user"></i>
                                            </div>
                                            <div className="client-nom">
                                                {nomComplet}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-muted">
                                        {client.email}
                                    </td>
                                    <td className="text-muted">
                                        {client.telephone || 'N/A'}
                                    </td>
                                    <td>
                                        <span className="badge bg-light text-dark">
                                            {formaterDate(
                                                client.dateInscription ||
                                                    client.createdAt ||
                                                    client.date
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableauNouveauxClients;
