import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * Page Profil - Affiche l'historique des commandes de l'utilisateur
 * Protégée par une vérification d'authentification
 */
export default function Profil() {
    const { user } = useAuth();
    const [commandes, setCommandes] = useState([]);

    // Redirection si non connecté
    if (!user) {
        return <Navigate to="/connexion" replace />;
    }

    // Chargement des commandes depuis le localStorage
    useEffect(() => {
        try {
            const sauvegarde = localStorage.getItem('nodyCommandes');
            if (sauvegarde) {
                // Filtrage pour ne montrer que les commandes de l'utilisateur actuel
                const toutesCommandes = JSON.parse(sauvegarde);
                const commandesUtilisateur = toutesCommandes.filter(
                    cmd => cmd.client.email === user.email
                );
                setCommandes(commandesUtilisateur);
            }
        } catch (e) {
            console.warn("Erreur chargement commandes", e);
        }
    }, [user]); // Dépendance à user pour recharger si l'utilisateur change

    if (commandes.length === 0) {
        return (
            <div className="container py-5 text-center">
                <h2>Bienvenue sur votre profil 👤</h2>
                <p className="lead">Aucune commande enregistrée.</p>
            </div>
        );
    }

    const { logout } = useAuth();
    const { addToast } = useToast();

    const handleDeactivate = () => {
        logout();
        addToast({
            type: 'info',
            title: 'Compte désactivé',
            message: 'Votre compte a été déconnecté temporairement.'
        });
        navigate('/');
    };
    return (
        <div className="container py-5">
            <h2 className="mb-4">Historique de vos commandes</h2>
            <div className="accordion" id="commandesAccordion">
                {commandes.map((commande, index) => (
                    <div className="accordion-item" key={index}>
                        <h2 className="accordion-header" id={`heading${index}`}>
                            <button 
                                className="accordion-button collapsed"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#collapse${index}`}
                            >
                                Commande du {commande.date} — {commande.total.toLocaleString()} XOF
                            </button>
                        </h2>
                        <div
                            id={`collapse${index}`}
                            className="accordion-collapse collapse"
                            data-bs-parent="#commandesAccordion"
                        >
                            <div className="accordion-body">
                                <p><strong>Nom :</strong> {commande.client.nom}</p>
                                <p><strong>Email :</strong> {commande.client.email}</p>
                                <p><strong>Téléphone :</strong> {commande.client.telephone}</p>
                                <p><strong>Adresse :</strong> {commande.client.adresse}</p>
                                <hr />
                                <h6>Produits commandés :</h6>
                                <ul>
                                    {commande.produits.map((p, i) => (
                                        <li key={i}>
                                            {p.quantite} x {p.nom} ({Object.entries(p.options || {}).map(([k, v]) => `${k}: ${v}`).join(', ')})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}