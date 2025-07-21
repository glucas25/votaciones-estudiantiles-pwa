// src/components/admin/LevelStatsViewer.jsx
// Componente simplificado para ver estadísticas por nivel educativo
import React, { useState, useEffect } from 'react';
import databaseService, { DOC_TYPES } from '../../services/database-indexeddb.js';
import './LevelStatsViewer.css';

const LevelStatsViewer = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalStats, setTotalStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalVoted: 0,
    totalLevels: 0
  });

  useEffect(() => {
    loadLevelStats();
  }, []);

  const loadLevelStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener todos los estudiantes
      const result = await databaseService.findDocuments('students', {
        selector: { type: DOC_TYPES.STUDENT }
      });

      if (result.success && result.docs) {
        const students = result.docs;
        
        // Agrupar por nivel
        const levelGroups = {};
        const coursesByLevel = {};
        
        students.forEach(student => {
          const level = student.nivel || student.level || 'SIN_NIVEL';
          const course = student.curso || student.course || 'Sin Curso';
          
          if (!levelGroups[level]) {
            levelGroups[level] = {
              total: 0,
              voted: 0,
              courses: new Set()
            };
            coursesByLevel[level] = new Set();
          }
          
          levelGroups[level].total++;
          coursesByLevel[level].add(course);
          
          if (student.status === 'voted') {
            levelGroups[level].voted++;
          }
        });

        // Convertir a array de estadísticas
        const levelStats = Object.entries(levelGroups).map(([levelKey, data]) => {
          const displayName = getLevelDisplayName(levelKey);
          const participation = data.total > 0 ? ((data.voted / data.total) * 100) : 0;
          
          return {
            key: levelKey,
            name: displayName,
            totalStudents: data.total,
            studentsVoted: data.voted,
            studentsNotVoted: data.total - data.voted,
            participationRate: Math.round(participation * 10) / 10,
            courses: Array.from(coursesByLevel[levelKey]).sort(),
            coursesCount: coursesByLevel[levelKey].size
          };
        }).sort((a, b) => b.totalStudents - a.totalStudents); // Ordenar por cantidad de estudiantes

        // Calcular totales generales
        const totals = {
          totalStudents: students.length,
          totalCourses: new Set(students.map(s => s.curso || s.course).filter(Boolean)).size,
          totalVoted: students.filter(s => s.status === 'voted').length,
          totalLevels: levelStats.length
        };

        setStats(levelStats);
        setTotalStats(totals);
        
      } else {
        throw new Error(result.error || 'No se pudieron cargar los estudiantes');
      }
      
    } catch (err) {
      console.error('Error cargando estadísticas por nivel:', err);
      setError('Error al cargar estadísticas: ' + err.message);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const getLevelDisplayName = (levelKey) => {
    const levelNames = {
      'PREPARATORIA': 'Preparatoria',
      'BACHILLERATO': 'Bachillerato',
      'BASICA_SUPERIOR': 'Básica Superior (8vo-10mo)',
      'BASICA_MEDIA': 'Básica Media (5to-7mo)',
      'BASICA_ELEMENTAL': 'Básica Elemental (1ro-4to)',
      'SIN_NIVEL': 'Sin Nivel Asignado'
    };
    
    return levelNames[levelKey] || levelKey;
  };

  const exportStats = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalStats,
        levelStats: stats.map(level => ({
          nivel: level.name,
          totalEstudiantes: level.totalStudents,
          hanVotado: level.studentsVoted,
          noHanVotado: level.studentsNotVoted,
          participacion: `${level.participationRate}%`,
          numeroCursos: level.coursesCount,
          cursos: level.courses.join(', ')
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estadisticas_por_nivel_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Error al exportar: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="level-stats-viewer">
        <div className="loading-indicator">
          ⏳ Cargando estadísticas por nivel...
        </div>
      </div>
    );
  }

  return (
    <div className="level-stats-viewer">
      <div className="stats-header">
        <h3>📊 Estadísticas por Nivel Educativo</h3>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={loadLevelStats}
          >
            🔄 Actualizar
          </button>
          <button 
            className="btn-secondary"
            onClick={exportStats}
            disabled={stats.length === 0}
          >
            📥 Exportar
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Resumen General */}
      <div className="stats-summary">
        <h4>📋 Resumen General</h4>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">👥</div>
            <div className="card-content">
              <h5>Total Estudiantes</h5>
              <p className="card-number">{totalStats.totalStudents}</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon">✅</div>
            <div className="card-content">
              <h5>Han Votado</h5>
              <p className="card-number">{totalStats.totalVoted}</p>
              <p className="card-percentage">
                ({totalStats.totalStudents > 0 ? ((totalStats.totalVoted / totalStats.totalStudents) * 100).toFixed(1) : '0.0'}%)
              </p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon">🏫</div>
            <div className="card-content">
              <h5>Total Cursos</h5>
              <p className="card-number">{totalStats.totalCourses}</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon">📚</div>
            <div className="card-content">
              <h5>Niveles Activos</h5>
              <p className="card-number">{totalStats.totalLevels}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas por Nivel */}
      <div className="levels-stats">
        <h4>📈 Detalle por Nivel Educativo</h4>
        
        {stats.length === 0 ? (
          <div className="no-data-message">
            <p>📊 No hay estudiantes registrados para mostrar estadísticas.</p>
            <p>Importe estudiantes desde la pestaña "Estudiantes" para ver las estadísticas por nivel.</p>
          </div>
        ) : (
          <div className="levels-grid">
            {stats.map(level => (
              <div key={level.key} className="level-stat-card">
                <div className="level-header">
                  <h5>{level.name}</h5>
                  <span className="participation-badge" 
                        style={{
                          backgroundColor: level.participationRate >= 80 ? '#27ae60' : 
                                          level.participationRate >= 60 ? '#f39c12' : 
                                          level.participationRate >= 40 ? '#e67e22' : '#e74c3c'
                        }}>
                    {level.participationRate}% participación
                  </span>
                </div>
                
                <div className="level-numbers">
                  <div className="number-row">
                    <span className="label">Total estudiantes:</span>
                    <span className="value">{level.totalStudents}</span>
                  </div>
                  <div className="number-row">
                    <span className="label">Han votado:</span>
                    <span className="value voted">{level.studentsVoted}</span>
                  </div>
                  <div className="number-row">
                    <span className="label">No han votado:</span>
                    <span className="value not-voted">{level.studentsNotVoted}</span>
                  </div>
                  <div className="number-row">
                    <span className="label">Cursos:</span>
                    <span className="value">{level.coursesCount}</span>
                  </div>
                </div>
                
                <div className="participation-bar">
                  <div 
                    className="participation-fill"
                    style={{
                      width: `${level.participationRate}%`,
                      backgroundColor: level.participationRate >= 80 ? '#27ae60' : 
                                      level.participationRate >= 60 ? '#f39c12' : 
                                      level.participationRate >= 40 ? '#e67e22' : '#e74c3c'
                    }}
                  ></div>
                </div>
                
                <div className="courses-list">
                  <h6>Cursos en este nivel:</h6>
                  <div className="courses-tags">
                    {level.courses.slice(0, 5).map((course, index) => (
                      <span key={index} className="course-tag">{course}</span>
                    ))}
                    {level.courses.length > 5 && (
                      <span className="course-tag more">+{level.courses.length - 5} más</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelStatsViewer;