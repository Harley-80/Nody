import React, { useState, useEffect } from 'react';
import profilService from '../../services/profilService';
import ModalAjouterAdresse from './ModalAjouterAdresse';
import './OngletAdresses.scss';

const OngletAdresses = () => {
    // États pour les adresses
    const [adresses, setAdresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState(null);

    // États pour le modal
    const [modalOuvert, setModalOuvert] = useState(false);
    const [adresseEnEdition, setAdresseEnEdition] = useState(null);

    // États pour les actions
    const [actionEnCours, setActionEnCours] = useState(null);

    // Charger les adresses au montage
    useEffect(() => {
        chargerAdresses();
    }, []);

    // Fonction pour charger les adresses
    const chargerAdresses = async () => {
        try {
            setLoading(true);
            setErreur(null);

            const response = await profilService.obtenirAdresses();

            if (response.succes) {
                setAdresses(response.adresses || []);
            }
        } catch (err) {
            console.error('Erreur chargement adresses:', err);
            setErreur('Erreur lors du chargement des adresses');
        } finally {
            setLoading(false);
        }
    };

    // Ouvrir le modal pour ajouter une adresse
    const handleAjouterAdresse = () => {
        setAdresseEnEdition(null);
        setModalOuvert(true);
    };

    // Ouvrir le modal pour modifier une adresse
    const handleModifierAdresse = adresse => {
        setAdresseEnEdition(adresse);
        setModalOuvert(true);
    };

    // Fermer le modal
    const handleFermerModal = () => {
        setModalOuvert(false);
        setAdresseEnEdition(null);
    };

    // Callback après sauvegarde réussie
    const handleAdresseSauvegardee = () => {
        handleFermerModal();
        chargerAdresses();
    };

    // Définir une adresse comme adresse par défaut
    const handleDefinirParDefaut = async adresseId => {
        try {
            setActionEnCours(adresseId);

            const response =
                await profilService.definirAdresseParDefaut(adresseId);

            if (response.succes) {
                setAdresses(response.adresses || []);
            }
        } catch (err) {
            console.error('Erreur définir adresse par défaut:', err);
            alert("Erreur lors de la définition de l'adresse par défaut");
        } finally {
            setActionEnCours(null);
        }
    };

    // Supprimer une adresse
    const handleSupprimerAdresse = async adresseId => {
        // Demander confirmation
        if (
            !window.confirm(
                'Êtes-vous sûr de vouloir supprimer cette adresse ?'
            )
        ) {
            return;
        }

        try {
            setActionEnCours(adresseId);

            const response = await profilService.supprimerAdresse(adresseId);

            if (response.succes) {
                setAdresses(response.adresses || []);
            }
        } catch (err) {
            console.error('Erreur suppression adresse:', err);
            alert("Erreur lors de la suppression de l'adresse");
        } finally {
            setActionEnCours(null);
        }
    };

    // Obtenir l'icône selon le type d'adresse
    const getIconeType = type => {
        const icones = {
            domicile: 'fa-home',
            travail: 'fa-briefcase',
            autre: 'fa-map-marker-alt',
        };
        return icones[type] || 'fa-map-marker-alt';
    };

    // Affichage pendant le chargement
    if (loading) {
        return (
            <div className="onglet-adresses">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Chargement des adresses...</p>
                </div>
            </div>
        );
    }

    // Affichage en cas d'erreur
    if (erreur) {
        return (
            <div className="onglet-adresses">
                <div className="error-container">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{erreur}</p>
                    <button onClick={chargerAdresses} className="btn-retry">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="onglet-adresses">
            {/* En-tête */}
            <div className="section-header">
                <div>
                    <h3>
                        <i className="fas fa-map-marked-alt"></i>
                        Mes adresses de livraison
                    </h3>
                    <p className="section-description">
                        Gérez vos adresses de livraison pour faciliter vos
                        commandes
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleAjouterAdresse}
                >
                    <i className="fas fa-plus"></i>
                    Ajouter une adresse
                </button>
            </div>

            {/* Liste des adresses */}
            {adresses.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-map-marked-alt"></i>
                    <h4>Aucune adresse enregistrée</h4>
                    <p>Ajoutez votre première adresse de livraison</p>
                    <button
                        className="btn btn-primary"
                        onClick={handleAjouterAdresse}
                    >
                        <i className="fas fa-plus"></i>
                        Ajouter une adresse
                    </button>
                </div>
            ) : (
                <div className="adresses-grid">
                    {adresses.map(adresse => (
                        <div
                            key={adresse._id}
                            className={`adresse-card ${adresse.parDefaut ? 'default' : ''}`}
                        >
                            {/* Badge par défaut */}
                            {adresse.parDefaut && (
                                <div className="badge-default">
                                    <i className="fas fa-star"></i>
                                    Par défaut
                                </div>
                            )}

                            {/* En-tête de la carte */}
                            <div className="card-header">
                                <div className="type-badge">
                                    <i
                                        className={`fas ${getIconeType(adresse.type)}`}
                                    ></i>
                                    {adresse.type.charAt(0).toUpperCase() +
                                        adresse.type.slice(1)}
                                </div>
                                <div className="card-actions">
                                    <button
                                        className="btn-icon"
                                        onClick={() =>
                                            handleModifierAdresse(adresse)
                                        }
                                        title="Modifier"
                                        disabled={actionEnCours === adresse._id}
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                        className="btn-icon btn-danger"
                                        onClick={() =>
                                            handleSupprimerAdresse(adresse._id)
                                        }
                                        title="Supprimer"
                                        disabled={actionEnCours === adresse._id}
                                    >
                                        {actionEnCours === adresse._id ? (
                                            <span className="spinner-tiny"></span>
                                        ) : (
                                            <i className="fas fa-trash"></i>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Corps de la carte */}
                            <div className="card-body">
                                <p className="nom-complet">
                                    <i className="fas fa-user"></i>
                                    {adresse.nomComplet}
                                </p>
                                <p className="telephone">
                                    <i className="fas fa-phone"></i>
                                    {adresse.telephone}
                                </p>
                                <p className="adresse">
                                    <i className="fas fa-map-marker-alt"></i>
                                    {adresse.adresse}
                                </p>
                                <p className="ville">
                                    {adresse.codePostal &&
                                        `${adresse.codePostal}, `}
                                    {adresse.ville}, {adresse.pays}
                                </p>
                                {adresse.instructions && (
                                    <p className="instructions">
                                        <i className="fas fa-info-circle"></i>
                                        {adresse.instructions}
                                    </p>
                                )}
                            </div>

                            {/* Pied de la carte */}
                            {!adresse.parDefaut && (
                                <div className="card-footer">
                                    <button
                                        className="btn-set-default"
                                        onClick={() =>
                                            handleDefinirParDefaut(adresse._id)
                                        }
                                        disabled={actionEnCours === adresse._id}
                                    >
                                        {actionEnCours === adresse._id ? (
                                            <>
                                                <span className="spinner-tiny"></span>
                                                Définition en cours...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-star"></i>
                                                Définir par défaut
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal d'ajout/modification */}
            {modalOuvert && (
                <ModalAjouterAdresse
                    adresse={adresseEnEdition}
                    onFermer={handleFermerModal}
                    onSauvegarder={handleAdresseSauvegardee}
                />
            )}
        </div>
    );
};

export default OngletAdresses;
