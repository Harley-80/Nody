import React, { useEffect, useState, useCallback } from 'react';
import CommandeCard from '../components/common/commandes/CommandeCard';
import { useNavigate } from 'react-router-dom';
import '../styles/CommandeClient.scss';
import { exporterMesCommandesExcel } from '../utils/exportClientCommandes';

export default function MesCommandes() {
    const [commandes, setCommandes] = useState([]);
    const [recherche, setRecherche] = useState('');
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const parPage = 5;
    const navigate = useNavigate();

    useEffect(() => {
        const chargerCommandes = () => {
            try {
                const saved = localStorage.getItem('nodyCommandes');
                if (saved) {
                    const commandesParsees = JSON.parse(saved);
                    setCommandes(Array.isArray(commandesParsees) ? commandesParsees : []);
                }
            } catch (e) {
                console.error("Erreur lors du chargement des commandes :", e);
                setCommandes([]);
            } finally {
                setIsLoading(false);
            }
        };

        setIsLoading(true);
        chargerCommandes();
    }, []);

    const voirDetail = useCallback((commande) => {
        try {
            localStorage.setItem('nodyCommandeActive', JSON.stringify(commande));
            navigate('/commande-detail');
        } catch (e) {
            console.error("Erreur navigation détail :", e);
            alert("Une erreur est survenue lors de l'affichage des détails.");
        }
    }, [navigate]);

    const commandesFiltrees = commandes.filter(cmd => {
        const termesRecherche = [
            cmd.client?.nom || '',
            cmd.date || '',
            ...(cmd.produits || []).map(p => p.nom || '')
        ].join(' ').toLowerCase();
        
        return termesRecherche.includes(recherche.toLowerCase());
    });

    const totalPages = Math.max(1, Math.ceil(commandesFiltrees.length / parPage));
    const indexDebut = (page - 1) * parPage;
    const commandesPage = commandesFiltrees.slice(indexDebut, indexDebut + parPage);

    useEffect(() => {
        if (page > totalPages && totalPages > 0) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    return (
        <div className="mes-commandes-container">
            <div className="mes-commandes-header">
                <h1>Mes commandes</h1>
                {commandes.length > 0 && (
                    <button
                        className="export-button"
                        onClick={() => exporterMesCommandesExcel(commandes)}
                        aria-label="Exporter mes commandes en Excel"
                    >
                        <i className="bi bi-file-earmark-excel"></i>
                        <span>Exporter</span>
                    </button>
                )}
            </div>

            <div className="search-section">
                <div className="search-input-container">
                    <i className="bi bi-search search-icon"></i>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Rechercher une commande..."
                        value={recherche}
                        onChange={(e) => {
                            setRecherche(e.target.value);
                            setPage(1);
                        }}
                        aria-label="Rechercher dans mes commandes"
                    />
                </div>
                <div className="results-count">
                    {commandesFiltrees.length} résultat{commandesFiltrees.length !== 1 ? 's' : ''}
                </div>
            </div>

            {isLoading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Chargement de vos commandes...</p>
                </div>
            ) : commandes.length === 0 ? (
                <div className="empty-state">
                    <i className="bi bi-cart"></i>
                    <h3>Aucune commande passée</h3>
                    <p>Vous n'avez pas encore passé de commande.</p>
                </div>
            ) : commandesFiltrees.length === 0 ? (
                <div className="empty-state">
                    <i className="bi bi-search"></i>
                    <h3>Aucun résultat</h3>
                    <p>Aucune commande ne correspond à votre recherche.</p>
                </div>
            ) : (
                <>
                    <div className="commandes-grid">
                        {commandesPage.map((cmd, i) => (
                            <div key={`${cmd.id || i}-${indexDebut}`} className="commande-item">
                                <CommandeCard commande={cmd} />
                                <button 
                                    className="detail-button"
                                    onClick={() => voirDetail(cmd)}
                                    aria-label={`Voir le détail de la commande ${cmd.id}`}
                                >
                                    <span>Voir détails</span>
                                    <i className="bi bi-arrow-right"></i>
                                </button>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button
                                className="pagination-button prev"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                aria-label="Page précédente"
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>
                            
                            <div className="page-numbers">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`page-number ${page === i + 1 ? 'active' : ''}`}
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            
                            <button
                                className="pagination-button next"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                aria-label="Page suivante"
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}