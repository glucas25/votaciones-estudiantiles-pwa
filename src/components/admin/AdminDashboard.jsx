import React, { useState, useEffect, createContext, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AdminDashboard.css';

// Contexto para datos de administración
const AdminContext = createContext();

// Mock data para candidatos y votos
const mockCandidates = [
  {
    id: 'pres_001',
    nombre: 'Ana Pérez González',
    cargo: 'PRESIDENTE',
    lista: 'Lista Azul',
    color: '#2563eb',
    foto: 'https://images.unsplash.com/photo-1494790108755-2616b612b193?w=150&h=150&fit=crop&crop=face',
    propuestas: ['Más deportes y mejor cafetería', 'Tecnología en aulas'],
    nivel: 'BACHILLERATO',
    votos: 245
  },
  {
    id: 'pres_002',
    nombre: 'Carlos Ruiz Morales',
    cargo: 'PRESIDENTE',
    lista: 'Lista Roja',
    color: '#dc2626',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    propuestas: ['Tecnología y medio ambiente', 'Actividades culturales'],
    nivel: 'BACHILLERATO',
    votos: 198
  },
  {
    id: 'pres_003',
    nombre: 'Sofía Torres Vargas',
    cargo: 'PRESIDENTE',
    lista: 'Lista Verde',
    color: '#16a34a',
    foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    propuestas: ['Arte y cultura estudiantil', 'Espacios recreativos'],
    nivel: 'BACHILLERATO',
    votos: 100
  },
  {
    id: 'vice_001',
    nombre: 'Luis Morales Díaz',
    cargo: 'VICEPRESIDENTE',
    lista: 'Lista Azul',
    color: '#2563eb',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    propuestas: ['Apoyo académico', 'Eventos deportivos'],
    nivel: 'BACHILLERATO',
    votos: 267
  },
  {
    id: 'vice_002',
    nombre: 'Patricia Vega Silva',
    cargo: 'VICEPRESIDENTE',
    lista: 'Lista Roja',
    color: '#dc2626',
    foto: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
    propuestas: ['Medio ambiente', 'Proyectos sociales'],
    nivel: 'BACHILLERATO',
    votos: 156
  },
  {
    id: 'vice_003',
    nombre: 'Roberto Silva Luna',
    cargo: 'VICEPRESIDENTE',
    lista: 'Lista Verde',
    color: '#16a34a',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    propuestas: ['Tecnología educativa', 'Bienestar estudiantil'],
    nivel: 'BACHILLERATO',
    votos: 120
  }
];

// Mock data para estadísticas
const mockStats = {
  totalStudents: 700,
  studentsVoted: 543,
  studentsAbsent: 157,
  activeCourses: 24,
  totalCourses: 28,
  syncedDevices: 22,
  totalDevices: 24,
  currentTime: '14:30'
};

const participationByLevel = [
  { level: 'Básica Elemental', voted: 85, total: 100, percentage: 85 },
  { level: 'Básica Media', voted: 142, total: 180, percentage: 78.9 },
  { level: 'Básica Superior', voted: 156, total: 200, percentage: 78 },
  { level: 'Bachillerato', voted: 160, total: 220, percentage: 72.7 }
];

// Componente principal del Dashboard
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [candidates, setCandidates] = useState(mockCandidates);
  const [stats, setStats] = useState(mockStats);

  return (
    <AdminContext.Provider value={{ candidates, setCandidates, stats, setStats }}>
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
        </nav>

        {/* Content */}
        <main className="admin-content">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'candidates' && <CandidatesTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'config' && <ConfigTab />}
        </main>
      </div>
    </AdminContext.Provider>
  );
}

