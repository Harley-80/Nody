import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

export default function Panier() {
    const { panier, supprimerDuPanier, totalPanier } = useCart();

    const handleRemove = (id, options) => {
        supprimerDuPanier(id, options);
    };

    if (panier.length === 0) {
        return (
            <div className="container py-5 text-center">
                <h2>Votre panier est vide 🛒</h2>
                <p className="lead">Découvrez nos <Link to="/produits">produits</Link> et commencez vos achats.</p>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <h2 className="mb-4">Mon panier</h2>
            <div className="table-responsive">
                <table className="table align-middle">
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Variations</th>
                            <th>Quantité</th>
                            <th>Prix unitaire</th>
                            <th>Sous-total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {panier.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={item.image}
                                            alt={item.nom}
                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                            className="me-2 rounded"
                                        />
                                        <span>{item.nom}</span>
                                    </div>
                                </td>
                                <td>
                                    {item.options &&
                                    Object.entries(item.options).map(([key, val]) => (
                                        <div key={key}>
                                            <small className="text-muted">{key} :</small> {val}
                                        </div>
                                    ))}
                                </td>
                                <td>{item.quantite}</td>
                                <td>{item.prix.toLocaleString()} XOF</td>
                                <td className="fw-bold text-primary">{(item.prix * item.quantite).toLocaleString()} XOF</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleRemove(item.id, item.options)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="4" className="text-end fw-bold fs-5">Total :</td>
                            <td className="fw-bold fs-5 text-success">{totalPanier.toLocaleString()} XOF</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div className="text-end mt-4">
                <Link to="/paiement" className="btn btn-success btn-lg">
                    <i className="fas fa-credit-card me-2"></i> Passer au paiement
                </Link>
            </div>
        </div>
    );
}
