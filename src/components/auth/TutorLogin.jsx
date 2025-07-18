// src/components/auth/TutorLogin.jsx
import React, { useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext.jsx';

const TutorLogin = () => {
  const [activationCode, setActivationCode] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [step, setStep] = useState('code');

  const {
    validateActivationCode,
    login,
    availableCourses,
    isValidatingCode,
    isLoading,
    error,
    clearError
  } = useAuthContext();

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!activationCode.trim()) return;

    const result = await validateActivationCode(activationCode);
    
    if (result.success) {
      if (result.courses.length === 1) {
        setSelectedCourse(result.courses[0]);
        setStep('name');
      } else {
        setStep('course');
      }
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setStep('name');
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    const finalTutorName = tutorName.trim() || 'Tutor';
    await login(activationCode, selectedCourse, finalTutorName);
  };

  const styles = {
    container: {
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '20px',
      padding: '32px',
      maxWidth: '500px',
      width: '100%'
    },
    title: {
      fontSize: '1.8rem',
      marginBottom: '24px',
      color: 'white',
      textAlign: 'center'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    input: {
      padding: '16px',
      borderRadius: '12px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '1.1rem',
      textAlign: 'center'
    },
    button: {
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#1e40af',
      border: 'none',
      borderRadius: '12px',
      padding: '16px 24px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    error: {
      background: 'rgba(239, 68, 68, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      color: '#FEF2F2',
      fontSize: '0.9rem'
    }
  };

  if (step === 'code') {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>🔐 Acceso Docente</h2>
        <form onSubmit={handleCodeSubmit} style={styles.form}>
          <input
            type="text"
            value={activationCode}
            onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
            placeholder="ELEC2024-BACH"
            style={styles.input}
            disabled={isValidatingCode}
          />
          
          {error && <div style={styles.error}>⚠️ {error}</div>}
          
          <button
            type="submit"
            style={styles.button}
            disabled={!activationCode.trim() || isValidatingCode}
          >
            {isValidatingCode ? '🔄 Validando...' : '🔓 Validar Código'}
          </button>
        </form>
      </div>
    );
  }

  if (step === 'course') {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>📚 Seleccionar Curso</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {availableCourses.map((course, index) => (
            <button
              key={index}
              onClick={() => handleCourseSelect(course)}
              style={{
                ...styles.button,
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
            >
              {course}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'name') {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>👨‍🏫 Información del Tutor</h2>
        <p style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          Curso: <strong>{selectedCourse}</strong>
        </p>
        <form onSubmit={handleNameSubmit} style={styles.form}>
          <input
            type="text"
            value={tutorName}
            onChange={(e) => setTutorName(e.target.value)}
            placeholder="Prof. García (opcional)"
            style={styles.input}
            disabled={isLoading}
          />
          
          {error && <div style={styles.error}>⚠️ {error}</div>}
          
          <button
            type="submit"
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Iniciando...' : '🚀 Iniciar Votación'}
          </button>
        </form>
      </div>
    );
  }

  return null;
};

export default TutorLogin;