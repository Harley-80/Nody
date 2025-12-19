import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useConfirmActions } from '../../hooks/useConfirmActions';
import { useToast } from '../../contexts/ToastContext';
import './Clients.scss';

const Clients = () => {
    // Hooks
    const { confirmDelete, confirmBlock, confirmUnblock } = useConfirmActions();
    const { addToast } = useToast();

    // États
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        motDePasse: '',
        genre: 'Homme',
    });
    const [submitting, setSubmitting] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limite: 10,
        total: 0,
        pages: 1,
    });

    // Chargement initial
    useEffect(() => {
        fetchClients();
    }, [pagination.page]);

    // Récupération des clients
    const fetchClients = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminService.getClients({
                page: pagination.page,
                limite: pagination.limite,
            });

            const clientsData =
                response.donnees?.utilisateurs || response.donnees || [];
            const paginationData = response.donnees?.pagination || {
                page: 1,
                limite: 10,
                total: 0,
                pages: 1,
            };

            setClients(clientsData);
            setPagination(paginationData);
        } catch (err) {
            const errorMessage =
                err.message || 'Impossible de charger les clients.';
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

    // Gestion du modal
    const openModal = (client = null) => {
        setEditingClient(client);
        setFormData(
            client
                ? {
                      nom: client.nom || '',
                      prenom: client.prenom || '',
                      email: client.email || '',
                      telephone: client.telephone || '',
                      motDePasse: '',
                      genre: client.genre || 'Homme',
                  }
                : {
                      nom: '',
                      prenom: '',
                      email: '',
                      telephone: '',
                      motDePasse: '',
                      genre: 'Homme',
                  }
        );
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingClient(null);
        setFormData({
            nom: '',
            prenom: '',
            email: '',
            telephone: '',
            motDePasse: '',
            genre: 'Homme',
        });
    };

    // Gestion du formulaire
    const handleInputChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();

        // Validation
        if (
            !formData.nom ||
            !formData.prenom ||
            !formData.email ||
            !formData.genre
        ) {
            addToast({
                type: 'warning',
                title: 'Champs manquants',
                message: 'Veuillez remplir tous les champs obligatoires',
            });
            return;
        }

        if (!editingClient && !formData.motDePasse) {
            addToast({
                type: 'warning',
                title: 'Mot de passe requis',
                message:
                    'Le mot de passe est obligatoire pour un nouveau client',
            });
            return;
        }

        try {
            setSubmitting(true);

            if (editingClient) {
                const dataToSend = { ...formData };
                if (!dataToSend.motDePasse) delete dataToSend.motDePasse;
                await adminService.updateClient(editingClient._id, dataToSend);
                addToast({
                    type: 'success',
                    title: 'Client modifié',
                    message: `${formData.prenom} ${formData.nom} a été modifié avec succès`,
                });
            } else {
                await adminService.createClient(formData);
                addToast({
                    type: 'success',
                    title: 'Client créé',
                    message: `${formData.prenom} ${formData.nom} a été créé avec succès`,
                });
            }

            closeModal();
            fetchClients();
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message:
                    err.message || 'Erreur lors de la sauvegarde du client',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Actions sur les clients
    const handleDelete = async (clientId, nom, prenom) => {
        const confirmed = await confirmDelete('client', `${prenom} ${nom}`);
        if (!confirmed) return;

        try {
            await adminService.deleteClient(clientId);
            setClients(clients.filter(c => c._id !== clientId));
            addToast({
                type: 'success',
                title: 'Client supprimé',
                message: `${prenom} ${nom} a été supprimé avec succès`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message:
                    err.message || 'Erreur lors de la suppression du client',
            });
        }
    };

    const handleBlockClient = async (clientId, nom, prenom) => {
        const confirmed = await confirmBlock(`${prenom} ${nom}`);
        if (!confirmed) return;

        try {
            await adminService.updateClientStatus(clientId, false);
            setClients(
                clients.map(c =>
                    c._id === clientId ? { ...c, estActif: false } : c
                )
            );
            addToast({
                type: 'warning',
                title: 'Client bloqué',
                message: `${prenom} ${nom} a été bloqué avec succès`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors du blocage du client',
            });
        }
    };

    const handleUnblockClient = async (clientId, nom, prenom) => {
        const confirmed = await confirmUnblock(`${prenom} ${nom}`);
        if (!confirmed) return;

        try {
            await adminService.updateClientStatus(clientId, true);
            setClients(
                clients.map(c =>
                    c._id === clientId ? { ...c, estActif: true } : c
                )
            );
            addToast({
                type: 'success',
                title: 'Client débloqué',
                message: `${prenom} ${nom} a été débloqué avec succès`,
            });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors du déblocage du client',
            });
        }
    };

    // Pagination
    const handlePageChange = newPage => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    // Fonctions utilitaires
    const formatDate = date => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getInitials = (nom, prenom) => {
        const n = nom ? nom.charAt(0).toUpperCase() : '';
        const p = prenom ? prenom.charAt(0).toUpperCase() : '';
        return n + p || '?';
    };

    // Statistiques
    const stats = {
        total: clients.length,
        actifs: clients.filter(c => c.estActif !== false).length,
        inactifs: clients.filter(c => c.estActif === false).length,
    };

    // États de chargement
    if (loading) {
        return (
            <div className="clients-container">
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Chargement des clients...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="clients-container">
                <div className="error-state">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={fetchClients}>
                        <i className="fas fa-redo"></i>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="clients-container">
            {/* En-tête */}
            <div className="page-header">
                <h1>
                    <i className="fas fa-users"></i>
                    Gestion des Clients
                </h1>
                <button className="btn-add" onClick={() => openModal()}>
                    <i className="fas fa-plus"></i>
                    Ajouter un client
                </button>
            </div>

            {/* Statistiques */}
            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.total}</h3>
                        <p>Total clients</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon actifs">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.actifs}</h3>
                        <p>Actifs</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon inactifs">
                        <i className="fas fa-ban"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.inactifs}</h3>
                        <p>Inactifs</p>
                    </div>
                </div>
            </div>

            {/* Tableau des clients */}
            <div className="clients-card">
                <div className="card-header">
                    <h2>
                        <i className="fas fa-list"></i>
                        Liste des clients
                    </h2>
                </div>
                <div className="card-body">
                    {clients.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-inbox"></i>
                            <p>Aucun client trouvé</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Client</th>
                                            <th>Téléphone</th>
                                            <th>Genre</th>
                                            <th>Statut</th>
                                            <th>Date d'inscription</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map(client => (
                                            <tr key={client._id}>
                                                <td>
                                                    <div className="client-info">
                                                        {client.avatar ? (
                                                            <img
                                                                src={
                                                                    client.avatar
                                                                }
                                                                alt={client.nom}
                                                                className="avatar"
                                                            />
                                                        ) : (
                                                            <div className="avatar-placeholder">
                                                                {getInitials(
                                                                    client.nom,
                                                                    client.prenom
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="info">
                                                            <div className="name">
                                                                {client.prenom}{' '}
                                                                {client.nom}
                                                            </div>
                                                            <div className="email">
                                                                {client.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {client.telephone || 'N/A'}
                                                </td>
                                                <td>{client.genre || 'N/A'}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${client.estActif !== false ? 'actif' : 'inactif'}`}
                                                    >
                                                        {client.estActif !==
                                                        false
                                                            ? 'Actif'
                                                            : 'Inactif'}
                                                    </span>
                                                </td>
                                                <td className="date">
                                                    {formatDate(
                                                        client.createdAt ||
                                                            client.dateInscription
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="actions">
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() =>
                                                                openModal(
                                                                    client
                                                                )
                                                            }
                                                            title="Modifier"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        {client.estActif !==
                                                        false ? (
                                                            <button
                                                                className="btn-warning"
                                                                onClick={() =>
                                                                    handleBlockClient(
                                                                        client._id,
                                                                        client.nom,
                                                                        client.prenom
                                                                    )
                                                                }
                                                                title="Bloquer"
                                                            >
                                                                <i className="fas fa-pause"></i>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn-success"
                                                                onClick={() =>
                                                                    handleUnblockClient(
                                                                        client._id,
                                                                        client.nom,
                                                                        client.prenom
                                                                    )
                                                                }
                                                                title="Débloquer"
                                                            >
                                                                <i className="fas fa-play"></i>
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    client._id,
                                                                    client.nom,
                                                                    client.prenom
                                                                )
                                                            }
                                                            title="Supprimer"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="pagination">
                                <button
                                    onClick={() =>
                                        handlePageChange(pagination.page - 1)
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
                                        handlePageChange(pagination.page + 1)
                                    }
                                    disabled={
                                        pagination.page === pagination.pages
                                    }
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal Ajouter/Modifier */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>
                                <i
                                    className={`fas fa-${editingClient ? 'edit' : 'plus'}`}
                                ></i>
                                {editingClient
                                    ? 'Modifier le client'
                                    : 'Ajouter un client'}
                            </h2>
                            <button className="close-btn" onClick={closeModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Nom *</label>
                                    <input
                                        type="text"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Entrez le nom"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Prénom *</label>
                                    <input
                                        type="text"
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Entrez le prénom"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Entrez l'email"
                                        disabled={!!editingClient}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Téléphone</label>
                                    <input
                                        type="tel"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleInputChange}
                                        placeholder="Entrez le téléphone"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Genre *</label>
                                    <select
                                        name="genre"
                                        value={formData.genre}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="Homme">Homme</option>
                                        <option value="Femme">Femme</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>
                                        Mot de passe {!editingClient && '*'}
                                        {editingClient && (
                                            <small>
                                                {' '}
                                                (laisser vide pour ne pas
                                                changer)
                                            </small>
                                        )}
                                    </label>
                                    <input
                                        type="password"
                                        name="motDePasse"
                                        value={formData.motDePasse}
                                        onChange={handleInputChange}
                                        required={!editingClient}
                                        placeholder="Entrez le mot de passe"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn-submit"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i>
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-check"></i>
                                                {editingClient
                                                    ? 'Modifier'
                                                    : 'Créer'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={closeModal}
                                        disabled={submitting}
                                    >
                                        <i className="fas fa-times"></i>
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
