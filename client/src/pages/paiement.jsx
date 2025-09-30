import { useState, useEffect, useCallback } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; // Assuming token is available from useAuth
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext'; // Ajout de useToast

/**
 * Page Paiement - Finalisation de la commande
 * Protégée par une vérification d'authentification
 */
export default function Paiement() {
    const { user, token } = useAuth();
    const { panier, totalPanier, viderPanier } = useCart();
    const navigate = useNavigate();
    const { addToast } = useToast(); // Récupération de addToast

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
            title: 'Connexion requise',
            message:
                'Veuillez vous connecter pour accéder à la page de paiement.',
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
                type: 'error',
                title: 'Champs manquants',
                message: `Veuillez remplir tous les champs requis: ${missingFields.join(', ')}.`,
            });
            return;
        }
        if (panier.length === 0) {
            addToast({
                type: 'error',
                title: 'Panier vide',
                message:
                    'Votre panier est vide. Veuillez ajouter des produits avant de commander.',
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
                type: 'success',
                title: 'Commande confirmée',
                message: `Merci ${form.nom} ! Votre commande a été enregistrée.`,
            });

            // REDIRECTION VERS LA PAGE DE CONFIRMATION AVEC LE STATE
            navigate('/confirmation', {
                state: {
                    type: 'success', // Type de message (succès, erreur, info)
                    title: 'Commande confirmée 🛍️', // Titre du message
                    message: `Merci ${form.nom} ! Votre commande a été enregistrée.`, // Message principal
                    buttonLabel: 'Voir mes commandes', // Texte du bouton d'action
                    redirectTo: '/mes-commandes', // Redirect to user's orders page
                    delay: 5000, // Délai avant redirection automatique (si implémenté dans le composant confirmation)
                },
            });
        } catch (err) {
            console.error('Erreur lors de la commande:', err);
            setError(err.message);
            addToast({
                type: 'error',
                title: 'Erreur',
                message:
                    err.message ||
                    'Une erreur est survenue lors de la finalisation de votre commande.',
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
            </div>
        );
    }

    return (
        <div className="container py-5">
            <h2 className="mb-4">Finaliser ma commande</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row">
                <div className="col-md-6">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Nom complet</label>
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
                            <select
                                className="form-select"
                                name="devise"
                                value={devise}
                                onChange={handleDeviseChange}
                                required
                            >
                                <option value="XOF">
                                    XOF (Afrique de l'Ouest)
                                </option>
                                <option value="XAF">
                                    XAF (Afrique Centrale)
                                </option>
                                <option value="EUR">EUR (Euro)</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Méthode de Paiement
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
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check me-2"></i>{' '}
                                    Confirmer la commande
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="col-md-6">
                    <h4 className="mb-3">Récapitulatif</h4>
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
