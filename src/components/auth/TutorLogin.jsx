// src/components/auth/TutorLogin.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../hooks/useDatabase.js';
import databaseService from '../../services/database-indexeddb.js';
import './TutorLogin.css';

const TutorLogin = () => {
  const [activationCode, setActivationCode] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [databaseCourses, setDatabaseCourses] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isOnline, validateActivationCode, getAvailableCourses } = useAuth();
  const { isReady } = useDatabase();

  // Función simplificada - ya no necesitamos validación compleja

  // Cargar cursos de la base de datos
  useEffect(() => {
    const loadDatabaseCourses = async () => {
      try {
        console.log('🔍 TutorLogin: Iniciando carga de cursos...');
        console.log('🔧 TutorLogin: isReady from hook:', isReady);
        console.log('🔧 TutorLogin: Database service ready:', databaseService.isReady());
        
        // Esperar un poco más para asegurar que la BD está lista
        if (!isReady) {
          console.log('⏳ TutorLogin: Esperando a que la BD esté lista...');
          return;
        }
        
        // Intentar múltiples veces si es necesario
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          try {
            console.log(`🔄 TutorLogin: Intento ${attempts + 1} de ${maxAttempts}`);
            
            const result = await databaseService.findDocuments('students', {
              selector: { type: 'student' }
            });
            
            console.log('📊 TutorLogin: Result from DB:', result);
            
            if (result && result.success && result.docs) {
              const courses = [...new Set(
                result.docs.map(s => s.curso || s.course).filter(Boolean)
              )].sort();
              
              console.log('📚 TutorLogin: Cursos encontrados en BD:', courses);
              setDatabaseCourses(courses);
              return; // Éxito, salir del bucle
            } else {
              console.log('⚠️ TutorLogin: Result inválido o sin éxito:', result);
            }
          } catch (error) {
            console.error(`❌ TutorLogin: Error en intento ${attempts + 1}:`, error);
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            console.log('⏳ Esperando 1 segundo antes del siguiente intento...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log('❌ TutorLogin: No se pudieron cargar los cursos después de todos los intentos');
        setDatabaseCourses([]);
        
      } catch (error) {
        console.error('❌ TutorLogin: Error general al cargar cursos:', error);
        setDatabaseCourses([]);
      }
    };
    
    // Esperar un poco antes de ejecutar
    const timer = setTimeout(() => {
      loadDatabaseCourses();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isReady]);

  useEffect(() => {
    console.log('🔄 TutorLogin: Effect triggered - código:', activationCode, 'DB cursos:', databaseCourses.length);
    
    if (activationCode.length >= 5) {
      const validation = validateActivationCode(activationCode);
      if (validation.valid) {
        console.log('✅ TutorLogin: Código válido:', activationCode);
        
        let finalCourses = [];
        
        if (databaseCourses.length > 0) {
          // Usar TODOS los cursos de BD tal como están importados
          finalCourses = [...databaseCourses]; // Crear copia para evitar mutaciones
          console.log('📚 TutorLogin: Usando cursos de BD:', finalCourses);
        } else {
          // Fallback a cursos hardcodeados solo si no hay BD
          const hardcodedCourses = getAvailableCourses(activationCode);
          finalCourses = [...hardcodedCourses];
          console.log('📚 TutorLogin: Usando cursos hardcodeados:', finalCourses);
        }
        
        console.log('🎯 TutorLogin: Estableciendo cursos disponibles:', finalCourses);
        setAvailableCourses(finalCourses);
        setError('');
        
        // Auto-seleccionar si solo hay uno
        if (finalCourses.length === 1) {
          setSelectedCourse(finalCourses[0]);
          console.log('🎯 Auto-seleccionado:', finalCourses[0]);
        } else {
          setSelectedCourse(''); // Reset selection
        }
      } else {
        console.log('❌ TutorLogin: Código inválido:', validation.error);
        setAvailableCourses([]);
        setSelectedCourse('');
        setError(validation.error);
      }
    } else {
      console.log('⏳ TutorLogin: Código muy corto');
      setAvailableCourses([]);
      setSelectedCourse('');
      setError('');
    }
  }, [activationCode, databaseCourses, validateActivationCode, getAvailableCourses]);

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
            <div className="course-info" style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '5px'
            }}>
              <div style={{ marginBottom: '5px' }}>
                {databaseCourses.length > 0 ? (
                  <span>📊 Cursos en BD ({databaseCourses.length}): {databaseCourses.join(', ')}</span>
                ) : (
                  <span>⚠️ No se cargaron cursos de BD</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎯 Opciones disponibles: {availableCourses.length}</span>
                <button 
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Recargar
                </button>
              </div>
            </div>
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