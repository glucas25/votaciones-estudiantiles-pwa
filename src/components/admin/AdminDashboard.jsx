import React, { useState, useEffect, createContext, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StudentManager from './StudentManager';
import DatabaseInspector from './DatabaseInspector';
import LevelStatsViewer from './LevelStatsViewer';
import ActivationCodesManager from './ActivationCodesManager';
import { useDatabase, useStudents, useCandidates } from '../../hooks/useDatabase.js';
import databaseService, { DOC_TYPES } from '../../services/database-indexeddb.js';
import activationCodesService from '../../services/activationCodes.js';
import './AdminDashboard.css';

// Contexto para datos de administración
const AdminContext = createContext();


// Default stats structure
const defaultStats = {
  totalStudents: 0,
  studentsVoted: 0,
  studentsAbsent: 0,
  activeCourses: 0,
  totalCourses: 0,
  syncedDevices: 0,
  totalDevices: 0,
  currentTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
};



// Componente principal del Dashboard
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Database hooks
  const { isReady, connectionStatus } = useDatabase();
  const { 
    students: dbStudents, 
    loading: studentsLoading,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents
  } = useStudents();
  const { 
    candidates: dbCandidates, 
    loading: candidatesLoading,
    addCandidate,
    updateCandidate,
    deleteCandidate
  } = useCandidates();

  // Local state - starts empty, filled from database
  const [candidates, setCandidates] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(defaultStats);
  const [participationByLevel, setParticipationByLevel] = useState([]);

  // Sync with database data
  useEffect(() => {
    if (isReady && !studentsLoading) {
      console.log('📊 Database ready, syncing students. DB count:', dbStudents.length);
      // Always use database data (including empty array) when database is ready
      setStudents(dbStudents);
      
      // If database is empty, offer to load mock data for development
      if (dbStudents.length === 0) {
        console.log('📊 Database is empty. Use "Reset a Mock" in Transition tab to load test data if needed.');
      }
    }
  }, [isReady, studentsLoading, dbStudents]);

  useEffect(() => {
    if (isReady && !candidatesLoading) {
      console.log('🏆 Database ready, syncing candidates. DB count:', dbCandidates.length);
      // Always use database data (including empty array) when database is ready
      setCandidates(dbCandidates);
      
      // If database is empty, offer to load mock data for development
      if (dbCandidates.length === 0) {
        console.log('🏆 Database is empty. Use "Reset a Mock" in Transition tab to load test data if needed.');
      }
    }
  }, [isReady, candidatesLoading, dbCandidates]);

  // Function to calculate real statistics from database data
  const calculateStats = (studentsData, candidatesData) => {
    const totalStudents = studentsData.length;
    const studentsVoted = studentsData.filter(s => s.status === 'voted').length;
    const studentsAbsent = studentsData.filter(s => s.status === 'absent').length;
    
    // Get unique courses from students
    const courses = [...new Set(studentsData.map(s => s.curso).filter(Boolean))];
    const activeCourses = courses.length;
    
    return {
      totalStudents,
      studentsVoted,
      studentsAbsent,
      activeCourses,
      totalCourses: activeCourses, // For now, assume all courses are active
      syncedDevices: 1, // Local database is always synced
      totalDevices: 1,
      currentTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Function to calculate participation by level
  const calculateParticipationByLevel = (studentsData) => {
    const levelMap = {
      'BASICA_ELEMENTAL': 'Básica Elemental',
      'BASICA_MEDIA': 'Básica Media', 
      'BASICA_SUPERIOR': 'Básica Superior',
      'BACHILLERATO': 'Bachillerato'
    };

    const levels = Object.keys(levelMap);
    return levels.map(levelKey => {
      const levelStudents = studentsData.filter(s => s.nivel === levelKey);
      const total = levelStudents.length;
      const voted = levelStudents.filter(s => s.status === 'voted').length;
      const percentage = total > 0 ? ((voted / total) * 100) : 0;
      
      return {
        level: levelMap[levelKey],
        voted,
        total,
        percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal place
      };
    }).filter(level => level.total > 0); // Only include levels with students
  };

  // Update stats when students or candidates data changes
  useEffect(() => {
    if (students.length >= 0) { // Allow calculation even with empty array
      const newStats = calculateStats(students, candidates);
      setStats(newStats);
      
      const newParticipation = calculateParticipationByLevel(students);
      setParticipationByLevel(newParticipation);
      
      console.log('📊 Stats updated:', newStats);
      console.log('📈 Participation by level updated:', newParticipation);
    }
  }, [students, candidates]);

  // Student management functions
  const handleStudentAdd = async (newStudent) => {
    if (isReady && addStudent) {
      try {
        const result = await addStudent(newStudent);
        if (result.success) {
          console.log('✅ Student added to database');
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('❌ Failed to add student to database:', error);
        // Fallback to local state
        setStudents([...students, { ...newStudent, id: `student_${Date.now()}` }]);
      }
    } else {
      // Fallback to local state
      setStudents([...students, { ...newStudent, id: `student_${Date.now()}` }]);
    }
  };

  const handleStudentUpdate = async (updatedStudent) => {
    if (isReady && updateStudent) {
      try {
        const result = await updateStudent(updatedStudent);
        if (result.success) {
          console.log('✅ Student updated in database');
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('❌ Failed to update student in database:', error);
        // Fallback to local state
        setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      }
    } else {
      // Fallback to local state
      setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    }
  };

  const handleStudentDelete = async (studentId) => {
    console.log('🗑️ Attempting to delete student:', studentId);
    console.log('🔍 Available students:', students);
    
    if (isReady && deleteStudent) {
      try {
        // Find student by either id or _id
        const student = students.find(s => s.id === studentId || s._id === studentId);
        console.log('🎯 Found student for deletion:', student);
        
        if (student) {
          // Use the correct ID field for database operations
          const dbId = student._id || student.id;
          const rev = student._rev;
          
          console.log('🔑 Using DB ID:', dbId, 'with rev:', rev);
          
          const result = await deleteStudent(dbId, rev);
          if (result.success) {
            console.log('✅ Student deleted from database');
            // The useStudents hook will automatically update dbStudents
            // which will trigger the useEffect and update local state
            // No need to manually update state here
          } else {
            throw new Error(result.error);
          }
        } else {
          console.log('⚠️ Student not found in database');
        }
      } catch (error) {
        console.error('❌ Failed to delete student from database:', error);
      }
    } else {
      console.log('⚠️ Database not ready for deletion');
    }
  };

  const handleBulkImport = async (importedStudents) => {
    console.log('📊 Importing students:', importedStudents);
    
    if (isReady && importStudents) {
      try {
        const result = await importStudents(importedStudents);
        if (result.success) {
          console.log('✅ Students imported to database:', result);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('❌ Failed to import students to database:', error);
        // Fallback to local state
        const studentsWithIds = importedStudents.map((student, index) => ({
          ...student,
          id: student.id || `student_${Date.now()}_${index}`,
          created: student.created || new Date().toISOString()
        }));
        
        const updatedStudents = [...students, ...studentsWithIds];
        console.log('✅ Updated students list (local fallback):', updatedStudents);
        setStudents(updatedStudents);
      }
    } else {
      // Fallback to local state
      const studentsWithIds = importedStudents.map((student, index) => ({
        ...student,
        id: student.id || `student_${Date.now()}_${index}`,
        created: student.created || new Date().toISOString()
      }));
      
      const updatedStudents = [...students, ...studentsWithIds];
      console.log('✅ Updated students list (local fallback):', updatedStudents);
      setStudents(updatedStudents);
    }
  };

  // Function to add test data for debugging
  const addTestData = async () => {
    console.log('🧪 Adding test data...');
    
    const testStudents = [
      {
        _id: 'student_001',
        type: DOC_TYPES.STUDENT,
        cedula: '1234567001',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez García',
        course: '1ro Bach A',
        curso: '1ro Bach A',
        level: 'BACHILLERATO',
        nivel: 'BACHILLERATO',
        numero: 1,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'student_002', 
        type: DOC_TYPES.STUDENT,
        cedula: '1234567002',
        nombres: 'María José',
        apellidos: 'González López',
        course: '1ro Bach A',
        curso: '1ro Bach A',
        level: 'BACHILLERATO',
        nivel: 'BACHILLERATO',
        numero: 2,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'student_003',
        type: DOC_TYPES.STUDENT,
        cedula: '1234567003',
        nombres: 'Pedro Andrés',
        apellidos: 'Martínez Silva',
        course: '1ro Bach A',
        curso: '1ro Bach A',
        level: 'BACHILLERATO',
        nivel: 'BACHILLERATO',
        numero: 3,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'student_004',
        type: DOC_TYPES.STUDENT,
        cedula: '1234567004',
        nombres: 'Ana Lucía',
        apellidos: 'Rodríguez Torres',
        course: '1ro Bach B',
        curso: '1ro Bach B',
        level: 'BACHILLERATO',
        nivel: 'BACHILLERATO',
        numero: 1,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'student_005',
        type: DOC_TYPES.STUDENT,
        cedula: '1234567005',
        nombres: 'Carlos Eduardo',
        apellidos: 'Vásquez Morales',
        course: '1ro Bach B',
        curso: '1ro Bach B',
        level: 'BACHILLERATO',
        nivel: 'BACHILLERATO',
        numero: 2,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'student_006',
        type: DOC_TYPES.STUDENT,
        cedula: '1234567006',
        nombres: 'Sofía Valentina',
        apellidos: 'Herrera Castro',
        course: '8vo A',
        curso: '8vo A',
        level: 'BASICA_SUPERIOR',
        nivel: 'BASICA_SUPERIOR',
        numero: 1,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'student_007',
        type: DOC_TYPES.STUDENT,
        cedula: '1234567007',
        nombres: 'Diego Alejandro',
        apellidos: 'Jiménez Ruiz',
        course: '8vo A',
        curso: '8vo A',
        level: 'BASICA_SUPERIOR',
        nivel: 'BASICA_SUPERIOR',
        numero: 2,
        createdAt: new Date().toISOString()
      }
    ];

    if (isReady) {
      try {
        for (const student of testStudents) {
          try {
            const result = await databaseService.createDocument('students', student, DOC_TYPES.STUDENT);
            if (result.success) {
              console.log(`✅ Added test student: ${student.nombres} ${student.apellidos}`);
            }
          } catch (error) {
            if (error.message && error.message.includes('already exists')) {
              console.log(`⚠️ Test student already exists: ${student.nombres} ${student.apellidos}`);
            } else {
              console.error(`❌ Error adding test student ${student.nombres}:`, error);
            }
          }
        }
        console.log('🎉 Finished adding test data');
        
        // Force refresh of students data
        window.location.reload();
        
      } catch (error) {
        console.error('❌ Error adding test data:', error);
      }
    } else {
      console.log('⚠️ Database not ready');
    }
  };

  return (
    <AdminContext.Provider value={{ 
      candidates, setCandidates, 
      students, setStudents,
      stats, setStats,
      participationByLevel,
      handleStudentAdd,
      handleStudentUpdate, 
      handleStudentDelete,
      handleBulkImport,
      addTestData
    }}>
      <div className="admin-container">
        {/* Header */}
        <header className="admin-header">
          <h1>🏛️ PANEL DE ADMINISTRACIÓN - ELECCIONES 2024</h1>
          <div className="header-info">
            <span className="status-indicator online">🟢 Conectado</span>
            <span className="time">⏰ {stats.currentTime}</span>
          </div>
        </header>

        {/* Navigation */}
        <nav className="admin-nav">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={activeTab === 'students' ? 'active' : ''}
            onClick={() => setActiveTab('students')}
          >
            👥 Estudiantes
          </button>
          <button 
            className={activeTab === 'candidates' ? 'active' : ''}
            onClick={() => setActiveTab('candidates')}
          >
            🏆 Candidatos
          </button>
          <button 
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            📋 Reportes
          </button>
          <button 
            className={activeTab === 'config' ? 'active' : ''}
            onClick={() => setActiveTab('config')}
          >
            ⚙️ Configuración
          </button>
          <button 
            className={activeTab === 'database' ? 'active' : ''}
            onClick={() => setActiveTab('database')}
          >
            🔍 Base de Datos
          </button>
          <button 
            className={activeTab === 'levels' ? 'active' : ''}
            onClick={() => setActiveTab('levels')}
          >
            📊 Estadísticas por Nivel
          </button>
          <button 
            className={activeTab === 'codes' ? 'active' : ''}
            onClick={() => setActiveTab('codes')}
          >
            🔑 Códigos Activación
          </button>
        </nav>

        {/* Content */}
        <main className="admin-content">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'students' && <StudentsTab />}
          {activeTab === 'candidates' && <CandidatesTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'config' && <ConfigTab />}
          {activeTab === 'database' && <DatabaseTab />}
          {activeTab === 'levels' && <LevelStatsViewer />}
          {activeTab === 'codes' && <ActivationCodesManager />}
        </main>
      </div>
    </AdminContext.Provider>
  );
}

// Tab del Dashboard principal
function DashboardTab() {
  const { stats, students, addTestData } = useContext(AdminContext);
  
  return (
    <div className="dashboard-tab">
      {/* Debug section - show if no students */}
      {students.length === 0 && (
        <section className="debug-section" style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <h3>🧪 DEBUG: No hay estudiantes en la base de datos</h3>
          <p>Para probar el sistema, puedes añadir datos de prueba:</p>
          <button 
            onClick={addTestData}
            style={{
              background: '#2ecc71',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🧪 AÑADIR DATOS DE PRUEBA
          </button>
        </section>
      )}

      {/* Resumen General */}
      <section className="summary-section">
        <h2>📊 RESUMEN GENERAL</h2>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon">👥</div>
            <div className="summary-content">
              <h3>Total Estudiantes</h3>
              <p className="summary-number">{stats.totalStudents}</p>
            </div>
          </div>
          
          <div className="summary-card voted">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <h3>Han Votado</h3>
              <p className="summary-number">{stats.studentsVoted}</p>
              <p className="summary-percentage">({stats.totalStudents > 0 ? ((stats.studentsVoted / stats.totalStudents) * 100).toFixed(1) : '0.0'}%)</p>
            </div>
          </div>
          
          <div className="summary-card absent">
            <div className="summary-icon">❌</div>
            <div className="summary-content">
              <h3>Ausentes</h3>
              <p className="summary-number">{stats.studentsAbsent}</p>
            </div>
          </div>
          
          <div className="summary-card courses">
            <div className="summary-icon">🏫</div>
            <div className="summary-content">
              <h3>Cursos Activos</h3>
              <p className="summary-number">{stats.activeCourses}/{stats.totalCourses}</p>
            </div>
          </div>
          
          <div className="summary-card sync">
            <div className="summary-icon">🔄</div>
            <div className="summary-content">
              <h3>Sincronizados</h3>
              <p className="summary-number">{stats.syncedDevices}/{stats.totalDevices}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resultados por Cargo */}
      <section className="results-section">
        <h2>🏆 RESULTADOS POR CARGO</h2>
        <ResultsCharts />
      </section>

      {/* Participación por Nivel */}
      <section className="participation-section">
        <h2>📈 PARTICIPACIÓN POR NIVEL</h2>
        <ParticipationStats />
      </section>
    </div>
  );
}

// Componente de gráficos de resultados
function ResultsCharts() {
  const { candidates } = useContext(AdminContext);
  
  const presidentCandidates = candidates.filter(c => c.cargo === 'PRESIDENTE');
  const vicepresidentCandidates = candidates.filter(c => c.cargo === 'VICEPRESIDENTE');
  
  const totalVotesPresident = presidentCandidates.reduce((sum, c) => sum + (c.votos || 0), 0);
  const totalVotesVicepresident = vicepresidentCandidates.reduce((sum, c) => sum + (c.votos || 0), 0);

  if (candidates.length === 0) {
    return (
      <div className="results-charts">
        <div className="no-data-message">
          <p>🏆 No hay candidatos registrados.</p>
          <p>Los resultados se mostrarán cuando se registren candidatos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-charts">
      {/* Presidente */}
      <div className="chart-container">
        <h3>PRESIDENTE ESTUDIANTIL</h3>
        <div className="results-bars">
          {presidentCandidates.map(candidate => {
            const votes = candidate.votos || 0;
            const percentage = totalVotesPresident > 0 ? ((votes / totalVotesPresident) * 100).toFixed(1) : '0.0';
            return (
              <div key={candidate.id} className="result-bar">
                <div className="candidate-info">
                  <span className="candidate-color" style={{backgroundColor: candidate.color}}></span>
                  <span className="candidate-name">{candidate.nombre} ({candidate.lista})</span>
                  <span className="votes-count">{votes} votos ({percentage}%)</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: candidate.color
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vicepresidente */}
      <div className="chart-container">
        <h3>VICEPRESIDENTE ESTUDIANTIL</h3>
        <div className="results-bars">
          {vicepresidentCandidates.map(candidate => {
            const votes = candidate.votos || 0;
            const percentage = totalVotesVicepresident > 0 ? ((votes / totalVotesVicepresident) * 100).toFixed(1) : '0.0';
            return (
              <div key={candidate.id} className="result-bar">
                <div className="candidate-info">
                  <span className="candidate-color" style={{backgroundColor: candidate.color}}></span>
                  <span className="candidate-name">{candidate.nombre} ({candidate.lista})</span>
                  <span className="votes-count">{votes} votos ({percentage}%)</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: candidate.color
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Componente de estadísticas de participación
function ParticipationStats() {
  const { participationByLevel } = useContext(AdminContext);
  
  if (!participationByLevel || participationByLevel.length === 0) {
    return (
      <div className="participation-stats">
        <div className="no-data-message">
          <p>📊 No hay datos de participación disponibles.</p>
          <p>Los datos se calcularán automáticamente cuando haya estudiantes registrados.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="participation-stats">
      {participationByLevel.map(level => (
        <div key={level.level} className="participation-card">
          <h4>{level.level}</h4>
          <div className="participation-numbers">
            <span className="voted">{level.voted}</span>
            <span className="separator">/</span>
            <span className="total">{level.total}</span>
            <span className="percentage">({level.percentage}%)</span>
          </div>
          <div className="participation-bar">
            <div 
              className="participation-fill"
              style={{width: `${level.percentage}%`}}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Tab de gestión de estudiantes
function StudentsTab() {
  const { 
    students, 
    handleStudentAdd, 
    handleStudentUpdate, 
    handleStudentDelete, 
    handleBulkImport 
  } = useContext(AdminContext);

  return (
    <div className="students-tab">
      <StudentManager
        students={students}
        onStudentAdd={handleStudentAdd}
        onStudentUpdate={handleStudentUpdate}
        onStudentDelete={handleStudentDelete}
        onBulkImport={handleBulkImport}
      />
    </div>
  );
}


// Tab de gestión de candidatos
function CandidatesTab() {
  const { candidates, setCandidates } = useContext(AdminContext);
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const handleDelete = async (candidateId) => {
    if (window.confirm('¿Está seguro de eliminar este candidato?')) {
      setLoading(true);
      setError(null);
      
      try {
        // Find the candidate to get its database info
        const candidate = candidates.find(c => c.id === candidateId || c._id === candidateId);
        if (!candidate) {
          throw new Error('Candidato no encontrado');
        }
        
        const dbId = candidate._id || candidateId;
        const rev = candidate._rev;
        
        if (!rev) {
          // If no _rev, it might be a local-only candidate
          setCandidates(candidates.filter(c => (c.id || c._id) !== candidateId));
          return;
        }
        
        const result = await databaseService.deleteDocument('candidates', dbId, rev);
        
        if (result.success) {
          // Remove from local state
          setCandidates(candidates.filter(c => (c.id || c._id) !== candidateId));
          console.log('✅ Candidato eliminado de la base de datos');
        } else {
          throw new Error(result.error || 'Error al eliminar candidato');
        }
      } catch (err) {
        console.error('❌ Error al eliminar candidato:', err);
        setError('Error al eliminar candidato: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="candidates-tab">
      <div className="candidates-header">
        <h2>🏆 GESTIÓN DE CANDIDATOS</h2>
        <div className="candidates-controls">
          <button 
            className="btn-primary"
            onClick={() => {
              setEditingCandidate(null);
              setShowForm(true);
            }}
            disabled={loading}
          >
            ➕ Nuevo Candidato
          </button>
          {loading && <span className="loading-indicator">⏳ Guardando...</span>}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {showForm && (
        <CandidateForm 
          candidate={editingCandidate}
          onSave={async (candidateData) => {
            setLoading(true);
            setError(null);
            
            try {
              if (editingCandidate) {
                // Update existing candidate
                const dbId = editingCandidate._id;
                const rev = editingCandidate._rev;
                
                if (dbId && rev) {
                  const result = await databaseService.updateDocument(
                    'candidates', 
                    dbId, 
                    rev, 
                    candidateData, 
                    DOC_TYPES.CANDIDATE
                  );
                  
                  if (result.success) {
                    // Update local state with new data
                    setCandidates(candidates.map(c => 
                      (c.id || c._id) === (editingCandidate.id || editingCandidate._id) 
                        ? { ...candidateData, _id: result.doc._id, _rev: result.doc._rev }
                        : c
                    ));
                    console.log('✅ Candidato actualizado en la base de datos');
                  } else {
                    throw new Error(result.error || 'Error al actualizar candidato');
                  }
                } else {
                  // Local-only update
                  setCandidates(candidates.map(c => 
                    (c.id || c._id) === (editingCandidate.id || editingCandidate._id) 
                      ? { ...candidateData, id: editingCandidate.id }
                      : c
                  ));
                }
              } else {
                // Create new candidate
                const result = await databaseService.createDocument(
                  'candidates', 
                  candidateData, 
                  DOC_TYPES.CANDIDATE
                );
                
                if (result.success) {
                  // Add to local state with database info
                  setCandidates([...candidates, {
                    ...candidateData,
                    _id: result.doc._id,
                    _rev: result.doc._rev
                  }]);
                  console.log('✅ Candidato creado en la base de datos');
                } else {
                  throw new Error(result.error || 'Error al crear candidato');
                }
              }
              
              setShowForm(false);
              setEditingCandidate(null);
            } catch (err) {
              console.error('❌ Error al guardar candidato:', err);
              setError('Error al guardar candidato: ' + err.message);
            } finally {
              setLoading(false);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingCandidate(null);
          }}
        />
      )}

      <div className="candidates-grid">
        {candidates.length === 0 ? (
          <div className="empty-state">
            <h3>📋 No hay candidatos registrados</h3>
            <p>Haga clic en "Nuevo Candidato" para agregar el primer candidato.</p>
          </div>
        ) : (
          candidates.map(candidate => {
            const candidateId = candidate._id || candidate.id;
            const isFromDb = !!candidate._id;
            
            return (
              <div key={candidateId} className="candidate-card">
                <div className="candidate-status">
                  {isFromDb ? '💾 Base de Datos' : '📝 Local'}
                </div>
                <img 
                  src={candidate.foto || '/placeholder-avatar.png'} 
                  alt={candidate.nombre || 'Candidato'} 
                  className="candidate-photo"
                  onError={(e) => {
                    e.target.src = '/placeholder-avatar.png';
                  }}
                />
                <div className="candidate-details">
                  <h3>{candidate.nombre || 'Nombre no especificado'}</h3>
                  <p className="candidate-position">{candidate.cargo || 'Cargo no especificado'}</p>
                  <p className="candidate-list" style={{color: candidate.color || '#666'}}>
                    {candidate.lista || candidate.ticketId || 'Lista no especificada'}
                  </p>
                  <p className="candidate-level">Nivel: {candidate.nivel || candidate.level || 'No especificado'}</p>
                  <p className="candidate-votes">Votos: {candidate.votos || 0}</p>
                  <div className="candidate-actions">
                    <button 
                      onClick={() => handleEdit(candidate)} 
                      className="btn-edit"
                      disabled={loading}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(candidateId)} 
                      className="btn-delete"
                      disabled={loading}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Formulario de candidatos
function CandidateForm({ candidate, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: candidate?.nombre || '',
    cargo: candidate?.cargo || 'PRESIDENTE',
    lista: candidate?.lista || '',
    color: candidate?.color || '#2563eb',
    foto: candidate?.foto || '',
    propuestas: candidate?.propuestas?.join('\n') || '',
    nivel: candidate?.nivel || 'BACHILLERATO',
    votos: candidate?.votos || 0
  });

  const handleSubmit = () => {
    onSave({
      ...candidate,
      ...formData,
      propuestas: formData.propuestas.split('\n').filter(p => p.trim())
    });
  };

  return (
    <div className="candidate-form-overlay">
      <div className="candidate-form">
        <h3>{candidate ? 'Editar Candidato' : 'Nuevo Candidato'}</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Cargo</label>
            <select
              value={formData.cargo}
              onChange={(e) => setFormData({...formData, cargo: e.target.value})}
            >
              <option value="PRESIDENTE">Presidente</option>
              <option value="VICEPRESIDENTE">Vicepresidente</option>
              <option value="SECRETARIO">Secretario</option>
              <option value="TESORERO">Tesorero</option>
            </select>
          </div>

          <div className="form-group">
            <label>Lista/Partido</label>
            <input
              type="text"
              value={formData.lista}
              onChange={(e) => setFormData({...formData, lista: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>URL de Foto</label>
            <input
              type="url"
              value={formData.foto}
              onChange={(e) => setFormData({...formData, foto: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Nivel</label>
            <select
              value={formData.nivel}
              onChange={(e) => setFormData({...formData, nivel: e.target.value})}
            >
              <option value="BASICA_ELEMENTAL">Básica Elemental</option>
              <option value="BASICA_MEDIA">Básica Media</option>
              <option value="BASICA_SUPERIOR">Básica Superior</option>
              <option value="BACHILLERATO">Bachillerato</option>
            </select>
          </div>
        </div>

        <div className="form-group full-width">
          <label>Propuestas (una por línea)</label>
          <textarea
            value={formData.propuestas}
            onChange={(e) => setFormData({...formData, propuestas: e.target.value})}
            rows="4"
            placeholder="Ej:\nMejorar la infraestructura del colegio\nImplementar programas deportivos\nCrear espacios de estudio"
          />
        </div>
        
        <div className="form-group full-width">
          <label>Experiencia</label>
          <textarea
            value={formData.experiencia}
            onChange={(e) => setFormData({...formData, experiencia: e.target.value})}
            rows="2"
            placeholder="Ej: 3 años como representante estudiantil"
          />
        </div>
        
        <div className="form-group full-width">
          <label>Slogan de Campaña</label>
          <input
            type="text"
            value={formData.slogan}
            onChange={(e) => setFormData({...formData, slogan: e.target.value})}
            placeholder="Ej: Juntos hacia la excelencia académica"
          />
        </div>

        <div className="form-actions">
          <button onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// Tab de reportes
function ReportsTab() {
  const { candidates, stats } = useContext(AdminContext);

  const generatePDFReport = () => {
    alert('Generando reporte PDF... (Función en desarrollo)');
  };

  const generateExcelReport = () => {
    alert('Generando reporte Excel... (Función en desarrollo)');
  };

  const generateCSVReport = () => {
    const csvData = candidates.map(c => ({
      Candidato: c.nombre,
      Cargo: c.cargo,
      Lista: c.lista,
      Votos: c.votos
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultados_elecciones.csv';
    a.click();
  };

  return (
    <div className="reports-tab">
      <h2>📋 REPORTES Y EXPORTACIÓN</h2>
      
      <div className="reports-grid">
        <div className="report-card">
          <h3>📊 Resultados Consolidados</h3>
          <p>Reporte completo con resultados por cargo y estadísticas</p>
          <div className="report-actions">
            <button onClick={generatePDFReport} className="btn-pdf">
              📄 PDF
            </button>
            <button onClick={generateExcelReport} className="btn-excel">
              📊 Excel
            </button>
            <button onClick={generateCSVReport} className="btn-csv">
              📝 CSV
            </button>
          </div>
        </div>

        <div className="report-card">
          <h3>👥 Lista de Sufragantes</h3>
          <p>Estudiantes que participaron en la votación</p>
          <div className="report-actions">
            <button className="btn-pdf">📄 PDF</button>
            <button className="btn-excel">📊 Excel</button>
          </div>
        </div>

        <div className="report-card">
          <h3>📈 Estadísticas de Participación</h3>
          <p>Análisis detallado por curso y nivel</p>
          <div className="report-actions">
            <button className="btn-pdf">📄 PDF</button>
            <button className="btn-excel">📊 Excel</button>
          </div>
        </div>

        <div className="report-card">
          <h3>📋 Acta Oficial</h3>
          <p>Documento oficial de resultados electorales</p>
          <div className="report-actions">
            <button className="btn-pdf">📄 PDF</button>
          </div>
        </div>
      </div>

      <div className="quick-stats">
        <h3>📊 Estadísticas Rápidas</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total de Votos:</span>
            <span className="stat-value">{candidates.reduce((sum, c) => sum + (c.votos || 0), 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Participación:</span>
            <span className="stat-value">{stats.totalStudents > 0 ? ((stats.studentsVoted / stats.totalStudents) * 100).toFixed(1) : '0.0'}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Candidatos:</span>
            <span className="stat-value">{candidates.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Cursos Activos:</span>
            <span className="stat-value">{stats.activeCourses}/{stats.totalCourses}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab de configuración
function ConfigTab() {
  const { students, setStudents, candidates, setCandidates } = useContext(AdminContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleNewElection = async () => {
    const confirmMessage = `🚨 CONFIRMACIÓN REQUERIDA 🚨

¿Está completamente seguro de que desea iniciar una nueva elección?

Esta acción:
• Eliminará TODOS los estudiantes actuales
• Eliminará TODOS los votos registrados
• Eliminará TODOS los candidatos
• Eliminará TODOS los códigos de activación
• Reiniciará todas las estadísticas
• NO se puede deshacer

Escriba "CONFIRMAR" para proceder:`;

    const userConfirmation = prompt(confirmMessage);
    
    if (userConfirmation === "CONFIRMAR") {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      try {
        console.log('🗑️ Iniciando limpieza completa para nueva elección...');
        
        // Step 0: Clear activation codes using dedicated service
        console.log('🔑 Eliminando códigos de activación...');
        const codesResult = await activationCodesService.clearAllCodes();
        if (codesResult.success) {
          console.log(`✅ Eliminados ${codesResult.deleted} códigos de activación`);
        } else {
          console.warn('⚠️ Error eliminando códigos:', codesResult.error);
        }
        
        // Step 1: Clear all other database collections
        const collections = ['students', 'candidates', 'votes', 'sessions'];
        let totalDeleted = codesResult.deleted || 0;
        
        for (const collection of collections) {
          try {
            const result = await databaseService.findDocuments(collection, {
              selector: {}
            });
            
            if (result.docs && result.docs.length > 0) {
              console.log(`🗑️ Eliminando ${result.docs.length} documentos de ${collection}...`);
              
              for (const doc of result.docs) {
                if (doc._id && doc._rev) {
                  await databaseService.deleteDocument(collection, doc._id, doc._rev);
                  totalDeleted++;
                }
              }
            }
          } catch (error) {
            console.error(`❌ Error limpiando ${collection}:`, error);
          }
        }
        
        // Step 2: Create backup of the clean state
        try {
          const backupData = {
            timestamp: new Date().toISOString(),
            action: 'new_election_reset',
            deletedRecords: totalDeleted,
            collections: collections
          };
          
          await databaseService.createDocument('election_config', backupData, DOC_TYPES.CONFIG);
          console.log('💾 Backup de limpieza creado');
        } catch (backupError) {
          console.warn('⚠️ No se pudo crear backup de limpieza:', backupError);
        }
        
        // Step 3: Clear localStorage data
        Object.keys(localStorage).forEach(key => {
          if (key.includes('student_states_') || 
              key.includes('votaciones_') || 
              key.includes('election_')) {
            localStorage.removeItem(key);
          }
        });
        
        // Step 4: Reset local state
        setStudents([]);
        setCandidates([]);
        
        const codesDeleted = codesResult.deleted || 0;
        const otherDeleted = totalDeleted - codesDeleted;
        
        setSuccess(`✅ Nueva elección iniciada exitosamente. 
        
Eliminados:
• ${codesDeleted} códigos de activación
• ${otherDeleted} registros de datos
• Total: ${totalDeleted} registros`);
        
        console.log(`✅ Nueva elección completada. Códigos: ${codesDeleted}, Otros: ${otherDeleted}, Total: ${totalDeleted}`);
        
      } catch (error) {
        console.error('❌ Error al iniciar nueva elección:', error);
        setError('Error al iniciar nueva elección: ' + error.message);
      } finally {
        setLoading(false);
      }
    } else if (userConfirmation !== null) {
      alert('❌ Confirmación incorrecta. La nueva elección no se ha iniciado.');
    }
  };
  
  const handleCreateBackup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all data from database
      const collections = ['students', 'candidates', 'votes', 'sessions'];
      const backupData = {
        timestamp: new Date().toISOString(),
        type: 'manual_backup',
        data: {}
      };
      
      for (const collection of collections) {
        const result = await databaseService.findDocuments(collection, {
          selector: {}
        });
        backupData.data[collection] = result.docs || [];
      }
      
      // Save backup to database
      const result = await databaseService.createDocument('election_config', backupData, DOC_TYPES.CONFIG);
      
      if (result.success) {
        setSuccess(`✅ Backup creado exitosamente. ID: ${result.doc._id}`);
        console.log('📦 Backup creado:', result.doc._id);
      } else {
        throw new Error(result.error || 'Error al crear backup');
      }
    } catch (err) {
      console.error('❌ Error al crear backup:', err);
      setError('Error al crear backup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all data from database
      const collections = ['students', 'candidates', 'votes', 'sessions'];
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        collections: {}
      };
      
      for (const collection of collections) {
        const result = await databaseService.findDocuments(collection, {
          selector: {}
        });
        exportData.collections[collection] = result.docs || [];
      }
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elecciones_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('✅ Datos exportados exitosamente');
      console.log('📤 Datos exportados');
    } catch (err) {
      console.error('❌ Error al exportar datos:', err);
      setError('Error al exportar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="config-tab">
      <h2>⚙️ CONFIGURACIÓN DEL SISTEMA</h2>
      
      {loading && (
        <div className="global-loading">
          ⏳ Procesando operación...
        </div>
      )}
      
      {error && (
        <div className="global-error">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      {success && (
        <div className="global-success">
          {success}
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}
      
      <div className="config-sections">

        <div className="config-section">
          <h3>📅 Fechas y Horarios</h3>
          <div className="date-config">
            <div className="date-item">
              <label>Inicio de Votación:</label>
              <input type="datetime-local" defaultValue="2024-03-15T08:00" />
            </div>
            <div className="date-item">
              <label>Fin de Votación:</label>
              <input type="datetime-local" defaultValue="2024-03-15T16:00" />
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3>🔄 Sincronización</h3>
          <div className="sync-config">
            <div className="sync-item">
              <span>Estado del Servidor:</span>
              <span className="status online">🟢 En línea</span>
            </div>
            <div className="sync-item">
              <span>Última Sincronización:</span>
              <span>14:29:45</span>
            </div>
            <div className="sync-item">
              <span>Dispositivos Conectados:</span>
              <span>22/24</span>
            </div>
          </div>
          <button className="btn-primary">🔄 Sincronizar Ahora</button>
        </div>

        <div className="config-section">
          <h3>💾 Backup y Seguridad</h3>
          <div className="backup-config">
            <button 
              className="btn-backup"
              onClick={handleCreateBackup}
              disabled={loading}
            >
              💾 Crear Backup
            </button>
            <button 
              className="btn-restore"
              onClick={() => alert('🔍 Funcionalidad disponible en el Panel de Transición')}
              disabled={loading}
            >
              📥 Restaurar Backup
            </button>
            <button 
              className="btn-export"
              onClick={handleExportData}
              disabled={loading}
            >
              📤 Exportar Datos
            </button>
          </div>
        </div>

        <div className="config-section">
          <h3>🔄 Nueva Elección</h3>
          <div className="election-reset">
            <div className="warning-box">
              <h4>⚠️ ADVERTENCIA</h4>
              <p>Esta acción eliminará <strong>TODOS</strong> los datos de la base de datos:</p>
              <ul>
                <li>• Todos los estudiantes importados</li>
                <li>• Todos los candidatos registrados</li>
                <li>• Todos los votos emitidos</li>
                <li>• Todas las sesiones de votación</li>
              </ul>
              <p><strong>Los datos eliminados NO se pueden recuperar.</strong></p>
            </div>
            
            {loading && (
              <div className="loading-indicator">
                ⏳ Eliminando datos de la base de datos...
              </div>
            )}
            
            {error && (
              <div className="error-message">
                ❌ {error}
                <button onClick={() => setError(null)}>✕</button>
              </div>
            )}
            
            {success && (
              <div className="success-message">
                {success}
                <button onClick={() => setSuccess(null)}>✕</button>
              </div>
            )}
            
            <button 
              className="btn-danger-large"
              onClick={handleNewElection}
              disabled={loading}
            >
              🗳️ Iniciar Nueva Elección
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab de inspector de base de datos
function DatabaseTab() {
  return (
    <div className="database-tab">
      <DatabaseInspector />
    </div>
  );
}

export default AdminDashboard;