// src/components/tutor/TutorDebugInfo.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents } from '../../contexts/StudentsContext';

const TutorDebugInfo = () => {
  const [showDebug, setShowDebug] = useState(false);
  const { user } = useAuth();
  const { students, totalStudentsInDB, loading, error, isReady } = useStudents();

  if (!showDebug) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000,
        backgroundColor: '#f3f4f6',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <button 
          onClick={() => setShowDebug(true)}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔍 Debug Info
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      zIndex: 1000,
      backgroundColor: 'white',
      border: '1px solid #ccc',
      padding: '15px',
      borderRadius: '8px',
      maxWidth: '400px',
      fontSize: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0 }}>🔍 Debug Information</h4>
        <button 
          onClick={() => setShowDebug(false)}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '2px 6px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>👤 Usuario:</strong>
        <pre style={{ fontSize: '10px', background: '#f8f9fa', padding: '4px', borderRadius: '3px', margin: '2px 0' }}>
          {JSON.stringify({
            course: user?.course,
            level: user?.level,
            sessionId: user?.sessionId?.slice(0, 8) + '...'
          }, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong>📊 Estado de Datos:</strong>
        <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
          <li>DB Ready: {isReady ? '✅' : '❌'}</li>
          <li>Loading: {loading ? '⏳' : '✅'}</li>
          <li>Error: {error || 'None'}</li>
          <li>Total en DB: {totalStudentsInDB}</li>
          <li>En curso actual: {students?.length || 0}</li>
        </ul>
      </div>

      {/* Mostrar cursos disponibles */}
      <DatabaseCoursesInfo />
      
      {/* Botón para refrescar */}
      <RefreshButton />
    </div>
  );
};

// Componente para mostrar cursos en la BD
const DatabaseCoursesInfo = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const loadCourses = async () => {
    setLoading(true);
    try {
      // Importar dinámicamente el servicio de base de datos
      const databaseModule = await import('../../services/database-indexeddb.js');
      const databaseService = databaseModule.default;
      
      const result = await databaseService.findDocuments('students', {
        selector: { type: 'student' }
      });
      
      const uniqueCourses = [...new Set(
        (result.docs || []).map(s => s.curso || s.course).filter(Boolean)
      )].sort();
      
      setCourses(uniqueCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div style={{ marginBottom: '8px' }}>
      <strong>🎓 Cursos en BD:</strong>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ maxHeight: '100px', overflow: 'auto' }}>
          {courses.length > 0 ? (
            <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '10px' }}>
              {courses.map(course => (
                <li key={course}>{course}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#ef4444', margin: '4px 0' }}>No hay estudiantes en la BD</p>
          )}
        </div>
      )}
    </div>
  );
};

// Botón para refrescar datos
const RefreshButton = () => {
  const { refreshStudents } = useStudents();
  
  const handleRefresh = () => {
    console.log('🔄 Refreshing students data...');
    refreshStudents();
    window.location.reload(); // Forzar recarga completa para debugging
  };

  return (
    <button 
      onClick={handleRefresh}
      style={{
        background: '#10b981',
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%',
        marginTop: '8px'
      }}
    >
      🔄 Refrescar Datos
    </button>
  );
};

export default TutorDebugInfo;