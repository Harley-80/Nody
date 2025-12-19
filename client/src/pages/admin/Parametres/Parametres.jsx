import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../../contexts/NotificationContext';
import axios from 'axios';
import './Parametres.scss';

const Parametres = () => {
    const { notifications, markAsRead, markAllAsRead } = useNotifications();
    const [activeTab, setActiveTab] = useState('profil');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // État Profil
    const [profileData, setProfileData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        avatar: null,
    });

    // État Paiement
    const [paymentData, setPaymentData] = useState({
        nomBanque: '',
        titulaire: '',
        iban: '',
        bic: '',
        stripe_account_id: '',
        paypal_email: '',
        mode_paiement_prefere: 'stripe',
    });

    // État Notifications
    const [notificationSettings, setNotificationSettings] = useState({
        email_nouvelles_commandes: true,
        email_messages: true,
        email_produits: false,
        push_nouvelles_commandes: true,
        push_messages: true,
        push_produits: true,
        son_notifications: true,
        notifications_bureau: true,
    });

    // État Sécurité
    const [securityData, setSecurityData] = useState({
        ancien_mot_de_passe: '',
        nouveau_mot_de_passe: '',
        confirmer_mot_de_passe: '',
    });

    // Chargement des données utilisateur au montage
    useEffect(() => {
        fetchUserData();
        fetchPaymentData();
        fetchNotificationSettings();
    }, []);

    // Fonctions de chargement des données
    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:5000/api/utilisateurs/profil',
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setProfileData(response.data);
        } catch (error) {
            console.error('Erreur chargement profil:', error);
        }
    };

    // Chargement des données de paiement
    const fetchPaymentData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:5000/api/utilisateurs/paiement',
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response.data) {
                setPaymentData(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement données paiement:', error);
        }
    };

    // Chargement des paramètres de notification
    const fetchNotificationSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:5000/api/utilisateurs/notifications-settings',
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response.data) {
                setNotificationSettings(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement paramètres notifications:', error);
        }
    };

    // Handlers de soumission des formulaires
    const handleProfileSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            Object.keys(profileData).forEach(key => {
                if (profileData[key] !== null) {
                    formData.append(key, profileData[key]);
                }
            });

            await axios.put(
                'http://localhost:5000/api/utilisateurs/profil',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setSuccess('Profil mis à jour avec succès !');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(
                error.response?.data?.message || 'Erreur lors de la mise à jour'
            );
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Handler de soumission des informations de paiement
    const handlePaymentSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                'http://localhost:5000/api/utilisateurs/paiement',
                paymentData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setSuccess('Informations de paiement mises à jour !');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(
                error.response?.data?.message || 'Erreur lors de la mise à jour'
            );
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Handler de soumission des paramètres de notification
    const handleNotificationSettingsSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                'http://localhost:5000/api/utilisateurs/notifications-settings',
                notificationSettings,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Mettre à jour localStorage pour les préférences locales
            localStorage.setItem(
                'notification_sound',
                notificationSettings.son_notifications
            );
            localStorage.setItem(
                'browser_notifications',
                notificationSettings.notifications_bureau
            );

            setSuccess('Préférences de notifications enregistrées !');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(
                error.response?.data?.message || 'Erreur lors de la mise à jour'
            );
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Handler de soumission des modifications de mot de passe
    const handleSecuritySubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (
            securityData.nouveau_mot_de_passe !==
            securityData.confirmer_mot_de_passe
        ) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                'http://localhost:5000/api/utilisateurs/mot-de-passe',
                {
                    ancien_mot_de_passe: securityData.ancien_mot_de_passe,
                    nouveau_mot_de_passe: securityData.nouveau_mot_de_passe,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setSuccess('Mot de passe modifié avec succès !');
            setSecurityData({
                ancien_mot_de_passe: '',
                nouveau_mot_de_passe: '',
                confirmer_mot_de_passe: '',
            });
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    'Erreur lors de la modification'
            );
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Rendu du contenu de l'onglet actif
    const renderTabContent = () => {
        switch (activeTab) {
            case 'profil':
                return (
                    <form
                        className="settings-form"
                        onSubmit={handleProfileSubmit}
                    >
                        <h2>Informations Personnelles</h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Nom</label>
                                <input
                                    type="text"
                                    value={profileData.nom}
                                    onChange={e =>
                                        setProfileData({
                                            ...profileData,
                                            nom: e.target.value,
                                        })
                                    }
                                    placeholder="Votre nom"
                                />
                            </div>
                            <div className="form-group">
                                <label>Prénom</label>
                                <input
                                    type="text"
                                    value={profileData.prenom}
                                    onChange={e =>
                                        setProfileData({
                                            ...profileData,
                                            prenom: e.target.value,
                                        })
                                    }
                                    placeholder="Votre prénom"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={e =>
                                        setProfileData({
                                            ...profileData,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="votre.email@exemple.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Téléphone</label>
                                <input
                                    type="tel"
                                    value={profileData.telephone}
                                    onChange={e =>
                                        setProfileData({
                                            ...profileData,
                                            telephone: e.target.value,
                                        })
                                    }
                                    placeholder="+33 6 12 34 56 78"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Photo de profil</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e =>
                                    setProfileData({
                                        ...profileData,
                                        avatar: e.target.files[0],
                                    })
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading
                                ? 'Enregistrement...'
                                : 'Enregistrer les modifications'}
                        </button>
                    </form>
                );

            case 'paiement':
                return (
                    <form
                        className="settings-form"
                        onSubmit={handlePaymentSubmit}
                    >
                        <h2>Informations de Paiement</h2>
                        <p className="subtitle">
                            Configurez vos méthodes de paiement pour recevoir
                            vos revenus
                        </p>

                        <div className="payment-methods">
                            <div className="payment-method">
                                <input
                                    type="radio"
                                    id="stripe"
                                    name="payment_method"
                                    value="stripe"
                                    checked={
                                        paymentData.mode_paiement_prefere ===
                                        'stripe'
                                    }
                                    onChange={e =>
                                        setPaymentData({
                                            ...paymentData,
                                            mode_paiement_prefere:
                                                e.target.value,
                                        })
                                    }
                                />
                                <label htmlFor="stripe">
                                    <i className="fab fa-stripe"></i>
                                    <span>Stripe</span>
                                </label>
                            </div>
                            <div className="payment-method">
                                <input
                                    type="radio"
                                    id="paypal"
                                    name="payment_method"
                                    value="paypal"
                                    checked={
                                        paymentData.mode_paiement_prefere ===
                                        'paypal'
                                    }
                                    onChange={e =>
                                        setPaymentData({
                                            ...paymentData,
                                            mode_paiement_prefere:
                                                e.target.value,
                                        })
                                    }
                                />
                                <label htmlFor="paypal">
                                    <i className="fab fa-paypal"></i>
                                    <span>PayPal</span>
                                </label>
                            </div>
                            <div className="payment-method">
                                <input
                                    type="radio"
                                    id="virement"
                                    name="payment_method"
                                    value="virement"
                                    checked={
                                        paymentData.mode_paiement_prefere ===
                                        'virement'
                                    }
                                    onChange={e =>
                                        setPaymentData({
                                            ...paymentData,
                                            mode_paiement_prefere:
                                                e.target.value,
                                        })
                                    }
                                />
                                <label htmlFor="virement">
                                    <i className="fas fa-university"></i>
                                    <span>Virement bancaire</span>
                                </label>
                            </div>
                        </div>

                        {paymentData.mode_paiement_prefere === 'stripe' && (
                            <div className="form-group">
                                <label>Stripe Account ID</label>
                                <input
                                    type="text"
                                    value={paymentData.stripe_account_id}
                                    onChange={e =>
                                        setPaymentData({
                                            ...paymentData,
                                            stripe_account_id: e.target.value,
                                        })
                                    }
                                    placeholder="acct_xxxxxxxxxxxxx"
                                />
                                <small>
                                    Connectez votre compte Stripe pour recevoir
                                    les paiements
                                </small>
                            </div>
                        )}

                        {paymentData.mode_paiement_prefere === 'paypal' && (
                            <div className="form-group">
                                <label>Email PayPal</label>
                                <input
                                    type="email"
                                    value={paymentData.paypal_email}
                                    onChange={e =>
                                        setPaymentData({
                                            ...paymentData,
                                            paypal_email: e.target.value,
                                        })
                                    }
                                    placeholder="votre.email@paypal.com"
                                />
                                <small>
                                    Adresse email associée à votre compte PayPal
                                </small>
                            </div>
                        )}

                        {paymentData.mode_paiement_prefere === 'virement' && (
                            <>
                                <div className="form-group">
                                    <label>Nom de la banque</label>
                                    <input
                                        type="text"
                                        value={paymentData.nomBanque}
                                        onChange={e =>
                                            setPaymentData({
                                                ...paymentData,
                                                nomBanque: e.target.value,
                                            })
                                        }
                                        placeholder="Ex: Crédit Agricole"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Titulaire du compte</label>
                                    <input
                                        type="text"
                                        value={paymentData.titulaire}
                                        onChange={e =>
                                            setPaymentData({
                                                ...paymentData,
                                                titulaire: e.target.value,
                                            })
                                        }
                                        placeholder="Nom complet du titulaire"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>IBAN</label>
                                        <input
                                            type="text"
                                            value={paymentData.iban}
                                            onChange={e =>
                                                setPaymentData({
                                                    ...paymentData,
                                                    iban: e.target.value,
                                                })
                                            }
                                            placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>BIC/SWIFT</label>
                                        <input
                                            type="text"
                                            value={paymentData.bic}
                                            onChange={e =>
                                                setPaymentData({
                                                    ...paymentData,
                                                    bic: e.target.value,
                                                })
                                            }
                                            placeholder="XXXXXXXX"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading
                                ? 'Enregistrement...'
                                : 'Enregistrer les informations'}
                        </button>
                    </form>
                );

            case 'notifications':
                return (
                    <form
                        className="settings-form"
                        onSubmit={handleNotificationSettingsSubmit}
                    >
                        <h2>Préférences de Notifications</h2>
                        <p className="subtitle">
                            Choisissez comment vous souhaitez être notifié
                        </p>

                        <div className="notification-section">
                            <h3>Notifications par Email</h3>
                            <div className="toggle-group">
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Nouvelles commandes</strong>
                                        <span>
                                            Recevez un email pour chaque
                                            nouvelle commande
                                        </span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={
                                                notificationSettings.email_nouvelles_commandes
                                            }
                                            onChange={e =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    email_nouvelles_commandes:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Messages</strong>
                                        <span>
                                            Recevez un email pour les nouveaux
                                            messages
                                        </span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={
                                                notificationSettings.email_messages
                                            }
                                            onChange={e =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    email_messages:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Mises à jour produits</strong>
                                        <span>
                                            Alertes sur les modifications de vos
                                            produits
                                        </span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={
                                                notificationSettings.email_produits
                                            }
                                            onChange={e =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    email_produits:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="notification-section">
                            <h3>Notifications Push</h3>
                            <div className="toggle-group">
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Nouvelles commandes</strong>
                                        <span>
                                            Notification instantanée pour les
                                            commandes
                                        </span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={
                                                notificationSettings.push_nouvelles_commandes
                                            }
                                            onChange={e =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    push_nouvelles_commandes:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Messages</strong>
                                        <span>
                                            Notification instantanée pour les
                                            messages
                                        </span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={
                                                notificationSettings.push_messages
                                            }
                                            onChange={e =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    push_messages:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Mises à jour produits</strong>
                                        <span>
                                            Notifications push pour vos produits
                                        </span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={
                                                notificationSettings.push_produits
                                            }
                                            onChange={e =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    push_produits:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="notification-section">
                            <h3>Paramètres Système</h3>
                            <div className="toggle-group">
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Son des notifications</strong>
                                        <span>
                                            Jouer un son lors de nouvelles
                                            notifications
                                        </span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={
                                                notificationSettings.son_notifications
                                            }
                                            onChange={e =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    son_notifications:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <strong>Notifications bureau</strong>
                                        <span>
                                            Afficher les notifications sur votre
                                            bureau
                                        </span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={
                                                notificationSettings.notifications_bureau
                                            }
                                            onChange={e =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    notifications_bureau:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading
                                ? 'Enregistrement...'
                                : 'Enregistrer les préférences'}
                        </button>
                    </form>
                );

            case 'securite':
                return (
                    <form
                        className="settings-form"
                        onSubmit={handleSecuritySubmit}
                    >
                        <h2>Sécurité</h2>

                        <div className="form-group">
                            <label>Ancien mot de passe</label>
                            <input
                                type="password"
                                value={securityData.ancien_mot_de_passe}
                                onChange={e =>
                                    setSecurityData({
                                        ...securityData,
                                        ancien_mot_de_passe: e.target.value,
                                    })
                                }
                                placeholder="Votre mot de passe actuel"
                            />
                        </div>

                        <div className="form-group">
                            <label>Nouveau mot de passe</label>
                            <input
                                type="password"
                                value={securityData.nouveau_mot_de_passe}
                                onChange={e =>
                                    setSecurityData({
                                        ...securityData,
                                        nouveau_mot_de_passe: e.target.value,
                                    })
                                }
                                placeholder="Minimum 8 caractères"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmer le nouveau mot de passe</label>
                            <input
                                type="password"
                                value={securityData.confirmer_mot_de_passe}
                                onChange={e =>
                                    setSecurityData({
                                        ...securityData,
                                        confirmer_mot_de_passe: e.target.value,
                                    })
                                }
                                placeholder="Retapez le nouveau mot de passe"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading
                                ? 'Modification...'
                                : 'Modifier le mot de passe'}
                        </button>
                    </form>
                );

            default:
                return null;
        }
    };

    return (
        <div className="parametres-page">
            <div className="parametres-header">
                <h1>Paramètres</h1>
                <p className="subtitle">
                    Gérez vos préférences et informations personnelles
                </p>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="parametres-container">
                <div className="tabs-sidebar">
                    <button
                        className={`tab-item ${activeTab === 'profil' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profil')}
                    >
                        <i className="fas fa-user"></i>
                        <span>Profil</span>
                    </button>
                    <button
                        className={`tab-item ${activeTab === 'paiement' ? 'active' : ''}`}
                        onClick={() => setActiveTab('paiement')}
                    >
                        <i className="fas fa-credit-card"></i>
                        <span>Paiement</span>
                    </button>
                    <button
                        className={`tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        <i className="fas fa-bell"></i>
                        <span>Notifications</span>
                    </button>
                    <button
                        className={`tab-item ${activeTab === 'securite' ? 'active' : ''}`}
                        onClick={() => setActiveTab('securite')}
                    >
                        <i className="fas fa-lock"></i>
                        <span>Sécurité</span>
                    </button>
                </div>

                <div className="tab-content">{renderTabContent()}</div>
            </div>
        </div>
    );
};

export default Parametres;
