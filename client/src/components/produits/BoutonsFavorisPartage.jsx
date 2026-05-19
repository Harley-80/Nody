import React from 'react';
import './BoutonsFavorisPartage.scss';

export default function BoutonsFavorisPartage({
    isFavorite,
    onToggleFavorite,
    produit,
}) {
    // Partager sur les réseaux sociaux
    const handlePartage = platform => {
        const url = window.location.href;
        const texte = `Découvrez ${produit.nom} sur Nody E-commerce`;

        let partageUrl = '';

        switch (platform) {
            case 'facebook':
                partageUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'twitter':
                partageUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texte)}`;
                break;
            case 'whatsapp':
                partageUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(texte + ' ' + url)}`;
                break;
            case 'linkedin':
                partageUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'copier':
                navigator.clipboard.writeText(url).then(() => {
                    alert('Lien copié dans le presse-papier !');
                });
                return;
            default:
                return;
        }

        if (partageUrl) {
            window.open(partageUrl, '_blank', 'width=600,height=400');
        }
    };

    return (
        <div className="boutons-favoris-partage">
            {/* Bouton Favoris */}
            <button
                className={`btn-action btn-favoris ${isFavorite ? 'active' : ''}`}
                onClick={onToggleFavorite}
                title={
                    isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
                }
            >
                <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
                <span className="btn-label">
                    {isFavorite ? 'Favori' : 'Favoris'}
                </span>
            </button>

            {/* Bouton Partager (Dropdown) */}
            <div className="dropdown">
                <button
                    className="btn-action btn-partage dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    title="Partager ce produit"
                >
                    <i className="fas fa-share-alt"></i>
                    <span className="btn-label">Partager</span>
                </button>

                <ul className="dropdown-menu dropdown-menu-end partage-menu">
                    <li>
                        <button
                            className="dropdown-item"
                            onClick={() => handlePartage('facebook')}
                        >
                            <i className="fab fa-facebook text-primary"></i>
                            Facebook
                        </button>
                    </li>
                    <li>
                        <button
                            className="dropdown-item"
                            onClick={() => handlePartage('twitter')}
                        >
                            <i className="fab fa-twitter text-info"></i>
                            Twitter
                        </button>
                    </li>
                    <li>
                        <button
                            className="dropdown-item"
                            onClick={() => handlePartage('whatsapp')}
                        >
                            <i className="fab fa-whatsapp text-success"></i>
                            WhatsApp
                        </button>
                    </li>
                    <li>
                        <button
                            className="dropdown-item"
                            onClick={() => handlePartage('linkedin')}
                        >
                            <i className="fab fa-linkedin text-primary"></i>
                            LinkedIn
                        </button>
                    </li>
                    <li>
                        <hr className="dropdown-divider" />
                    </li>
                    <li>
                        <button
                            className="dropdown-item"
                            onClick={() => handlePartage('copier')}
                        >
                            <i className="fas fa-link text-secondary"></i>
                            Copier le lien
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
}