// src/components/auth/TutorLogin.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './TutorLogin.css';

const TutorLogin = () => {
  const [activationCode, setActivationCode] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isOnline, validateActivationCode, getAvailableCourses } = useAuth();

  useEffect(() => {
    if (activationCode.length >= 5) {
      const validation = validateActivationCode(activationCode);
      if (validation.valid) {
        const courses = getAvailableCourses(activationCode);
        setAvailableCourses(courses);
        setError('');
        if (courses.length === 1) {
          setSelectedCourse(courses[0]);
        }
      } else {
        setAvailableCourses([]);
        setSelectedCourse('');
        setError(validation.error);
      }
    } else {
      setAvailableCourses([]);
      setSelectedCourse('');
      setError('');
    }
  }, [activationCode, validateActivationCode, getAvailableCourses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!activationCode.trim()) {
      setError('Ingrese el código de activación');
      return;
    }
    
    if (!selectedCourse) {
      setError('Seleccione un curso');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await login(activationCode.trim(), selectedCourse, tutorName.trim());
    
    if (!result.success) {
      setError(result.error);
    }
    
    setIsSubmitting(false);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setActivationCode(value);
  };

  const getConnectionStatus = () => {
    return isOnline ? '🟢 Conectado' : '🔴 Sin conexión';
  };

  const getSyncStatus = () => {
    return isOnline ? '🔄 Sincronizado' : '⏸️ Pendiente sync';
  };

  return (
    <div className="tutor-login">
      <div className="login-container">
        <div className="login-header">
          <h1>🏫 ELECCIONES ESTUDIANTILES 2024</h1>
          <h2>📱 ACCESO DOCENTE</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="activationCode">
              🔑 Código de Activación:
            </label>
            <input
              type="text"
              id="activationCode"
              value={activationCode}
              onChange={handleCodeChange}
              placeholder="ELEC2024-BACH"
              className={`form-input ${error && !availableCourses.length ? 'error' : ''}`}
              maxLength="20"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tutorName">
              👤 Nombre del Docente (Opcional):
            </label>
            <input
              type="text"
              id="tutorName"
              value={tutorName}
              onChange={(e) => setTutorName(e.target.value)}
              placeholder="Profesor García"
              className="form-input"
              maxLength="50"
            />
          </div>

          <div className="form-group">
            <label htmlFor="course">
              🎓 Seleccionar Curso:
            </label>
            <select
              id="course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className={`form-select ${!availableCourses.length ? 'disabled' : ''}`}
              disabled={!availableCourses.length}
            >
              <option value="">
                {availableCourses.length ? 'Seleccione un curso' : 'Ingrese código válido'}
              </option>
              {availableCourses.map(course => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={!activationCode || !selectedCourse || isSubmitting}
          >
            {isSubmitting ? (
              <>🔄 Iniciando...</>
            ) : (
              <>🔓 INICIAR VOTACIÓN</>
            )}
          </button>
        </form>

        <div className="status-bar">
          <span className="status-item">
            💡 Estado: {getConnectionStatus()}
          </span>
          <span className="status-divider">|</span>
          <span className="status-item">
            {getSyncStatus()}
          </span>
        </div>

        <div className="help-section">
          <h3>📋 Códigos de Prueba:</h3>
          <ul>
            <li><strong>ELEC2024-BACH</strong> - Bachillerato</li>
            <li><strong>ELEC2024-BASICA-SUP</strong> - Básica Superior</li>
            <li><strong>ELEC2024-BASICA-MEDIA</strong> - Básica Media</li>
            <li><strong>ELEC2024-BASICA-ELEM</strong> - Básica Elemental</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TutorLogin;