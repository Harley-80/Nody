import React from 'react';
import { formaterMontant, formaterNombre } from '../../../utils/formatage';
import './TableauDashboard.scss';

const TableauProduitsPopulaires = ({ produits }) => {
    if (!produits || produits.length === 0) {
        return (
            <div className="tableau-vide">
                <i className="fas fa-box-open"></i>
                <p>Aucun produit populaire</p>
            </div>
        );
    }

    return (
        <div className="tableau-dashboard">
            <div className="tableau-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Catégorie</th>
                            <th className="text-end">Ventes</th>
                            <th className="text-end">Prix</th>
                        </tr>
                    </thead>
                    <tbody>
                        {produits.map((produit, index) => (
                            <tr
                                key={
                                    produit._id ||
                                    produit.id ||
                                    `produit-${index}`
                                }
                            >
                                {/* Utiliser _id (MongoDB) avec fallbacks */}
                                <td>
                                    <div className="produit-info">
                                        <div className="produit-rang">
                                            {index + 1}
                                        </div>
                                        <div className="produit-image">
                                            {produit.image ||
                                            produit.images?.[0] ? (
                                                <img
                                                    src={
                                                        produit.image ||
                                                        produit.images[0]
                                                    }
                                                    alt={produit.nom}
                                                    onError={e => {
                                                        e.target.style.display =
                                                            'none';
                                                        e.target.nextSibling.style.display =
                                                            'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <i
                                                className="fas fa-image"
                                                style={{
                                                    display:
                                                        produit.image ||
                                                        produit.images?.[0]
                                                            ? 'none'
                                                            : 'flex',
                                                }}
                                            ></i>
                                        </div>
                                        <div className="produit-nom">
                                            {produit.nom ||
                                                produit.titre ||
                                                'Produit sans nom'}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="badge bg-light text-dark">
                                        {produit.categorie ||
                                            produit.categorie?.nom ||
                                            'Non catégorisé'}
                                    </span>
                                </td>
                                <td className="text-end fw-bold text-primary">
                                    {formaterNombre(
                                        produit.ventes ||
                                            produit.nombreVentes ||
                                            0
                                    )}
                                </td>
                                <td className="text-end fw-bold">
                                    {formaterMontant(
                                        produit.prix || produit.prixVente || 0
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

export default TableauProduitsPopulaires;
