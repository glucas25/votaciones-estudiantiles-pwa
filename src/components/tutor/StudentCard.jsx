// src/components/tutor/StudentCard.jsx
import React, { useState } from 'react';
import { useStudents } from '../../contexts/StudentsContext';
import './StudentCard.css';

const StudentCard = ({ student, status, index, onStartVoting }) => {
  const { 
    studentStates, 
    markStudentAsVoted, 
    markStudentAsAbsent, 
    markStudentAsPresent,
    getStudentId 
  } = useStudents();
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const studentId = getStudentId(student);
  const studentState = studentStates[studentId];

  const handleStartVoting = async () => {
    setIsProcessing(true);
    
    // Simular breve delay de preparación
    setTimeout(() => {
      if (window.confirm(`¿Confirmar inicio de votación para ${student.nombres || student.nombre} ${student.apellidos}?`)) {
        // Llamar al callback para abrir la interfaz de votación
        if (onStartVoting) {
          onStartVoting(student);
        }
      }
      setIsProcessing(false);
    }, 500);
  };

  const handleMarkAbsent = () => {
    if (window.confirm(`¿Marcar a ${student.nombres || student.nombre} ${student.apellidos} como ausente?`)) {
      markStudentAsAbsent(student);
    }
  };

  const handleMarkPresent = () => {
    if (window.confirm(`¿Marcar a ${student.nombres || student.nombre} ${student.apellidos} como presente?`)) {
      markStudentAsPresent(student);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCardClass = () => {
    const baseClass = 'student-card';
    return `${baseClass} ${status}`;
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return { icon: '🟢', text: 'Pendiente', color: '#22c55e' };
      case 'voted':
        return { icon: '✅', text: 'Votó', color: '#3b82f6' };
      case 'absent':
        return { icon: '❌', text: 'Ausente', color: '#ef4444' };
      default:
        return { icon: '📋', text: 'Sin estado', color: '#6b7280' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className={getCardClass()}>
      <div className="card-header">
        <div className="student-number">#{index.toString().padStart(2, '0')}</div>
        <div className="status-indicator" style={{ color: statusDisplay.color }}>
          {statusDisplay.icon}
        </div>
      </div>

      <div className="student-info">
        <h3 className="student-name">
          {student.apellidos}, {student.nombres || student.nombre}
        </h3>
        <div className="student-details">
          <span className="student-course">🎓 {student.curso || student.course}</span>
          <span className="student-id">📋 {student.cedula}</span>
        </div>
      </div>

      <div className="status-info">
        <span className="status-text" style={{ color: statusDisplay.color }}>
          {statusDisplay.text}
        </span>
        {studentState?.votedAt && (
          <span className="time-info">
            🕐 {formatTime(studentState.votedAt)}
          </span>
        )}
      </div>

      <div className="card-actions">
        {status === 'pending' && (
          <>
            <button
              onClick={handleStartVoting}
              disabled={isProcessing}
              className="action-btn primary-btn vote-btn"
            >
              {isProcessing ? '🔄 Procesando...' : '🗳️ VOTAR'}
            </button>
            <button
              onClick={handleMarkAbsent}
              className="action-btn secondary-btn absent-btn"
            >
              ❌ Ausente
            </button>
          </>
        )}

        {status === 'voted' && (
          <div className="voted-info">
            <span className="voted-badge">✅ Voto registrado</span>
            {studentState?.votedAt && (
              <span className="voted-time">
                {formatTime(studentState.votedAt)}
              </span>
            )}
          </div>
        )}

        {status === 'absent' && (
          <button
            onClick={handleMarkPresent}
            className="action-btn secondary-btn present-btn"
          >
            📝 Marcar Presente
          </button>
        )}
      </div>

      {/* Indicador de procesamiento */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner">🔄</div>
        </div>
      )}
    </div>
  );
};

export default StudentCard;