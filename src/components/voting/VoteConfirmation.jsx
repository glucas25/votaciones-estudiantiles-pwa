// src/components/voting/VoteConfirmation.jsx
import React, { useState } from 'react';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useStudents } from '../../contexts/StudentsContext';
import './VoteConfirmation.css';

const VoteConfirmation = ({ student, onConfirm, onCancel }) => {
  const { 
    selectedVotes, 
    getListById, 
    castVote,
    candidates 
  } = useCandidates();
  const { markStudentAsVoted } = useStudents();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Get selected electoral list
  const selectedListId = selectedVotes['electoral_list'];
  const selectedList = selectedListId ? getListById(selectedListId) : null;

  const handleConfirm = async () => {
    if (!selectedList) {
      alert('❌ No hay lista seleccionada');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Cast vote for the selected list
      const voteRecord = await castVote(student.id, selectedListId);

      // Mark student as voted
      markStudentAsVoted(student.id);
      
      setSubmitted(true);
      
      // Simulate processing delay
      setTimeout(() => {
        onConfirm(voteRecord);
      }, 2000);
      
    } catch (error) {
      console.error('Error al registrar voto:', error);
      alert('❌ Error al registrar el voto. Intente nuevamente.');
      setIsSubmitting(false);
    }
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (submitted) {
    return (
      <div className="vote-confirmation submitted">
        <div className="submission-screen">
          <div className="submission-animation">
            <div className="check-mark">✅</div>
            <div className="processing-text">
              <h2>Procesando Voto...</h2>
              <p>Por favor espere mientras se registra su voto</p>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vote-confirmation">
      <div className="confirmation-header">
        <h1>✅ CONFIRMACIÓN DE VOTO</h1>
        <p className="confirmation-subtitle">
          Por favor revise cuidadosamente sus selecciones antes de confirmar
        </p>
      </div>

      <div className="voter-summary">
        <h2>👤 Información del Votante</h2>
        <div className="voter-details">
          <div className="detail-item">
            <span className="label">Estudiante:</span>
            <span className="value">{student.nombres} {student.apellidos}</span>
          </div>
          <div className="detail-item">
            <span className="label">Curso:</span>
            <span className="value">{student.curso}</span>
          </div>
          <div className="detail-item">
            <span className="label">Cédula:</span>
            <span className="value">{student.cedula}</span>
          </div>
          <div className="detail-item">
            <span className="label">Hora:</span>
            <span className="value">{formatTime()}</span>
          </div>
        </div>
      </div>

      <div className="votes-summary">
        <h2>🗳️ Lista Electoral Seleccionada</h2>
        <div className="selected-list-display">
          {selectedList ? (
            <div className="vote-item">
              <div className="list-header">
                <div 
                  className="list-color-indicator"
                  style={{ backgroundColor: selectedList.color }}
                ></div>
                <h3 className="list-name" style={{ color: selectedList.color }}>
                  {selectedList.listName}
                </h3>
                <div className="vote-indicator">
                  <span className="vote-checkmark">✓</span>
                </div>
              </div>
              
              <div className="list-candidates">
                <div className="candidate-item">
                  <div className="candidate-photo-container">
                    {selectedList.presidentPhoto ? (
                      <img 
                        src={selectedList.presidentPhoto} 
                        alt={selectedList.presidentName}
                        className="candidate-photo-small"
                      />
                    ) : (
                      <div className="candidate-photo-placeholder president">
                        👑
                      </div>
                    )}
                  </div>
                  <div className="candidate-info">
                    <div className="candidate-role">👑 PRESIDENTE</div>
                    <h4 className="candidate-name">{selectedList.presidentName}</h4>
                    {selectedList.presidentCourse && (
                      <p className="candidate-course">📚 {selectedList.presidentCourse}</p>
                    )}
                  </div>
                </div>
                
                <div className="candidate-item">
                  <div className="candidate-photo-container">
                    <div className="candidate-photo-placeholder vice-president">
                      🤝
                    </div>
                  </div>
                  <div className="candidate-info">
                    <div className="candidate-role">🤝 VICEPRESIDENTE</div>
                    <h4 className="candidate-name">{selectedList.vicePresidentName}</h4>
                    {selectedList.vicePresidentCourse && (
                      <p className="candidate-course">📚 {selectedList.vicePresidentCourse}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>❌ No hay lista electoral seleccionada</p>
            </div>
          )}
        </div>
      </div>

      <div className="confirmation-warning">
        <div className="warning-content">
          <h3>⚠️ IMPORTANTE</h3>
          <ul>
            <li>Una vez confirmado, <strong>no podrá cambiar su voto</strong></li>
            <li>Asegúrese de que todas sus selecciones sean correctas</li>
            <li>Su voto será registrado de forma <strong>segura y confidencial</strong></li>
            <li>Mantenga la confidencialidad de su decisión</li>
          </ul>
        </div>
      </div>

      <div className="confirmation-actions">
        <button 
          onClick={onCancel}
          className="action-btn cancel-btn"
          disabled={isSubmitting}
        >
          ⬅️ Revisar Selecciones
        </button>
        
        <button 
          onClick={handleConfirm}
          className="action-btn confirm-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>🔄 Registrando Voto...</>
          ) : (
            <>✅ CONFIRMAR VOTO</>
          )}
        </button>
      </div>

      <div className="security-footer">
        <p>🔒 Su voto es secreto y será procesado de forma segura</p>
      </div>
    </div>
  );
};

export default VoteConfirmation;