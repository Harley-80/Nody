import React, { useState } from 'react';
import './OngletsInfosProduit.scss';

export default function OngletsInfosProduit({ produit }) {
    const [activeTab, setActiveTab] = useState('description');

    return (
        <div className="onglets-info-produit mt-5">
            {/* En-têtes des onglets */}
            <ul className="nav nav-tabs tabs-custom" role="tablist">
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'description' ? 'active' : ''}`}
                        onClick={() => setActiveTab('description')}
                    >
                        <i className="fas fa-align-left me-2"></i>
                        Description
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'caracteristiques' ? 'active' : ''}`}
                        onClick={() => setActiveTab('caracteristiques')}
                    >
                        <i className="fas fa-list-ul me-2"></i>
                        Caractéristiques
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'livraison' ? 'active' : ''}`}
                        onClick={() => setActiveTab('livraison')}
                    >
                        <i className="fas fa-shipping-fast me-2"></i>
                        Livraison & Retours
                    </button>
                </li>
            </ul>

            {/* Contenu des onglets */}
            <div className="tab-content tabs-content-custom">
                {/* Onglet Description */}
                {activeTab === 'description' && (
                    <div className="tab-pane-custom active">
                        <div className="description-content">
                            <p className="lead">
                                {produit.description ||
                                    'Aucune description disponible pour ce produit.'}
                            </p>

                            {/* Détails supplémentaires si disponibles */}
                            {produit.details && (
                                <div className="details-supplementaires mt-4">
                                    <h5 className="mb-3">
                                        Détails supplémentaires
                                    </h5>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: produit.details,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Onglet Caractéristiques */}
                {activeTab === 'caracteristiques' && (
                    <div className="tab-pane-custom active">
                        <div className="caracteristiques-content">
                            <table className="table table-bordered caracteristiques-table">
                                <tbody>
                                    {produit.marque && (
                                        <tr>
                                            <th>
                                                <i className="fas fa-trademark me-2"></i>
                                                Marque
                                            </th>
                                            <td>{produit.marque}</td>
                                        </tr>
                                    )}
                                    {produit.reference && (
                                        <tr>
                                            <th>
                                                <i className="fas fa-barcode me-2"></i>
                                                Référence
                                            </th>
                                            <td>{produit.reference}</td>
                                        </tr>
                                    )}
                                    {produit.categorie && (
                                        <tr>
                                            <th>
                                                <i className="fas fa-tag me-2"></i>
                                                Catégorie
                                            </th>
                                            <td>
                                                {produit.categorie.nom ||
                                                    produit.categorie}
                                            </td>
                                        </tr>
                                    )}
                                    {produit.couleur && (
                                        <tr>
                                            <th>
                                                <i className="fas fa-palette me-2"></i>
                                                Couleur
                                            </th>
                                            <td>{produit.couleur}</td>
                                        </tr>
                                    )}
                                    {produit.taille && (
                                        <tr>
                                            <th>
                                                <i className="fas fa-ruler me-2"></i>
                                                Taille
                                            </th>
                                            <td>{produit.taille}</td>
                                        </tr>
                                    )}
                                    {produit.poids && (
                                        <tr>
                                            <th>
                                                <i className="fas fa-weight me-2"></i>
                                                Poids
                                            </th>
                                            <td>{produit.poids}</td>
                                        </tr>
                                    )}
                                    {produit.dimensions && (
                                        <tr>
                                            <th>
                                                <i className="fas fa-cube me-2"></i>
                                                Dimensions
                                            </th>
                                            <td>{produit.dimensions}</td>
                                        </tr>
                                    )}
                                    {produit.materiaux && (
                                        <tr>
                                            <th>
                                                <i className="fas fa-layer-group me-2"></i>
                                                Matériaux
                                            </th>
                                            <td>{produit.materiaux}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <th>
                                            <i className="fas fa-box me-2"></i>
                                            Stock
                                        </th>
                                        <td>
                                            <span
                                                className={`badge ${produit.stock > 0 ? 'bg-success' : 'bg-danger'}`}
                                            >
                                                {produit.stock > 0
                                                    ? `${produit.stock} unité(s) disponible(s)`
                                                    : 'Rupture de stock'}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Caractéristiques personnalisées si disponibles */}
                            {produit.caracteristiques &&
                                typeof produit.caracteristiques ===
                                    'object' && (
                                    <div className="caracteristiques-personnalisees mt-4">
                                        <h5 className="mb-3">
                                            Autres caractéristiques
                                        </h5>
                                        <table className="table table-sm">
                                            <tbody>
                                                {Object.entries(
                                                    produit.caracteristiques
                                                ).map(([key, value]) => (
                                                    <tr key={key}>
                                                        <th>{key}</th>
                                                        <td>{value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                        </div>
                    </div>
                )}

                {/* Onglet Livraison & Retours */}
                {activeTab === 'livraison' && (
                    <div className="tab-pane-custom active">
                        <div className="livraison-content">
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <div className="info-card">
                                        <div className="info-icon">
                                            <i className="fas fa-shipping-fast"></i>
                                        </div>
                                        <h5>Livraison</h5>
                                        <ul className="info-list">
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Livraison gratuite à partir de
                                                50 000 XOF
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Délai de livraison : 2-5 jours
                                                ouvrés
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Suivi de commande en temps réel
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Livraison à domicile ou en point
                                                relais
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="col-md-6 mb-4">
                                    <div className="info-card">
                                        <div className="info-icon">
                                            <i className="fas fa-undo"></i>
                                        </div>
                                        <h5>Retours & Échanges</h5>
                                        <ul className="info-list">
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Retour gratuit sous 14 jours
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Produit dans son emballage
                                                d'origine
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Étiquettes intactes et non
                                                portées
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Remboursement sous 7 jours
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="col-md-6 mb-4">
                                    <div className="info-card">
                                        <div className="info-icon">
                                            <i className="fas fa-shield-alt"></i>
                                        </div>
                                        <h5>Garanties</h5>
                                        <ul className="info-list">
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Produits 100% authentiques
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Garantie fabricant selon
                                                conditions
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Service client disponible 7j/7
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="col-md-6 mb-4">
                                    <div className="info-card">
                                        <div className="info-icon">
                                            <i className="fas fa-credit-card"></i>
                                        </div>
                                        <h5>Paiement Sécurisé</h5>
                                        <ul className="info-list">
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Paiement par carte bancaire
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Mobile Money (Orange, MTN, Moov)
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Paiement à la livraison
                                                disponible
                                            </li>
                                            <li>
                                                <i className="fas fa-check text-success me-2"></i>
                                                Cryptage SSL 256 bits
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}