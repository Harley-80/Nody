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
                        {produits.map((produit, index) => {
                            // Extraction propre de l'URL de l'image
                            const imagePath =
                                produit.images?.[0] || produit.image;

                            return (
                                <tr key={produit._id || `produit-${index}`}>
                                    <td>
                                        <div className="produit-info">
                                            <div className="produit-rang">
                                                {index + 1}
                                            </div>
                                            <div className="produit-image">
                                                <img
                                                    src={imagePath}
                                                    alt={produit.nom}
                                                    onError={e => {
                                                        // En cas d'erreur, on affiche l'icône FontAwesome cachée derrière
                                                        e.target.style.display =
                                                            'none';
                                                        if (
                                                            e.target.nextSibling
                                                        ) {
                                                            e.target.nextSibling.style.display =
                                                                'flex';
                                                        }
                                                    }}
                                                />
                                                <i
                                                    className="fas fa-image"
                                                    style={{ display: 'none' }}
                                                ></i>
                                            </div>
                                            <div className="produit-nom">
                                                {produit.nom ||
                                                    'Produit sans nom'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge bg-light text-dark">
                                            {produit.categorie?.nom ||
                                                produit.categorie ||
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
                                            produit.prix ||
                                                produit.prixVente ||
                                                0
                                        )}
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

export default TableauProduitsPopulaires;