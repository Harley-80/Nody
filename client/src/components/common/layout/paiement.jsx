import { useState, useEffect, useCallback } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; // Assuming token is available from useAuth
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext'; // Ajout de useToast
import { useTranslation } from 'react-i18next';

/**
 * Page Paiement - Finalisation de la commande
 * Protégée par une vérification d'authentification
 */
export default function Paiement() {
    const { user, token } = useAuth();
    const { panier, totalPanier, viderPanier } = useCart();
    const navigate = useNavigate();
    const { addToast } = useToast(); // Récupération de addToast
    const { t } = useTranslation();

    const [form, setForm] = useState({
        nom: user?.nomComplet || '',
        email: user?.email || '',
        telephone: user?.telephone || '',
        adresse: user?.adresses?.[0]?.rue || '',
        ville: user?.adresses?.[0]?.ville || '', // Added country
        pays: user?.adresses?.[0]?.pays || '', // Added postal code
        codePostal: user?.adresses?.[0]?.codePostal || '', // Added postal code
    });
    const [devise, setDevise] = useState(user?.preferences?.devise || 'XOF'); // Default currency
    const [methodePaiement, setMethodePaiement] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const showLoginToast = useCallback(() => {
        addToast({
            type: 'info',

            type: 'info', //
            title: t('payment.loginRequiredTitle'),
            message: t('payment.loginRequiredMessage'),
        });
    }, [addToast]);

    // Redirection si non connecté
    if (!user) {
        useEffect(() => {
            showLoginToast();
        }, [showLoginToast]);
        return <Navigate to="/connexion?redirect=/paiement" replace />;
    }

    // Pré-remplissage avec les infos utilisateur si disponibles
    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                nom: user.nomComplet || prev.nom,
                email: user.email || prev.email,
                // Assuming user might have default address info
                telephone: user.telephone || prev.telephone,
                adresse: user.adresses?.[0]?.rue || prev.adresse,
                ville: user.adresses?.[0]?.ville || prev.ville,
                pays: user.adresses?.[0]?.pays || prev.pays,
                codePostal: user.adresses?.[0]?.codePostal || prev.codePostal,
            }));
            // Set default currency from user preferences if available
            if (user.preferences?.devise) {
                setDevise(user.preferences.devise);
            }
        }
    }, [user]);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDeviseChange = e => {
        setDevise(e.target.value);
    };

    const handleMethodePaiementChange = e => {
        setMethodePaiement(e.target.value);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (loading) return;

        const requiredFields = [
            'nom',
            'email',
            'telephone',
            'adresse',
            'ville',
            'pays',
            'codePostal',
            'methodePaiement',
        ];
        const missingFields = requiredFields.filter(
            field =>
                (!form[field] && field !== 'methodePaiement') ||
                (field === 'methodePaiement' && !methodePaiement)
        );

        if (missingFields.length > 0) {
            addToast({

                type: 'error', //
                title: t('payment.missingFieldsTitle'),
                message: `${t('payment.missingFieldsMessage')} ${missingFields.join(', ')}.`,
            });
            return;
        }
        if (panier.length === 0) {

                type: 'error', //
                title: t('payment.emptyCartTitle'),
                message: t('payment.emptyCartMessage'),
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const orderData = {
                articles: panier.map(item => ({
                    // Correction de la structure des articles
                    produit: item.produit, // Utiliser l'ID du produit
                    quantite: item.quantite,
                    variante: item.variante, // Utiliser les variantes
                })),
                adresseLivraison: {
                    prenom: form.nom.split(' ')[0], // Simple split, might need more robust parsing
                    nom: form.nom.split(' ').slice(1).join(' ') || form.nom,
                    rue: form.adresse,
                    ville: form.ville,
                    pays: form.pays,
                    codePostal: form.codePostal,
                    telephone: form.telephone,
                },
                adresseFacturation: {
                    // For simplicity, using same as delivery
                    prenom: form.nom.split(' ')[0],
                    nom: form.nom.split(' ').slice(1).join(' ') || form.nom,
                    rue: form.adresse,
                    ville: form.ville,
                    pays: form.pays,
                    codePostal: form.codePostal,
                    telephone: form.telephone,
                },
                methodeLivraison: {
                    // Placeholder, assuming a default method
                    nom: 'Standard',
                    transporteur: 'Local',
                    cout: 0,
                },
                methodePaiement: methodePaiement,
                notesClient: 'Commande passée via le site web.',
                devise: devise,
            };
            const response = await fetch('/api/commandes', {
                // Correction de l'URL de l'API
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // Assuming token is available
                },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Erreur lors de la création de la commande.'
                );
            }

            viderPanier();
            addToast({

                type: 'success', //
                title: t('payment.orderConfirmedTitle'),
                message: t('payment.orderConfirmedMessage', { name: form.nom }),
            });

            // REDIRECTION VERS LA PAGE DE CONFIRMATION AVEC LE STATE
            navigate('/confirmation', {
                state: {
                    type: 'success', // Type de message (succès, erreur, info)
                    title: 'Commande confirmée 🛍️', // Titre du message
                    message: `Merci ${form.nom} ! Votre commande a été enregistrée.`, // Message principal
                    buttonLabel: 'Voir mes commandes', // Texte du bouton d'action
                    title: t('payment.confirmation.title'), // Titre du message
                    message: t('payment.confirmation.message', { name: form.nom }), // Message principal
                    buttonLabel: t('payment.confirmation.buttonLabel'), // Texte du bouton d'action
                    redirectTo: '/mes-commandes', // Redirect to user's orders page
                    delay: 5000, // Délai avant redirection automatique (si implémenté dans le composant confirmation)
                    delay: 5000,
                },
            });
        } catch (err) {
            console.error('Erreur lors de la commande:', err);
            setError(err.message);
            addToast({

                title: t('errors.genericTitle'),
                message: err.message || t('payment.orderErrorMessage'),
            });
        } finally {
            setLoading(false);
        }
    };

    if (panier.length === 0 && !loading) {
        // On ne garde que la vérification du panier vide
        return (
            <div className="container py-5 text-center">
                Votre panier est vide.{' '}
                <Link to="/produits">Parcourir les produits</Link>
                {t('payment.emptyCartInfo')}{' '}
                <Link to="/produits">{t('payment.browseProducts')}</Link>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <h2 className="mb-4">Finaliser ma commande</h2>
            <h2 className="mb-4">{t('payment.title')}</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row">
                <div className="col-md-6">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Nom complet</label>
                            <label className="form-label">
                                {t('payment.form.fullName')}
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="nom"
                                value={form.nom}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <label className="form-label">
                                {t('payment.form.email')}
                            </label>
                            <input
                                type="email"
                                className="form-control"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Téléphone</label>
                            <label className="form-label">
                                {t('payment.form.phone')}
                            </label>
                            <input
                                type="tel"
                                className="form-control"
                                name="telephone"
                                value={form.telephone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">
                                Adresse de livraison
                                {t('payment.form.shippingAddress')}
                            </label>
                            <textarea
                                className="form-control"
                                name="adresse"
                                rows="3"
                                value={form.adresse}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Ville</label>
                            <label className="form-label">
                                {t('payment.form.city')}
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="ville"
                                value={form.ville}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Pays</label>
                            <label className="form-label">
                                {t('payment.form.country')}
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="pays"
                                value={form.pays}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Code Postal</label>
                            <label className="form-label">
                                {t('payment.form.postalCode')}
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="codePostal"
                                value={form.codePostal}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Devise</label>
                            <label className="form-label">
                                {t('payment.form.currency')}
                            </label>
                            <select
                                className="form-select"
                                name="devise"
                                value={devise}
                                onChange={handleDeviseChange}
                                required
                            >
                                <option value="XOF">
                                    XOF (Afrique de l'Ouest)
                                    {t('currencies.XOF')}
                                </option>
                                <option value="XAF">
                                    XAF (Afrique Centrale)
                                    {t('currencies.XAF')}
                                </option>
                                <option value="EUR">EUR (Euro)</option>
                                <option value="EUR">{t('currencies.EUR')}</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Méthode de Paiement
                                {t('payment.form.paymentMethod')}
                            </label>
                            <div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="methodePaiement"
                                        id="wave"
                                        value="wave"
                                        checked={methodePaiement === 'wave'}
                                        onChange={handleMethodePaiementChange}
                                        required
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="wave"
                                    >
                                        Wave
                                        {t('paymentMethods.wave')}
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="methodePaiement"
                                        id="orange_money"
                                        value="orange_money"
                                        checked={
                                            methodePaiement === 'orange_money'
                                        }
                                        onChange={handleMethodePaiementChange}
                                        required
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="orange_money"
                                    >
                                        Orange Money
                                        {t('paymentMethods.orange_money')}
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="methodePaiement"
                                        id="airtel_money"
                                        value="airtel_money"
                                        checked={
                                            methodePaiement === 'airtel_money'
                                        }
                                        onChange={handleMethodePaiementChange}
                                        required
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="airtel_money"
                                    >
                                        Airtel Money
                                        {t('paymentMethods.airtel_money')}
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="methodePaiement"
                                        id="mobicash"
                                        value="mobicash"
                                        checked={methodePaiement === 'mobicash'}
                                        onChange={handleMethodePaiementChange}
                                        required
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="mobicash"
                                    >
                                        MobiCash
                                        {t('paymentMethods.mobicash')}
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="methodePaiement"
                                        id="carte_credit"
                                        value="carte_credit"
                                        checked={
                                            methodePaiement === 'carte_credit'
                                        }
                                        onChange={handleMethodePaiementChange}
                                        required
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="carte_credit"
                                    >
                                        Carte de Crédit
                                        {t('paymentMethods.carte_credit')}
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="methodePaiement"
                                        id="paiement_livraison"
                                        value="paiement_livraison"
                                        checked={
                                            methodePaiement ===
                                            'paiement_livraison'
                                        }
                                        onChange={handleMethodePaiementChange}
                                        required
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="paiement_livraison"
                                    >
                                        Paiement à la livraison
                                        {t('paymentMethods.paiement_livraison')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-success w-100">
                            {loading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Traitement...
                                    {t('payment.processing')}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check me-2"></i>{' '}
                                    Confirmer la commande
                                    {t('payment.confirmOrder')}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="col-md-6">
                    <h4 className="mb-3">Récapitulatif</h4>
                    <h4 className="mb-3">{t('payment.summary.title')}</h4>
                    <ul className="list-group mb-3">
                        {panier.map((item, index) => (
                            <li
                                key={index}
                                className="list-group-item d-flex justify-content-between align-items-start"
                            >
                                <div>
                                    <strong>{item.nom}</strong>
                                    <div className="small text-muted">
                                        Quantité : {item.quantite}
                                        {t('payment.summary.quantity')}: {item.quantite}
                                        {item.options &&
                                            Object.entries(item.options).map(
                                                ([key, val]) => (
                                                    <div key={key}>
                                                        {' '}
                                                        | {key}: {val}
                                                    </div>
                                                )
                                            )}
                                    </div>
                                </div>
                                <span>
                                    {(
                                        item.prix * item.quantite
                                    ).toLocaleString()}{' '}
                                    {devise}
                                </span>
                            </li>
                        ))}
                        <li className="list-group-item d-flex justify-content-between">
                            <span className="fw-bold">Total</span>
                            <span className="fw-bold">{t('payment.summary.total')}</span>
                            <span className="fw-bold text-success">
                                {totalPanier.toLocaleString()} {devise}
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
