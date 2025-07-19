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
  const { hasVoted, getAvailableCargos } = useCandidates();
  const [currentStep, setCurrentStep] = useState('voting'); // voting, confirmation, completed
  const [startTime] = useState(new Date());

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