import React, { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StudentManager from './StudentManager';
import DatabaseInspector from './DatabaseInspector';
import ActivationCodesManager from './ActivationCodesManager';
import ElectionConfigurator from './ElectionConfigurator';
import CandidateListManager from './CandidateListManager';
import ReportGenerator from './ReportGenerator';
import AdminContext from '../../contexts/AdminContext';
import { useDatabase, useStudents, useCandidates, useVotes } from '../../hooks/useDatabase.js';
import databaseService, { DOC_TYPES } from '../../services/database-indexeddb.js';
import activationCodesService from '../../services/activationCodes.js';
import './AdminDashboard.css';


// Default stats structure
const defaultStats = {
  totalStudents: 0,
  studentsVoted: 0,
  studentsNotVoted: 0,
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
    importStudents,
    loadStudents: refetchStudents
  } = useStudents();
  const { 
    candidates: dbCandidates, 
    loading: candidatesLoading,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    loadCandidates: refetchCandidates
  } = useCandidates();
  const { 
    votes: dbVotes, 
    loading: votesLoading,
    loadVotes: refetchVotes
  } = useVotes();

  /**
   * Update student voting status based on vote records
   */
  const updateStudentVotingStatus = (studentsData, votesData) => {
    if (!studentsData || !votesData || votesData.length === 0) {
      console.log('🔍 AdminDashboard: No votes to sync, returning students as-is');
      return studentsData;
    }

    console.log(`🔄 AdminDashboard: Updating ${studentsData.length} students with ${votesData.length} votes`);
    
    // Create a Set of student IDs who have voted for fast lookup
    const votedStudentIds = new Set(votesData.map(vote => vote.studentId));
    console.log('🔍 AdminDashboard: Voted student IDs:', Array.from(votedStudentIds).slice(0, 5));
    
    const updatedStudents = studentsData.map(student => {
      const studentId = student._id || student.id || student.cedula;
      let hasVoted = votedStudentIds.has(studentId);
      
      // BACKUP MATCH: If not found, try alternative ID formats
      if (!hasVoted) {
        // Try with just the _id
        hasVoted = hasVoted || votedStudentIds.has(student._id);
        // Try with just the id
        hasVoted = hasVoted || votedStudentIds.has(student.id);
        // Try with just the cedula
        hasVoted = hasVoted || votedStudentIds.has(student.cedula);
        
        // Try to find votes that contain the cedula in complex IDs
        if (!hasVoted && student.cedula) {
          const cedulaVotes = Array.from(votedStudentIds).filter(voteId => 
            voteId.includes(student.cedula)
          );
          hasVoted = cedulaVotes.length > 0;
          
          if (hasVoted) {
            console.log(`🔄 AdminDashboard: Backup match found for student ${student.cedula} with vote ID ${cedulaVotes[0]}`);
          }
        }
      }
      
      // Log matches for debugging
      if (hasVoted) {
        console.log(`✅ AdminDashboard: Student ${studentId} (${student.nombres}) marked as voted`);
      }
      
      // Determine status priority: voted > absent > pending
      let finalStatus = 'pending';
      if (hasVoted) {
        finalStatus = 'voted';
      } else if (student.absent === true || student.status === 'absent') {
        finalStatus = 'absent';
      } else {
        finalStatus = student.status || 'pending';
      }
      
      // Log absent students for debugging
      if (finalStatus === 'absent') {
        console.log(`❌ AdminDashboard: Student ${studentId} (${student.nombres}) marked as absent`);
      }
      
      return {
        ...student,
        status: finalStatus,
        votado: hasVoted ? true : (student.votado || false),
        absent: finalStatus === 'absent' ? true : (student.absent || false)
      };
    });
    
    const votedCount = updatedStudents.filter(s => s.status === 'voted').length;
    const absentCount = updatedStudents.filter(s => s.status === 'absent').length;
    const pendingCount = updatedStudents.filter(s => s.status === 'pending').length;
    
    console.log(`📊 AdminDashboard: Status summary - Voted: ${votedCount}, Absent: ${absentCount}, Pending: ${pendingCount}, Total: ${studentsData.length}`);
    
    return updatedStudents;
  };

  // Local state - starts empty, filled from database
  const [candidates, setCandidates] = useState([]);
  const [students, setStudents] = useState([]);
  const [votes, setVotes] = useState([]);
  const [stats, setStats] = useState(defaultStats);
  const [participationByLevel, setParticipationByLevel] = useState([]);
  const [participationByCourse, setParticipationByCourse] = useState([]);

  // Sync with database data and update student voting status
  useEffect(() => {
    if (isReady && !studentsLoading) {
      console.log('📊 Database ready, syncing students. DB count:', dbStudents.length);
      
      // Update student status based on votes before setting state
      const updatedStudents = updateStudentVotingStatus(dbStudents, votes);
      setStudents(updatedStudents);
      
      // Database is ready for real student data
      if (dbStudents.length === 0) {
        console.log('📊 Database is empty. Import real student data to begin.');
      }
    }
  }, [isReady, studentsLoading, dbStudents, votes]); // Added votes dependency

  useEffect(() => {
    if (isReady && !candidatesLoading) {
      console.log('🏆 AdminDashboard: Database ready, syncing candidates. DB count:', dbCandidates.length);
      console.log('🏆 AdminDashboard: Candidates data:', dbCandidates);
      
      // Always use database data (including empty array) when database is ready
      setCandidates(dbCandidates);
      
      // Log electoral lists specifically
      const electoralLists = dbCandidates.filter(c => 
        c.type === 'list' || 
        (c.type === 'candidate' && c.listName) ||
        c.listName ||
        c.presidentName ||
        c.vicePresidentName
      );
      
      console.log('🏆 AdminDashboard: Electoral lists detected:', electoralLists.length, electoralLists);
      
      // Database is ready for electoral lists
      if (dbCandidates.length === 0) {
        console.log('🏆 AdminDashboard: Database is empty. Create electoral lists to begin voting.');
      }
    }
  }, [isReady, candidatesLoading, dbCandidates]);

  useEffect(() => {
    if (isReady && !votesLoading) {
      console.log('🗳️ AdminDashboard: Database ready, syncing votes. DB count:', dbVotes.length);
      console.log('🗳️ AdminDashboard: Votes data sample:', dbVotes.slice(0, 3));
      console.log('🗳️ AdminDashboard: First vote structure:', dbVotes[0]);
      
      // Always use database data (including empty array) when database is ready
      setVotes(dbVotes);
      
      // When votes change, update student status if we have students
      if (dbStudents && dbStudents.length > 0) {
        console.log('🔄 AdminDashboard: Votes updated, recalculating student status...');
        const updatedStudents = updateStudentVotingStatus(dbStudents, dbVotes);
        setStudents(updatedStudents);
      }
      
      // Database is ready for votes
      if (dbVotes.length === 0) {
        console.log('🗳️ AdminDashboard: No votes registered yet.');
      } else {
        console.log('🗳️ AdminDashboard: Found votes, checking structure...');
        dbVotes.forEach((vote, index) => {
          if (index < 3) { // Log first 3 votes for debugging
            console.log(`Vote ${index + 1}:`, {
              _id: vote._id,
              studentId: vote.studentId,
              listId: vote.listId,
              candidateId: vote.candidateId,
              timestamp: vote.timestamp,
              type: vote.type
            });
          }
        });
      }
    }
  }, [isReady, votesLoading, dbVotes, dbStudents]); // Added dbStudents dependency

  // Function to calculate real statistics from database data
  const calculateStats = (studentsData, candidatesData, votesData) => {
    const totalStudents = studentsData.length;
    
    // Count votes from actual votes database
    const totalVotes = votesData.length;
    const studentsVoted = totalVotes; // Each vote represents one student who voted
    const studentsNotVoted = totalStudents - studentsVoted; // Students who haven't voted yet
    
    // Count students specifically marked as absent
    const studentsAbsent = studentsData.filter(s => s.status === 'absent').length;
    
    // Also try to count from student status for cross-validation
    const studentsVotedByStatus = studentsData.filter(s => s.status === 'voted').length;
    
    // Get unique courses from students
    const courses = [...new Set(studentsData.map(s => s.curso).filter(Boolean))];
    const activeCourses = courses.length;
    
    console.log('📊 AdminDashboard: Stats calculation DETAILED:', {
      totalStudents,
      totalVotes,
      studentsVoted,
      studentsVotedByStatus,
      studentsNotVoted,
      studentsAbsent,
      activeCourses,
      votesDataLength: votesData ? votesData.length : 'undefined',
      votesDataSample: votesData ? votesData.slice(0, 2) : 'undefined',
      studentsDataSample: studentsData ? studentsData.slice(0, 2).map(s => ({ 
        id: s._id || s.id, 
        name: s.nombre, 
        status: s.status 
      })) : 'undefined'
    });
    
    return {
      totalStudents,
      studentsVoted,
      studentsNotVoted, // Students who haven't voted yet
      studentsAbsent,   // Students specifically marked as absent
      activeCourses,
      totalCourses: activeCourses, // For now, assume all courses are active
      syncedDevices: 1, // Local database is always synced
      totalDevices: 1,
      currentTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Function to calculate participation by level using real votes data
  const calculateParticipationByLevel = (studentsData, votesData) => {
    const levelMap = {
      'BASICA_ELEMENTAL': 'Básica Elemental',
      'BASICA_MEDIA': 'Básica Media', 
      'BASICA_SUPERIOR': 'Básica Superior',
      'BACHILLERATO': 'Bachillerato'
    };

    // Create a set of student IDs who have voted
    const votedStudentIds = new Set(votesData.map(vote => vote.studentId).filter(Boolean));

    const levels = Object.keys(levelMap);
    return levels.map(levelKey => {
      const levelStudents = studentsData.filter(s => s.nivel === levelKey);
      const total = levelStudents.length;
      
      // Count students who have actually voted (by checking votes database)
      const voted = levelStudents.filter(student => {
        const studentId = student._id || student.id;
        return votedStudentIds.has(studentId);
      }).length;
      
      const percentage = total > 0 ? ((voted / total) * 100) : 0;
      
      console.log(`📈 Participation by level - ${levelMap[levelKey]}:`, {
        total,
        voted,
        percentage,
        votedStudentIds: Array.from(votedStudentIds).slice(0, 3)
      });
      
      return {
        level: levelMap[levelKey],
        voted,
        total,
        percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal place
      };
    }).filter(level => level.total > 0); // Only include levels with students
  };

  // Function to calculate participation by course using real votes data
  const calculateParticipationByCourse = (studentsData, votesData) => {
    // Create a set of student IDs who have voted
    const votedStudentIds = new Set(votesData.map(vote => vote.studentId).filter(Boolean));

    // Get all unique courses from students data
    const courseList = [...new Set(studentsData.map(s => s.curso).filter(Boolean))];
    
    return courseList.map(course => {
      const courseStudents = studentsData.filter(s => s.curso === course);
      const total = courseStudents.length;
      
      // Count students who have actually voted (by checking votes database)
      const voted = courseStudents.filter(student => {
        const studentId = student._id || student.id;
        let hasVoted = votedStudentIds.has(studentId);
        
        // BACKUP MATCH: Try alternative ID formats if not found
        if (!hasVoted) {
          hasVoted = hasVoted || votedStudentIds.has(student._id);
          hasVoted = hasVoted || votedStudentIds.has(student.id);
          hasVoted = hasVoted || votedStudentIds.has(student.cedula);
          
          // Try to find votes that contain the cedula in complex IDs
          if (!hasVoted && student.cedula) {
            const cedulaVotes = Array.from(votedStudentIds).filter(voteId => 
              voteId.includes(student.cedula)
            );
            hasVoted = cedulaVotes.length > 0;
          }
        }
        
        return hasVoted;
      }).length;
      
      const percentage = total > 0 ? ((voted / total) * 100) : 0;
      
      console.log(`📈 Participation by course - ${course}:`, {
        total,
        voted,
        percentage,
        sampleStudents: courseStudents.slice(0, 2).map(s => ({ 
          name: s.nombres, 
          id: s._id || s.id,
          cedula: s.cedula 
        }))
      });
      
      return {
        course,
        voted,
        total,
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
        // Additional info for better display
        nivel: courseStudents[0]?.nivel || 'Sin nivel'
      };
    }).sort((a, b) => {
      // Sort by nivel first, then by course name
      if (a.nivel !== b.nivel) {
        const nivelOrder = ['BASICA_ELEMENTAL', 'BASICA_MEDIA', 'BASICA_SUPERIOR', 'BACHILLERATO'];
        return nivelOrder.indexOf(a.nivel) - nivelOrder.indexOf(b.nivel);
      }
      return a.course.localeCompare(b.course);
    }).filter(course => course.total > 0); // Only include courses with students
  };

  // Update stats when students, candidates, or votes data changes
  useEffect(() => {
    if (students.length >= 0) { // Allow calculation even with empty array
      console.log('📊 AdminDashboard: Recalculating stats with data:', {
        studentsCount: students.length,
        candidatesCount: candidates.length,
        votesCount: votes.length,
        studentsWithVotedStatus: students.filter(s => s.status === 'voted').length
      });
      
      const newStats = calculateStats(students, candidates, votes);
      setStats(newStats);
      
      const newParticipation = calculateParticipationByLevel(students, votes);
      setParticipationByLevel(newParticipation);
      
      const newParticipationByCourse = calculateParticipationByCourse(students, votes);
      setParticipationByCourse(newParticipationByCourse);
      
      console.log('📊 Stats updated:', newStats);
      console.log('📊 Raw stats calculation check:', {
        inputStudents: students.length,
        inputVotes: votes.length,
        outputStudentsVoted: newStats.studentsVoted,
        outputStudentsAbsent: newStats.studentsAbsent
      });
      console.log('📈 Participation by level updated:', newParticipation);
      console.log('📈 Participation by course updated:', newParticipationByCourse);
    }
  }, [students, candidates, votes]);

  // Debug function available globally
  useEffect(() => {
    window.debugAdminDashboard = () => {
      console.log('🔍 GLOBAL DEBUG - AdminDashboard Data:');
      console.log('📚 Students:', students.length, students);
      console.log('🏆 Candidates:', candidates.length, candidates);
      console.log('🗳️ Votes:', votes.length, votes);
      console.log('📊 Stats:', stats);
      console.log('🗃️ DB Votes:', dbVotes.length, dbVotes);
      console.log('🗃️ DB Students:', dbStudents.length, dbStudents);
      console.log('🗃️ DB Candidates:', dbCandidates.length, dbCandidates);
      
      // Check if votes exist in IndexedDB directly
      databaseService.findDocuments('votes', {}).then(result => {
        console.log('🗂️ Direct DB Query - Votes:', result);
      });
      
      return {
        localStudents: students.length,
        localCandidates: candidates.length,
        localVotes: votes.length,
        dbStudents: dbStudents.length,
        dbCandidates: dbCandidates.length,
        dbVotes: dbVotes.length,
        stats
      };
    };
  }, [students, candidates, votes, stats, dbStudents, dbCandidates, dbVotes]);

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


  return (
    <AdminContext.Provider value={{ 
      candidates, setCandidates, 
      students, setStudents,
      stats, setStats,
      participationByLevel,
      participationByCourse,
      handleStudentAdd,
      handleStudentUpdate, 
      handleStudentDelete,
      handleBulkImport,
      refetchCandidates,
      refetchStudents,
      refetchVotes,
      votes,
      debugDashboardData: () => {
        console.log('🔍 DASHBOARD DEBUG DATA:');
        console.log('📚 Students:', students.length, students.slice(0, 3));
        console.log('🏆 Candidates:', candidates.length, candidates.slice(0, 3));
        console.log('🗳️ Votes:', votes.length, votes.slice(0, 3));
        console.log('📊 Current Stats:', stats);
        console.log('📈 Current Participation:', participationByLevel);
        
        // Manual stats calculation for debugging
        const manualStats = calculateStats(students, candidates, votes);
        console.log('🧮 Manual Stats Calculation:', manualStats);
        
        return {
          students: students.length,
          candidates: candidates.length,
          votes: votes.length,
          stats,
          manualStats
        };
      },
    }}>
      <div className="admin-container">
        {/* Header */}
        <header className="admin-header">
          <h1>🏛️ PANEL DE ADMINISTRACIÓN - ELECCIONES 2024</h1>
          <div className="header-info">
            <button 
              className="btn-sync"
              onClick={async () => {
                console.log('🔄 Manual sync triggered');
                await Promise.all([refetchStudents(), refetchCandidates(), refetchVotes()]);
                console.log('✅ Manual sync completed');
              }}
              title="Sincronizar datos con la base de datos"
            >
              🔄 Sincronizar
            </button>
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
          {activeTab === 'reports' && <ReportGenerator />}
          {activeTab === 'config' && <ConfigTab />}
          {activeTab === 'database' && <DatabaseTab />}
          {activeTab === 'codes' && <ActivationCodesManager />}
        </main>
      </div>
    </AdminContext.Provider>
  );
}

// Tab del Dashboard principal
function DashboardTab() {
  const { stats, students } = useContext(AdminContext);
  
  return (
    <div className="dashboard-tab">
      {/* Empty state message - show if no students */}
      {students.length === 0 && (
        <section className="empty-state-section" style={{ 
          background: '#f8f9fa', 
          border: '2px dashed #dee2e6', 
          borderRadius: '12px', 
          padding: '40px 20px', 
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📊</div>
          <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>Sistema Listo para Iniciar</h3>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            No hay estudiantes registrados. Importe los datos desde la pestaña "👥 Estudiantes" para comenzar.
          </p>
          <div style={{ 
            background: '#e3f2fd', 
            padding: '15px', 
            borderRadius: '8px', 
            fontSize: '0.9rem',
            color: '#1565c0'
          }}>
            <strong>Pasos para iniciar:</strong><br/>
            1. Vaya a "👥 Estudiantes" → Importar archivo CSV/Excel<br/>
            2. Registre candidatos en "🏆 Candidatos"<br/>
            3. Genere códigos en "🔑 Códigos Activación"
          </div>
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
          
          <div className="summary-card not-voted">
            <div className="summary-icon">⏳</div>
            <div className="summary-content">
              <h3>No han Votado</h3>
              <p className="summary-number">{stats.studentsNotVoted}</p>
              <p className="summary-percentage">({stats.totalStudents > 0 ? ((stats.studentsNotVoted / stats.totalStudents) * 100).toFixed(1) : '0.0'}%)</p>
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

      {/* Participación por Curso */}
      <section className="participation-section">
        <h2>🎓 PARTICIPACIÓN POR CURSO</h2>
        <ParticipationByCourseStats />
      </section>
    </div>
  );
}

// Componente de gráficos de resultados
function ResultsCharts() {
  const { candidates, votes } = useContext(AdminContext);
  
  // Filter electoral lists using the same criteria as CandidateListManager
  const electoralLists = candidates.filter(c => 
    c.type === 'list' || 
    (c.type === 'candidate' && c.listName) ||
    c.listName ||
    c.presidentName ||
    c.vicePresidentName
  ) || [];
  
  // Calculate votes per list from actual votes database
  const votesByList = {};
  votes.forEach(vote => {
    const listId = vote.listId || vote.candidateId;
    if (listId) {
      votesByList[listId] = (votesByList[listId] || 0) + 1;
    }
  });
  
  // Add vote counts to electoral lists
  const listsWithVotes = electoralLists.map(list => ({
    ...list,
    votos: votesByList[list._id] || votesByList[list.id] || 0
  }));
  
  // Calculate total votes for all lists
  const totalVotes = Object.values(votesByList).reduce((sum, count) => sum + count, 0);
  
  console.log('📊 ResultsCharts: Vote calculation:', {
    totalVotesInDB: votes.length,
    votesByList,
    listsWithVotes: listsWithVotes.map(l => ({ name: l.listName, votes: l.votos })),
    totalVotes
  });

  if (electoralLists.length === 0) {
    return (
      <div className="results-charts">
        <div className="no-data-message">
          <p>🏆 No hay listas electorales registradas.</p>
          <p>Los resultados se mostrarán cuando se registren listas electorales.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-charts">
      {/* Listas Electorales */}
      <div className="chart-container">
        <h3>RESULTADOS POR LISTA ELECTORAL</h3>
        <div className="results-bars">
          {listsWithVotes.map(list => {
            const votes = list.votos || 0;
            const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
            const listId = list._id || list.id || `list_${Date.now()}`;
            return (
              <div key={listId} className="result-bar">
                <div className="candidate-info">
                  <span className="candidate-color" style={{backgroundColor: list.color || '#007bff'}}></span>
                  <span className="candidate-name">{list.listName || 'Lista Sin Nombre'}</span>
                  <span className="votes-count">{votes} votos ({percentage}%)</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: list.color || '#007bff'
                    }}
                  ></div>
                </div>
                <div className="list-candidates">
                  <small>👑 {list.presidentName || 'Sin presidente'} | 🤝 {list.vicePresidentName || 'Sin vicepresidente'}</small>
                </div>
              </div>
            );
          })}
        </div>
        <div className="total-votes">Total: {totalVotes} votos</div>
      </div>

      {/* Gráfico circular de resultados */}
      <div className="chart-container">
        <h3>DISTRIBUCIÓN DE VOTOS</h3>
        {totalVotes > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={listsWithVotes.map(list => ({
                  name: list.listName || 'Lista Sin Nombre',
                  value: list.votos || 0,
                  fill: list.color || '#007bff'
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-votes-message">
            <p>📊 No hay votos registrados aún.</p>
          </div>
        )}
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

// Componente de estadísticas de participación por curso
function ParticipationByCourseStats() {
  const { participationByCourse } = useContext(AdminContext);
  
  if (!participationByCourse || participationByCourse.length === 0) {
    return (
      <div className="participation-stats">
        <div className="no-data-message">
          <p>🎓 No hay datos de participación por curso disponibles.</p>
          <p>Los datos se mostrarán cuando haya estudiantes registrados con cursos asignados.</p>
        </div>
      </div>
    );
  }

  // Group courses by nivel for better organization
  const coursesByLevel = participationByCourse.reduce((acc, course) => {
    const nivel = course.nivel || 'Sin nivel';
    if (!acc[nivel]) {
      acc[nivel] = [];
    }
    acc[nivel].push(course);
    return acc;
  }, {});

  const nivelDisplayNames = {
    'BASICA_ELEMENTAL': '📖 Básica Elemental',
    'BASICA_MEDIA': '📓 Básica Media',
    'BASICA_SUPERIOR': '📔 Básica Superior',
    'BACHILLERATO': '🎓 Bachillerato',
    'Sin nivel': '❓ Sin nivel'
  };
  
  return (
    <div className="participation-by-course-stats">
      {Object.entries(coursesByLevel).map(([nivel, courses]) => (
        <div key={nivel} className="course-level-group">
          <h4 className="level-header">{nivelDisplayNames[nivel] || nivel}</h4>
          <div className="course-stats-grid">
            {courses.map(course => (
              <div key={course.course} className="course-participation-card">
                <div className="course-header">
                  <h5 className="course-name" title={`Curso: ${course.course}`}>
                    {course.course}
                  </h5>
                  <div className="course-numbers">
                    <span className="voted">{course.voted}</span>
                    <span className="separator">/</span>
                    <span className="total">{course.total}</span>
                  </div>
                </div>
                <div className="course-percentage">
                  <span className="percentage-text">{course.percentage}%</span>
                </div>
                <div className="course-participation-bar">
                  <div 
                    className="course-participation-fill"
                    style={{
                      width: `${course.percentage}%`,
                      backgroundColor: course.percentage >= 80 ? '#28a745' : 
                                      course.percentage >= 60 ? '#ffc107' : 
                                      course.percentage >= 40 ? '#fd7e14' : '#dc3545'
                    }}
                  ></div>
                </div>
                <div className="course-status">
                  {course.percentage >= 80 && <span className="status-excellent">🟢 Excelente</span>}
                  {course.percentage >= 60 && course.percentage < 80 && <span className="status-good">🟡 Buena</span>}
                  {course.percentage >= 40 && course.percentage < 60 && <span className="status-regular">🟠 Regular</span>}
                  {course.percentage < 40 && <span className="status-low">🔴 Baja</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Summary statistics */}
      <div className="course-summary">
        <h5>📊 Resumen por Cursos</h5>
        <div className="summary-items">
          <div className="summary-item">
            <span className="summary-label">Total Cursos:</span>
            <span className="summary-value">{participationByCourse.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Participación Promedio:</span>
            <span className="summary-value">
              {participationByCourse.length > 0 ? 
                Math.round(participationByCourse.reduce((sum, course) => sum + course.percentage, 0) / participationByCourse.length * 10) / 10 
                : 0}%
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Mejor Curso:</span>
            <span className="summary-value">
              {participationByCourse.length > 0 ? 
                participationByCourse.reduce((best, course) => course.percentage > best.percentage ? course : best).course
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
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


// Tab de gestión de listas de candidatos
function CandidatesTab() {
  return <CandidateListManager />;
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
• CONSERVARÁ todos los estudiantes importados
• Eliminará TODOS los votos registrados
• Reiniciará TODOS los estados de votación de estudiantes
• Eliminará TODOS los candidatos/listas electorales
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
        console.log('🗑️ Iniciando limpieza para nueva elección (conservando estudiantes)...');
        
        // Step 0: Clear activation codes using dedicated service
        console.log('🔑 Eliminando códigos de activación...');
        const codesResult = await activationCodesService.clearAllCodes();
        if (codesResult.success) {
          console.log(`✅ Eliminados ${codesResult.deleted} códigos de activación`);
        } else {
          console.warn('⚠️ Error eliminando códigos:', codesResult.error);
        }
        
        // Step 1: Reset student voting states (preserve students, reset states)
        console.log('🔄 Reiniciando estados de votación de estudiantes...');
        try {
          // Get all students to reset their voting status
          const studentsResult = await databaseService.findDocuments('students', {
            selector: { type: 'student' }
          });
          
          if (studentsResult.docs && studentsResult.docs.length > 0) {
            console.log(`🔄 Reiniciando ${studentsResult.docs.length} estudiantes...`);
            
            const resetPromises = studentsResult.docs.map(async (student) => {
              const resetStudent = {
                ...student,
                votado: false,
                absent: false,
                votedAt: null,
                absentAt: null
              };
              return databaseService.updateDocument('students', resetStudent);
            });
            
            await Promise.all(resetPromises);
            console.log(`✅ Estados reiniciados para ${studentsResult.docs.length} estudiantes`);
          }
        } catch (error) {
          console.error('Error reiniciando estados de estudiantes:', error);
        }
        
        // Step 2: Clear only votes, candidates, and sessions (preserve students)
        const collections = ['candidates', 'votes', 'sessions'];
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
        
        // Step 4: Reset local state (only clear candidates, keep students)
        setCandidates([]);
        
        const codesDeleted = codesResult.deleted || 0;
        const otherDeleted = totalDeleted - codesDeleted;
        
        // Get student count for success message
        const studentsResult = await databaseService.findDocuments('students', {
          selector: { type: 'student' }
        });
        const studentCount = studentsResult.docs ? studentsResult.docs.length : 0;
        
        setSuccess(`✅ Nueva elección iniciada exitosamente. 

CONSERVADOS:
• ${studentCount} estudiantes (estados reiniciados)

ELIMINADOS:
• ${codesDeleted} códigos de activación
• ${otherDeleted} votos, candidatos y sesiones
• Total eliminados: ${totalDeleted} registros`);
        
        console.log(`✅ Nueva elección completada. Estudiantes conservados: ${studentCount}, Eliminados - Códigos: ${codesDeleted}, Otros: ${otherDeleted}`);
        
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
      <div className="config-header">
        <h2>⚙️ CONFIGURACIÓN DEL SISTEMA</h2>
      </div>
      
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
      
      <div className="config-content">
        {/* Configuración de Elección - Componente principal */}
        <ElectionConfigurator />
        
        {/* Configuraciones del Sistema adicionales */}
        <div className="config-sections">
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
                onClick={() => alert('🔍 Funcionalidad no disponible en esta versión')}
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