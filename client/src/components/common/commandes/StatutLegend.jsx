import React from 'react';
import { STATUTS, getBadgeColor } from '../../../constants/statuts';
import './StatutLegend.scss';

export default function StatutLegend({ className = '', showTitle = true, compact = false }) {
    return (
        <div className={`statut-legend ${className}`}>
            {showTitle && <h3 className="legend-title">Légende des statuts</h3>}
            <div className={`legend-items ${compact ? 'compact' : ''}`}>
                {Object.entries(STATUTS).map(([key, label]) => (
                    <div key={key} className="legend-item">
                        <span 
                            className={`status-badge ${getBadgeColor(key)}`}
                            aria-label={`Statut: ${label}`}
                        >
                            {label}
                        </span>
                        {!compact && (
                            <span className="status-description">
                                {getStatusDescription(key)}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function getStatusDescription(statusKey) {
    const descriptions = {
        'en_attente': 'Commande en attente de traitement',
        'en_traitement': 'Commande en cours de traitement',
        'expediee': 'Commande expédiée au client',
        'livree': 'Commande livrée avec succès',
        'annulee': 'Commande annulée',
        'remboursee': 'Commande remboursée'
    };
    return descriptions[statusKey] || '';
}