// Tab del Dashboard principal
function DashboardTab() {
  const { stats } = useContext(AdminContext);
  
  return (
    <div className="dashboard-tab">
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
              <p className="summary-percentage">({((stats.studentsVoted / stats.totalStudents) * 100).toFixed(1)}%)</p>
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
  
  const totalVotesPresident = presidentCandidates.reduce((sum, c) => sum + c.votos, 0);
  const totalVotesVicepresident = vicepresidentCandidates.reduce((sum, c) => sum + c.votos, 0);

  return (
    <div className="results-charts">
      {/* Presidente */}
      <div className="chart-container">
        <h3>PRESIDENTE ESTUDIANTIL</h3>
        <div className="results-bars">
          {presidentCandidates.map(candidate => {
            const percentage = ((candidate.votos / totalVotesPresident) * 100).toFixed(1);
            return (
              <div key={candidate.id} className="result-bar">
                <div className="candidate-info">
                  <span className="candidate-color" style={{backgroundColor: candidate.color}}></span>
                  <span className="candidate-name">{candidate.nombre} ({candidate.lista})</span>
                  <span className="votes-count">{candidate.votos} votos ({percentage}%)</span>
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
            const percentage = ((candidate.votos / totalVotesVicepresident) * 100).toFixed(1);
            return (
              <div key={candidate.id} className="result-bar">
                <div className="candidate-info">
                  <span className="candidate-color" style={{backgroundColor: candidate.color}}></span>
                  <span className="candidate-name">{candidate.nombre} ({candidate.lista})</span>
                  <span className="votes-count">{candidate.votos} votos ({percentage}%)</span>
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

// Tab de gestión de candidatos
function CandidatesTab() {
  const { candidates, setCandidates } = useContext(AdminContext);
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const handleDelete = (candidateId) => {
    if (window.confirm('¿Está seguro de eliminar este candidato?')) {
      setCandidates(candidates.filter(c => c.id !== candidateId));
    }
  };

  return (
    <div className="candidates-tab">
      <div className="candidates-header">
        <h2>🏆 GESTIÓN DE CANDIDATOS</h2>
        <button 
          className="btn-primary"
          onClick={() => {
            setEditingCandidate(null);
            setShowForm(true);
          }}
        >
          ➕ Nuevo Candidato
        </button>
      </div>

      {showForm && (
        <CandidateForm 
          candidate={editingCandidate}
          onSave={(candidate) => {
            if (editingCandidate) {
              setCandidates(candidates.map(c => c.id === candidate.id ? candidate : c));
            } else {
              setCandidates([...candidates, { ...candidate, id: `candidate_${Date.now()}` }]);
            }
            setShowForm(false);
            setEditingCandidate(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingCandidate(null);
          }}
        />
      )}

      <div className="candidates-grid">
        {candidates.map(candidate => (
          <div key={candidate.id} className="candidate-card">
            <img src={candidate.foto} alt={candidate.nombre} className="candidate-photo" />
            <div className="candidate-details">
              <h3>{candidate.nombre}</h3>
              <p className="candidate-position">{candidate.cargo}</p>
              <p className="candidate-list" style={{color: candidate.color}}>
                {candidate.lista}
              </p>
              <p className="candidate-votes">Votos: {candidate.votos}</p>
              <div className="candidate-actions">
                <button onClick={() => handleEdit(candidate)} className="btn-edit">
                  ✏️ Editar
                </button>
                <button onClick={() => handleDelete(candidate.id)} className="btn-delete">
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
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
            <span className="stat-value">{candidates.reduce((sum, c) => sum + c.votos, 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Participación:</span>
            <span className="stat-value">{((stats.studentsVoted / stats.totalStudents) * 100).toFixed(1)}%</span>
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
  return (
    <div className="config-tab">
      <h2>⚙️ CONFIGURACIÓN DEL SISTEMA</h2>
      
      <div className="config-sections">
        <div className="config-section">
          <h3>🔑 Códigos de Activación</h3>
          <div className="activation-codes">
            <div className="code-item">
              <span className="code">ELEC2024-BACH</span>
              <span className="level">Bachillerato</span>
              <span className="status active">✅ Activo</span>
            </div>
            <div className="code-item">
              <span className="code">ELEC2024-BASICA-SUP</span>
              <span className="level">Básica Superior</span>
              <span className="status active">✅ Activo</span>
            </div>
            <div className="code-item">
              <span className="code">ELEC2024-BASICA-MEDIA</span>
              <span className="level">Básica Media</span>
              <span className="status inactive">❌ Inactivo</span>
            </div>
          </div>
          <button className="btn-primary">➕ Nuevo Código</button>
        </div>

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
            <button className="btn-backup">💾 Crear Backup</button>
            <button className="btn-restore">📥 Restaurar Backup</button>
            <button className="btn-export">📤 Exportar Datos</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;