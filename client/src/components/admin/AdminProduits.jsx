import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { produitsMock } from '../../data/produits.data';
import ResponsiveTable from '../../components/admin/ResponsiveTable';
import BatchActions from '../../components/admin/BatchActions';
import useSyncFilters from '../../hooks/useSyncFilters';
import { saveAs } from 'file-saver';

export default function AdminProduits() {
    const navigate = useNavigate();
    
    const [produits, setProduits] = useState(() => {
        const saved = localStorage.getItem('nodyProduits');
        return saved ? JSON.parse(saved) : produitsMock;
    });

    // Sauvegarde automatique
    useEffect(() => {
        localStorage.setItem('nodyProduits', JSON.stringify(produits));
    }, [produits]);

    const [filters, setFilters] = useSyncFilters({
        search: '',
        category: '',
        minPrix: '',
        maxPrix: '',
        page: 1,
    });

    const { search, category, minPrix, maxPrix, page } = filters;

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [devise, setDevise] = useState('XOF');
    const [selectedIds, setSelectedIds] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const tauxConversion = 655.957;
    const itemsPerPage = 5;

    const categoriesUniques = [...new Set(produits.map(p => p.categories))];

    const formatPrix = (prix) =>
    devise === 'XOF'
    ? `${prix.toLocaleString()} XOF`
    : `${(prix / tauxConversion).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

    const produitsFiltres = useMemo(() => {
        let resultats = [...produits];

        if (search) {
            resultats = resultats.filter(p =>
                p.nom.toLowerCase().includes(search.toLowerCase()) ||
                p.description?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (category) {
            resultats = resultats.filter(p => p.categories.includes(category));
        }
        if (minPrix) {
            resultats = resultats.filter(p => p.prix >= parseInt(minPrix));
        }
        if (maxPrix) {
            resultats = resultats.filter(p => p.prix <= parseInt(maxPrix));
        }
        if (sortConfig.key) {
            resultats.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return resultats;
    }, [produits, search, category, minPrix, maxPrix, sortConfig]);

    const totalPages = Math.ceil(produitsFiltres.length / itemsPerPage);
    const produitsPage = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return produitsFiltres.slice(start, start + itemsPerPage);
    }, [produitsFiltres, page]);

    const requestSort = (key) =>
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));

        const updateFilter = (key, value) =>
            setFilters({ ...filters, [key]: value, page: 1 });

        const resetFilters = () =>
            setFilters({ search: '', category: '', minPrix: '', maxPrix: '', page: 1 });

        const handleBulkDelete = () => {
            if (window.confirm(`Supprimer ${selectedIds.length} produit(s) ?`)) {
                setProduits(prev => prev.filter(p => !selectedIds.includes(p.id)));
                setSelectedIds([]);
            }
        };

    const handleBulkStatusChange = (statut) => {
        setProduits(prev => prev.map(p => 
            selectedIds.includes(p.id) ? { ...p, statut } : p
        ));
        setSelectedIds([]);
    };

    const handleExportCSV = () => {
        const csvContent = [
            'ID,Nom,Catégorie,Prix,Stock,Statut',
            ...produits.map(p => 
                `${p.id},${p.nom},${p.categories},${p.prix},${p.stock},${p.statut}`
            )
        ].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `produits_nody_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const tableColumns = [
        {
            key: 'select',
            header: (
                <input
                    type="checkbox"
                    checked={produitsPage.length > 0 && produitsPage.every(p => selectedIds.includes(p.id))}
                    onChange={(e) => {
                        const ids = produitsPage.map(p => p.id);
                        setSelectedIds(current =>
                        e.target.checked
                            ? [...new Set([...current, ...ids])]
                            : current.filter(id => !ids.includes(id))
                        );
                    }}
                />
            ),
            width: '40px',
            render: (item) => (
                <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() =>
                        setSelectedIds(prev =>
                        prev.includes(item.id)
                            ? prev.filter(id => id !== item.id)
                            : [...prev, item.id]
                        )
                    }
                />
            )
        },
        { key: 'id', header: 'ID', sortable: true, width: '80px' },
        { key: 'nom', header: 'Nom', sortable: true, width: '25%' },
        { key: 'categories', header: 'Catégorie', sortable: true, width: '15%' },
        {
            key: 'prix',
            header: `Prix (${devise})`,
            ortable: true,
            width: '15%',
            render: (item) => formatPrix(item.prix)
        },
        {
            key: 'stock',
            header: 'Stock',
            sortable: true,
            width: '100px',
            render: (item) => (
                <span className={item.stock < 10 ? 'text-danger fw-bold' : ''}>
                {item.stock}
                </span>
            )
        },
        {
            key: 'statut',
            header: 'Statut',
            sortable: true,
            width: '100px',
            render: (item) => (
                <span
                className={`badge ${
                    item.statut === 'actif' ? 'bg-success' : item.statut === 'inactif' ? 'bg-secondary' : 'bg-warning'
                }`}
                >
                {item.statut || 'actif'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            actions: true,
            width: '120px',
            render: (item) => (
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => console.log('Éditer', item.id)}
                        title="Éditer"
                    >
                        <i className="bi bi-pencil" />
                    </button>
                    <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => console.log('Supprimer', item.id)}
                        title="Supprimer"
                    >
                        <i className="bi bi-trash" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="container py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div className="d-flex align-items-center gap-3">
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/admin')}
                    >
                        <i className="bi bi-arrow-left me-1"></i> Retour
                    </button>
                    <h2 className="mb-0">Gestion des Produits</h2>
                </div>

                <div className="d-flex gap-2">
                    <button onClick={handleExportCSV} className="btn btn-success">
                        <i className="bi bi-file-earmark-excel me-1" /> Exporter
                    </button>
                    <button onClick={() => console.log('Ajouter')} className="btn btn-primary">
                        <i className="bi bi-plus-circle me-1" /> Ajouter
                    </button>
                    <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline-secondary">
                        <i className={`bi bi-funnel${showFilters ? '-fill' : ''} me-1`} /> Filtres
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Recherche</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nom ou description..."
                                    value={search}
                                    onChange={e => updateFilter('search', e.target.value)}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Catégorie</label>
                                <select
                                    className="form-select"
                                    value={category}
                                    onChange={e => updateFilter('category', e.target.value)}
                                >
                                    <option value="">Toutes catégories</option>
                                    {categoriesUniques.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            {showAdvanced && (
                                <>
                                    <div className="col-md-6">
                                        <label className="form-label">Prix minimum ({devise})</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-control"
                                            placeholder="Prix min"
                                            value={minPrix}
                                            onChange={e => updateFilter('minPrix', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Prix maximum ({devise})</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-control"
                                            placeholder="Prix max"
                                            value={maxPrix}
                                            onChange={e => updateFilter('maxPrix', e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="col-12 d-flex justify-content-between">
                                <button className="btn btn-sm btn-link" onClick={() => setShowAdvanced(!showAdvanced)}>
                                    {showAdvanced ? 'Moins de filtres' : 'Plus de filtres'}...
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={resetFilters}>
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">{produitsFiltres.length} produit(s) trouvé(s)</p>
                <select className="form-select form-select-sm w-auto" value={devise} onChange={e => setDevise(e.target.value)}>
                    <option value="XOF">XOF</option>
                    <option value="EUR">EUR</option>
                </select>
            </div>

            {selectedIds.length > 0 && (
                <BatchActions
                    count={selectedIds.length}
                    onDelete={handleBulkDelete}
                    onStatusChange={handleBulkStatusChange}
                    className="mb-3"
                />
            )}

            <div className="card">
                <div className="card-body p-0">
                    <ResponsiveTable
                        columns={tableColumns}
                        data={produitsPage}
                        sortConfig={sortConfig}
                        onSort={requestSort}
                        emptyMessage="Aucun produit trouvé"
                    />
                </div>
            </div>

            {totalPages > 1 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 gap-2">
                    <span className="text-muted">Page {page} sur {totalPages}</span>
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary" onClick={() => updateFilter('page', 1)} disabled={page <= 1}>
                            <i className="bi bi-chevron-bar-left"></i>
                        </button>
                        <button className="btn btn-outline-primary" onClick={() => updateFilter('page', page - 1)} disabled={page <= 1}>
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            const pageNum =
                                page <= 3 ? i + 1
                                : page >= totalPages - 2 ? totalPages - 4 + i
                                : page - 2 + i;
                                return pageNum >= 1 && pageNum <= totalPages ? (
                                    <button
                                        key={i}
                                        className={`btn ${page === pageNum ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => updateFilter('page', pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                ) : null;
                        })}
                        <button className="btn btn-outline-primary" onClick={() => updateFilter('page', page + 1)} disabled={page >= totalPages}>
                            <i className="bi bi-chevron-right"></i>
                        </button>
                        <button className="btn btn-outline-primary" onClick={() => updateFilter('page', totalPages)} disabled={page >= totalPages}>
                            <i className="bi bi-chevron-bar-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}