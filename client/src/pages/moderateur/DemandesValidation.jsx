import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { moderateurService } from '../../services/moderateurService';
import { useConfirmActions } from '../../hooks/useConfirmActions';
import { useToast } from '../../contexts/ToastContext';
import { useDevise } from '../../contexts/DeviseContext';
import './DemandesValidation.scss';

const DemandesValidation = () => {
    const { confirmAction } = useConfirmActions();
    const { addToast } = useToast();
    const { formaterPrix } = useDevise();
    const [searchParams, setSearchParams] = useSearchParams();

    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedDemande, setSelectedDemande] = useState(null);
    const [type, setType] = useState(searchParams.get('type') || 'produit');
    const [pagination, setPagination] = useState({
        page: 1,
        limite: 10,
        total: 0,
        pages: 1,
    });

    useEffect(() => {
        fetchDemandes();
    }, [type, pagination.page]);

    const fetchDemandes = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await moderateurService.obtenirDemandes({
                type,
                statut: 'en_attente',
                page: pagination.page,
                limite: pagination.limite,
            });

            if (response.succes) {
                const demandesData =
                    response.donnees?.demandes || response.donnees || [];
                const paginationData = response.donnees?.pagination || {
                    page: 1,
                    limite: 10,
                    total: demandesData.length,
                    pages: 1,
                };

                setDemandes(demandesData);
                setPagination(paginationData);
            } else {
                throw new Error(
                    response.message || 'Erreur lors du chargement des demandes'
                );
            }
        } catch (err) {
            const errorMessage =
                err.message || 'Impossible de charger les demandes.';
            setError(errorMessage);
            addToast({
                type: 'error',
                title: 'Erreur',
                message: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const openModal = demande => {
        setSelectedDemande(demande);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedDemande(null);
    };

    const handleApprove = async demande => {
        const confirmed = await confirmAction({
            title:
                type === 'produit'
                    ? 'Approuver ce produit ?'
                    : 'Approuver ce vendeur ?',
            message:
                type === 'produit'
                    ? 'Le produit sera visible sur la plateforme.'
                    : 'Le vendeur pourra accéder à son compte.',
            variant: 'info',
        });

        if (!confirmed) return;

        try {
            const valider =
                type === 'produit'
                    ? moderateurService.validerProduit
                    : moderateurService.validerVendeur;

            const response = await valider(demande._id, 'approuve', null);

            if (response.succes) {
                addToast({
                    type: 'success',
                    title: 'Demande approuvée',
                    message:
                        type === 'produit'
                            ? 'Le produit a été approuvé avec succès'
                            : 'Le vendeur a été approuvé avec succès',
                });
                fetchDemandes();
            }
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: err.message || "Erreur lors de l'approbation",
            });
        }
    };

    const handleReject = async demande => {
        const motif = prompt('Motif du rejet (optionnel):');

        const confirmed = await confirmAction({
            title:
                type === 'produit'
                    ? 'Rejeter ce produit ?'
                    : 'Rejeter ce vendeur ?',
            message: motif
                ? `Motif : ${motif}\nLa demande sera refusée.`
                : 'La demande sera refusée sans motif spécifié.',
            variant: 'warning',
        });

        if (!confirmed) return;

        try {
            const valider =
                type === 'produit'
                    ? moderateurService.validerProduit
                    : moderateurService.validerVendeur;

            const response = await valider(
                demande._id,
                'rejete',
                motif || 'Non spécifié'
            );

            if (response.succes) {
                addToast({
                    type: 'warning',
                    title: 'Demande rejetée',
                    message:
                        type === 'produit'
                            ? 'Le produit a été rejeté'
                            : 'Le vendeur a été rejeté',
                });
                fetchDemandes();
            }
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors du rejet',
            });
        }
    };

    const handlePageChange = newPage => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleTypeChange = newType => {
        setType(newType);
        setSearchParams({ type: newType });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const formatDate = date => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = statut => {
        switch (statut) {
            case 'en_attente':
                return <span className="badge en-attente">En attente</span>;
            case 'approuve':
                return <span className="badge actif">Approuvé</span>;
            case 'rejete':
                return <span className="badge inactif">Rejeté</span>;
            default:
                return <span className="badge">Inconnu</span>;
        }
    };

    const stats = {
        total: pagination.total,
        produits: type === 'produit' ? pagination.total : 0,
        vendeurs: type === 'vendeur' ? pagination.total : 0,
    };

    if (loading) {
        return (
            <div className="demandes-validation-container">
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Chargement des demandes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="demandes-validation-container">
                <div className="error-state">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={fetchDemandes}>
                        <i className="fas fa-redo"></i>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="demandes-validation-container">
            <div className="page-header">
                <h1>
                    <i className="fas fa-clipboard-check"></i>
                    Validation des Demandes
                </h1>
                <div className="header-actions">
                    <div className="filters">
                        <button
                            className={`filter-btn ${type === 'produit' ? 'active' : ''}`}
                            onClick={() => handleTypeChange('produit')}
                        >
                            <i className="fas fa-box"></i>
                            Produits ({stats.produits})
                        </button>
                        <button
                            className={`filter-btn ${type === 'vendeur' ? 'active' : ''}`}
                            onClick={() => handleTypeChange('vendeur')}
                        >
                            <i className="fas fa-store"></i>
                            Vendeurs ({stats.vendeurs})
                        </button>
                    </div>
                </div>
            </div>

            <div className="stats-cards">
                <div className="stat-card urgent">
                    <div className="stat-icon urgent">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.total}</h3>
                        <p>Demandes en attente</p>
                        <span className="stat-badge">À traiter</span>
                    </div>
                </div>
            </div>

            <div className="demandes-card">
                <div className="card-header">
                    <h2>
                        <i className="fas fa-list"></i>
                        {type === 'produit'
                            ? 'Demandes Produits'
                            : 'Demandes Vendeurs'}
                    </h2>
                </div>
                <div className="card-body">
                    {demandes.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-inbox"></i>
                            <p>Aucune demande en attente</p>
                            <p className="subtext">
                                Toutes les{' '}
                                {type === 'produit' ? 'produits' : 'vendeurs'}{' '}
                                ont été traités
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>
                                                {type === 'produit'
                                                    ? 'Produit'
                                                    : 'Vendeur'}
                                            </th>
                                            {type === 'produit' && (
                                                <th>Prix</th>
                                            )}
                                            {type === 'vendeur' && (
                                                <th>Contact</th>
                                            )}
                                            <th>Statut</th>
                                            <th>Date de soumission</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {demandes.map(demande => (
                                            <tr key={demande._id}>
                                                <td>
                                                    <div className="demande-info">
                                                        {type === 'produit' ? (
                                                            <>
                                                                {demande.images &&
                                                                demande.images
                                                                    .length >
                                                                    0 ? (
                                                                    <img
                                                                        src={
                                                                            demande
                                                                                .images[0]
                                                                        }
                                                                        alt={
                                                                            demande.nom
                                                                        }
                                                                        className="demande-image"
                                                                    />
                                                                ) : (
                                                                    <div className="image-placeholder">
                                                                        <i className="fas fa-box"></i>
                                                                    </div>
                                                                )}
                                                                <div className="info">
                                                                    <div className="name">
                                                                        {
                                                                            demande.nom
                                                                        }
                                                                    </div>
                                                                    <div className="description">
                                                                        {demande.description?.substring(
                                                                            0,
                                                                            100
                                                                        )}
                                                                        ...
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="avatar-placeholder">
                                                                    <i className="fas fa-user-tie"></i>
                                                                </div>
                                                                <div className="info">
                                                                    <div className="name">
                                                                        {
                                                                            demande.entreprise
                                                                        }
                                                                    </div>
                                                                    <div className="details">
                                                                        {demande.siret && (
                                                                            <span>
                                                                                SIRET:{' '}
                                                                                {
                                                                                    demande.siret
                                                                                }
                                                                            </span>
                                                                        )}
                                                                        {demande.telephone && (
                                                                            <span>
                                                                                Tél:{' '}
                                                                                {
                                                                                    demande.telephone
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>

                                                {type === 'produit' && (
                                                    <td className="price">
                                                        {formaterPrix(
                                                            demande.prix || 0
                                                        )}
                                                    </td>
                                                )}

                                                {type === 'vendeur' && (
                                                    <td>
                                                        <div className="contact-info">
                                                            <div className="email">
                                                                {demande.email ||
                                                                    'N/A'}
                                                            </div>
                                                            {demande.kbis && (
                                                                <a
                                                                    href={
                                                                        demande.kbis
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="kbis-link"
                                                                >
                                                                    <i className="fas fa-file-pdf"></i>{' '}
                                                                    KBIS
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}

                                                <td>
                                                    {getStatusBadge(
                                                        demande.statut ||
                                                            'en_attente'
                                                    )}
                                                </td>

                                                <td className="date">
                                                    {formatDate(
                                                        demande.createdAt
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="actions">
                                                        <button
                                                            className="btn-details"
                                                            onClick={() =>
                                                                openModal(
                                                                    demande
                                                                )
                                                            }
                                                            title="Voir les détails"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>

                                                        <button
                                                            className="btn-approve"
                                                            onClick={() =>
                                                                handleApprove(
                                                                    demande
                                                                )
                                                            }
                                                            title="Approuver"
                                                        >
                                                            <i className="fas fa-check"></i>
                                                        </button>

                                                        <button
                                                            className="btn-reject"
                                                            onClick={() =>
                                                                handleReject(
                                                                    demande
                                                                )
                                                            }
                                                            title="Rejeter"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.pages > 1 && (
                                <div className="pagination">
                                    <button
                                        onClick={() =>
                                            handlePageChange(
                                                pagination.page - 1
                                            )
                                        }
                                        disabled={pagination.page === 1}
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    <span>
                                        Page {pagination.page} sur{' '}
                                        {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            handlePageChange(
                                                pagination.page + 1
                                            )
                                        }
                                        disabled={
                                            pagination.page === pagination.pages
                                        }
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showModal && selectedDemande && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>
                                <i className="fas fa-info-circle"></i>
                                Détails de la demande
                            </h2>
                            <button className="close-btn" onClick={closeModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="demande-details">
                                {type === 'produit' ? (
                                    <>
                                        <div className="detail-section">
                                            <h3>Informations produit</h3>
                                            <div className="detail-row">
                                                <span className="detail-label">
                                                    Nom:
                                                </span>
                                                <span className="detail-value">
                                                    {selectedDemande.nom}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">
                                                    Description:
                                                </span>
                                                <span className="detail-value">
                                                    {
                                                        selectedDemande.description
                                                    }
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">
                                                    Prix:
                                                </span>
                                                <span className="detail-value">
                                                    {formaterPrix(
                                                        selectedDemande.prix
                                                    )}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">
                                                    Catégorie:
                                                </span>
                                                <span className="detail-value">
                                                    {selectedDemande.categorie
                                                        ?.nom ||
                                                        'Non spécifiée'}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">
                                                    Vendeur:
                                                </span>
                                                <span className="detail-value">
                                                    {selectedDemande.vendeur
                                                        ?.entreprise ||
                                                        selectedDemande.vendeur
                                                            ?.email ||
                                                        'Non spécifié'}
                                                </span>
                                            </div>
                                        </div>

                                        {selectedDemande.images &&
                                            selectedDemande.images.length >
                                                0 && (
                                                <div className="detail-section">
                                                    <h3>Images</h3>
                                                    <div className="images-grid">
                                                        {selectedDemande.images.map(
                                                            (image, index) => (
                                                                <img
                                                                    key={index}
                                                                    src={image}
                                                                    alt={`${selectedDemande.nom} ${index + 1}`}
                                                                    className="detail-image"
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </>
                                ) : (
                                    <>
                                        <div className="detail-section">
                                            <h3>Informations vendeur</h3>
                                            <div className="detail-row">
                                                <span className="detail-label">
                                                    Entreprise:
                                                </span>
                                                <span className="detail-value">
                                                    {selectedDemande.entreprise}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">
                                                    SIRET:
                                                </span>
                                                <span className="detail-value">
                                                    {selectedDemande.siret ||
                                                        'Non fourni'}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">
                                                    Téléphone:
                                                </span>
                                                <span className="detail-value">
                                                    {selectedDemande.telephone ||
                                                        'Non fourni'}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">
                                                    Email:
                                                </span>
                                                <span className="detail-value">
                                                    {selectedDemande.email ||
                                                        'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {selectedDemande.kbis && (
                                            <div className="detail-section">
                                                <h3>Document KBIS</h3>
                                                <a
                                                    href={selectedDemande.kbis}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="kbis-document"
                                                >
                                                    <i className="fas fa-file-pdf"></i>
                                                    Voir le document KBIS
                                                </a>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="detail-section">
                                    <h3>Informations de soumission</h3>
                                    <div className="detail-row">
                                        <span className="detail-label">
                                            Statut:
                                        </span>
                                        <span className="detail-value">
                                            {getStatusBadge(
                                                selectedDemande.statut
                                            )}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">
                                            Date de soumission:
                                        </span>
                                        <span className="detail-value">
                                            {formatDate(
                                                selectedDemande.createdAt
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="btn-approve"
                                    onClick={() => {
                                        closeModal();
                                        handleApprove(selectedDemande);
                                    }}
                                >
                                    <i className="fas fa-check"></i>
                                    Approuver
                                </button>
                                <button
                                    className="btn-reject"
                                    onClick={() => {
                                        closeModal();
                                        handleReject(selectedDemande);
                                    }}
                                >
                                    <i className="fas fa-times"></i>
                                    Rejeter
                                </button>
                                <button
                                    className="btn-cancel"
                                    onClick={closeModal}
                                >
                                    <i className="fas fa-times"></i>
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemandesValidation;