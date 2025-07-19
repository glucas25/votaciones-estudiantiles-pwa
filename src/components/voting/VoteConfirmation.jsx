// src/components/voting/VoteConfirmation.jsx
import React, { useState } from 'react';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useStudents } from '../../contexts/StudentsContext';
import './VoteConfirmation.css';

const VoteConfirmation = ({ student, onConfirm, onCancel }) => {
  const { 
    selectedVotes, 
    getCandidateById, 
    castVote,
    getAvailableCargos 
  } = useCandidates();
  const { markStudentAsVoted } = useStudents();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cargos = getAvailableCargos();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    
    try {
      // Registrar votos para cada cargo
      const voteRecords = [];
      
      for (const cargo of cargos) {
        const candidateId = selectedVotes[cargo];
        if (candidateId) {
          const voteRecord = castVote(student.id, candidateId, cargo);
          voteRecords.push(voteRecord);
        }
      }

      // Marcar estudiante como votado
      markStudentAsVoted(student.id);
      
      setSubmitted(true);
      
      // Simular delay de procesamiento
      setTimeout(() => {
        onConfirm(voteRecords);
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
        <h2>🗳️ Resumen de Votos</h2>
        <div className="votes-list">
          {cargos.map(cargo => {
            const candidateId = selectedVotes[cargo];
            const candidate = candidateId ? getCandidateById(candidateId) : null;
            
            return (
              <div key={cargo} className="vote-item">
                <div className="vote-cargo">
                  <h3>🏆 {cargo}</h3>
                </div>
                
                {candidate ? (
                  <div className="selected-candidate">
                    <div className="candidate-summary">
                      <div 
                        className="candidate-photo-small"
                        style={{ backgroundColor: candidate.color }}
                      >
                        {candidate.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="candidate-info">
                        <h4 className="candidate-name">{candidate.nombre}</h4>
                        <p 
                          className="candidate-list"
                          style={{ color: candidate.color }}
                        >
                          {candidate.lista}
                        </p>
                        <p className="candidate-slogan">"{candidate.slogan}"</p>
                      </div>
                    </div>
                    <div className="vote-indicator">
                      <span className="vote-checkmark">✓</span>
                    </div>
                  </div>
                ) : (
                  <div className="no-selection">
                    <p>❌ Sin selección para este cargo</p>
                  </div>
                )}
              </div>
            );
          })}
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