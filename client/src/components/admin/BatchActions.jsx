import React from 'react';
import { STATUTS } from '../../constants/statuts';

export default function BatchActions({ selectedIds = [], onDelete, onChangeStatus }) {
    return (
        <div className="bg-light border rounded p-3 mb-3 d-flex flex-wrap gap-3 align-items-center">
            <span className="mb-0 fw-semibold">
                {selectedIds.length} sélectionné{selectedIds.length !== 1 && 's'}
            </span>

            <button onClick={onDelete} className="btn btn-sm btn-danger">
                <i className="bi bi-trash me-1" /> Supprimer la sélection
            </button>

            <div className="dropdown">
                <button
                    className="btn btn-sm btn-outline-primary dropdown-toggle"
                    data-bs-toggle="dropdown"
                >
                    <i className="bi bi-pencil-square me-1" /> Marquer comme…
                </button>
                <ul className="dropdown-menu">
                    {Object.entries(STATUTS).map(([key, label]) => (
                        <li key={key}>
                            <button
                                className="dropdown-item"
                                type="button"
                                onClick={() => onChangeStatus(key)}
                            >
                                {label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}