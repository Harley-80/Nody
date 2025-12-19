import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye,
    faEdit,
    faTrash,
    faChartLine,
    faStar,
    faBox,
    faEuroSign,
    faTags,
    faCheckCircle,
    faClock,
    faTimesCircle,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import './CarteProduitVendeur.scss';

const CarteProduitVendeur = ({ produit, onEdit, onDelete, onView }) => {
    const formatCurrency = amount => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatutClass = statut => {
        switch (statut) {
            case 'actif':
                return 'success';
            case 'en_attente':
                return 'warning';
            case 'rejete':
                return 'danger';
            case 'approuve':
                return 'info';
            default:
                return 'secondary';
        }
    };

    const getStatutIcon = statut => {
        switch (statut) {
            case 'actif':
                return faCheckCircle;
            case 'en_attente':
                return faClock;
            case 'rejete':
                return faTimesCircle;
            case 'approuve':
                return faCheckCircle;
            default:
                return faBox;
        }
    };

    const calculateDiscount = (prix, prixComparaison) => {
        if (!prixComparaison || prixComparaison <= prix) return 0;
        return Math.round(((prixComparaison - prix) / prixComparaison) * 100);
    };

    return (
        <div className="carte-produit-vendeur">
            {/* Badge statut */}
            <div className={`badge-statut ${getStatutClass(produit.statut)}`}>
                <FontAwesomeIcon icon={getStatutIcon(produit.statut)} />
                <span>
                    {produit.statut === 'actif'
                        ? 'Actif'
                        : produit.statut === 'en_attente'
                          ? 'En attente'
                          : produit.statut === 'rejete'
                            ? 'Rejeté'
                            : 'Approuvé'}
                </span>
            </div>

            {/* Image */}
            <div className="carte-image">
                {produit.images && produit.images.length > 0 ? (
                    <img
                        src={produit.images[0].url || produit.images[0]}
                        alt={produit.nom}
                        className="image-produit"
                    />
                ) : (
                    <div className="image-placeholder">
                        <FontAwesomeIcon icon={faBox} />
                    </div>
                )}

                {/* Badge discount */}
                {produit.prixComparaison &&
                    produit.prixComparaison > produit.prix && (
                        <div className="badge-discount">
                            -
                            {calculateDiscount(
                                produit.prix,
                                produit.prixComparaison
                            )}
                            %
                        </div>
                    )}
            </div>

            {/* Contenu */}
            <div className="carte-contenu">
                <h3 className="titre-produit">{produit.nom}</h3>

                <p className="description-produit">
                    {produit.description?.substring(0, 100)}...
                </p>

                {/* Prix */}
                <div className="section-prix">
                    <span className="prix-actuel">
                        {formatCurrency(produit.prix)}
                    </span>
                    {produit.prixComparaison &&
                        produit.prixComparaison > produit.prix && (
                            <span className="prix-original">
                                {formatCurrency(produit.prixComparaison)}
                            </span>
                        )}
                </div>

                {/* Statistiques */}
                <div className="stats-produit">
                    <div className="stat-item">
                        <FontAwesomeIcon icon={faEye} />
                        <span>{produit.nombreVues || 0} vues</span>
                    </div>
                    <div className="stat-item">
                        <FontAwesomeIcon icon={faChartLine} />
                        <span>{produit.nombreVentes || 0} ventes</span>
                    </div>
                    <div className="stat-item">
                        <FontAwesomeIcon icon={faStar} />
                        <span>{produit.evaluations?.moyenne || 0}/5</span>
                    </div>
                    <div className="stat-item">
                        <FontAwesomeIcon icon={faTags} />
                        <span>
                            {produit.categorie?.nom || 'Non catégorisé'}
                        </span>
                    </div>
                </div>

                {/* Stock */}
                <div className="section-stock">
                    <div
                        className={`stock-indicator ${produit.quantite <= 5 ? 'faible' : 'bon'}`}
                    >
                        <FontAwesomeIcon icon={faBox} />
                        <span>
                            {produit.quantite || 0} en stock
                            {produit.quantite <= 5 && (
                                <FontAwesomeIcon
                                    icon={faExclamationTriangle}
                                    className="warning-icon"
                                />
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="carte-actions">
                <button
                    className="btn-action btn-vue"
                    onClick={() => onView(produit._id)}
                    title="Voir détails"
                >
                    <FontAwesomeIcon icon={faEye} />
                </button>
                <button
                    className="btn-action btn-modifier"
                    onClick={() => onEdit(produit)}
                    title="Modifier"
                >
                    <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                    className="btn-action btn-supprimer"
                    onClick={() => onDelete(produit)}
                    title="Supprimer"
                >
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            </div>
        </div>
    );
};

export default CarteProduitVendeur;