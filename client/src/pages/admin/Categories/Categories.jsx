import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import './Categories.scss';

const Categories = () => {
    //HOOK CONFIRMATIONS
    const { confirmDelete, confirmBulkDelete, confirmArchive } =
        useConfirmActions();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentCategorie, setCurrentCategorie] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatut, setFilterStatut] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'ordre',
        direction: 'asc',
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState(new Set());

    const [stats, setStats] = useState({
        total: 0,
        actives: 0,
        inactives: 0,
        totalProduits: 0,
    });

    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        image: null,
        estActif: true,
        ordre: 0,
    });

    const [errors, setErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        fetchCategories();
        fetchStats();
    }, []);

    const toggleCategorie = categorieId => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categorieId)) {
                newSet.delete(categorieId);
            } else {
                newSet.add(categorieId);
            }
            return newSet;
        });
    };

    const organiserParParent = categories => {
        // Méthode SIMPLIFIÉE et plus fiable
        const categoriesMap = new Map();

        // D'abord, créer un map de toutes les catégories par ID
        categories.forEach(cat => {
            categoriesMap.set(cat._id, { ...cat, enfants: [] });
        });

        // Ensuite, organiser les enfants sous leurs parents
        const resultats = [];

        categories.forEach(cat => {
            const categorieAvecEnfants = categoriesMap.get(cat._id);

            if (!cat.parent) {
                // C'est une catégorie racine
                resultats.push(categorieAvecEnfants);
            } else {
                // C'est un enfant, trouver son parent
                let parentId;

                if (typeof cat.parent === 'string') {
                    parentId = cat.parent;
                } else if (cat.parent && typeof cat.parent === 'object') {
                    parentId = cat.parent._id;
                }

                if (parentId && categoriesMap.has(parentId)) {
                    const parent = categoriesMap.get(parentId);
                    parent.enfants = parent.enfants || [];
                    parent.enfants.push(categorieAvecEnfants);
                } else {
                    // Si le parent n'est pas trouvé, c'est aussi une racine
                    resultats.push(categorieAvecEnfants);
                }
            }
        });

        return resultats;
    };

    const categoriesFiltrees = useMemo(() => {
        let resultats = [...categories];

        if (searchTerm) {
            resultats = resultats.filter(
                cat =>
                    cat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cat.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatut) {
            const estActif = filterStatut === 'active';
            resultats = resultats.filter(cat => cat.estActif === estActif);
        }

        if (sortConfig.key) {
            resultats.sort((a, b) => {
                const aValue = a[sortConfig.key] || 0;
                const bValue = b[sortConfig.key] || 0;
                if (aValue < bValue)
                    return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue)
                    return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return resultats;
    }, [categories, searchTerm, filterStatut, sortConfig]);

    // Fonction de debug - DÉPLACÉE APRÈS la déclaration de categoriesFiltrees
    useEffect(() => {
        if (categories.length > 0 && categoriesFiltrees.length > 0) {
            console.log('=== DEBUG COMPLET CATÉGORIES ===');
            console.log('Total catégories:', categories.length);
            console.log('Catégories filtrées:', categoriesFiltrees.length);

            // Trouver Accessoires
            const accessoires = categories.find(
                cat => cat.nom === 'Accessoires'
            );
            if (accessoires) {
                console.log('Accessoires trouvé:', {
                    id: accessoires._id,
                    parent: accessoires.parent,
                    sousCategoriesField: accessoires.sousCategories,
                    niveau: accessoires.niveau,
                    estActif: accessoires.estActif,
                });

                // Trouver TOUTES les catégories qui ont Accessoires comme parent
                const toutesEnfantsAccessoires = categories.filter(cat => {
                    if (!cat.parent) return false;

                    // Vérifier plusieurs formats possibles de parent
                    let parentId;

                    if (typeof cat.parent === 'string') {
                        parentId = cat.parent;
                    } else if (
                        cat.parent &&
                        typeof cat.parent === 'object' &&
                        cat.parent._id
                    ) {
                        parentId = cat.parent._id;
                    } else {
                        return false;
                    }

                    return parentId === accessoires._id;
                });

                console.log(
                    "Enfants d'Accessoires (tous):",
                    toutesEnfantsAccessoires.length
                );
                console.log(
                    'Liste des enfants:',
                    toutesEnfantsAccessoires.map(e => ({
                        nom: e.nom,
                        id: e._id,
                        parent: e.parent,
                        parentType: typeof e.parent,
                    }))
                );

                // Vérifier également dans categoriesFiltrees
                const enfantsAccessoiresFiltrees = categoriesFiltrees.filter(
                    cat => {
                        if (!cat.parent) return false;

                        let parentId;

                        if (typeof cat.parent === 'string') {
                            parentId = cat.parent;
                        } else if (
                            cat.parent &&
                            typeof cat.parent === 'object' &&
                            cat.parent._id
                        ) {
                            parentId = cat.parent._id;
                        } else {
                            return false;
                        }

                        return parentId === accessoires._id;
                    }
                );

                console.log(
                    'Enfants dans categoriesFiltrees:',
                    enfantsAccessoiresFiltrees.length
                );
            }

            // Afficher quelques catégories pour voir la structure
            console.log('Structure de quelques catégories:');
            categories.slice(0, 10).forEach(cat => {
                console.log(
                    `- ${cat.nom}: parent=`,
                    cat.parent,
                    'type=',
                    typeof cat.parent
                );
            });
        }
    }, [categories, categoriesFiltrees]); // Ajout de categoriesFiltrees dans les dépendances

    // FONCTION COMPLÈTEMENT REPENSÉE pour aplatir les catégories
    const aplatirCategories = (categories, parentId = null, niveau = 0) => {
        let resultat = [];
        if (!Array.isArray(categories)) return [];

        categories.forEach(cat => {
            const { sousCategories, ...categorieSansEnfants } = cat;

            // IMPORTANT: Créer la catégorie avec le parent CORRECTEMENT défini
            const categorieAplatie = {
                ...categorieSansEnfants,
                niveau,
                // Le parent peut être soit l'ID passé en paramètre, soit le parent existant
                parent: cat.parent || parentId,
            };

            resultat.push(categorieAplatie);

            // Si cette catégorie a des sous-catégories, les aplatir aussi
            if (sousCategories && Array.isArray(sousCategories)) {
                // Pour chaque sous-catégorie, s'assurer qu'elle a le bon parent
                sousCategories.forEach(subCat => {
                    const subCatAplatie = {
                        ...subCat,
                        niveau: niveau + 1,
                        parent: cat._id, // Toujours définir le parent comme l'ID de la catégorie courante
                    };
                    resultat.push(subCatAplatie);

                    // Récursion pour les sous-sous-catégories
                    if (
                        subCat.sousCategories &&
                        Array.isArray(subCat.sousCategories)
                    ) {
                        resultat = resultat.concat(
                            aplatirCategories(
                                subCat.sousCategories,
                                cat._id,
                                niveau + 2
                            )
                        );
                    }
                });
            }
        });

        return resultat;
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            console.log('=== DÉBUT CHARGEMENT CATÉGORIES ===');
            const response = await axios.get(
                'http://localhost:5000/api/categories',
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log('Structure complète de la réponse:', response.data);

            const donnees = response.data.donnees || response.data;

            // ANALYSE DÉTAILLÉE DE LA STRUCTURE
            console.log('Analyse de la structure des données:');

            // 1. Vérifier Accessoires dans les données brutes
            const accessoiresBrut = trouverCategorieRecursive(
                donnees,
                'Accessoires'
            );
            console.log('Accessoires dans données brutes:', accessoiresBrut);

            // 2. Aplatir les catégories
            const categoriesPlates = aplatirCategories(donnees);
            console.log(
                'Total catégories après aplatissement:',
                categoriesPlates.length
            );

            // 3. Trouver Accessoires dans les catégories aplaties
            const accessoiresAplati = categoriesPlates.find(
                cat => cat.nom === 'Accessoires'
            );
            console.log('Accessoires après aplatissement:', accessoiresAplati);

            // 4. Compter les enfants d'Accessoires
            const enfantsAccessoires = categoriesPlates.filter(cat => {
                if (!cat.parent) return false;

                let parentId;
                if (typeof cat.parent === 'string') {
                    parentId = cat.parent;
                } else if (cat.parent && typeof cat.parent === 'object') {
                    parentId = cat.parent._id;
                } else {
                    return false;
                }

                return parentId === accessoiresAplati?._id;
            });

            console.log(
                "Enfants d'Accessoires après aplatissement:",
                enfantsAccessoires.length
            );
            console.log(
                'Liste des enfants:',
                enfantsAccessoires.map(e => e.nom)
            );

            // Fonction utilitaire pour trouver une catégorie récursivement
            function trouverCategorieRecursive(categories, nom) {
                for (const cat of categories) {
                    if (cat.nom === nom) {
                        return cat;
                    }
                    if (cat.sousCategories && cat.sousCategories.length > 0) {
                        const trouve = trouverCategorieRecursive(
                            cat.sousCategories,
                            nom
                        );
                        if (trouve) return trouve;
                    }
                }
                return null;
            }

            setCategories(categoriesPlates);
            setLoading(false);
            console.log('=== FIN CHARGEMENT CATÉGORIES ===');
        } catch (error) {
            console.error('Erreur chargement catégories:', error);
            showAlert('error', 'Erreur lors du chargement des catégories');
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:5000/api/categories',
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const donnees = response.data.donnees || response.data;
            const categoriesPlates = aplatirCategories(donnees);
            const actives = categoriesPlates.filter(c => c.estActif).length;
            const inactives = categoriesPlates.filter(c => !c.estActif).length;

            setStats({
                total: categoriesPlates.length,
                actives,
                inactives,
                totalProduits: 0,
            });
        } catch (error) {
            console.error('Erreur chargement statistiques:', error);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(
            () => setAlert({ show: false, type: '', message: '' }),
            3000
        );
    };

    const handleOpenModal = (categorie = null) => {
        if (categorie) {
            setEditMode(true);
            setCurrentCategorie(categorie);
            setFormData({
                nom: categorie.nom,
                description: categorie.description || '',
                image: null,
                estActif: categorie.estActif,
                ordre: categorie.ordre || 0,
            });
        } else {
            setEditMode(false);
            setCurrentCategorie(null);
            setFormData({
                nom: '',
                description: '',
                image: null,
                estActif: true,
                ordre: 0,
            });
        }
        setErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
        setCurrentCategorie(null);
        setFormData({
            nom: '',
            description: '',
            image: null,
            estActif: true,
            ordre: 0,
        });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
        if (formData.nom.length < 3)
            newErrors.nom = 'Le nom doit contenir au moins 3 caractères';
        if (!formData.image && !editMode)
            newErrors.image = 'Une image est requise';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!validateForm()) {
            showAlert('error', 'Veuillez corriger les erreurs du formulaire');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            formDataToSend.append('nom', formData.nom);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('estActif', formData.estActif);
            formDataToSend.append('ordre', formData.ordre);
            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            if (editMode) {
                await axios.put(
                    `http://localhost:5000/api/categories/${currentCategorie._id}`,
                    formDataToSend,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
                showAlert('success', 'Catégorie modifiée avec succès');
            } else {
                await axios.post(
                    'http://localhost:5000/api/categories',
                    formDataToSend,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
                showAlert('success', 'Catégorie créée avec succès');
            }

            handleCloseModal();
            fetchCategories();
            fetchStats();
        } catch (error) {
            console.error('Erreur sauvegarde catégorie:', error);
            showAlert(
                'error',
                error.response?.data?.message || 'Erreur lors de la sauvegarde'
            );
        }
    };

    //SUPPRIMER UNE CATÉGORIE
    const handleDelete = async (id, nom) => {
        const confirmed = await confirmDelete('catégorie', nom);
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showAlert('success', 'Catégorie supprimée avec succès');
            fetchCategories();
            fetchStats();
        } catch (error) {
            console.error('Erreur suppression catégorie:', error);
            showAlert(
                'error',
                error.response?.data?.message || 'Erreur lors de la suppression'
            );
        }
    };

    //SUPPRESSION EN MASSE
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const confirmed = await confirmBulkDelete(
            'catégorie',
            selectedIds.length
        );
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            await Promise.all(
                selectedIds.map(id =>
                    axios.delete(`http://localhost:5000/api/categories/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                )
            );
            showAlert(
                'success',
                `${selectedIds.length} catégorie(s) supprimée(s)`
            );
            setSelectedIds([]);
            fetchCategories();
            fetchStats();
        } catch (error) {
            console.error('Erreur suppression en masse:', error);
            showAlert('error', 'Erreur lors de la suppression en masse');
        }
    };

    const handleBulkStatusChange = async nouvelEstActif => {
        try {
            const token = localStorage.getItem('token');
            await Promise.all(
                selectedIds.map(id =>
                    axios.put(
                        `http://localhost:5000/api/categories/${id}`,
                        { estActif: nouvelEstActif },
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                )
            );
            showAlert(
                'success',
                `Statut modifié pour ${selectedIds.length} catégorie(s)`
            );
            setSelectedIds([]);
            fetchCategories();
            fetchStats();
        } catch (error) {
            console.error('Erreur changement statut en masse:', error);
            showAlert('error', 'Erreur lors du changement de statut');
        }
    };

    const handleExportCSV = () => {
        const csvContent = [
            'ID,Nom,Description,Statut,Ordre',
            ...categoriesFiltrees.map(
                cat =>
                    `${cat._id},"${cat.nom}","${cat.description || ''}",${cat.estActif ? 'Active' : 'Inactive'},${cat.ordre}`
            ),
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `categories_nody_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        showAlert('success', 'Export CSV réussi');
    };

    const requestSort = key => {
        setSortConfig(prev => ({
            key,
            direction:
                prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterStatut('');
    };

    const handleImageChange = e => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
        }
    };

    const handleSelectAll = e => {
        if (e.target.checked) {
            setSelectedIds(categoriesFiltrees.map(cat => cat._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = id => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const CategoryCard = ({ category }) => {
        const categoryColor = category.estActif ? '#667eea' : '#94a3b8';

        // FONCTION ULTRA-FIABLE POUR COMPTER LES ENFANTS
        const getEnfantsCount = () => {
            const categoryId = category._id;
            if (!categoryId) return 0;

            // Compter dans toutes les catégories filtrées
            return categoriesFiltrees.filter(cat => {
                if (!cat.parent) return false;

                // Gérer tous les formats possibles de parent
                let parentId;

                if (typeof cat.parent === 'string') {
                    parentId = cat.parent;
                } else if (cat.parent && typeof cat.parent === 'object') {
                    // Peut être {_id: '...'} ou juste un objet avec _id
                    parentId = cat.parent._id || cat.parent;
                } else {
                    return false;
                }

                // Comparer les IDs
                return parentId?.toString() === categoryId.toString();
            }).length;
        };

        const enfantsCount = getEnfantsCount();

        // Vérifier si cette catégorie est développée
        const isExpanded = expandedCategories.has(category._id);

        // RÉCUPÉRER LES SOUS-CATÉGORIES
        const getSousCategories = () => {
            const categoryId = category._id;
            if (!categoryId) return [];

            return categoriesFiltrees.filter(cat => {
                if (!cat.parent) return false;

                let parentId;

                if (typeof cat.parent === 'string') {
                    parentId = cat.parent;
                } else if (cat.parent && typeof cat.parent === 'object') {
                    parentId = cat.parent._id || cat.parent;
                } else {
                    return false;
                }

                return parentId?.toString() === categoryId.toString();
            });
        };

        const sousCategories = getSousCategories();

        // DEBUG SPÉCIFIQUE POUR Accessoires
        React.useEffect(() => {
            if (category.nom === 'Accessoires') {
                console.log('=== DEBUG DÉTAILLÉ Accessoires ===');
                console.log('Catégorie Accessoires:', {
                    id: category._id,
                    nom: category.nom,
                    estActif: category.estActif,
                });

                console.log('Enfants count:', enfantsCount);
                console.log('Sous-catégories trouvées:', sousCategories.length);
                console.log(
                    'Liste des sous-catégories:',
                    sousCategories.map(sc => ({
                        nom: sc.nom,
                        id: sc._id,
                        parent: sc.parent,
                    }))
                );

                // Vérifier quelques catégories au hasard
                const quelquesCategories = categoriesFiltrees.slice(0, 20);
                console.log('Quelques catégories pour vérification:');
                quelquesCategories.forEach(cat => {
                    if (cat.parent) {
                        console.log(`- ${cat.nom}: parent=`, cat.parent);
                    }
                });
            }
        }, [category, enfantsCount, sousCategories, categoriesFiltrees]); // Ajout de categoriesFiltrees

        return (
            <div className="category-card-modern">
                <div
                    className="card-gradient-overlay"
                    style={{
                        background: `linear-gradient(135deg, ${categoryColor}22, ${categoryColor}44)`,
                    }}
                />
                <div className="card-content">
                    <div className="card-header">
                        <div
                            className="card-icon"
                            style={{
                                background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
                            }}
                        >
                            {category.image ? (
                                <img
                                    src={`http://localhost:5000${category.image}`}
                                    alt={category.nom}
                                />
                            ) : (
                                <i className="fas fa-folder"></i>
                            )}
                        </div>
                        <div className="card-actions">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(category._id)}
                                onChange={() => handleSelectOne(category._id)}
                                onClick={e => e.stopPropagation()}
                            />
                            {/* BOUTON POUR DÉVELOPPER/RÉDUIRE */}
                            {enfantsCount > 0 && (
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        toggleCategorie(category._id);
                                    }}
                                    className="btn-expand"
                                >
                                    <i
                                        className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
                                    ></i>
                                </button>
                            )}
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    handleOpenModal(category);
                                }}
                                className="btn-edit"
                            >
                                <i className="fas fa-edit"></i>
                            </button>
                            {/*BOUTON SUPPRIMER*/}
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    handleDelete(category._id, category.nom);
                                }}
                                className="btn-delete"
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <h3 className="card-title">{category.nom}</h3>
                    <div className="card-info">
                        <span className="subcategory-count">
                            {enfantsCount} sous-catégorie(s)
                        </span>
                        <span
                            className="status-badge"
                            style={{
                                background: `${categoryColor}22`,
                                color: categoryColor,
                            }}
                        >
                            {category.estActif ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    {category.description && (
                        <p className="card-description">
                            {category.description}
                        </p>
                    )}

                    {/* AFFICHER LES SOUS-CATÉGORIES SI DÉVELOPPÉ */}
                    {isExpanded && sousCategories.length > 0 && (
                        <div className="sub-categories-container">
                            {sousCategories.map(subCat => (
                                <div
                                    key={subCat._id}
                                    className="sub-category-item"
                                >
                                    <div className="sub-category-content">
                                        <div className="sub-category-icon">
                                            {subCat.image ? (
                                                <img
                                                    src={`http://localhost:5000${subCat.image}`}
                                                    alt={subCat.nom}
                                                />
                                            ) : (
                                                <i className="fas fa-folder"></i>
                                            )}
                                        </div>
                                        <div className="sub-category-details">
                                            <h4>{subCat.nom}</h4>
                                            <p>
                                                {subCat.description ||
                                                    'Aucune description'}
                                            </p>
                                        </div>
                                        <div className="sub-category-actions">
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleOpenModal(subCat);
                                                }}
                                                className="btn-edit-small"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleDelete(
                                                        subCat._id,
                                                        subCat.nom
                                                    );
                                                }}
                                                className="btn-delete-small"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="categories-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Chargement des catégories...</p>
                </div>
            </div>
        );
    }

    const categoriesHierarchiques = organiserParParent(categoriesFiltrees);

    return (
        <div className="categories-page">
            {alert.show && (
                <div className={`alert alert-${alert.type}`}>
                    {alert.message}
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1>Gestion des Catégories</h1>
                    <p className="subtitle">
                        Organisez et gérez vos catégories de produits
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={handleExportCSV}>
                        <i className="fas fa-file-excel"></i>
                        Exporter CSV
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => handleOpenModal()}
                    >
                        <i className="fas fa-plus"></i>
                        Nouvelle catégorie
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div
                        className="stat-icon"
                        style={{
                            background:
                                'linear-gradient(135deg, #667eea, #764ba2)',
                        }}
                    >
                        <i
                            className="fas fa-layer-group"
                            style={{ color: 'white' }}
                        ></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.total}</h3>
                        <p>Total catégories</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div
                        className="stat-icon"
                        style={{
                            background:
                                'linear-gradient(135deg, #10b981, #059669)',
                        }}
                    >
                        <i
                            className="fas fa-check-circle"
                            style={{ color: 'white' }}
                        ></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.actives}</h3>
                        <p>Catégories actives</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div
                        className="stat-icon"
                        style={{
                            background:
                                'linear-gradient(135deg, #ef4444, #dc2626)',
                        }}
                    >
                        <i
                            className="fas fa-times-circle"
                            style={{ color: 'white' }}
                        ></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.inactives}</h3>
                        <p>Catégories inactives</p>
                    </div>
                </div>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Rechercher une catégorie..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={filterStatut}
                    onChange={e => setFilterStatut(e.target.value)}
                >
                    <option value="">Tous les statuts</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <button
                    className="btn-sort"
                    onClick={() => requestSort('ordre')}
                >
                    <i className="fas fa-sort"></i>
                    Trier par ordre{' '}
                    {sortConfig.key === 'ordre' &&
                        (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                {(searchTerm || filterStatut) && (
                    <button className="btn-reset" onClick={resetFilters}>
                        <i className="fas fa-times"></i>
                        Réinitialiser
                    </button>
                )}
            </div>

            {/*ACTIONS EN MASSE*/}
            {selectedIds.length > 0 && (
                <div className="bulk-actions">
                    <span className="bulk-count">
                        {selectedIds.length} sélectionné(s)
                    </span>
                    <button
                        className="btn-bulk"
                        onClick={() => handleBulkStatusChange(true)}
                    >
                        <i className="fas fa-check-circle"></i>Activer
                    </button>
                    <button
                        className="btn-bulk"
                        onClick={() => handleBulkStatusChange(false)}
                    >
                        <i className="fas fa-times-circle"></i>Désactiver
                    </button>
                    <button
                        className="btn-bulk btn-danger"
                        onClick={handleBulkDelete}
                    >
                        <i className="fas fa-trash"></i>Supprimer
                    </button>
                </div>
            )}

            <div className="results-info">
                <p>{categoriesFiltrees.length} catégorie(s) trouvée(s)</p>
                <label className="select-all-label">
                    <input
                        type="checkbox"
                        checked={
                            categoriesFiltrees.length > 0 &&
                            categoriesFiltrees.every(cat =>
                                selectedIds.includes(cat._id)
                            )
                        }
                        onChange={handleSelectAll}
                    />
                    <span>Tout sélectionner</span>
                </label>
            </div>

            {categoriesHierarchiques.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-folder-open"></i>
                    <h3>Aucune catégorie trouvée</h3>
                    <p>Commencez par créer votre première catégorie</p>
                    <button
                        className="btn-primary"
                        onClick={() => handleOpenModal()}
                    >
                        <i className="fas fa-plus"></i>Créer une catégorie
                    </button>
                </div>
            ) : (
                <div className="categories-grid-view">
                    {categoriesHierarchiques.map(parent => (
                        <CategoryCard key={parent._id} category={parent} />
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>
                                {editMode
                                    ? 'Modifier la catégorie'
                                    : 'Nouvelle catégorie'}
                            </h2>
                            <button
                                className="btn-close"
                                onClick={handleCloseModal}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label>Nom de la catégorie *</label>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            nom: e.target.value,
                                        })
                                    }
                                    placeholder="Ex: Accessoires"
                                    className={errors.nom ? 'error' : ''}
                                />
                                {errors.nom && (
                                    <span className="error-message">
                                        {errors.nom}
                                    </span>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Description de la catégorie..."
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="form-row">
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
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ordre d'affichage</label>
                                    <input
                                        type="number"
                                        value={formData.ordre}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                ordre: e.target.value,
                                            })
                                        }
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>
                                    Image de la catégorie {!editMode && '*'}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className={errors.image ? 'error' : ''}
                                />
                                {errors.image && (
                                    <span className="error-message">
                                        {errors.image}
                                    </span>
                                )}
                                {(formData.image ||
                                    (editMode && currentCategorie?.image)) && (
                                    <div className="image-preview">
                                        <img
                                            src={
                                                formData.image
                                                    ? URL.createObjectURL(
                                                          formData.image
                                                      )
                                                    : `http://localhost:5000${currentCategorie?.image}`
                                            }
                                            alt="Preview"
                                        />
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
                                        : 'Créer la catégorie'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;//  