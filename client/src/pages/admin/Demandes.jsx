import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useConfirmActions } from '../../hooks/useConfirmActions';
import './Demandes.scss';

const Demandes = () => {
    // Import de toutes les fonctions nécessaires
    const {
        confirmApproveRequest,
        confirmRejectRequest,
        confirmDelete,
        confirmSuspend,
        confirmReactivate,
    } = useConfirmActions();

    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [filtreStatut, setFiltreStatut] = useState('en_attente');
    const [filtreRole, setFiltreRole] = useState('tous');
    const [rechercheTexte, setRechercheTexte] = useState('');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [modalRejetOuvert, setModalRejetOuvert] = useState(false);
    const [demandeARejeterId, setDemandeARejeterId] = useState(null);
    const [demandeARejeterNom, setDemandeARejeterNom] = useState('');
    const [demandeARejeterRole, setDemandeARejeterRole] = useState('');
    const [raisonRejet, setRaisonRejet] = useState('');
    const [erreurRaison, setErreurRaison] = useState('');

    const [modalProfilOuvert, setModalProfilOuvert] = useState(false);
    const [utilisateurSelectionne, setUtilisateurSelectionne] = useState(null);

    const [notification, setNotification] = useState(null);

    const afficherNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const chargerDemandes = async () => {
        try {
            setLoading(true);
            setErreur(null);

            let params = {
                page,
                limite: 10,
                role: filtreRole === 'tous' ? undefined : filtreRole,
                recherche: rechercheTexte || undefined,
            };

            if (filtreStatut === 'approuve') {
                params.statut = 'verifie';
                params.estActif = true;
            } else if (filtreStatut === 'suspendu') {
                params.statut = 'verifie';
                params.estActif = false;
            } else if (filtreStatut !== 'tous') {
                params.statut = filtreStatut;
            }

            const response = await adminService.getDemandes(params);

            if (response.succes || response.success) {
                if (response.demandes && response.pagination) {
                    setDemandes(response.demandes);
                    setTotal(response.pagination.total || 0);
                    setTotalPages(response.pagination.totalPages || 1);
                } else if (
                    response.donnees?.demandes &&
                    response.donnees?.pagination
                ) {
                    setDemandes(response.donnees.demandes);
                    setTotal(response.donnees.pagination.total || 0);
                    setTotalPages(response.donnees.pagination.totalPages || 1);
                } else {
                    setDemandes([]);
                    setTotal(0);
                    setTotalPages(1);
                }
            } else {
                setErreur('Erreur lors du chargement des demandes');
                setDemandes([]);
            }
        } catch (err) {
            console.error('[Demandes] Erreur chargement:', err);
            setErreur('Erreur de connexion au serveur');
            setDemandes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chargerDemandes();
    }, [page, filtreStatut, filtreRole, rechercheTexte]);

    // APPROUVER UNE DEMANDE
    const handleApprouver = async (demandeId, type, nom, prenom) => {
        const confirmed = await confirmApproveRequest(type, `${nom} ${prenom}`);
        if (!confirmed) return;

        try {
            const response = await adminService.approuverDemande(demandeId);

            if (response.succes) {
                await chargerDemandes();
                window.dispatchEvent(new Event('demandesUpdated'));
                afficherNotification(
                    'Demande approuvée avec succès',
                    'success'
                );
            } else {
                afficherNotification(
                    response.message || "Échec de l'approbation",
                    'error'
                );
            }
        } catch (err) {
            console.error('[Demandes] Erreur approbation:', err);
            afficherNotification(
                "Erreur lors de l'approbation de la demande",
                'error'
            );
        }
    };

    // OUVRIR MODAL REJET
    const ouvrirModalRejet = (demandeId, type, nom, prenom) => {
        setDemandeARejeterId(demandeId);
        setDemandeARejeterNom(`${nom} ${prenom}`);
        setDemandeARejeterRole(type);
        setRaisonRejet('');
        setErreurRaison('');
        setModalRejetOuvert(true);
    };

    const fermerModalRejet = () => {
        setModalRejetOuvert(false);
        setDemandeARejeterId(null);
        setDemandeARejeterNom('');
        setDemandeARejeterRole('');
        setRaisonRejet('');
        setErreurRaison('');
    };

    // REJETER UNE DEMANDE
    const handleRejeter = async () => {
        if (!raisonRejet || raisonRejet.trim().length < 10) {
            setErreurRaison(
                'La raison du rejet doit contenir au moins 10 caractères'
            );
            return;
        }

        if (!demandeARejeterId) return;

        // Utiliser le hook pour confirmer
        const confirmed = await confirmRejectRequest(
            demandeARejeterRole,
            demandeARejeterNom
        );

        if (!confirmed) {
            fermerModalRejet();
            return;
        }

        try {
            const response = await adminService.rejeterDemande(
                demandeARejeterId,
                raisonRejet.trim()
            );

            if (response.succes) {
                await chargerDemandes();
                window.dispatchEvent(new Event('demandesUpdated'));
                fermerModalRejet();
                afficherNotification('Demande rejetée avec succès', 'success');
            } else {
                afficherNotification(
                    response.message || 'Échec du rejet',
                    'error'
                );
            }
        } catch (err) {
            console.error('[Demandes] Erreur rejet:', err);
            afficherNotification('Erreur lors du rejet de la demande', 'error');
        }
    };

    const ouvrirModalProfil = utilisateur => {
        setUtilisateurSelectionne(utilisateur);
        setModalProfilOuvert(true);
    };

    const fermerModalProfil = () => {
        setModalProfilOuvert(false);
        setUtilisateurSelectionne(null);
    };

    // Fonction handleSuspendre
    const handleSuspendre = async (utilisateurId, nom, prenom) => {
        const confirmed = await confirmSuspend(`${nom} ${prenom}`);

        if (!confirmed) return;

        try {
            const response = await adminService.updateStatutUtilisateur(
                utilisateurId,
                false
            );

            if (response.succes) {
                await chargerDemandes();
                window.dispatchEvent(new Event('demandesUpdated'));
                afficherNotification(
                    'Utilisateur suspendu avec succès',
                    'success'
                );
            } else {
                afficherNotification(
                    response.message || 'Échec de la suspension',
                    'error'
                );
            }
        } catch (err) {
            console.error('[Demandes] Erreur suspension:', err);
            afficherNotification('Erreur lors de la suspension', 'error');
        }
    };

    // Fonction handleReactiver
    const handleReactiver = async (utilisateurId, nom, prenom) => {
        const confirmed = await confirmReactivate(`${nom} ${prenom}`);

        if (!confirmed) return;

        try {
            const response =
                await adminService.reactiverUtilisateur(utilisateurId);

            if (response.succes) {
                await chargerDemandes();
                window.dispatchEvent(new Event('demandesUpdated'));
                afficherNotification(
                    'Utilisateur réactivé avec succès',
                    'success'
                );
            } else {
                afficherNotification(
                    response.message || 'Échec de la réactivation',
                    'error'
                );
            }
        } catch (err) {
            console.error('[Demandes] Erreur réactivation:', err);
            afficherNotification('Erreur lors de la réactivation', 'error');
        }
    };

    const handleReapprouver = async (utilisateurId, nom, prenom, role) => {
        const confirmed = await confirmApproveRequest(role, `${nom} ${prenom}`);
        if (!confirmed) return;

        try {
            const response =
                await adminService.reapprouverDemande(utilisateurId);

            if (response.succes) {
                await chargerDemandes();
                window.dispatchEvent(new Event('demandesUpdated'));
                afficherNotification(
                    'Utilisateur réapprouvé avec succès',
                    'success'
                );
            } else {
                afficherNotification(
                    response.message || 'Échec de la réapprobation',
                    'error'
                );
            }
        } catch (err) {
            console.error('[Demandes] Erreur réapprobation:', err);
            afficherNotification('Erreur lors de la réapprobation', 'error');
        }
    };

    // SUPPRIMER UN UTILISATEUR
    const handleSupprimer = async (utilisateurId, nom, prenom) => {
        const confirmed = await confirmDelete(
            'utilisateur',
            `${nom} ${prenom}`
        );
        if (!confirmed) return;

        try {
            const response =
                await adminService.deleteUtilisateur(utilisateurId);

            if (response.succes) {
                await chargerDemandes();
                window.dispatchEvent(new Event('demandesUpdated'));
                afficherNotification(
                    'Utilisateur supprimé avec succès',
                    'success'
                );
            } else {
                afficherNotification(
                    response.message || 'Échec de la suppression',
                    'error'
                );
            }
        } catch (err) {
            console.error('[Demandes] Erreur suppression:', err);
            afficherNotification('Erreur lors de la suppression', 'error');
        }
    };

    const formaterDate = dateString => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getBadgeStatut = statut => {
        const badges = {
            en_attente: { classe: 'warning', texte: 'En attente' },
            verifie: { classe: 'success', texte: 'Approuvé' },
            rejete: { classe: 'danger', texte: 'Rejeté' },
        };
        return badges[statut] || badges.en_attente;
    };

    const getBadgeRole = role => {
        const badges = {
            vendeur: { classe: 'info', texte: 'Vendeur' },
            moderateur: { classe: 'primary', texte: 'Modérateur' },
        };
        return badges[role] || { classe: 'secondary', texte: role };
    };

    return (
        <div className="demandes-page">
            {notification && (
                <div className={`notification-toast ${notification.type}`}>
                    <i
                        className={`fas ${
                            notification.type === 'success'
                                ? 'fa-check-circle'
                                : 'fa-exclamation-circle'
                        }`}
                    ></i>
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            <div className="page-header">
                <div className="header-left">
                    <i className="fas fa-inbox header-icon"></i>
                    <div>
                        <h1 className="page-title">Demandes d'Inscription</h1>
                        <p className="page-subtitle">
                            Gérer les demandes des vendeurs et modérateurs
                        </p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={chargerDemandes}>
                    <i className="fas fa-sync-alt"></i> Actualiser
                </button>
            </div>

            <div className="filtres-section">
                <div className="filtre-groupe">
                    <label>Statut</label>
                    <select
                        className="form-select"
                        value={filtreStatut}
                        onChange={e => {
                            setFiltreStatut(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="en_attente">En attente</option>
                        <option value="approuve">Approuvé</option>
                        <option value="suspendu">Suspendu</option>
                        <option value="rejete">Rejeté</option>
                        <option value="tous">Tous</option>
                    </select>
                </div>

                <div className="filtre-groupe">
                    <label>Rôle</label>
                    <select
                        className="form-select"
                        value={filtreRole}
                        onChange={e => {
                            setFiltreRole(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="tous">Tous</option>
                        <option value="vendeur">Vendeur</option>
                        <option value="moderateur">Modérateur</option>
                    </select>
                </div>

                <div className="filtre-groupe filtre-recherche">
                    <label>Rechercher</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Nom, email..."
                        value={rechercheTexte}
                        onChange={e => {
                            setRechercheTexte(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p>Chargement des demandes...</p>
                </div>
            ) : erreur ? (
                <div className="alert alert-danger">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {erreur}
                </div>
            ) : demandes.length === 0 ? (
                <div className="aucune-demande">
                    <i className="fas fa-inbox"></i>
                    <h3>Aucune demande</h3>
                    <p>Il n'y a aucune demande correspondant à vos critères</p>
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table demandes-table">
                            <thead>
                                <tr>
                                    <th>UTILISATEUR</th>
                                    <th>EMAIL</th>
                                    <th>RÔLE</th>
                                    <th>TÉLÉPHONE</th>
                                    <th>DATE D'INSCRIPTION</th>
                                    <th>STATUT</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {demandes.map(demande => {
                                    const nomComplet = demande.prenom
                                        ? `${demande.prenom} ${demande.nom}`
                                        : demande.nom || 'N/A';
                                    const badgeStatut = getBadgeStatut(
                                        demande.statutVerification
                                    );
                                    const badgeRole = getBadgeRole(
                                        demande.role
                                    );

                                    return (
                                        <tr key={demande._id}>
                                            <td>
                                                <div className="utilisateur-info">
                                                    <div className="avatar-initiales">
                                                        {demande.prenom?.[0] ||
                                                            'U'}
                                                        {demande.nom?.[0] ||
                                                            'N'}
                                                    </div>
                                                    <div>
                                                        <div className="utilisateur-nom">
                                                            {nomComplet}
                                                        </div>
                                                        <div className="utilisateur-sous-titre">
                                                            {demande.boutique
                                                                ?.nomBoutique ||
                                                                'Pas de boutique'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-muted">
                                                {demande.email}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge bg-${badgeRole.classe}`}
                                                >
                                                    {badgeRole.texte}
                                                </span>
                                            </td>
                                            <td className="text-muted">
                                                {demande.telephone || 'N/A'}
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark">
                                                    {formaterDate(
                                                        demande.createdAt
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge bg-${badgeStatut.classe}`}
                                                >
                                                    {badgeStatut.texte}
                                                </span>
                                                {!demande.estActif && (
                                                    <span className="badge bg-secondary ms-2">
                                                        Suspendu
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {/*ACTIONS EN ATTENTE */}
                                                {demande.statutVerification ===
                                                    'en_attente' && (
                                                    <div className="actions-buttons">
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() =>
                                                                handleApprouver(
                                                                    demande._id,
                                                                    demande.role,
                                                                    demande.nom,
                                                                    demande.prenom
                                                                )
                                                            }
                                                            title="Approuver"
                                                        >
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() =>
                                                                ouvrirModalRejet(
                                                                    demande._id,
                                                                    demande.role,
                                                                    demande.nom,
                                                                    demande.prenom
                                                                )
                                                            }
                                                            title="Rejeter"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                )}

                                                {/*ACTIONS VÉRIFIÉ ACTIF */}
                                                {demande.statutVerification ===
                                                    'verifie' &&
                                                    demande.estActif && (
                                                        <div className="actions-buttons">
                                                            <button
                                                                className="btn btn-sm btn-info"
                                                                onClick={() =>
                                                                    ouvrirModalProfil(
                                                                        demande
                                                                    )
                                                                }
                                                                title="Voir le profil"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-warning"
                                                                onClick={() =>
                                                                    handleSuspendre(
                                                                        demande._id,
                                                                        demande.nom,
                                                                        demande.prenom
                                                                    )
                                                                }
                                                                title="Suspendre"
                                                            >
                                                                <i className="fas fa-pause"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() =>
                                                                    handleSupprimer(
                                                                        demande._id,
                                                                        demande.nom,
                                                                        demande.prenom
                                                                    )
                                                                }
                                                                title="Supprimer"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    )}

                                                {/*ACTIONS VÉRIFIÉ SUSPENDU */}
                                                {demande.statutVerification ===
                                                    'verifie' &&
                                                    !demande.estActif && (
                                                        <div className="actions-buttons">
                                                            <button
                                                                className="btn btn-sm btn-info"
                                                                onClick={() =>
                                                                    ouvrirModalProfil(
                                                                        demande
                                                                    )
                                                                }
                                                                title="Voir le profil"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() =>
                                                                    handleReactiver(
                                                                        demande._id,
                                                                        demande.nom,
                                                                        demande.prenom
                                                                    )
                                                                }
                                                                title="Réactiver"
                                                            >
                                                                <i className="fas fa-play"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() =>
                                                                    handleSupprimer(
                                                                        demande._id,
                                                                        demande.nom,
                                                                        demande.prenom
                                                                    )
                                                                }
                                                                title="Supprimer"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    )}

                                                {/*ACTIONS REJETÉ */}
                                                {demande.statutVerification ===
                                                    'rejete' && (
                                                    <div className="actions-buttons">
                                                        <button
                                                            className="btn btn-sm btn-info"
                                                            onClick={() =>
                                                                ouvrirModalProfil(
                                                                    demande
                                                                )
                                                            }
                                                            title="Voir le profil"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() =>
                                                                handleReapprouver(
                                                                    demande._id,
                                                                    demande.nom,
                                                                    demande.prenom,
                                                                    demande.role
                                                                )
                                                            }
                                                            title="Réapprouver"
                                                        >
                                                            <i className="fas fa-redo"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() =>
                                                                handleSupprimer(
                                                                    demande._id,
                                                                    demande.nom,
                                                                    demande.prenom
                                                                )
                                                            }
                                                            title="Supprimer"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <i className="fas fa-chevron-left"></i>{' '}
                                Précédent
                            </button>

                            <span className="pagination-info">
                                Page {page} sur {totalPages} ({total} demandes)
                            </span>

                            <button
                                className="btn btn-outline-primary"
                                onClick={() =>
                                    setPage(p => Math.min(totalPages, p + 1))
                                }
                                disabled={page === totalPages}
                            >
                                Suivant <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/*MODAL de rejet (affiche seulement le formulaire) */}
            {modalRejetOuvert && (
                <div className="modal-overlay" onClick={fermerModalRejet}>
                    <div
                        className="modal-content modal-rejet"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-times-circle text-danger me-2"></i>
                                Rejeter la demande
                            </h3>
                            <button
                                className="btn-close"
                                onClick={fermerModalRejet}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Veuillez indiquer la raison du rejet de cette
                                demande d'inscription.
                            </p>

                            <div className="form-group">
                                <label className="form-label">
                                    Raison du rejet{' '}
                                    <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className={`form-control ${erreurRaison ? 'is-invalid' : ''}`}
                                    rows="4"
                                    placeholder="Ex: Documents incomplets, informations incorrectes, profil ne correspond pas aux critères..."
                                    value={raisonRejet}
                                    onChange={e => {
                                        setRaisonRejet(e.target.value);
                                        setErreurRaison('');
                                    }}
                                    maxLength="500"
                                ></textarea>
                                {erreurRaison && (
                                    <div className="invalid-feedback">
                                        {erreurRaison}
                                    </div>
                                )}
                                <div className="form-text">
                                    <span
                                        className={
                                            raisonRejet.length < 10
                                                ? 'text-danger'
                                                : 'text-success'
                                        }
                                    >
                                        {raisonRejet.length < 10
                                            ? `Il manque ${10 - raisonRejet.length} caractère(s)`
                                            : `${raisonRejet.length} caractères`}
                                    </span>
                                    <span className="text-muted ms-2">
                                        (max 500)
                                    </span>
                                </div>
                            </div>

                            <div className="alert alert-warning mt-3">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                L'utilisateur recevra un email avec la raison du
                                rejet.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={fermerModalRejet}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleRejeter}
                                disabled={
                                    !raisonRejet ||
                                    raisonRejet.trim().length < 10
                                }
                            >
                                <i className="fas fa-times me-2"></i>
                                Rejeter la demande
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PROFIL */}
            {modalProfilOuvert && utilisateurSelectionne && (
                <div className="modal-overlay" onClick={fermerModalProfil}>
                    <div
                        className="modal-content modal-profil"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-user-circle me-2"></i>
                                Profil de l'utilisateur
                            </h3>
                            <button
                                className="btn-close"
                                onClick={fermerModalProfil}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="profil-info">
                                <div className="info-ligne">
                                    <strong>Nom complet :</strong>
                                    <span>
                                        {utilisateurSelectionne.prenom}{' '}
                                        {utilisateurSelectionne.nom}
                                    </span>
                                </div>
                                <div className="info-ligne">
                                    <strong>Email :</strong>
                                    <span>{utilisateurSelectionne.email}</span>
                                </div>
                                <div className="info-ligne">
                                    <strong>Téléphone :</strong>
                                    <span>
                                        {utilisateurSelectionne.telephone ||
                                            'Non renseigné'}
                                    </span>
                                </div>
                                <div className="info-ligne">
                                    <strong>Rôle :</strong>
                                    <span
                                        className={`badge bg-${
                                            getBadgeRole(
                                                utilisateurSelectionne.role
                                            ).classe
                                        }`}
                                    >
                                        {
                                            getBadgeRole(
                                                utilisateurSelectionne.role
                                            ).texte
                                        }
                                    </span>
                                </div>
                                <div className="info-ligne">
                                    <strong>Statut :</strong>
                                    <span
                                        className={`badge bg-${
                                            getBadgeStatut(
                                                utilisateurSelectionne.statutVerification
                                            ).classe
                                        }`}
                                    >
                                        {
                                            getBadgeStatut(
                                                utilisateurSelectionne.statutVerification
                                            ).texte
                                        }
                                    </span>
                                    {!utilisateurSelectionne.estActif && (
                                        <span className="badge bg-secondary ms-2">
                                            Suspendu
                                        </span>
                                    )}
                                </div>
                                <div className="info-ligne">
                                    <strong>Date d'inscription :</strong>
                                    <span>
                                        {formaterDate(
                                            utilisateurSelectionne.createdAt
                                        )}
                                    </span>
                                </div>

                                {utilisateurSelectionne.boutique && (
                                    <>
                                        <hr />
                                        <h5>Informations boutique</h5>
                                        <div className="info-ligne">
                                            <strong>
                                                Nom de la boutique :
                                            </strong>
                                            <span>
                                                {utilisateurSelectionne.boutique
                                                    .nomBoutique ||
                                                    'Non renseigné'}
                                            </span>
                                        </div>
                                        <div className="info-ligne">
                                            <strong>Description :</strong>
                                            <span>
                                                {utilisateurSelectionne.boutique
                                                    .descriptionBoutique ||
                                                    'Non renseignée'}
                                            </span>
                                        </div>
                                    </>
                                )}

                                {utilisateurSelectionne.statutVerification ===
                                    'rejete' &&
                                    utilisateurSelectionne.raisonRejet && (
                                        <>
                                            <hr />
                                            <div className="alert alert-danger">
                                                <strong>
                                                    Raison du rejet :
                                                </strong>
                                                <p className="mb-0 mt-2">
                                                    {
                                                        utilisateurSelectionne.raisonRejet
                                                    }
                                                </p>
                                            </div>
                                        </>
                                    )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={fermerModalProfil}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Demandes; //harley
