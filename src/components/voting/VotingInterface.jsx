// src/components/voting/VotingInterface.jsx
import React, { useState, useEffect } from 'react';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useElectionConfig } from '../../contexts/ElectionConfigContext';
import ElectoralListCard from './ElectoralListCard';
import './VotingInterface.css';

const VotingInterface = ({ student, onSubmit }) => {
  const { 
    candidates, 
    selectedVotes, 
    selectCandidate, 
    getSelectedCandidate,
    clearSelections,
    loading,
    error
  } = useCandidates();

  const {
    config,
    getElectionTypeName,
    isConfigLoaded
  } = useElectionConfig();

  // Debug logging (can be removed in production)
  console.log('🗳️ VotingInterface render:', { student, candidates, selectedVotes, loading, error });
  
  const [selectedList, setSelectedList] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  
  // Get electoral lists from candidates (support multiple detection methods)
  const electoralLists = candidates.filter(c => 
    c.type === 'list' || 
    (c.type === 'candidate' && c.listName) ||
    c.listName ||
    c.presidentName ||
    c.vicePresidentName
  ) || [];
  
  console.log('🏆 Electoral lists found:', electoralLists.length, electoralLists);
  console.log('📋 All candidates data:', candidates);
  

  // Show loading state
  if (loading) {
    return (
      <div className="voting-interface loading">
        <div className="loading-screen">
          <div className="loading-spinner">🔄</div>
          <h2>Cargando candidatos...</h2>
          <p>Por favor espere</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="voting-interface error">
        <div className="error-screen">
          <div className="error-icon">❌</div>
          <h2>Error al cargar candidatos</h2>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Check if a list has been selected
    setIsComplete(!!selectedList);
  }, [selectedList]);

  const handleListSelect = (listId) => {
    const selected = electoralLists.find(list => (list._id || list.id) === listId);
    setSelectedList(selected);
    // Also update the candidates context for consistency
    selectCandidate('electoral_list', listId);
  };

  const handleSubmit = () => {
    if (isComplete) {
      onSubmit();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('¿Está seguro de que desea limpiar la selección?')) {
      setSelectedList(null);
      clearSelections();
    }
  };

  const getProgressPercentage = () => {
    return selectedList ? 100 : 0;
  };

  return (
    <div className="voting-interface">
      {/* Información de la elección */}
      {isConfigLoaded && (
        <div className="election-info">
          <div className="election-type">
            <span className="election-label">Tipo de Elección:</span>
            <span className="election-value">{getElectionTypeName()}</span>
          </div>
          <div className="election-name">
            <span className="election-label">Elección:</span>
            <span className="election-value">{config.electionName}</span>
          </div>
        </div>
      )}

      {/* Progreso de votación */}
      <div className="voting-progress">
        <div className="progress-header">
          <h2>📊 Progreso de Votación</h2>
          <span className="progress-percentage">{getProgressPercentage()}% Completado</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="voting-status">
          <div className={`status-item ${selectedList ? 'completed' : 'pending'}`}>
            {selectedList ? '✅' : '⏳'} Lista Electoral {selectedList ? 'Seleccionada' : 'Pendiente'}
          </div>
        </div>
      </div>

      {/* Información del tipo de elección */}
      <div className="election-instructions">
        <h2>🏆 Elección por Listas Electorales</h2>
        <p className="instruction-text">
          Seleccione una lista electoral completa. Cada lista incluye candidatos para Presidente y Vicepresidente estudiantil.
        </p>
      </div>

      {/* Lista de listas electorales */}
      <div className="lists-section">
        <div className="section-header">
          <h2>
            🗳️ LISTAS ELECTORALES DISPONIBLES:
          </h2>
          <p className="instruction">
            Seleccione la lista electoral de su preferencia
          </p>
        </div>

        <div className="lists-grid">
          {electoralLists.map((list, index) => (
            <ElectoralListCard
              key={list._id || list.id || `list-${index}`}
              list={list}
              isSelected={selectedList && (selectedList._id || selectedList.id) === (list._id || list.id)}
              onSelect={handleListSelect}
            />
          ))}
        </div>

        {electoralLists.length === 0 && (
          <div className="no-lists">
            <div className="no-lists-icon">⚠️</div>
            <h3>No hay listas electorales disponibles</h3>
            <p>No se han configurado listas electorales para este nivel educativo.</p>
            <p>Contacte al administrador del sistema.</p>
          </div>
        )}
      </div>

      {/* Acciones de votación */}
      <div className="voting-actions">
        <div className="actions-left">
          <button 
            onClick={handleClearAll}
            className="action-btn clear-btn"
            disabled={Object.keys(selectedVotes).length === 0}
          >
            🗑️ Limpiar Todo
          </button>
        </div>

        <div className="actions-center">
          <div className="selection-summary">
            <h3>📋 Selección Actual:</h3>
            {selectedList ? (
              <div className="selected-list-summary">
                <div className="list-summary-header">
                  <span className="list-name" style={{ color: selectedList.color }}>
                    ✅ {selectedList.listName}
                  </span>
                  <span className="list-color-dot" style={{ backgroundColor: selectedList.color }}></span>
                </div>
                <div className="candidates-summary">
                  <div className="candidate-summary">
                    <span className="role">👑 Presidente:</span>
                    <span className="name">{selectedList.presidentName}</span>
                  </div>
                  <div className="candidate-summary">
                    <span className="role">🤝 Vicepresidente:</span>
                    <span className="name">{selectedList.vicePresidentName}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <span className="pending-icon">⏳</span>
                <span className="pending-text">Ningúna lista seleccionada</span>
              </div>
            )}
          </div>
        </div>

        <div className="actions-right">
          <button 
            onClick={handleSubmit}
            className={`action-btn submit-btn ${isComplete ? 'ready' : 'disabled'}`}
            disabled={!isComplete}
          >
            {isComplete ? '✅ Confirmar Voto' : '⏳ Seleccione una lista electoral'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingInterface;