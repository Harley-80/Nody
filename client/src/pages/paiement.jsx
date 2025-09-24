import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext'; // Ajout de useToast

/**
 * Page Paiement - Finalisation de la commande
 * Protégée par une vérification d'authentification
 */
export default function Paiement() {
    const { user } = useAuth();
    const { panier, totalPanier, viderPanier } = useCart();
    const navigate = useNavigate();
    const { addToast } = useToast(); // Récupération de addToast

    const [form, setForm] = useState({
        nom: user?.name || '',
        email: user?.email || '',
        telephone: '',
        adresse: '',
    });
    // const [confirmation, setConfirmation] = useState(null); // <-- Ce state n'est plus utile, peut être supprimé si vous le souhaitez

    // Redirection si non connecté
    if (!user) {
        // Ajout d'un toast d'info si l'utilisateur est redirigé pour se connecter
        useEffect(() => {
            addToast({
                type: 'info',
                title: 'Connexion requise',
                message: 'Veuillez vous connecter pour accéder à la page de paiement.'
            });
        }, [addToast]); // Le useEffect ne s'exécutera qu'une fois après le montage

        return <Navigate to="/connexion?redirect=/paiement" replace />;
    }

    // Pré-remplissage avec les infos utilisateur si disponibles
    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                nom: user.name || prev.nom,
                email: user.email || prev.email
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.nom || !form.email || !form.telephone || !form.adresse) {
            // Utiliser le toast pour les messages d'erreur de validation
            addToast({
                type: 'error',
                title: 'Champs manquants',
                message: 'Veuillez remplir tous les champs avant de confirmer la commande.'
            });
            return;
        }

        const commande = {
            client: { ...form, userId: user.id }, // Ajout de l'ID utilisateur
            produits: panier,
            total: totalPanier,
            date: new Date().toLocaleString(),
        };

        // Sauvegarde dans localStorage
        let commandesPrecedentes = [];
        try {
            const saved = localStorage.getItem('nodyCommandes');
            if (saved) commandesPrecedentes = JSON.parse(saved);
        } catch (e) {
            console.warn("Erreur lecture commandes localStorage", e);
            addToast({ // Toast d'erreur en cas de problème de lecture localStorage
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de lire les commandes précédentes.'
            });
            return; // Arrêter le processus si la lecture échoue gravement
        }

        try {
            localStorage.setItem('nodyCommandes', JSON.stringify([...commandesPrecedentes, commande]));
            viderPanier(); // Vider le panier

            // REDIRECTION VERS LA PAGE DE CONFIRMATION AVEC LE STATE
            navigate('/confirmation', {
                state: {
                    type: 'success', // Type de message (succès, erreur, info)
                    title: 'Commande confirmée 🛍️', // Titre du message
                    message: `Merci ${form.nom} ! Votre commande a été enregistrée.`, // Message principal
                    buttonLabel: 'Voir mes commandes', // Texte du bouton d'action
                    redirectTo: '/profil', // Chemin de redirection du bouton
                    delay: 5000 // Délai avant redirection automatique (si implémenté dans le composant confirmation)
                }
            });

        } catch (e) {
            console.warn("Erreur sauvegarde commande localStorage", e);
            // Utiliser le toast pour l'erreur de sauvegarde
            addToast({
                type: 'error',
                title: 'Erreur',
                message: "Une erreur est survenue lors de l'enregistrement de votre commande. Veuillez réessayer."
            });
        }
    };

    if (panier.length === 0) { // On ne garde que la vérification du panier vide
        return <div className="container py-5 text-center">Votre panier est vide. <Link to="/produits">Parcourir les produits</Link></div>;
    }

    return (
        <div className="container py-5">
            <h2 className="mb-4">Finaliser ma commande</h2>
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
                            <label className="form-label">Adresse de livraison</label>
                            <textarea
                                className="form-control"
                                name="adresse"
                                rows="3"
                                value={form.adresse}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-success w-100">
                            <i className="fas fa-check me-2"></i> Confirmer la commande
                        </button>
                    </form>
                </div>

                <div className="col-md-6">
                    <h4 className="mb-3">Récapitulatif</h4>
                    <ul className="list-group mb-3">
                        {panier.map((item, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-start">
                                <div>
                                    <strong>{item.nom}</strong>
                                    <div className="small text-muted">
                                        Quantité : {item.quantite}
                                        {item.options && Object.entries(item.options).map(([key, val]) => (
                                            <div key={key}> | {key}: {val}</div>
                                        ))}
                                    </div>
                                </div>
                                <span>{(item.prix * item.quantite).toLocaleString()} XOF</span>
                            </li>
                        ))}
                        <li className="list-group-item d-flex justify-content-between">
                            <span className="fw-bold">Total</span>
                            <span className="fw-bold text-success">{totalPanier.toLocaleString()} XOF</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}