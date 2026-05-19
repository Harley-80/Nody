import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './SectionAvisClients.scss';

export default function SectionAvisClients({
    avis,
    produitId,
    noteMoyenne,
    onAvisAjoute,
}) {
    const { utilisateur } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        note: 5,
        commentaire: '',
        titre: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Soumettre un avis
    const handleSubmitAvis = async e => {
        e.preventDefault();

        if (!utilisateur) {
            alert('Veuillez vous connecter pour laisser un avis');
            return;
        }

        setSubmitting(true);

        try {
            // TODO: Appel API pour poster l'avis
            // await produitsService.posterAvis(produitId, formData);

            // Simulation
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('Merci pour votre avis !');
            setShowForm(false);
            setFormData({ note: 5, commentaire: '', titre: '' });

            // Recharger les avis
            if (onAvisAjoute) {
                onAvisAjoute();
            }
        } catch (err) {
            console.error("Erreur lors de la soumission de l'avis:", err);
            alert("Erreur lors de l'envoi de votre avis");
        } finally {
            setSubmitting(false);
        }
    };

    // Distribution des notes
    const repartitionNotes = [5, 4, 3, 2, 1].map(note => {
        const count = avis.filter(a => Math.round(a.note) === note).length;
        const percentage = avis.length > 0 ? (count / avis.length) * 100 : 0;
        return { note, count, percentage };
    });

    return (
        <div className="section-avis-clients mt-5">
            <div className="avis-header">
                <h3 className="mb-4">
                    <i className="fas fa-comments me-2"></i>
                    Avis clients
                </h3>
            </div>

            <div className="row">
                {/* Résumé des notes */}
                <div className="col-lg-4 mb-4">
                    <div className="avis-resume">
                        <div className="note-globale">
                            <div className="note-chiffre">{noteMoyenne}</div>
                            <div className="note-etoiles">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <i
                                        key={star}
                                        className={`fas fa-star ${star <= Math.round(noteMoyenne) ? 'filled' : ''}`}
                                    ></i>
                                ))}
                            </div>
                            <div className="note-total">
                                Basé sur {avis.length} avis
                            </div>
                        </div>

                        {/* Répartition des notes */}
                        <div className="repartition-notes mt-4">
                            {repartitionNotes.map(
                                ({ note, count, percentage }) => (
                                    <div key={note} className="note-row">
                                        <span className="note-label">
                                            {note} ★
                                        </span>
                                        <div className="note-barre">
                                            <div
                                                className="note-barre-fill"
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <span className="note-count">
                                            {count}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Bouton pour laisser un avis */}
                        <button
                            className="btn btn-primary w-100 mt-4"
                            onClick={() => setShowForm(!showForm)}
                        >
                            <i className="fas fa-pen me-2"></i>
                            {showForm ? 'Annuler' : 'Écrire un avis'}
                        </button>
                    </div>
                </div>

                {/* Liste des avis */}
                <div className="col-lg-8">
                    {/* Formulaire d'ajout d'avis */}
                    {showForm && (
                        <div className="formulaire-avis mb-4">
                            <h5 className="mb-3">Votre avis</h5>
                            <form onSubmit={handleSubmitAvis}>
                                {/* Sélecteur de note */}
                                <div className="mb-3">
                                    <label className="form-label">Note *</label>
                                    <div className="note-selector">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star-btn ${star <= formData.note ? 'active' : ''}`}
                                                onClick={() =>
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        note: star,
                                                    }))
                                                }
                                            >
                                                <i className="fas fa-star"></i>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Titre */}
                                <div className="mb-3">
                                    <label className="form-label">
                                        Titre de votre avis *
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.titre}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                titre: e.target.value,
                                            }))
                                        }
                                        placeholder="Résumez votre avis en quelques mots"
                                        required
                                    />
                                </div>

                                {/* Commentaire */}
                                <div className="mb-3">
                                    <label className="form-label">
                                        Votre commentaire *
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        value={formData.commentaire}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                commentaire: e.target.value,
                                            }))
                                        }
                                        placeholder="Partagez votre expérience avec ce produit..."
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-success"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane me-2"></i>
                                            Publier mon avis
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Liste des avis */}
                    {avis.length > 0 ? (
                        <div className="liste-avis">
                            {avis.map((avisItem, index) => (
                                <div key={index} className="avis-card">
                                    <div className="avis-header-card">
                                        <div className="avis-auteur">
                                            <div className="auteur-avatar">
                                                {avisItem.auteur?.avatar ? (
                                                    <img
                                                        src={
                                                            avisItem.auteur
                                                                .avatar
                                                        }
                                                        alt={
                                                            avisItem.auteur.nom
                                                        }
                                                    />
                                                ) : (
                                                    <i className="fas fa-user"></i>
                                                )}
                                            </div>
                                            <div className="auteur-info">
                                                <div className="auteur-nom">
                                                    {avisItem.auteur?.nom ||
                                                        'Client anonyme'}
                                                </div>
                                                <div className="avis-date">
                                                    {new Date(
                                                        avisItem.date
                                                    ).toLocaleDateString(
                                                        'fr-FR',
                                                        {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="avis-note">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <i
                                                    key={star}
                                                    className={`fas fa-star ${star <= avisItem.note ? 'filled' : ''}`}
                                                ></i>
                                            ))}
                                        </div>
                                    </div>

                                    {avisItem.titre && (
                                        <h6 className="avis-titre">
                                            {avisItem.titre}
                                        </h6>
                                    )}

                                    <p className="avis-commentaire">
                                        {avisItem.commentaire}
                                    </p>

                                    {/* Badge "Achat vérifié" */}
                                    {avisItem.achatVerifie && (
                                        <div className="badge badge-verified">
                                            <i className="fas fa-check-circle me-1"></i>
                                            Achat vérifié
                                        </div>
                                    )}

                                    {/* Réactions */}
                                    <div className="avis-reactions">
                                        <button className="btn-reaction">
                                            <i className="fas fa-thumbs-up"></i>
                                            <span>
                                                Utile ({avisItem.utiles || 0})
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="aucun-avis">
                            <i className="fas fa-comments fa-3x mb-3"></i>
                            <p className="text-muted">
                                Aucun avis pour le moment
                            </p>
                            <p className="text-muted">
                                Soyez le premier à donner votre avis !
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}