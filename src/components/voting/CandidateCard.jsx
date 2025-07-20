// src/components/voting/CandidateCard.jsx
import React, { useState } from 'react';
import './CandidateCard.css';

const CandidateCard = ({ candidate, isSelected, onSelect }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Ensure propuestas is always an array
  const propuestas = Array.isArray(candidate.propuestas) 
    ? candidate.propuestas 
    : (candidate.propuestas ? candidate.propuestas.split(',').map(p => p.trim()) : []);

  const handleSelect = () => {
    onSelect(candidate.id);
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
    <div className={`candidate-card ${isSelected ? 'selected' : ''}`}>
      {/* Badge de selección */}
      {isSelected && (
        <div className="selection-badge">
          ✅ SELECCIONADO
        </div>
      )}

      {/* Encabezado con foto y info básica */}
      <div className="candidate-header">
        <div className="candidate-photo">
          {!imageError ? (
            <img
              src={candidate.foto}
              alt={candidate.nombre}
              onError={handleImageError}
              className="photo-img"
            />
          ) : (
            <div 
              className="photo-placeholder"
              style={{ backgroundColor: candidate.color }}
            >
              {getInitials(candidate.nombre)}
            </div>
          )}
        </div>

        <div className="candidate-info">
          <h3 className="candidate-name">{candidate.nombre}</h3>
          <div 
            className="candidate-list"
            style={{ color: candidate.color }}
          >
            <span className="list-indicator" style={{ backgroundColor: candidate.color }}></span>
            {candidate.lista}
          </div>
          <div className="candidate-cargo">
            🏆 {candidate.cargo}
          </div>
        </div>
      </div>

      {/* Slogan principal */}
      {candidate.slogan && (
        <div className="candidate-slogan">
          💬 "{candidate.slogan}"
        </div>
      )}

      {/* Propuestas principales (las primeras 2) */}
      <div className="candidate-proposals">
        <h4>📋 Propuestas Principales:</h4>
        <ul className="proposals-list">
          {propuestas.slice(0, 2).map((propuesta, index) => (
            <li key={index} className="proposal-item">
              <span className="proposal-bullet" style={{ color: candidate.color }}>•</span>
              {propuesta}
            </li>
          ))}
        </ul>
        
        {propuestas.length > 2 && (
          <button 
            onClick={toggleDetails}
            className="show-more-btn"
          >
            {showDetails ? 'Ver menos ▲' : `Ver ${propuestas.length - 2} propuestas más ▼`}
          </button>
        )}
      </div>

      {/* Detalles expandibles */}
      {showDetails && (
        <div className="candidate-details">
          {propuestas.length > 2 && (
            <div className="all-proposals">
              <h4>📋 Todas las Propuestas:</h4>
              <ul className="proposals-list full">
                {propuestas.map((propuesta, index) => (
                  <li key={index} className="proposal-item">
                    <span className="proposal-number">{index + 1}.</span>
                    {propuesta}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {candidate.experiencia && (
            <div className="candidate-experience">
              <h4>🎓 Experiencia:</h4>
              <p>{candidate.experiencia}</p>
            </div>
          )}
        </div>
      )}

      {/* Botón de selección */}
      <div className="selection-area">
        <button
          onClick={handleSelect}
          className={`select-btn ${isSelected ? 'selected' : ''}`}
          style={{
            backgroundColor: isSelected ? candidate.color : 'transparent',
            borderColor: candidate.color,
            color: isSelected ? 'white' : candidate.color
          }}
        >
          {isSelected ? '✅ SELECCIONADO' : 'SELECCIONAR'}
        </button>
      </div>

      {/* Indicador de color de la lista */}
      <div 
        className="list-color-stripe"
        style={{ backgroundColor: candidate.color }}
      ></div>
    </div>
  );
};

export default CandidateCard;