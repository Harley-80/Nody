import React from 'react';
import './SelecteurVariantes.scss';

export default function SelecteurVariantes({
    variations,
    selectedOptions,
    setSelectedOptions,
}) {
    // Fonction pour générer les couleurs
    const getColorValue = colorName => {
        const colors = {
            // Couleurs de base
            noir: '#000000',
            black: '#000000',
            blanc: '#FFFFFF',
            white: '#FFFFFF',
            rouge: '#FF0000',
            red: '#FF0000',
            bleu: '#0000FF',
            blue: '#0000FF',
            vert: '#00FF00',
            green: '#008000',
            jaune: '#FFFF00',
            yellow: '#FFFF00',
            orange: '#FFA500',
            violet: '#800080',
            purple: '#800080',
            rose: '#FFC0CB',
            pink: '#FFC0CB',
            gris: '#808080',
            gray: '#808080',
            marron: '#8B4513',
            brown: '#8B4513',
            beige: '#F5F5DC',
            kaki: '#9C7E4B',
            khaki: '#9C7E4B',
            marine: '#000080',
            navy: '#000080',
            bordeaux: '#800020',
        };

        return colors[colorName.toLowerCase()] || colorName;
    };

    return (
        <div className="selecteur-variantes mb-4">
            {variations.map((variation, index) => {
                const isColorType = variation.type
                    .toLowerCase()
                    .includes('coul');
                const isSizeType = variation.type
                    .toLowerCase()
                    .includes('taill');

                return (
                    <div key={index} className="variante-group">
                        <label className="variante-label">
                            {variation.type} :
                            {selectedOptions[variation.type] && (
                                <span className="variante-selected">
                                    {selectedOptions[variation.type]}
                                </span>
                            )}
                        </label>

                        <div
                            className={`variante-options ${isColorType ? 'color-options' : ''} ${isSizeType ? 'size-options' : ''}`}
                        >
                            {variation.options.map((option, idx) => {
                                const isSelected =
                                    selectedOptions[variation.type] === option;

                                if (isColorType) {
                                    // Affichage pour les couleurs
                                    const colorValue = getColorValue(option);
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`color-option ${isSelected ? 'selected' : ''}`}
                                            onClick={() =>
                                                setSelectedOptions(prev => ({
                                                    ...prev,
                                                    [variation.type]: option,
                                                }))
                                            }
                                            title={option}
                                        >
                                            <span
                                                className="color-swatch"
                                                style={{
                                                    backgroundColor: colorValue,
                                                    border:
                                                        colorValue === '#FFFFFF'
                                                            ? '1px solid #ddd'
                                                            : 'none',
                                                }}
                                            ></span>
                                            {isSelected && (
                                                <i className="fas fa-check check-icon"></i>
                                            )}
                                        </button>
                                    );
                                } else if (isSizeType) {
                                    // Affichage pour les tailles
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`size-option ${isSelected ? 'selected' : ''}`}
                                            onClick={() =>
                                                setSelectedOptions(prev => ({
                                                    ...prev,
                                                    [variation.type]: option,
                                                }))
                                            }
                                        >
                                            {option}
                                        </button>
                                    );
                                } else {
                                    // Affichage par défaut (dropdown)
                                    return null; // Géré par le select ci-dessous
                                }
                            })}
                        </div>

                        {/* Fallback select pour les autres types de variations */}
                        {!isColorType && !isSizeType && (
                            <select
                                className="form-select variante-select"
                                value={
                                    selectedOptions[variation.type] ||
                                    variation.options[0]
                                }
                                onChange={e =>
                                    setSelectedOptions(prev => ({
                                        ...prev,
                                        [variation.type]: e.target.value,
                                    }))
                                }
                            >
                                {variation.options.map((option, idx) => (
                                    <option key={idx} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                );
            })}
        </div>
    );
}