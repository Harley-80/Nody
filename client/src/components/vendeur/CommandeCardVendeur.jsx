import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShoppingCart,
    faUser,
    faCalendarAlt,
    faEuroSign,
    faBox,
    faTruck,
    faCheckCircle,
    faClock,
    faTimesCircle,
    faEye,
    faMessage,
    faPrint,
    faMapMarkerAlt,
    faPhone,
    faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
//import './CommandeCardVendeur.scss';

const CommandeCardVendeur = ({
    commande,
    onView,
    onContact,
    onUpdateStatus,
}) => {
    const formatCurrency = amount => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = date => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTimeAgo = date => {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays < 7) return `Il y a ${diffDays} j`;
        return formatDate(date);
    };

    const getStatutClass = statut => {
        switch (statut) {
            case 'en_attente':
                return 'warning';
            case 'confirme':
                return 'info';
            case 'en_cours':
                return 'primary';
            case 'expedie':
                return 'success';
            case 'livre':
                return 'success';
            case 'annule':
                return 'danger';
            case 'retourne':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const getStatutIcon = statut => {
        switch (statut) {
            case 'en_attente':
                return faClock;
            case 'confirme':
                return faCheckCircle;
            case 'en_cours':
                return faTruck;
            case 'expedie':
                return faTruck;
            case 'livre':
                return faBox;
            case 'annule':
                return faTimesCircle;
            case 'retourne':
                return faTimesCircle;
            default:
                return faShoppingCart;
        }
    };

    const calculateProcessingTime = (createdAt, updatedAt) => {
        const start = new Date(createdAt);
        const end = updatedAt ? new Date(updatedAt) : new Date();
        const diffHours = Math.floor((end - start) / 3600000);
        return diffHours;
    };

    return (
        <div className="commande-card-vendeur">
            {/* En-tête */}
            <div className="commande-header">
                <div className="header-left">
                    <div className="commande-id">
                        #
                        {commande.numeroCommande?.slice(-8) ||
                            commande._id.slice(-8)}
                    </div>
                    <div
                        className={`statut-badge ${getStatutClass(commande.statut)}`}
                    >
                        <FontAwesomeIcon
                            icon={getStatutIcon(commande.statut)}
                        />
                        <span>
                            {commande.statut === 'en_attente'
                                ? 'En attente'
                                : commande.statut === 'confirme'
                                  ? 'Confirmée'
                                  : commande.statut === 'en_cours'
                                    ? 'En cours'
                                    : commande.statut === 'expedie'
                                      ? 'Expédiée'
                                      : commande.statut === 'livre'
                                        ? 'Livrée'
                                        : commande.statut === 'annule'
                                          ? 'Annulée'
                                          : 'Retournée'}
                        </span>
                    </div>
                </div>
                <div className="header-right">
                    <span className="commande-date">
                        {formatDate(commande.createdAt)}
                    </span>
                    <span className="commande-temps">
                        {formatTimeAgo(commande.createdAt)}
                    </span>
                </div>
            </div>

            {/* Informations client */}
            <div className="client-section">
                <div className="client-avatar">
                    <FontAwesomeIcon icon={faUser} />
                </div>
                <div className="client-info">
                    <h4 className="client-nom">
                        {commande.utilisateur?.nom ||
                            commande.client?.nom ||
                            'Client'}
                    </h4>
                    <div className="client-contact">
                        {commande.utilisateur?.email && (
                            <div className="contact-item">
                                <FontAwesomeIcon icon={faEnvelope} />
                                <span>{commande.utilisateur.email}</span>
                            </div>
                        )}
                        {commande.adresseLivraison?.telephone && (
                            <div className="contact-item">
                                <FontAwesomeIcon icon={faPhone} />
                                <span>
                                    {commande.adresseLivraison.telephone}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Détails commande */}
            <div className="details-section">
                <div className="detail-item">
                    <FontAwesomeIcon icon={faEuroSign} />
                    <div className="detail-content">
                        <span className="detail-label">Montant total</span>
                        <span className="detail-value">
                            {formatCurrency(commande.montantTotal || 0)}
                        </span>
                    </div>
                </div>

                <div className="detail-item">
                    <FontAwesomeIcon icon={faBox} />
                    <div className="detail-content">
                        <span className="detail-label">Articles</span>
                        <span className="detail-value">
                            {commande.articles?.length || 0} article(s)
                        </span>
                    </div>
                </div>

                <div className="detail-item">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <div className="detail-content">
                        <span className="detail-label">Livraison</span>
                        <span className="detail-value">
                            {commande.methodeLivraison?.nom || 'Standard'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Articles */}
            <div className="articles-section">
                <h5>Articles commandés</h5>
                <div className="articles-list">
                    {commande.articles?.slice(0, 3).map((article, index) => (
                        <div key={index} className="article-item">
                            <span className="article-nom">{article.nom}</span>
                            <span className="article-quantite">
                                × {article.quantite}
                            </span>
                            <span className="article-prix">
                                {formatCurrency(
                                    article.prix * article.quantite
                                )}
                            </span>
                        </div>
                    ))}
                    {commande.articles && commande.articles.length > 3 && (
                        <div className="more-articles">
                            +{commande.articles.length - 3} autre(s) article(s)
                        </div>
                    )}
                </div>
            </div>

            {/* Temps de traitement */}
            <div className="processing-section">
                <div className="processing-time">
                    <FontAwesomeIcon icon={faClock} />
                    <span>
                        {calculateProcessingTime(
                            commande.createdAt,
                            commande.updatedAt
                        )}
                        h de traitement
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="commande-actions">
                <button
                    className="btn-action btn-view"
                    onClick={() => onView(commande._id)}
                >
                    <FontAwesomeIcon icon={faEye} />
                    <span>Voir détails</span>
                </button>
                <button
                    className="btn-action btn-contact"
                    onClick={() =>
                        onContact(commande.utilisateur?._id || commande.client)
                    }
                >
                    <FontAwesomeIcon icon={faMessage} />
                    <span>Contacter</span>
                </button>
                <button
                    className="btn-action btn-print"
                    onClick={() => window.print()}
                >
                    <FontAwesomeIcon icon={faPrint} />
                    <span>Imprimer</span>
                </button>
            </div>
        </div>
    );
};

export default CommandeCardVendeur;