import React, { useState, useEffect, useMemo } from 'react';
import { useConfirmModal } from '../../../contexts/ConfirmModalContext';
import axios from 'axios';
import './Produits.scss';

// CONFIGURATION DE L'URL DU BACKEND
const API_BASE_URL = 'http://localhost:5000';

// FONCTION POUR FORMATTER LES URLs D'IMAGES
const formatImageUrl = imageUrl => {
    if (!imageUrl) return null;

    // Si l'URL est déjà complète, ne rien faire
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // Ajouter le préfixe backend pour les URLs relatives
    return `${API_BASE_URL}${imageUrl}`;
};

// Composant principal de la page Produits
const Produits = () => {
    const { confirm } = useConfirmModal();
    const [produits, setProduits] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoriesPlat, setCategoriesPlat] = useState([]); // Pour le formulaire
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentProduit, setCurrentProduit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategorie, setFilterCategorie] = useState('');
    const [filterStatut, setFilterStatut] = useState('');
    const [filterMinPrix, setFilterMinPrix] = useState('');
    const [filterMaxPrix, setFilterMaxPrix] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({
        key: 'nom',
        direction: 'asc',
    });

    // Gestion des devises
    const [devise, setDevise] = useState('XOF');
    const devises = {
        XOF: { nom: 'Franc CFA (XOF)', symbole: 'CFA', taux: 1 },
        XAF: { nom: 'Franc CFA (XAF)', symbole: 'CFA', taux: 1 },
        EUR: { nom: 'Euro (EUR)', symbole: '€', taux: 655.957 },
        USD: { nom: 'Dollar US (USD)', symbole: '$', taux: 600 },
    };

    const [stats, setStats] = useState({
        total: 0,
        actifs: 0,
        enRupture: 0,
        brouillons: 0,
    });

    // Données du formulaire
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        prix: '',
        quantite: '',
        categorie: '',
        images: [],
        estActif: true,
        poids: '',
        dimensions: { longueur: '', largeur: '', hauteur: '' },
        marque: '',
        etiquettes: [],
    });

    const [errors, setErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        fetchProduits();
        fetchCategories();
        fetchStats();
    }, []);

    // Filtrage et tri côté client pour meilleure réactivité
    const produitsFiltres = useMemo(() => {
        let resultats = [...produits];

        // Recherche
        if (searchTerm) {
            resultats = resultats.filter(
                p =>
                    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
        }

        // Filtre catégorie
        if (filterCategorie) {
            resultats = resultats.filter(
                p => p.categorie?._id === filterCategorie
            );
        }

        // Filtre statut
        if (filterStatut) {
            if (filterStatut === 'actif') {
                resultats = resultats.filter(p => p.estActif === true);
            } else if (filterStatut === 'inactif') {
                resultats = resultats.filter(p => p.estActif === false);
            }
        }

        // Filtre prix min
        if (filterMinPrix) {
            resultats = resultats.filter(
                p => p.prix >= parseInt(filterMinPrix)
            );
        }

        // Filtre prix max
        if (filterMaxPrix) {
            resultats = resultats.filter(
                p => p.prix <= parseInt(filterMaxPrix)
            );
        }

        // Tri
        if (sortConfig.key) {
            resultats.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Cas spécial pour la catégorie
                if (sortConfig.key === 'categorie') {
                    aValue = a.categorie?.nom || '';
                    bValue = b.categorie?.nom || '';
                }

                if (aValue < bValue)
                    return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue)
                    return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return resultats;
    }, [
        produits,
        searchTerm,
        filterCategorie,
        filterStatut,
        filterMinPrix,
        filterMaxPrix,
        sortConfig,
    ]);

    // Pagination côté client
    const itemsPerPage = 10;
    const produitsPage = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        const calculatedTotalPages = Math.ceil(
            produitsFiltres.length / itemsPerPage
        );
        setTotalPages(calculatedTotalPages);
        return produitsFiltres.slice(start, start + itemsPerPage);
    }, [produitsFiltres, page]);

    // Chargement des produits
    const fetchProduits = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/produits`, {
                params: { limite: 100 },
            });

            const produitsData =
                response.data.donnees || response.data.produits || [];
            console.log('Produits chargés:', produitsData.length);
            setProduits(produitsData);
            setLoading(false);
        } catch (error) {
            console.error('Erreur chargement produits:', error);
            console.error('Détails erreur:', error.response?.data);
            showAlert('error', 'Erreur lors du chargement des produits');
            setProduits([]);
            setLoading(false);
        }
    };

    // Chargement des catégories depuis le backend
    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/categories`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const categoriesData = response.data.donnees || response.data || [];
            console.log('Catégories chargées:', categoriesData.length);
            setCategories(categoriesData);

            // Aplatir l'arbre hiérarchique pour le formulaire
            const aplatirCategories = (cats, niveau = 0) => {
                let resultat = [];
                cats.forEach(cat => {
                    resultat.push({
                        _id: cat._id,
                        nom: '—'.repeat(niveau) + ' ' + cat.nom,
                        niveau: niveau,
                    });
                    if (cat.sousCategories && cat.sousCategories.length > 0) {
                        resultat = resultat.concat(
                            aplatirCategories(cat.sousCategories, niveau + 1)
                        );
                    }
                });
                return resultat;
            };

            setCategoriesPlat(aplatirCategories(categoriesData));
        } catch (error) {
            console.error('Erreur chargement catégories:', error);
            setCategories([]);
            setCategoriesPlat([]);
        }
    };

    // Chargement des statistiques
    const fetchStats = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/produits/stats`
            );
            console.log('Statistiques chargées:', response.data);
            setStats(response.data);
        } catch (error) {
            console.error('Erreur chargement statistiques:', error);
            setStats({ total: 0, actifs: 0, enRupture: 0, brouillons: 0 });
        }
    };

    // Gestion des alertes
    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(
            () => setAlert({ show: false, type: '', message: '' }),
            3000
        );
    };

    // Gestion du formulaire
    const handleOpenModal = (produit = null) => {
        if (produit) {
            setEditMode(true);
            setCurrentProduit(produit);
            setFormData({
                nom: produit.nom,
                description: produit.description,
                prix: produit.prix,
                quantite: produit.quantite,
                categorie: produit.categorie?._id || '',
                images: produit.images || [],
                estActif: produit.estActif,
                poids: produit.poids || '',
                dimensions: produit.dimensions || {
                    longueur: '',
                    largeur: '',
                    hauteur: '',
                },
                marque: produit.marque || '',
                etiquettes: produit.etiquettes || [],
            });
        } else {
            setEditMode(false);
            setCurrentProduit(null);
            setFormData({
                nom: '',
                description: '',
                prix: '',
                quantite: '',
                categorie: '',
                images: [],
                estActif: true,
                poids: '',
                dimensions: { longueur: '', largeur: '', hauteur: '' },
                marque: '',
                etiquettes: [],
            });
        }
        setErrors({});
        setShowModal(true);
    };

    // Fermer le modal
    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
        setCurrentProduit(null);
        setFormData({
            nom: '',
            description: '',
            prix: '',
            quantite: '',
            categorie: '',
            images: [],
            estActif: true,
            poids: '',
            dimensions: { longueur: '', largeur: '', hauteur: '' },
            marque: '',
            etiquettes: [],
        });
        setErrors({});
    };

    // Validation du formulaire
    const validateForm = () => {
        const newErrors = {};

        if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
        if (!formData.description.trim())
            newErrors.description = 'La description est requise';
        if (!formData.prix || formData.prix <= 0)
            newErrors.prix = 'Le prix doit être supérieur à 0';
        if (!formData.quantite && formData.quantite !== 0)
            newErrors.quantite = 'La quantité est requise';
        if (!formData.categorie)
            newErrors.categorie = 'La catégorie est requise';
        if (formData.images.length === 0 && !editMode)
            newErrors.images = 'Au moins une image est requise';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Soumission du formulaire
    const handleSubmit = async e => {
        e.preventDefault();

        if (!validateForm()) {
            showAlert('error', 'Veuillez corriger les erreurs du formulaire');
            return;
        }

        try {
            const token = localStorage.getItem('token');

            // DÉTECTION : Y a-t-il des images à uploader ?
            const hasNewImages = formData.images.some(
                img => img instanceof File
            );

            if (hasNewImages) {
                // MODE 1 : AVEC IMAGES (FormData multipart)
                const formDataToSend = new FormData();

                // CORRECTION CRITIQUE : Convertir les valeurs AVANT append
                const nomValue = String(formData.nom).trim();
                const descriptionValue = String(formData.description).trim();
                const prixValue = String(formData.prix);
                const quantiteValue = String(formData.quantite);
                const categorieValue = String(formData.categorie);
                const estActifValue = String(formData.estActif);

                // Champs de base
                formDataToSend.append('nom', nomValue);
                formDataToSend.append('description', descriptionValue);
                formDataToSend.append('prix', prixValue);
                formDataToSend.append('quantite', quantiteValue);
                formDataToSend.append('categorie', categorieValue);
                formDataToSend.append('estActif', estActifValue);

                // Images (uniquement les nouveaux fichiers)
                let imageCount = 0;
                formData.images.forEach(image => {
                    if (image instanceof File) {
                        formDataToSend.append('images', image);
                        imageCount++;
                    }
                });
                console.log(`${imageCount} image(s) ajoutée(s) au FormData`);

                // Champs optionnels
                if (formData.marque && String(formData.marque).trim()) {
                    formDataToSend.append(
                        'marque',
                        String(formData.marque).trim()
                    );
                }

                if (formData.poids && parseFloat(formData.poids) > 0) {
                    formDataToSend.append('poids', String(formData.poids));
                }

                // Dimensions
                const hasValidDimensions =
                    (formData.dimensions.longueur &&
                        parseFloat(formData.dimensions.longueur) > 0) ||
                    (formData.dimensions.largeur &&
                        parseFloat(formData.dimensions.largeur) > 0) ||
                    (formData.dimensions.hauteur &&
                        parseFloat(formData.dimensions.hauteur) > 0);

                if (hasValidDimensions) {
                    const dimensionsObj = {};
                    if (formData.dimensions.longueur)
                        dimensionsObj.longueur = parseFloat(
                            formData.dimensions.longueur
                        );
                    if (formData.dimensions.largeur)
                        dimensionsObj.largeur = parseFloat(
                            formData.dimensions.largeur
                        );
                    if (formData.dimensions.hauteur)
                        dimensionsObj.hauteur = parseFloat(
                            formData.dimensions.hauteur
                        );
                    formDataToSend.append(
                        'dimensions',
                        JSON.stringify(dimensionsObj)
                    );
                }

                // Etiquettes
                if (formData.etiquettes && formData.etiquettes.length > 0) {
                    const validTags = formData.etiquettes.filter(
                        tag => tag.trim() !== ''
                    );
                    if (validTags.length > 0) {
                        formDataToSend.append(
                            'etiquettes',
                            JSON.stringify(validTags)
                        );
                    }
                }

                console.log('Mode FormData (avec images) - Envoi en cours...');

                if (editMode) {
                    const response = await axios.put(
                        `${API_BASE_URL}/api/produits/${currentProduit._id}`,
                        formDataToSend,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data',
                            },
                        }
                    );
                    console.log('Réponse backend (edit):', response.data);
                    showAlert('success', 'Produit modifié avec succès !');
                } else {
                    const response = await axios.post(
                        `${API_BASE_URL}/api/produits`,
                        formDataToSend,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data',
                            },
                        }
                    );
                    console.log('Réponse backend (create):', response.data);
                    showAlert('success', 'Produit créé avec succès !');
                }
            } else {
                // MODE 2 : SANS IMAGES (JSON simple)
                const payload = {
                    nom: formData.nom.trim(),
                    description: formData.description.trim(),
                    prix: parseFloat(formData.prix),
                    quantite: parseInt(formData.quantite, 10),
                    categorie: formData.categorie,
                    estActif:
                        formData.estActif === true ||
                        formData.estActif === 'true',
                };

                // Champs optionnels
                if (formData.marque && formData.marque.trim()) {
                    payload.marque = formData.marque.trim();
                }

                if (formData.poids && parseFloat(formData.poids) > 0) {
                    payload.poids = parseFloat(formData.poids);
                }

                // Dimensions
                const hasValidDimensions =
                    (formData.dimensions.longueur &&
                        parseFloat(formData.dimensions.longueur) > 0) ||
                    (formData.dimensions.largeur &&
                        parseFloat(formData.dimensions.largeur) > 0) ||
                    (formData.dimensions.hauteur &&
                        parseFloat(formData.dimensions.hauteur) > 0);

                if (hasValidDimensions) {
                    payload.dimensions = {};
                    if (formData.dimensions.longueur)
                        payload.dimensions.longueur = parseFloat(
                            formData.dimensions.longueur
                        );
                    if (formData.dimensions.largeur)
                        payload.dimensions.largeur = parseFloat(
                            formData.dimensions.largeur
                        );
                    if (formData.dimensions.hauteur)
                        payload.dimensions.hauteur = parseFloat(
                            formData.dimensions.hauteur
                        );
                }

                // Etiquettes
                if (formData.etiquettes && formData.etiquettes.length > 0) {
                    payload.etiquettes = formData.etiquettes.filter(
                        tag => tag.trim() !== ''
                    );
                }

                console.log('Mode JSON (sans images):', payload);

                if (editMode) {
                    const response = await axios.put(
                        `${API_BASE_URL}/api/produits/${currentProduit._id}`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    console.log('Réponse backend (edit):', response.data);
                    showAlert('success', 'Produit modifié avec succès !');
                } else {
                    const response = await axios.post(
                        `${API_BASE_URL}/api/produits`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    console.log('Réponse backend (create):', response.data);
                    showAlert('success', 'Produit créé avec succès !');
                }
            }

            handleCloseModal();
            fetchProduits();
            fetchStats();
        } catch (error) {
            console.error('Erreur sauvegarde produit:', error);
            console.error('Détails erreur complète:', error.response?.data);

            // Afficher les erreurs de validation détaillées
            if (
                error.response?.data?.details &&
                Array.isArray(error.response.data.details)
            ) {
                const messageErreur = error.response.data.details
                    .map(d => d.message)
                    .join(', ');
                showAlert('error', messageErreur);
            } else {
                const messageErreur =
                    error.response?.data?.message ||
                    error.response?.data?.erreur ||
                    'Erreur lors de la sauvegarde';
                showAlert('error', messageErreur);
            }
        }
    };

    // Suppression avec ConfirmModal
    const handleDelete = async (id, nom) => {
        const confirmed = await confirm({
            title: `Supprimer "${nom}" ?`,
            message:
                'Cette action est irréversible et supprimera définitivement ce produit du catalogue.',
            variant: 'danger',
        });

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/produits/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            showAlert('success', 'Produit supprimé avec succès !');
            fetchProduits();
            fetchStats();
        } catch (error) {
            console.error('Erreur suppression produit:', error);
            showAlert('error', 'Erreur lors de la suppression');
        }
    };

    // Suppression en masse avec ConfirmModal
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            showAlert('warning', 'Aucun produit sélectionné');
            return;
        }

        const confirmed = await confirm({
            title: `Supprimer ${selectedIds.length} produit(s) ?`,
            message: `Vous êtes sur le point de supprimer ${selectedIds.length} produit(s) de manière définitive. Cette action est irréversible.`,
            variant: 'danger',
        });

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            await Promise.all(
                selectedIds.map(id =>
                    axios.delete(`${API_BASE_URL}/api/produits/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                )
            );

            showAlert(
                'success',
                `${selectedIds.length} produit(s) supprimé(s) avec succès !`
            );
            setSelectedIds([]);
            fetchProduits();
            fetchStats();
        } catch (error) {
            console.error('Erreur suppression en masse:', error);
            showAlert('error', 'Erreur lors de la suppression en masse');
        }
    };

    // Changement de statut en masse
    const handleBulkStatusChange = async nouveauStatut => {
        try {
            const token = localStorage.getItem('token');
            await Promise.all(
                selectedIds.map(id =>
                    axios.put(
                        `${API_BASE_URL}/api/produits/${id}`,
                        { estActif: nouveauStatut === 'actif' },
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                )
            );

            showAlert(
                'success',
                `Statut modifié pour ${selectedIds.length} produit(s) !`
            );
            setSelectedIds([]);
            fetchProduits();
            fetchStats();
        } catch (error) {
            console.error('Erreur changement statut en masse:', error);
            showAlert('error', 'Erreur lors du changement de statut');
        }
    };

    // Export CSV avec conversion de devise
    const handleExportCSV = () => {
        const deviseInfo = devises[devise];
        const csvContent = [
            `ID,Nom,Catégorie,Prix (${devise}),Stock,Statut,Marque`,
            ...produitsFiltres.map(p => {
                const prixConverti =
                    devise === 'XOF' || devise === 'XAF'
                        ? p.prix
                        : (p.prix / deviseInfo.taux).toFixed(2);
                return `${p._id},"${p.nom}","${p.categorie?.nom || 'Sans catégorie'}",${prixConverti},${p.quantite},${p.estActif ? 'Actif' : 'Inactif'},"${p.marque || ''}"`;
            }),
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `produits_nody_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        showAlert('success', 'Export CSV réussi !');
    };

    // Conversion de devise
    const formatPrix = prix => {
        const deviseInfo = devises[devise];
        const prixConverti =
            devise === 'XOF' || devise === 'XAF'
                ? prix
                : prix / deviseInfo.taux;

        if (devise === 'XOF' || devise === 'XAF') {
            return `${prixConverti.toLocaleString()} ${deviseInfo.symbole}`;
        } else {
            return `${deviseInfo.symbole} ${prixConverti.toLocaleString(
                'fr-FR',
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }
            )}`;
        }
    };

    // Tri
    const requestSort = key => {
        setSortConfig(prev => ({
            key,
            direction:
                prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Réinitialiser filtres
    const resetFilters = () => {
        setSearchTerm('');
        setFilterCategorie('');
        setFilterStatut('');
        setFilterMinPrix('');
        setFilterMaxPrix('');
        setPage(1);
    };

    const handleImageChange = e => {
        const files = Array.from(e.target.files);
        setFormData({ ...formData, images: [...formData.images, ...files] });
    };

    const removeImage = index => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages });
    };

    const handleTagsChange = e => {
        const tagsString = e.target.value;
        const tagsArray = tagsString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        setFormData({ ...formData, etiquettes: tagsArray });
    };

    // Sélection/Désélection tous
    const handleSelectAll = e => {
        if (e.target.checked) {
            setSelectedIds(produitsPage.map(p => p._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = id => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (loading && produits.length === 0) {
        return (
            <div className="produits-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Chargement des produits...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="produits-page">
            {alert.show && (
                <div className={`alert alert-${alert.type}`}>
                    {alert.message}
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1>📦 Produits</h1>
                    <p className="subtitle">
                        Gérez votre catalogue de produits
                    </p>
                </div>
                <div className="header-actions">
                    {/* Selecteur de devise */}
                    <select
                        className="devise-select"
                        value={devise}
                        onChange={e => setDevise(e.target.value)}
                    >
                        {Object.entries(devises).map(([code, info]) => (
                            <option key={code} value={code}>
                                {info.symbole} {info.nom}
                            </option>
                        ))}
                    </select>
                    <button className="btn-secondary" onClick={handleExportCSV}>
                        <i className="fas fa-file-excel"></i>
                        Exporter CSV
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => handleOpenModal()}
                    >
                        <i className="fas fa-plus"></i>
                        Nouveau produit
                    </button>
                </div>
            </div>

            {/* Statistiques */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div
                        className="stat-icon"
                        style={{ background: '#e3f2fd' }}
                    >
                        <i
                            className="fas fa-boxes"
                            style={{ color: '#1976d2' }}
                        ></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.total}</h3>
                        <p>Total produits</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div
                        className="stat-icon"
                        style={{ background: '#e8f5e9' }}
                    >
                        <i
                            className="fas fa-check-circle"
                            style={{ color: '#388e3c' }}
                        ></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.actifs}</h3>
                        <p>Produits actifs</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div
                        className="stat-icon"
                        style={{ background: '#fff3e0' }}
                    >
                        <i
                            className="fas fa-exclamation-triangle"
                            style={{ color: '#f57c00' }}
                        ></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.enRupture}</h3>
                        <p>En rupture</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div
                        className="stat-icon"
                        style={{ background: '#f3e5f5' }}
                    >
                        <i
                            className="fas fa-file-alt"
                            style={{ color: '#7b1fa2' }}
                        ></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.brouillons}</h3>
                        <p>Brouillons</p>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="filters-section">
                <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <select
                    value={filterCategorie}
                    onChange={e => {
                        setFilterCategorie(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">Toutes les catégories</option>
                    {categoriesPlat.map(cat => (
                        <option key={cat._id} value={cat._id}>
                            {cat.nom}
                        </option>
                    ))}
                </select>

                <select
                    value={filterStatut}
                    onChange={e => {
                        setFilterStatut(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">Tous les statuts</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                </select>

                <button
                    className="btn-filter-toggle"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                    <i
                        className={`fas fa-filter${showAdvancedFilters ? '' : '-slash'}`}
                    ></i>
                    {showAdvancedFilters ? 'Moins' : 'Plus'} de filtres
                </button>

                {(searchTerm ||
                    filterCategorie ||
                    filterStatut ||
                    filterMinPrix ||
                    filterMaxPrix) && (
                    <button className="btn-reset" onClick={resetFilters}>
                        <i className="fas fa-times"></i>
                        Réinitialiser
                    </button>
                )}
            </div>

            {/* Filtres avancés */}
            {showAdvancedFilters && (
                <div className="advanced-filters">
                    <div className="filter-group">
                        <label>Prix minimum ({devise})</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="Prix min"
                            value={filterMinPrix}
                            onChange={e => {
                                setFilterMinPrix(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Prix maximum ({devise})</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="Prix max"
                            value={filterMaxPrix}
                            onChange={e => {
                                setFilterMaxPrix(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Actions en masse */}
            {selectedIds.length > 0 && (
                <div className="bulk-actions">
                    <span className="bulk-count">
                        {selectedIds.length} sélectionné(s)
                    </span>
                    <button
                        className="btn-bulk"
                        onClick={() => handleBulkStatusChange('actif')}
                    >
                        <i className="fas fa-check-circle"></i>
                        Activer
                    </button>
                    <button
                        className="btn-bulk"
                        onClick={() => handleBulkStatusChange('inactif')}
                    >
                        <i className="fas fa-times-circle"></i>
                        Désactiver
                    </button>
                    <button
                        className="btn-bulk btn-danger"
                        onClick={handleBulkDelete}
                    >
                        <i className="fas fa-trash"></i>
                        Supprimer
                    </button>
                </div>
            )}

            <div className="results-info">
                <p>{produitsFiltres.length} produit(s) trouvé(s)</p>
            </div>

            {/* Table responsive */}
            <div className="table-container">
                <table className="produits-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={
                                        produitsPage.length > 0 &&
                                        produitsPage.every(p =>
                                            selectedIds.includes(p._id)
                                        )
                                    }
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th
                                onClick={() => requestSort('nom')}
                                className="sortable"
                            >
                                Nom{' '}
                                {sortConfig.key === 'nom' &&
                                    (sortConfig.direction === 'asc'
                                        ? '↑'
                                        : '↓')}
                            </th>
                            <th
                                onClick={() => requestSort('categorie')}
                                className="sortable"
                            >
                                Catégorie{' '}
                                {sortConfig.key === 'categorie' &&
                                    (sortConfig.direction === 'asc'
                                        ? '↑'
                                        : '↓')}
                            </th>
                            <th
                                onClick={() => requestSort('prix')}
                                className="sortable"
                            >
                                Prix ({devise}){' '}
                                {sortConfig.key === 'prix' &&
                                    (sortConfig.direction === 'asc'
                                        ? '↑'
                                        : '↓')}
                            </th>
                            <th
                                onClick={() => requestSort('quantite')}
                                className="sortable"
                            >
                                Stock{' '}
                                {sortConfig.key === 'quantite' &&
                                    (sortConfig.direction === 'asc'
                                        ? '↑'
                                        : '↓')}
                            </th>
                            <th
                                onClick={() => requestSort('estActif')}
                                className="sortable"
                            >
                                Statut{' '}
                                {sortConfig.key === 'estActif' &&
                                    (sortConfig.direction === 'asc'
                                        ? '↑'
                                        : '↓')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {produitsPage.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-row">
                                    <div className="empty-state">
                                        <i className="fas fa-box-open"></i>
                                        <p>Aucun produit trouvé</p>
                                        {produits.length === 0 && (
                                            <button
                                                className="btn-primary"
                                                onClick={() =>
                                                    handleOpenModal()
                                                }
                                            >
                                                <i className="fas fa-plus"></i>
                                                Créer le premier produit
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            produitsPage.map(produit => (
                                <tr key={produit._id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(
                                                produit._id
                                            )}
                                            onChange={() =>
                                                handleSelectOne(produit._id)
                                            }
                                        />
                                    </td>
                                    <td>
                                        <div className="produit-cell">
                                            {produit.images &&
                                            produit.images.length > 0 ? (
                                                <img
                                                    src={
                                                        typeof produit
                                                            .images[0] ===
                                                            'object' &&
                                                        produit.images[0].url
                                                            ? produit.images[0]
                                                                  .url
                                                            : typeof produit
                                                                    .images[0] ===
                                                                    'string' &&
                                                                produit.images[0].startsWith(
                                                                    'http'
                                                                )
                                                              ? produit
                                                                    .images[0]
                                                              : `http://localhost:5000${produit.images[0]}`
                                                    }
                                                    alt={produit.nom}
                                                    className="produit-thumb"
                                                />
                                            ) : (
                                                <div className="produit-thumb no-image">
                                                    <i className="fas fa-image"></i>
                                                </div>
                                            )}
                                            <span>{produit.nom}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {produit.categorie?.nom ||
                                            'Sans catégorie'}
                                    </td>
                                    <td className="prix-cell">
                                        {formatPrix(produit.prix)}
                                    </td>
                                    <td>
                                        <span
                                            className={`stock-badge ${produit.quantite === 0 ? 'rupture' : produit.quantite < 10 ? 'faible' : ''}`}
                                        >
                                            {produit.quantite}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`statut-badge ${produit.estActif ? 'actif' : 'inactif'}`}
                                        >
                                            {produit.estActif
                                                ? '✓ Actif'
                                                : '✕ Inactif'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <button
                                                className="btn-icon"
                                                onClick={() =>
                                                    handleOpenModal(produit)
                                                }
                                                title="Modifier"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-icon btn-danger"
                                                onClick={() =>
                                                    handleDelete(
                                                        produit._id,
                                                        produit.nom
                                                    )
                                                }
                                                title="Supprimer"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="btn-pagination"
                    >
                        <i className="fas fa-angle-double-left"></i>
                    </button>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-pagination"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>

                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum =
                            page <= 3
                                ? i + 1
                                : page >= totalPages - 2
                                  ? totalPages - 4 + i
                                  : page - 2 + i;

                        return pageNum >= 1 && pageNum <= totalPages ? (
                            <button
                                key={i}
                                onClick={() => setPage(pageNum)}
                                className={`btn-pagination ${page === pageNum ? 'active' : ''}`}
                            >
                                {pageNum}
                            </button>
                        ) : null;
                    })}

                    <button
                        onClick={() =>
                            setPage(p => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        className="btn-pagination"
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                    <button
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        className="btn-pagination"
                    >
                        <i className="fas fa-angle-double-right"></i>
                    </button>
                </div>
            )}

            {/* Modal Formulaire */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>
                                {editMode
                                    ? 'Modifier le produit'
                                    : 'Nouveau produit'}
                            </h2>
                            <button
                                className="btn-close"
                                onClick={handleCloseModal}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nom du produit *</label>
                                    <input
                                        type="text"
                                        value={formData.nom}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                nom: e.target.value,
                                            })
                                        }
                                        placeholder="Ex: Ensemble homme"
                                        className={errors.nom ? 'error' : ''}
                                    />
                                    {errors.nom && (
                                        <span className="error-message">
                                            {errors.nom}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Catégorie *</label>
                                    <select
                                        value={formData.categorie}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                categorie: e.target.value,
                                            })
                                        }
                                        className={
                                            errors.categorie ? 'error' : ''
                                        }
                                    >
                                        <option value="">
                                            Sélectionner une catégorie
                                        </option>
                                        {categoriesPlat.map(cat => (
                                            <option
                                                key={cat._id}
                                                value={cat._id}
                                            >
                                                {cat.nom}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.categorie && (
                                        <span className="error-message">
                                            {errors.categorie}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Description détaillée du produit..."
                                    rows="4"
                                    className={
                                        errors.description ? 'error' : ''
                                    }
                                ></textarea>
                                {errors.description && (
                                    <span className="error-message">
                                        {errors.description}
                                    </span>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Prix (XOF) *</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={formData.prix}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                prix: e.target.value,
                                            })
                                        }
                                        placeholder="0"
                                        className={errors.prix ? 'error' : ''}
                                    />
                                    {errors.prix && (
                                        <span className="error-message">
                                            {errors.prix}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Stock *</label>
                                    <input
                                        type="number"
                                        value={formData.quantite}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                quantite: e.target.value,
                                            })
                                        }
                                        placeholder="0"
                                        className={
                                            errors.quantite ? 'error' : ''
                                        }
                                    />
                                    {errors.quantite && (
                                        <span className="error-message">
                                            {errors.quantite}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Statut</label>
                                    <select
                                        value={formData.estActif}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                estActif:
                                                    e.target.value === 'true',
                                            })
                                        }
                                    >
                                        <option value="true">Actif</option>
                                        <option value="false">Inactif</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Marque</label>
                                    <input
                                        type="text"
                                        value={formData.marque}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                marque: e.target.value,
                                            })
                                        }
                                        placeholder="Ex: Adidas"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Poids (kg)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.poids}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                poids: e.target.value,
                                            })
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Dimensions (cm)</label>
                                <div className="dimensions-row">
                                    <input
                                        type="number"
                                        placeholder="Longueur"
                                        value={formData.dimensions.longueur}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                dimensions: {
                                                    ...formData.dimensions,
                                                    longueur: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                    <span>×</span>
                                    <input
                                        type="number"
                                        placeholder="Largeur"
                                        value={formData.dimensions.largeur}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                dimensions: {
                                                    ...formData.dimensions,
                                                    largeur: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                    <span>×</span>
                                    <input
                                        type="number"
                                        placeholder="Hauteur"
                                        value={formData.dimensions.hauteur}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                dimensions: {
                                                    ...formData.dimensions,
                                                    hauteur: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Tags (séparés par des virgules)</label>
                                <input
                                    type="text"
                                    value={formData.etiquettes.join(', ')}
                                    onChange={handleTagsChange}
                                    placeholder="Ex: ensemble, sport"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Images du produit {!editMode && '*'}
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className={errors.images ? 'error' : ''}
                                />
                                {errors.images && (
                                    <span className="error-message">
                                        {errors.images}
                                    </span>
                                )}

                                {formData.images.length > 0 && (
                                    <div className="images-preview">
                                        {formData.images.map((img, index) => (
                                            <div
                                                key={index}
                                                className="image-preview-item"
                                            >
                                                <img
                                                    src={
                                                        img instanceof File
                                                            ? URL.createObjectURL(
                                                                  img
                                                              )
                                                            : formatImageUrl(
                                                                  img.url || img
                                                              )
                                                    }
                                                    alt={`Preview ${index + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-remove-image"
                                                    onClick={() =>
                                                        removeImage(index)
                                                    }
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleCloseModal}
                                >
                                    Annuler
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editMode
                                        ? 'Enregistrer'
                                        : 'Créer le produit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Produits;
