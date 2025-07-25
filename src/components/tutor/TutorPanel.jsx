// src/components/tutor/TutorPanel.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents } from '../../contexts/StudentsContext';
import StudentList from './StudentList';
import VotingBooth from '../voting/VotingBooth';
import TutorDebugInfo from './TutorDebugInfo';
import './TutorPanel.css';

const TutorPanel = () => {
  const { user, isOnline } = useAuth();
  const { 
    students,
    searchTerm, 
    setSearchTerm, 
    filterType, 
    setFilterType, 
    getStudentsByStatus, 
    getStats,
    markStudentAsVoted,
    loading,
    dataReady,
    error,
    isReady,
    totalStudentsInDB,
    studentStates,
    resetStudentStatesForNewElection
  } = useStudents();

  const [activeSection, setActiveSection] = useState('pending'); // pending, voted, absent
  const [votingStudent, setVotingStudent] = useState(null); // Estudiante en proceso de votación
  
  const stats = getStats;
  const { pending, voted, absent } = getStudentsByStatus;

  const handleStartVoting = (student) => {
    setVotingStudent(student);
  };

  const handleCloseVoting = () => {
    setVotingStudent(null);
  };

  const handleVoteComplete = (studentId) => {
    // Student is already marked as voted in VoteConfirmation
    // Just close the voting booth
    setVotingStudent(null);
  };

  const getConnectionStatus = () => {
    return isOnline ? '🟢 Conectado' : '🔴 Offline';
  };

  const getSyncStatus = () => {
    return isOnline ? '🔄 Sincronizado' : '⏸️ Pendiente sync';
  };

  const handleSyncData = () => {
    // TODO: Implementar sincronización real
    alert('🔄 Sincronización simulada completada');
  };

  const handleGenerateReport = () => {
    const report = {
      curso: user.course,
      tutor: user.tutorName,
      fecha: new Date().toLocaleDateString(),
      hora: new Date().toLocaleTimeString(),
      estadisticas: stats,
      estudiantes: {
        votaron: voted.map(s => `${s.apellidos}, ${s.nombres}`),
        ausentes: absent.map(s => `${s.apellidos}, ${s.nombres}`),
        pendientes: pending.map(s => `${s.apellidos}, ${s.nombres}`)
      }
    };
    
    alert('📊 Reporte generado en consola (F12)');
  };

  const handleResetStudentStates = async () => {
    const confirmMessage = `¿Estás seguro de que quieres REINICIAR todos los estados de votación?\n\n` +
                          `Esto hará que todos los estudiantes vuelvan a estado "PENDIENTE":\n` +
                          `• ${voted.length} estudiantes que votaron → PENDIENTE\n` +
                          `• ${absent.length} estudiantes ausentes → PENDIENTE\n` +
                          `• Los votos registrados NO se eliminarán\n\n` +
                          `Esta acción NO se puede deshacer.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await resetStudentStatesForNewElection();
      if (result.success) {
        alert(`✅ Estados reiniciados exitosamente\n\n${result.count} estudiantes regresaron a estado PENDIENTE`);
      }
    } catch (error) {
      console.error('Error resetting student states:', error);
      alert('❌ Error al reiniciar estados. Ver consola para detalles.');
    }
  };

  const handleBackup = () => {
    const backupData = {
      curso: user.course,
      fecha: new Date().toISOString(),
      estudiantes: [...pending, ...voted, ...absent],
      estados: getStudentsByStatus()
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${user.course}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mostrar loading si los datos no están completamente listos
  if (!dataReady || loading) {
    return (
      <div className="tutor-panel">
        <div className="tutor-panel-header">
          <h2>🎓 Panel del Tutor - {user.course}</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner">⏳ Cargando datos completos...</div>
          <p>Sincronizando estudiantes y estados de votación</p>
        </div>
      </div>
    );
  }

  // Si hay un estudiante votando, mostrar solo la interfaz de votación
  if (votingStudent) {
    return (
      <VotingBooth
        student={votingStudent}
        onClose={handleCloseVoting}
        onVoteComplete={handleVoteComplete}
      />
    );
  }

  // Panel principal del tutor
  return (
    <div className="tutor-panel">
      <TutorDebugInfo />
      {/* Header con estadísticas */}
      <div className="panel-header">
        <div className="header-info">
          <h1>📊 VOTACIÓN ACTIVA - {user.course}</h1>
          <div className="status-indicators">
            <span className="status-item">{getConnectionStatus()}</span>
            <span className="status-item">👥 {stats.voted}/{stats.total}</span>
            <span className="status-item">❌ {stats.absent} ausentes</span>
          </div>
        </div>
        <div className="progress-info">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${stats.participation}%` }}
            ></div>
          </div>
          <span className="progress-text">{stats.participation}% completado</span>
        </div>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="controls-section">
        <div className="search-controls">
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">📋 Todos</option>
            <option value="pending">🟢 Pendientes</option>
            <option value="voted">✅ Votaron</option>
            <option value="absent">❌ Ausentes</option>
          </select>
        </div>

        <div className="action-buttons">
          <button onClick={handleSyncData} className="action-btn sync-btn">
            🔄 SINCRONIZAR
          </button>
        </div>
      </div>

      {/* Navegación entre secciones */}
      <div className="section-tabs">
        <button
          className={`tab-button ${activeSection === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveSection('pending')}
        >
          🟢 PENDIENTES ({pending.length})
        </button>
        <button
          className={`tab-button ${activeSection === 'voted' ? 'active' : ''}`}
          onClick={() => setActiveSection('voted')}
        >
          ✅ VOTARON ({voted.length})
        </button>
        <button
          className={`tab-button ${activeSection === 'absent' ? 'active' : ''}`}
          onClick={() => setActiveSection('absent')}
        >
          ❌ AUSENTES ({absent.length})
        </button>
      </div>

      {/* Lista de estudiantes */}
      <div className="students-section">
        {activeSection === 'pending' && (
          <StudentList
            students={pending}
            status="pending"
            title="Estudiantes Pendientes"
            emptyMessage="🎉 ¡Todos los estudiantes han votado!"
            onStartVoting={handleStartVoting}
          />
        )}
        
        {activeSection === 'voted' && (
          <StudentList
            students={voted}
            status="voted"
            title="Estudiantes que ya Votaron"
            emptyMessage="📝 Aún no hay votos registrados"
            onStartVoting={handleStartVoting}
          />
        )}
        
        {activeSection === 'absent' && (
          <StudentList
            students={absent}
            status="absent"
            title="Estudiantes Ausentes"
            emptyMessage="👏 ¡Todos los estudiantes están presentes!"
            onStartVoting={handleStartVoting}
          />
        )}
      </div>

      {/* Botones de acción inferiores */}
      <div className="bottom-actions">
        <button onClick={handleGenerateReport} className="action-btn report-btn">
          📊 REPORTE
        </button>
        <button onClick={handleBackup} className="action-btn backup-btn">
          💾 BACKUP
        </button>
        <button onClick={handleResetStudentStates} className="action-btn reset-btn" title="Reiniciar estados de votación de todos los estudiantes">
          🔄 REINICIAR ESTADOS
        </button>
        <button onClick={handleSyncData} className="action-btn sync-btn">
          🔄 SYNC
        </button>
        <button className="action-btn kiosk-btn">
          🖥️ QUIOSCO
        </button>
      </div>

      {/* Información adicional */}
      <div className="session-info">
        <div className="session-details">
          <span>👤 {user.tutorName}</span>
          <span>🎓 {user.levelName}</span>
          <span>🕐 Inicio: {formatTime(user.loginTime)}</span>
          <span>{getSyncStatus()}</span>
        </div>
      </div>
    </div>
  );
};

export default TutorPanel;