// src/components/voting/ElectoralListCard.jsx
import React, { useState } from 'react';
import './ElectoralListCard.css';

const ElectoralListCard = ({ list, isSelected, onSelect }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSelect = () => {
    onSelect(list._id || list.id);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`electoral-list-card ${isSelected ? 'selected' : ''}`}>
      {/* Badge de selección */}
      {isSelected && (
        <div className="selection-badge">
          ✅ SELECCIONADO
        </div>
      )}

      {/* Encabezado de la lista */}
      <div className="list-header">
        <div className="list-info">
          <h3 className="list-name" style={{ color: list.color }}>{list.listName}</h3>
          <div className="list-color-indicator" style={{ backgroundColor: list.color }}></div>
        </div>
      </div>

      {/* Candidatos de la lista */}
      <div className="list-candidates">
        {/* Presidente */}
        <div className="candidate-item president">
          <div className="candidate-photo">
            {list.presidentPhoto && !imageError ? (
              <img
                src={list.presidentPhoto}
                alt={list.presidentName}
                onError={handleImageError}
                className="photo-img"
              />
            ) : (
              <div className="photo-placeholder president-placeholder">
                👑
              </div>
            )}
          </div>
          <div className="candidate-details">
            <div className="candidate-role">👑 PRESIDENTE</div>
            <div className="candidate-name">{list.presidentName}</div>
            {list.presidentCourse && (
              <div className="candidate-course">📚 {list.presidentCourse}</div>
            )}
          </div>
        </div>

        {/* Vicepresidente */}
        <div className="candidate-item vice-president">
          <div className="candidate-photo">
            <div className="photo-placeholder vice-president-placeholder">
              🤝
            </div>
          </div>
          <div className="candidate-details">
            <div className="candidate-role">🤝 VICEPRESIDENTE</div>
            <div className="candidate-name">{list.vicePresidentName}</div>
            {list.vicePresidentCourse && (
              <div className="candidate-course">📚 {list.vicePresidentCourse}</div>
            )}
          </div>
        </div>
      </div>

      {/* Botón de selección */}
      <div className="selection-area">
        <button
          onClick={handleSelect}
          className={`select-btn ${isSelected ? 'selected' : ''}`}
          style={{
            backgroundColor: isSelected ? list.color : 'transparent',
            borderColor: list.color,
            color: isSelected ? 'white' : list.color
          }}
        >
          {isSelected ? '✅ LISTA SELECCIONADA' : 'VOTAR POR ESTA LISTA'}
        </button>
      </div>

      {/* Franja de color de la lista */}
      <div 
        className="list-color-stripe"
        style={{ backgroundColor: list.color }}
      ></div>
    </div>
  );
};

export default ElectoralListCard;