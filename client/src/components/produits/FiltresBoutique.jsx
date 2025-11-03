import React, { useState, useEffect } from 'react';
import { useProduits } from '../../contexts/ProduitsContext.jsx';

const FiltresBoutique = ({ onFiltreChange, filtresActuels = {} }) => {
    const { categories, chargerCategories } = useProduits();

    const [filtresLocaux, setFiltresLocaux] = useState({
        search: '',
        categorie: '',
        prixMin: '',
        prixMax: '',
        tailles: [],
        couleurs: [],
        enStock: false,
        enPromotion: false,
    });

    useEffect(() => {
        chargerCategories();
    }, [chargerCategories]);

    useEffect(() => {
        const filtresPourEtat = { ...filtresActuels };

        if (filtresActuels?.tailles) {
            if (
                typeof filtresActuels.tailles === 'string' &&
                filtresActuels.tailles !== ''
            ) {
                filtresPourEtat.tailles = filtresActuels.tailles.split(',');
            }
        } else {
            filtresPourEtat.tailles = [];
        }

        if (filtresActuels?.couleurs) {
            if (
                typeof filtresActuels.couleurs === 'string' &&
                filtresActuels.couleurs !== ''
            ) {
                filtresPourEtat.couleurs = filtresActuels.couleurs.split(',');
            }
        } else {
            filtresPourEtat.couleurs = [];
        }

        filtresPourEtat.enStock = filtresActuels?.enStock === 'true';
        filtresPourEtat.enPromotion = filtresActuels?.enPromotion === 'true';

        setFiltresLocaux(prev => ({
            ...prev,
            ...filtresPourEtat,
        }));
    }, [filtresActuels]);

    const handleFiltreChange = (key, value) => {
        const nouveauxFiltres = {
            ...filtresLocaux,
            [key]: value,
        };
        setFiltresLocaux(nouveauxFiltres);
        onFiltreChange(nouveauxFiltres);
    };

    const reinitialiserFiltres = () => {
        const filtresVides = {
            search: '',
            categorie: '',
            prixMin: '',
            prixMax: '',
            tailles: [],
            couleurs: [],
            enStock: false,
            enPromotion: false,
        };
        setFiltresLocaux(filtresVides);
        onFiltreChange(filtresVides);
    };

    const handleCheckboxChange = (key, valeur, estCoche) => {
        const valeursActuelles = filtresLocaux[key] || [];
        let nouvellesValeurs;

        if (estCoche) {
            if (!valeursActuelles.includes(valeur)) {
                nouvellesValeurs = [...valeursActuelles, valeur];
            } else {
                nouvellesValeurs = valeursActuelles;
            }
        } else {
            nouvellesValeurs = valeursActuelles.filter(v => v !== valeur);
        }

        handleFiltreChange(key, nouvellesValeurs);
    };

    const taillesDisponibles = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const couleursDisponibles = [
        'Noir',
        'Blanc',
        'Bleu',
        'Rouge',
        'Vert',
        'Jaune',
        'Rose',
        'Gris',
    ];

    return (
        <div className="filtres-boutique p-3">
            <div className="filtres-header d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Filtres</h5>
                <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={reinitialiserFiltres}
                >
                    Réinitialiser
                </button>
            </div>

            <div className="filtre-groupe mb-4">
                <label className="form-label fw-semibold">Recherche</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher un produit..."
                    value={filtresLocaux.search || ''}
                    onChange={e => handleFiltreChange('search', e.target.value)}
                />
            </div>

            <div className="filtre-groupe mb-4">
                <label className="form-label fw-semibold">Catégorie</label>
                <select
                    className="form-select"
                    value={filtresLocaux.categorie || ''}
                    onChange={e =>
                        handleFiltreChange('categorie', e.target.value)
                    }
                >
                    <option value="">Toutes les catégories</option>
                    {categories.map(categorie => (
                        <option key={categorie._id} value={categorie.slug}>
                            {categorie.nom} ({categorie.nombreProduits || 0})
                        </option>
                    ))}
                </select>
            </div>

            <div className="filtre-groupe mb-4">
                <label className="form-label fw-semibold">Prix</label>
                <div className="row g-2">
                    <div className="col-6">
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Min"
                            value={filtresLocaux.prixMin || ''}
                            onChange={e =>
                                handleFiltreChange('prixMin', e.target.value)
                            }
                        />
                    </div>
                    <div className="col-6">
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Max"
                            value={filtresLocaux.prixMax || ''}
                            onChange={e =>
                                handleFiltreChange('prixMax', e.target.value)
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="filtre-groupe mb-4">
                <label className="form-label fw-semibold">Tailles</label>
                <div className="tailles-filtre">
                    {taillesDisponibles.map(taille => (
                        <div key={taille} className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`taille-${taille}`}
                                checked={
                                    filtresLocaux.tailles?.includes(taille) ||
                                    false
                                }
                                onChange={e =>
                                    handleCheckboxChange(
                                        'tailles',
                                        taille,
                                        e.target.checked
                                    )
                                }
                            />
                            <label
                                className="form-check-label"
                                htmlFor={`taille-${taille}`}
                            >
                                {taille}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="filtre-groupe mb-4">
                <label className="form-label fw-semibold">Couleurs</label>
                <div className="couleurs-filtre">
                    {couleursDisponibles.map(couleur => (
                        <div key={couleur} className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`couleur-${couleur}`}
                                checked={
                                    filtresLocaux.couleurs?.includes(couleur) ||
                                    false
                                }
                                onChange={e =>
                                    handleCheckboxChange(
                                        'couleurs',
                                        couleur,
                                        e.target.checked
                                    )
                                }
                            />
                            <label
                                className="form-check-label"
                                htmlFor={`couleur-${couleur}`}
                            >
                                {couleur}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="filtre-groupe">
                <div className="form-check mb-2">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="enStock"
                        checked={filtresLocaux.enStock || false}
                        onChange={e =>
                            handleFiltreChange('enStock', e.target.checked)
                        }
                    />
                    <label className="form-check-label" htmlFor="enStock">
                        En stock seulement
                    </label>
                </div>
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="enPromotion"
                        checked={filtresLocaux.enPromotion || false}
                        onChange={e =>
                            handleFiltreChange('enPromotion', e.target.checked)
                        }
                    />
                    <label className="form-check-label" htmlFor="enPromotion">
                        En promotion
                    </label>
                </div>
            </div>
        </div>
    );
};

export default FiltresBoutique;
