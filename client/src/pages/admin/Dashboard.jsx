import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../../styles/AdminTable.scss';
import { STATUTS, getBadgeColor } from '../../constants/statuts';
import StatutLegend from '../../components/common/commandes/StatutLegend';
import { formatDateTimeFR } from '../../utils/dateUtils';
import BatchActions from '../../components/admin/BatchActions';

const normalizeStatut = (statut) => {
    const STATUTS_VALIDES = {
        'en_attente': 'En attente',
        'en_traitement': 'En traitement',
        'expediee': 'Expédiée',
        'livree': 'Livrée',
        'annulee': 'Annulée',
        'remboursee': 'Remboursée'
    };

    if (!statut) return 'en_attente';

    const statutNormalise = statut.toLowerCase()
        .replace(/[éèê]/g, 'e')
        .replace(/\s+/g, '_')
        .replace(/[àä]/g, 'a')
        .replace(/[îï]/g, 'i');

    return STATUTS_VALIDES[statutNormalise] ? statutNormalise : 'en_attente';
};

export default function Dashboard() {
    const [commandes, setCommandes] = useState([]);
    const [filtreTexte, setFiltreTexte] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [triPar, setTriPar] = useState('date');
    const [ordre, setOrdre] = useState('desc');
    const [selectedIds, setSelectedIds] = useState([]);
    const itemsPerPage = 5;

    const { user } = useAuth();
    const navigate = useNavigate();

    const parseDateSafely = useCallback((dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date.toISOString();
    }, []);

    // Chargement initial des commandes
    useEffect(() => {
        const saved = localStorage.getItem('nodyCommandes');
        if (saved) {
            try {
                const loadedCommandes = JSON.parse(saved).map(cmd => ({
                    ...cmd,
                    statut: normalizeStatut(cmd.statut),
                    date: parseDateSafely(cmd.date) || new Date().toISOString(),
                    id: cmd.id || Date.now() + Math.random().toString(36).substring(2, 9)
                }));

                const uniqueCommandes = [];
                const seenIds = new Set();
                let hasDuplicatesOnLoad = false;

                loadedCommandes.forEach(cmd => {
                    if (cmd.id && seenIds.has(cmd.id)) {
                        console.warn(`ID dupliqué détecté lors du chargement : ${cmd.id}. Création d'un nouvel ID.`);
                        hasDuplicatesOnLoad = true;
                        uniqueCommandes.push({
                            ...cmd,
                            id: Date.now() + Math.random().toString(36).substring(2, 9)
                        });
                    } else if (cmd.id) {
                        seenIds.add(cmd.id);
                        uniqueCommandes.push(cmd);
                    } else {
                        console.warn("Commande sans ID détectée lors du chargement. Création d'un nouvel ID.");
                        hasDuplicatesOnLoad = true;
                        uniqueCommandes.push({
                            ...cmd,
                            id: Date.now() + Math.random().toString(36).substring(2, 9)
                        });
                    }
                });

                if (hasDuplicatesOnLoad) {
                    console.info("IDs dupliqués corrigés après le chargement initial.");
                    localStorage.setItem('nodyCommandes', JSON.stringify(uniqueCommandes));
                }

                setCommandes(uniqueCommandes);
            } catch (error) {
                console.error("Erreur lors du chargement ou de la parsing des commandes:", error);
            }
        }
    }, [parseDateSafely]);

    // Vérification des doublons
    useEffect(() => {
        const currentIds = commandes.map(c => c.id);
        const hasDuplicates = new Set(currentIds).size !== currentIds.length;
        if (hasDuplicates) {
            console.error("⚠️ ATTENTION : IDs dupliqués détectés dans l'état actuel des commandes !");
        }
    }, [commandes]);

    // Gestion des sélections
    const clearSelection = useCallback(() => setSelectedIds([]), []);

    const supprimerSelection = useCallback(() => {
        if (!selectedIds.length) return;
        if (!window.confirm(`Confirmer la suppression de ${selectedIds.length} commande(s) ?`)) return;

        const restantes = commandes.filter(c => !selectedIds.includes(c.id));
        setCommandes(restantes);
        localStorage.setItem('nodyCommandes', JSON.stringify(restantes));
        clearSelection();
    }, [commandes, selectedIds, clearSelection]);

    const changerStatutSelection = useCallback((statut) => {
        if (!selectedIds.length) return;
        const misesAJour = commandes.map(c =>
            selectedIds.includes(c.id) ? { ...c, statut: normalizeStatut(statut) } : c
        );
        setCommandes(misesAJour);
        localStorage.setItem('nodyCommandes', JSON.stringify(misesAJour));
        clearSelection();
    }, [commandes, selectedIds, clearSelection]);

    const handleCommandeStatutChange = useCallback((idCommande, nouveauStatut) => {
        setCommandes(prevCommandes => {
            const updatedCommandes = prevCommandes.map(cmd =>
                cmd.id === idCommande
                    ? { ...cmd, statut: normalizeStatut(nouveauStatut) }
                    : cmd
            );
            localStorage.setItem('nodyCommandes', JSON.stringify(updatedCommandes));
            return updatedCommandes;
        });
        setSelectedIds(prev => prev.filter(id => id !== idCommande));
    }, []);

    const supprimerCommande = useCallback((idCommande) => {
        if (window.confirm('Confirmer la suppression de cette commande ?')) {
            const nouvelles = commandes.filter(cmd => cmd.id !== idCommande);
            setCommandes(nouvelles);
            localStorage.setItem('nodyCommandes', JSON.stringify(nouvelles));
            clearSelection();
        }
    }, [commandes, clearSelection]);

    const exporterCommandesCSV = useCallback(() => {
        if (!commandes.length) return;

        const rows = commandes.map(cmd => ({
            Client: cmd.client?.nom || 'Inconnu',
            Email: cmd.client?.email || 'N/A',
            Adresse: cmd.client?.adresse || 'N/A',
            Date: cmd.date ? formatDateTimeFR(cmd.date) : 'N/A',
            Statut: STATUTS[cmd.statut] || 'Statut inconnu',
            Total: `${cmd.total?.toLocaleString('fr-FR')} XOF`,
            Produits: cmd.produits?.map(p => `${p.quantite}x ${p.nom} (${p.prix?.toLocaleString('fr-FR')} XOF)`).join('; ') || 'Aucun produit'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Commandes');
        const blob = new Blob(
            [XLSX.write(wb, { bookType: 'xlsx', type: 'array' })],
            { type: 'application/octet-stream' }
        );
        saveAs(blob, `commandes_nody_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }, [commandes]);

    // Filtrage et tri des commandes
    const commandesFiltrees = useMemo(() => {
        const recherche = filtreTexte.toLowerCase().trim();
        return commandes.filter(c => {
            const clientNom = c.client?.nom?.toLowerCase() || '';
            const clientEmail = c.client?.email?.toLowerCase() || '';
            const clientAdresse = c.client?.adresse?.toLowerCase() || '';
            const dateFormatted = c.date ? formatDateTimeFR(cmd.date).toLowerCase() : '';
            const statutNormalise = (c.statut || 'en_attente').toLowerCase();
            const produitsList = c.produits?.map(p => p.nom?.toLowerCase()).join(' ') || '';

            const matchesText = !recherche ||
                clientNom.includes(recherche) ||
                clientEmail.includes(recherche) ||
                clientAdresse.includes(recherche) ||
                dateFormatted.includes(recherche) ||
                statutNormalise.includes(recherche) ||
                produitsList.includes(recherche);

            const matchesStatut = !filtreStatut || statutNormalise === filtreStatut;

            return matchesText && matchesStatut;
        });
    }, [commandes, filtreTexte, filtreStatut]);

    const commandesTriees = useMemo(() => {
        return [...commandesFiltrees].sort((a, b) => {
            if (triPar === 'total') {
                const totalA = a.total || 0;
                const totalB = b.total || 0;
                return ordre === 'asc' ? totalA - totalB : totalB - totalA;
            }
            if (triPar === 'date') {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
                return ordre === 'asc'
                    ? dateA.getTime() - dateB.getTime()
                    : dateB.getTime() - dateA.getTime();
            }
            return 0;
        });
    }, [commandesFiltrees, triPar, ordre]);

    // Pagination
    const totalPages = Math.ceil(commandesTriees.length / itemsPerPage);
    const commandesPage = commandesTriees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Gestion de la sélection
    const isAllSelected = commandesPage.length > 0 && selectedIds.length === commandesPage.length && commandesPage.every(cmd => selectedIds.includes(cmd.id));
    const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

    if (!user?.isAdmin) return <Navigate to="/admin-login" />;

    return (
        <div className="container py-5 admin-table">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    Dashboard – Commandes <span className="badge bg-primary">{commandes.length}</span>
                </h2>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => navigate('/admin/produits')}
                    >
                        <i className="bi bi-box-seam me-1"></i> Gestion Produits
                    </button>
                    <button
                        className="btn btn-success"
                        onClick={exporterCommandesCSV}
                        disabled={!commandes.length}
                    >
                        <i className="bi bi-file-earmark-excel me-1"></i> Exporter
                    </button>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <BatchActions
                    selectedCount={selectedIds.length}
                    onDelete={supprimerSelection}
                    onChangeStatus={changerStatutSelection}
                />
            )}

            <div className="filters-container mb-4 p-3 bg-light rounded">
                <div className="row g-3">
                    <div className="col-md-6">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filtrer par texte (client, email, adresse, date, statut, produits)..."
                            value={filtreTexte}
                            onChange={(e) => {
                                setFiltreTexte(e.target.value);
                                setCurrentPage(1);
                                clearSelection();
                            }}
                        />
                    </div>
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={filtreStatut}
                            onChange={e => {
                                setFiltreStatut(e.target.value);
                                setCurrentPage(1);
                                clearSelection();
                            }}
                        >
                            <option value="">Tous les statuts</option>
                            {Object.entries(STATUTS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3 d-flex gap-2">
                        <select
                            className="form-select flex-grow-1"
                            value={triPar}
                            onChange={e => {
                                setTriPar(e.target.value);
                                clearSelection();
                            }}
                        >
                            <option value="date">Date</option>
                            <option value="total">Montant</option>
                        </select>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                setOrdre(prev => (prev === 'asc' ? 'desc' : 'asc'));
                                clearSelection();
                            }}
                            title={ordre === 'asc' ? 'Croissant' : 'Décroissant'}
                        >
                            {ordre === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>

            <StatutLegend className="mb-4" />

            {commandesFiltrees.length === 0 ? (
                <div className="alert alert-info">
                    {commandes.length === 0
                        ? "Aucune commande enregistrée"
                        : "Aucune commande ne correspond aux filtres"}
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: 40 }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={isAllSelected}
                                            ref={el => {
                                                if (el) el.indeterminate = isIndeterminate;
                                            }}
                                            onChange={() => {
                                                if (isAllSelected) {
                                                    setSelectedIds(prev => prev.filter(id => !commandesPage.map(c => c.id).includes(id)));
                                                } else {
                                                    setSelectedIds(prev => [...new Set([...prev, ...commandesPage.map(c => c.id)])]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th>#</th>
                                    <th>Client</th>
                                    <th>Date</th>
                                    <th>Email</th>
                                    <th>Adresse</th>
                                    <th>Statut</th>
                                    <th>Total</th>
                                    <th>Produits</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commandesPage.map((cmd, index) => {
                                    const effectiveKey = cmd.id || `temp-idx-${(currentPage - 1) * itemsPerPage + index}`;
                                    const globalIndex = (currentPage - 1) * itemsPerPage + index;
                                    const currentStatut = cmd.statut || 'en_attente';

                                    return (
                                        <tr key={effectiveKey}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedIds.includes(cmd.id)}
                                                    onChange={() =>
                                                        setSelectedIds(prev =>
                                                            prev.includes(cmd.id)
                                                                ? prev.filter(id => id !== cmd.id)
                                                                : [...prev, cmd.id]
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>{globalIndex + 1}</td>
                                            <td>{cmd.client?.nom || 'Client inconnu'}</td>
                                            <td>{cmd.date ? formatDateTimeFR(cmd.date) : 'N/A'}</td>
                                            <td>{cmd.client?.email || 'Non renseigné'}</td>
                                            <td>{cmd.client?.adresse || 'Non renseignée'}</td>
                                            <td>
                                                <span className={`badge ${getBadgeColor(currentStatut)}`}>
                                                    {STATUTS[currentStatut] || `Inconnu (${cmd.statut})`}
                                                </span>
                                                <div className="mt-2">
                                                    <select
                                                        id={`statut-select-${cmd.id}`}
                                                        value={currentStatut}
                                                        onChange={(e) => handleCommandeStatutChange(cmd.id, e.target.value)}
                                                        className="form-select form-select-sm"
                                                        aria-label="Modifier le statut de la commande"
                                                    >
                                                        {Object.entries(STATUTS).map(([key, label]) => (
                                                            <option key={key} value={key}>{label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td>{cmd.total?.toLocaleString('fr-FR')} XOF</td>
                                            <td>
                                                <ul className="list-unstyled mb-0 d-flex flex-wrap align-items-center gap-2">
                                                    {cmd.produits?.map((p, pIdx) => (
                                                        <li key={`prod-${effectiveKey}-${pIdx}`} className="d-flex align-items-center gap-1">
                                                            {p.image && (
                                                                <img
                                                                    src={p.image}
                                                                    alt={p.nom}
                                                                    className="img-thumbnail"
                                                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                                    loading="lazy"
                                                                />
                                                            )}
                                                            <span>{p.quantite}x {p.nom}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            localStorage.setItem('nodyCommandeActive', JSON.stringify(cmd));
                                                            navigate('/commande-detail');
                                                        }}
                                                    >
                                                        <i className="bi bi-eye me-1"></i> Détail
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => supprimerCommande(cmd.id)}
                                                    >
                                                        <i className="bi bi-trash me-1"></i> Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-4">
                            <button
                                className="btn btn-outline-primary"
                                disabled={currentPage === 1}
                                onClick={() => {
                                    setCurrentPage(p => p - 1);
                                    clearSelection();
                                }}
                            >
                                <i className="bi bi-chevron-left"></i> Précédent
                            </button>
                            <span className="text-muted">
                                Page {currentPage} sur {totalPages}
                            </span>
                            <button
                                className="btn btn-outline-primary"
                                disabled={currentPage === totalPages}
                                onClick={() => {
                                    setCurrentPage(p => p + 1);
                                    clearSelection();
                                }}
                            >
                                Suivant <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}