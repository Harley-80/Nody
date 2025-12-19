import React, { useState } from 'react';
import './FiltresPeriode.scss';

// Composant pour les filtres de période dans le tableau de bord admin
const FiltresPeriode = ({ onChangePeriode, onExporterPDF, chargement }) => {
    const [periodeActive, setPeriodeActive] = useState('mois');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [afficherPersonnalise, setAfficherPersonnalise] = useState(false);

    const periodesPredefinies = [
        { id: 'aujourdhui', label: "Aujourd'hui", icone: 'fa-calendar-day' },
        { id: 'semaine', label: 'Cette Semaine', icone: 'fa-calendar-week' },
        { id: 'mois', label: 'Ce Mois', icone: 'fa-calendar-alt' },
        { id: 'trimestre', label: 'Ce Trimestre', icone: 'fa-calendar' },
        { id: 'annee', label: 'Cette Année', icone: 'fa-calendar-check' },
        {
            id: 'personnalise',
            label: 'Personnalisée',
            icone: 'fa-calendar-plus',
        },
    ];

    // Gestion des changements de période
    const handleChangePeriode = periodeId => {
        setPeriodeActive(periodeId);

        if (periodeId === 'personnalise') {
            setAfficherPersonnalise(true);
        } else {
            setAfficherPersonnalise(false);
            onChangePeriode(periodeId);
        }
    };

    // Appliquer la période personnalisée
    const handleAppliquerPersonnalise = () => {
        if (dateDebut && dateFin) {
            onChangePeriode('personnalise', { dateDebut, dateFin });
        }
    };

    // Exporter les statistiques en PDF
    const handleExporterPDF = () => {
        const periode = {
            dateDebut:
                periodeActive === 'personnalise'
                    ? dateDebut
                    : calculerDateDebut(periodeActive),
            dateFin:
                periodeActive === 'personnalise'
                    ? dateFin
                    : new Date().toISOString(),
        };
        onExporterPDF(periode);
    };

    return (
        <div className="filtres-periode">
            <div className="filtres-header">
                <h4>
                    <i className="fas fa-filter me-2"></i>
                    Filtrer par Période
                </h4>
                <button
                    className="btn btn-sm btn-success"
                    onClick={handleExporterPDF}
                    disabled={chargement}
                >
                    <i className="fas fa-file-pdf me-2"></i>
                    Exporter PDF
                </button>
            </div>

            <div className="periodes-predefinies">
                {periodesPredefinies.map(periode => (
                    <button
                        key={periode.id}
                        className={`btn-periode ${periodeActive === periode.id ? 'active' : ''}`}
                        onClick={() => handleChangePeriode(periode.id)}
                    >
                        <i className={`fas ${periode.icone}`}></i>
                        <span>{periode.label}</span>
                    </button>
                ))}
            </div>

            {afficherPersonnalise && (
                <div className="periode-personnalisee">
                    <div className="row g-3">
                        <div className="col-md-5">
                            <label className="form-label">Date de début</label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateDebut}
                                onChange={e => setDateDebut(e.target.value)}
                                max={dateFin || undefined}
                            />
                        </div>
                        <div className="col-md-5">
                            <label className="form-label">Date de fin</label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateFin}
                                onChange={e => setDateFin(e.target.value)}
                                min={dateDebut || undefined}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button
                                className="btn btn-primary w-100"
                                onClick={handleAppliquerPersonnalise}
                                disabled={!dateDebut || !dateFin}
                            >
                                <i className="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Fonction utilitaire pour calculer la date de début
const calculerDateDebut = periode => {
    const maintenant = new Date();

    switch (periode) {
        case 'aujourdhui':
            return new Date(
                maintenant.getFullYear(),
                maintenant.getMonth(),
                maintenant.getDate()
            ).toISOString();

        case 'semaine':
            const jourSemaine = maintenant.getDay();
            const diffLundi = jourSemaine === 0 ? -6 : 1 - jourSemaine;
            const lundi = new Date(maintenant);
            lundi.setDate(maintenant.getDate() + diffLundi);
            return new Date(
                lundi.getFullYear(),
                lundi.getMonth(),
                lundi.getDate()
            ).toISOString();

        case 'mois':
            return new Date(
                maintenant.getFullYear(),
                maintenant.getMonth(),
                1
            ).toISOString();

        case 'trimestre':
            const moisActuel = maintenant.getMonth();
            const debutTrimestre = Math.floor(moisActuel / 3) * 3;
            return new Date(
                maintenant.getFullYear(),
                debutTrimestre,
                1
            ).toISOString();

        case 'annee':
            return new Date(maintenant.getFullYear(), 0, 1).toISOString();

        default:
            return maintenant.toISOString();
    }
};

export default FiltresPeriode;
