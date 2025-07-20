// src/components/voting/VotingInterface.jsx
import React, { useState, useEffect } from 'react';
import { useCandidates } from '../../contexts/CandidatesContext';
import CandidateCard from './CandidateCard';
import './VotingInterface.css';

const VotingInterface = ({ student, onSubmit }) => {
  const { 
    candidates, 
    selectedVotes, 
    selectCandidate, 
    getSelectedCandidate,
    getAvailableCargos,
    clearSelections,
    loading,
    error
  } = useCandidates();

  // Debug logging (can be removed in production)
  // console.log('VotingInterface render:', { student, candidates, selectedVotes, loading, error });
  
  const [currentCargo, setCurrentCargo] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  const cargos = getAvailableCargos();

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
    // Seleccionar el primer cargo disponible
    if (cargos.length > 0 && !currentCargo) {
      setCurrentCargo(cargos[0]);
    }
  }, [cargos, currentCargo]);

  useEffect(() => {
    // Verificar si se han hecho todas las selecciones necesarias
    const allSelected = cargos.every(cargo => getSelectedCandidate(cargo));
    setIsComplete(allSelected);
  }, [selectedVotes, cargos, getSelectedCandidate]);

  const handleCandidateSelect = (candidateId) => {
    selectCandidate(currentCargo, candidateId);
  };

  const handleCargoChange = (cargo) => {
    setCurrentCargo(cargo);
  };

  const handleSubmit = () => {
    if (isComplete) {
      onSubmit();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('¿Está seguro de que desea limpiar todas las selecciones?')) {
      clearSelections();
    }
  };

  const getProgressPercentage = () => {
    const selectedCount = cargos.filter(cargo => getSelectedCandidate(cargo)).length;
    return cargos.length > 0 ? Math.round((selectedCount / cargos.length) * 100) : 0;
  };

  const currentCandidates = candidates[currentCargo] || [];
  const selectedCandidate = getSelectedCandidate(currentCargo);

  return (
    <div className="voting-interface">
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
        <div className="cargos-status">
          {cargos.map(cargo => (
            <div 
              key={cargo} 
              className={`cargo-status ${getSelectedCandidate(cargo) ? 'completed' : 'pending'}`}
            >
              {getSelectedCandidate(cargo) ? '✅' : '⏳'} {cargo}
            </div>
          ))}
        </div>
      </div>

      {/* Selector de cargo */}
      <div className="cargo-selector">
        <h2>🏆 Seleccione el cargo a votar:</h2>
        <div className="cargo-tabs">
          {cargos.map(cargo => (
            <button
              key={cargo}
              onClick={() => handleCargoChange(cargo)}
              className={`cargo-tab ${currentCargo === cargo ? 'active' : ''} ${getSelectedCandidate(cargo) ? 'completed' : ''}`}
            >
              <span className="cargo-icon">
                {getSelectedCandidate(cargo) ? '✅' : '🗳️'}
              </span>
              <span className="cargo-name">{cargo}</span>
              {getSelectedCandidate(cargo) && (
                <span className="selected-indicator">
                  Seleccionado
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de candidatos */}
      {currentCargo && (
        <div className="candidates-section">
          <div className="section-header">
            <h2>
              🏆 {currentCargo.toUpperCase()}:
            </h2>
            <p className="instruction">
              Seleccione su candidato preferido para {currentCargo.toLowerCase()}
            </p>
          </div>

          <div className="candidates-grid">
            {currentCandidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.id || candidate._id || candidate.originalId || `candidate-${index}`}
                candidate={candidate}
                isSelected={selectedCandidate === (candidate.id || candidate._id || candidate.originalId)}
                onSelect={() => handleCandidateSelect(candidate.id || candidate._id || candidate.originalId)}
              />
            ))}
          </div>

          {currentCandidates.length === 0 && (
            <div className="no-candidates">
              <p>ℹ️ No hay candidatos disponibles para este cargo</p>
            </div>
          )}
        </div>
      )}

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
            <h3>📋 Resumen de Selecciones:</h3>
            {cargos.map(cargo => {
              const selected = getSelectedCandidate(cargo);
              return (
                <div key={cargo} className="selection-item">
                  <span className="cargo">{cargo}:</span>
                  <span className={`candidate ${selected ? 'selected' : 'pending'}`}>
                    {selected ? 
                      candidates[cargo]?.find(c => c.id === selected)?.nombre || 'Candidato no encontrado'
                      : 'Sin seleccionar'
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="actions-right">
          <button 
            onClick={handleSubmit}
            className={`action-btn submit-btn ${isComplete ? 'ready' : 'disabled'}`}
            disabled={!isComplete}
          >
            {isComplete ? '✅ Confirmar Voto' : `⏳ Faltan ${cargos.length - Object.keys(selectedVotes).length} selecciones`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingInterface;