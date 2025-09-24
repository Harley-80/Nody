import React from 'react';
import { STATUTS, getBadgeColor } from '../../../constants/statuts';
import './CommandeCard.scss';
import { formatDateTimeFR } from '../../../utils/dateUtils';

export default function CommandeCard({ commande, onChangeStatut }) {
    if (!commande) return <div className="alert alert-warning">Aucune donnée de commande</div>;

    const normalizeStatut = (statut) => {
        if (!statut) return 'en_attente';
        
        return statut.toString().toLowerCase()
            .replace(/é|è|ê|ë/g, 'e')
            .replace(/à|â|ä/g, 'a')
            .replace(/î|ï/g, 'i')
            .replace(/ô|ö/g, 'o')
            .replace(/û|ù|ü/g, 'u')
            .replace(/ç/g, 'c')
            .replace(/\s+/g, '_')
            .replace(/expedits/g, 'expediee')
            .replace(/trente/g, 'livree')
            .replace(/randonnees/g, 'remboursee')
            .trim();
    };

    const normalizedStatut = normalizeStatut(commande.statut);
    const isValidStatut = Object.keys(STATUTS).includes(normalizedStatut);
    const displayStatut = isValidStatut ? STATUTS[normalizedStatut] : `Inconnu (${commande.statut})`;

    const badgeClass = getBadgeColor(normalizedStatut);
    const formattedDate = formatDateTimeFR(commande.date);
    const clientName = commande.client?.nom || 'Client inconnu';

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        if (onChangeStatut) {
            onChangeStatut(commande.id, newStatus);
            commande.statut = newStatus;
        }
    };

    return (
        <div className="commande-card">
            <div className="card-header">
                <h3 className="card-title">
                    Commande de <span className="client-name">{clientName}</span>
                </h3>
                <span className={`badge ${badgeClass} status-badge`}>
                    {displayStatut}
                </span>
            </div>

            <div className="card-content">
                <div className="client-info">
                    <p>
                        <span className="info-label">Email :</span> 
                        <span className="info-value">{commande.client?.email || 'Non renseigné'}</span>
                    </p>
                    <p>
                        <span className="info-label">Adresse :</span> 
                        <span className="info-value">{commande.client?.adresse || 'Non renseignée'}</span>
                    </p>
                    <p>
                        <span className="info-label">Date :</span> 
                        <span className="info-value">{formattedDate}</span>
                    </p>
                </div>

                <div className="produits-list">
                    <h4>Articles</h4>
                    <ul className="produits">
                        {commande.produits?.map((p, idx) => (
                            <li key={`prod-${idx}`} className="produit-item">
                                {p.image && (
                                    <img 
                                        src={p.image} 
                                        alt={p.nom} 
                                        className="produit-image"
                                        loading="lazy"
                                    />
                                )}
                                <div className="produit-details">
                                    <h5 className="produit-nom">{p.nom}</h5>
                                    <p className="produit-quantite-prix">
                                        {p.quantite} × {p.prix?.toLocaleString('fr-FR')} XOF
                                    </p>
                                    {p.options && Object.keys(p.options).length > 0 && (
                                        <div className="produit-options">
                                            {Object.entries(p.options).map(([key, value]) => (
                                                <span key={key} className="option">
                                                    {key}: <strong>{value}</strong>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card-footer">
                    <div className="total">
                        Total: <span>{commande.total?.toLocaleString('fr-FR')} XOF</span>
                    </div>

                    {onChangeStatut && (
                        <div className="statut-selector">
                            <label htmlFor={`statut-select-${commande.id}`} className="select-label">
                                Modifier le statut:
                            </label>
                            <select
                                id={`statut-select-${commande.id}`}
                                value={isValidStatut ? normalizedStatut : 'en_attente'}
                                onChange={handleStatusChange}
                                className="form-select"
                                aria-label="Modifier le statut de la commande"
                            >
                                {Object.entries(STATUTS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}