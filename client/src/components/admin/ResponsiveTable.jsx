import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

const ResponsiveTable = ({
    columns,
    data,
    sortConfig,
    onSort,
    onEdit,
    onDelete,
    selectedIds,
    onSelectionChange,
    className = ''
}) => {
    const handleSort = (key) => {
        if (onSort && sortConfig?.key === key) {
        onSort(key, sortConfig.direction === 'asc' ? 'desc' : 'asc');
        } else if (onSort) {
        onSort(key, 'asc');
        }
    };

    const sortedColumns = useMemo(() =>
        columns.map(col => ({
            ...col,
            isSorted: sortConfig?.key === col.key,
            sortDirection: sortConfig?.direction
        })),
        [columns, sortConfig]
    );

    const isSelected   = useCallback((id) => selectedIds.includes(id), [selectedIds]);
    const toggleRow    = useCallback((id) => {
        onSelectionChange(
            isSelected(id)
            ? selectedIds.filter(i => i !== id)
            : [...selectedIds, id]
        );
    }, [selectedIds, onSelectionChange, isSelected]);

    const toggleAll = () => {
        onSelectionChange(
            selectedIds.length === data.length ? [] : data.map(d => d.id)
        );
    };

    return (
        <div className={`responsive-table-container ${className}`}>
            {/* Desktop */}
            <div className="d-none d-md-block">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={data.length > 0 && selectedIds.length === data.length}
                                    onChange={toggleAll}
                                />
                            </th>
                            {sortedColumns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                    className={`${col.sortable ? 'sortable' : ''} ${col.headerClassName || ''}`}
                                    style={{ width: col.width, minWidth: col.minWidth }}
                                >
                                    <div className="d-flex align-items-center">
                                        {col.header}
                                        {col.sortable && (
                                            <span className="ms-2">
                                                {col.isSorted
                                                    ? (col.sortDirection === 'asc' ? '↑' : '↓')
                                                    : '⇅'
                                                }
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => (
                            <tr key={item.id || idx}>
                                <td>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={isSelected(item.id)}
                                        onChange={() => toggleRow(item.id)}
                                    />
                                </td>
                                {sortedColumns.map((col) => (
                                    <td
                                        key={`${item.id}-${col.key}`}
                                        className={col.cellClassName || ''}
                                        data-label={col.header}
                                    >
                                    {col.render
                                        ? col.render(item)
                                        : col.actions
                                        ? (
                                            <div className="d-flex gap-2">
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(item)}
                                                        className="btn btn-sm btn-outline-primary"
                                                    >
                                                        Modifier
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(item)}
                                                        className="btn btn-sm btn-outline-danger"
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    : item[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile */}
            <div className="d-md-none">
                {data.map((item, idx) => (
                    <div key={item.id || idx} className="card mb-3">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isSelected(item.id)}
                                onChange={() => toggleRow(item.id)}
                            />
                        </div>
                        <div className="card-body">
                            {sortedColumns
                                .filter((col) => !col.hideOnMobile)
                                .map((col) => (
                                    <div key={`mobile-${item.id}-${col.key}`} className="row mb-2">
                                        <div className="col-4 fw-bold">{col.header}</div>
                                        <div className="col-8">
                                            {col.render
                                                ? col.render(item)
                                                : col.actions
                                                ? (
                                                    <div className="d-flex gap-2">
                                                        {onEdit && (
                                                            <button
                                                                onClick={() => onEdit(item)}
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                Modifier
                                                            </button>
                                                        )}
                                                        {onDelete && (
                                                            <button
                                                                onClick={() => onDelete(item)}
                                                                className="btn btn-sm btn-outline-danger"
                                                            >
                                                                Supprimer
                                                            </button>
                                                        )}
                                                </div>
                                            )
                                            : item[col.key]}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            {data.length === 0 && (
                <div className="text-center py-4 text-muted">Aucun résultat trouvé</div>
            )}
        </div>
    );
};

ResponsiveTable.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            header: PropTypes.node.isRequired,
            render: PropTypes.func,
            sortable: PropTypes.bool,
            width: PropTypes.string,
            minWidth: PropTypes.string,
            headerClassName: PropTypes.string,
            cellClassName: PropTypes.string,
            hideOnMobile: PropTypes.bool,
            actions: PropTypes.bool
        })
    ).isRequired,
    data: PropTypes.array.isRequired,
    sortConfig: PropTypes.shape({
        key: PropTypes.string,
        direction: PropTypes.oneOf(['asc', 'desc'])
    }),
    onSort: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    selectedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    onSelectionChange: PropTypes.func.isRequired,
    className: PropTypes.string
};

export default ResponsiveTable;