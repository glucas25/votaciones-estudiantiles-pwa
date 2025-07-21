// src/components/auth/TutorLogin.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import activationCodesService from '../../services/activationCodes.js';
import './TutorLogin.css';

const TutorLogin = () => {
  const [activationCode, setActivationCode] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [courseInfo, setCourseInfo] = useState(null);  // Info del curso detectado
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  
  const { isOnline, login } = useAuth();

  // VALIDACIÓN DINÁMICA de códigos desde BD
  const validateCode = async (code) => {
    if (!code || code.length < 8) {
      setCourseInfo(null);
      setError('');
      return;
    }

    setValidating(true);
    setError('');
    
    try {
      const validation = await activationCodesService.validateCode(code);
      
      if (validation.valid) {
        const courseData = validation.data;
        
        setCourseInfo({
          course: courseData.course,
          level: courseData.level_name || courseData.level,
          codeData: courseData
        });
        setError('');
      } else {
        setCourseInfo(null);
        setError(validation.error || 'Código de activación inválido');
      }
    } catch (err) {
      setCourseInfo(null);
      setError('Error validando código: ' + err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!activationCode.trim()) {
      setError('Ingrese el código de activación');
      return;
    }
    
    if (!tutorName.trim()) {
      setError('Ingrese su nombre completo');
      return;
    }

    if (!courseInfo) {
      setError('Código de activación inválido');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Marcar código como usado
      await activationCodesService.markCodeAsUsed(activationCode.trim(), tutorName.trim());
      
      // Usar AuthContext para login - esto automáticamente mostrará TutorPanel
      const loginResult = await login(activationCode.trim(), courseInfo.course, tutorName.trim());
      
      if (!loginResult.success) {
        throw new Error(loginResult.error);
      }
      
      // Login exitoso - AuthContext automáticamente mostrará TutorPanel
      
    } catch (err) {
      console.error('❌ TutorLogin: Error en login:', err);
      setError('Error al iniciar sesión: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setActivationCode(value);
    
    // Validar automáticamente cuando el código tenga la longitud mínima
    if (value.length >= 8) {
      // Validar inmediatamente - sin delay para mejor UX
      validateCode(value);
    } else {
      setCourseInfo(null);
      setError('');
    }
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
              placeholder="VOTACION-A7X9K"
              className={`form-input ${error ? 'error' : courseInfo ? 'success' : ''}`}
              maxLength="20"
              autoComplete="off"
            />
            {validating && (
              <div className="validation-status">
                🔄 Validando código...
              </div>
            )}
            {courseInfo && (
              <div className="course-detected">
                ✅ <strong>Curso detectado:</strong> {courseInfo.course} ({courseInfo.level})
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="tutorName">
              👤 Nombre del Docente (Obligatorio):
            </label>
            <input
              type="text"
              id="tutorName"
              value={tutorName}
              onChange={(e) => setTutorName(e.target.value)}
              placeholder="Profesor Juan García"
              className="form-input"
              maxLength="50"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={!activationCode || !tutorName || !courseInfo || isSubmitting || validating}
          >
            {isSubmitting ? (
              <>🔄 Iniciando sesión...</>
            ) : validating ? (
              <>⏳ Validando código...</>
            ) : (
              <>🔓 ACCEDER AL PANEL</>
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
          <h3>💡 Instrucciones de Acceso:</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <p><strong>1.</strong> Solicite su código de activación al administrador</p>
            <p><strong>2.</strong> Ingrese el código completo (ej: VOTACION-A7X9K)</p>
            <p><strong>3.</strong> Escriba su nombre completo</p>
            <p><strong>4.</strong> El sistema detectará automáticamente su curso</p>
            <p><strong>5.</strong> Accederá directamente al panel de votación</p>
          </div>
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px',
            border: '1px solid #bfdbfe'
          }}>
            <strong>📞 ¿Problemas con su código?</strong><br/>
            Contacte al administrador de la elección
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorLogin;