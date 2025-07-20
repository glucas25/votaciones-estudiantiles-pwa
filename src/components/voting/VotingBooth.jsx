// src/components/voting/VotingBooth.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useStudents } from '../../contexts/StudentsContext';
import VotingInterface from './VotingInterface';
import VoteConfirmation from './VoteConfirmation';
import './VotingBooth.css';

const VotingBooth = ({ student, onClose, onVoteComplete }) => {
  const { user } = useAuth();
  const { hasVoted, getAvailableCargos, candidates, loading, error } = useCandidates();
  const [currentStep, setCurrentStep] = useState('voting'); // voting, confirmation, completed
  const [startTime] = useState(new Date());

  // Debug logging (can be removed in production)
  // console.log('VotingBooth render:', { student, user, candidates, loading, error, currentStep });

  // Verificar si el estudiante ya votó
  useEffect(() => {
    if (hasVoted(student.id)) {
      setCurrentStep('completed');
    }
  }, [student.id, hasVoted]);

  const handleVoteSubmission = () => {
    setCurrentStep('confirmation');
  };

  const handleConfirmVote = () => {
    setCurrentStep('completed');
    
    // Llamar callback para marcar como votado
    if (onVoteComplete) {
      onVoteComplete(student.id);
    }
  };

  const handleReturn = () => {
    if (onClose) {
      onClose();
    }
  };

  const getSessionDuration = () => {
    const now = new Date();
    const duration = Math.round((now - startTime) / 1000);
    return duration;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="voting-booth loading">
        <div className="loading-screen">
          <div className="loading-spinner">🔄</div>
          <h2>Cargando sistema de votación...</h2>
          <p>Por favor espere mientras se cargan los candidatos</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="voting-booth error">
        <div className="error-screen">
          <div className="error-icon">❌</div>
          <h2>Error en el sistema de votación</h2>
          <p>Error: {error}</p>
          <button onClick={handleReturn} className="return-btn">
            ⬅️ Volver al Panel
          </button>
        </div>
      </div>
    );
  }

  // Show if no candidates available
  if (!candidates || Object.keys(candidates).length === 0) {
    return (
      <div className="voting-booth no-candidates">
        <div className="no-candidates-screen">
          <div className="warning-icon">⚠️</div>
          <h2>No hay candidatos disponibles</h2>
          <p>No se han configurado candidatos para este nivel educativo.</p>
          <button onClick={handleReturn} className="return-btn">
            ⬅️ Volver al Panel
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'completed') {
    return (
      <div className="voting-booth completed">
        <div className="completion-screen">
          <div className="completion-icon">✅</div>
          <h2>¡Voto Registrado Exitosamente!</h2>
          <div className="voter-info">
            <p><strong>{student.nombres} {student.apellidos}</strong></p>
            <p>Curso: {student.curso}</p>
            <p>Hora: {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="session-info">
            <p>Tiempo de votación: {getSessionDuration()} segundos</p>
            <p>Tutor: {user.tutorName}</p>
          </div>
          <button 
            onClick={handleReturn}
            className="return-btn"
          >
            ⬅️ Volver al Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-booth">
      <div className="booth-header">
        <div className="voter-identification">
          <h1>🗳️ SISTEMA DE VOTACIÓN ESTUDIANTIL</h1>
          <div className="voter-details">
            <div className="voter-info">
              <span className="label">👤 Votante:</span>
              <span className="value">{student.nombres} {student.apellidos}</span>
            </div>
            <div className="course-info">
              <span className="label">🎓 Curso:</span>
              <span className="value">{student.curso}</span>
            </div>
            <div className="time-info">
              <span className="label">🕐 Hora:</span>
              <span className="value">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        
        <div className="booth-controls">
          <button 
            onClick={handleReturn}
            className="back-btn"
            title="Volver al menú"
          >
            ⬅️ Volver
          </button>
        </div>
      </div>

      <div className="booth-content">
        {currentStep === 'voting' && (
          <VotingInterface
            student={student}
            onSubmit={handleVoteSubmission}
          />
        )}
        
        {currentStep === 'confirmation' && (
          <VoteConfirmation
            student={student}
            onConfirm={handleConfirmVote}
            onCancel={() => setCurrentStep('voting')}
          />
        )}
      </div>

      <div className="booth-footer">
        <div className="security-info">
          🔒 Votación segura y confidencial | 
          ⏱️ Sesión iniciada: {startTime.toLocaleTimeString()} | 
          👨‍🏫 Supervisor: {user.tutorName}
        </div>
      </div>
    </div>
  );
};

export default VotingBooth;