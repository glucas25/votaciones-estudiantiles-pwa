// src/App.jsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StudentsProvider } from './contexts/StudentsContext';
import { CandidatesProvider } from './contexts/CandidatesContext';
import { ElectionConfigProvider } from './contexts/ElectionConfigContext';
import TutorLogin from './components/auth/TutorLogin';
import AdminLogin from './components/auth/AdminLogin';
import TutorPanel from './components/tutor/TutorPanel';
import LoadingSpinner from './components/common/LoadingSpinner';
import AdminDashboard from './components/admin/AdminDashboard';
import DatabaseTest from './components/common/DatabaseTest';
import migrationService from './services/migration.js';
import './App.css';

const AdminPanel = ({ user }) => (
  <div className="admin-panel">
    <div className="panel-header">
      <h1>🏛️ PANEL DE ADMINISTRACIÓN</h1>
      <div className="user-info">
        <span>👤 Administrador</span>
        <span>🕐 {new Date(user.loginTime).toLocaleTimeString()}</span>
      </div>
    </div>
    
    <div className="panel-content">
      <div className="welcome-message">
        <h2>🔧 ¡Panel de Control Administrativo!</h2>
        <p>Acceso completo al sistema de votación estudiantil</p>
        
        <div className="admin-features">
          <h3>⚙️ Herramientas disponibles:</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <h4>👥 Gestión de Estudiantes</h4>
              <p>Importar, editar y organizar estudiantes por cursos</p>
            </div>
            <div className="feature-card">
              <h4>🏆 Gestión de Candidatos</h4>
              <p>Crear candidatos, cargos y listas electorales</p>
            </div>
            <div className="feature-card">
              <h4>🔑 Códigos de Activación</h4>
              <p>Generar y gestionar códigos por nivel educativo</p>
            </div>
            <div className="feature-card">
              <h4>📊 Dashboard en Tiempo Real</h4>
              <p>Monitor de resultados y participación</p>
            </div>
            <div className="feature-card">
              <h4>📋 Reportes</h4>
              <p>Exportar resultados, actas y estadísticas</p>
            </div>
            <div className="feature-card">
              <h4>🔄 Sincronización</h4>
              <p>Control de dispositivos y backup</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HomePage = () => {
  const [selectedRole, setSelectedRole] = useState('');

  if (selectedRole === 'tutor') {
    return <TutorLogin />;
  }

  if (selectedRole === 'admin') {
    return <AdminLogin />;
  }

  return (
    <div className="homepage">
      <div className="hero-section">
        <h1>🏫 SISTEMA DE VOTACIÓN ESTUDIANTIL</h1>
        <p className="subtitle">Elecciones Transparentes - Tecnología Confiable</p>
        
        <div className="role-selector">
          <h2>Seleccione su rol de acceso:</h2>
          
          <div className="role-cards">
            <div 
              className="role-card tutor-card"
              onClick={() => setSelectedRole('tutor')}
            >
              <div className="role-icon">📱</div>
              <h3>Docente/Tutor</h3>
              <p>Supervisar votación de su curso</p>
              <div className="role-features">
                <span>✓ Lista de estudiantes</span>
                <span>✓ Proceso de votación</span>
                <span>✓ Modo quiosco</span>
              </div>
            </div>
            
            <div 
              className="role-card admin-card"
              onClick={() => setSelectedRole('admin')}
            >
              <div className="role-icon">🏛️</div>
              <h3>Administrador</h3>
              <p>Gestión completa del sistema</p>
              <div className="role-features">
                <span>✓ Dashboard general</span>
                <span>✓ Gestión de datos</span>
                <span>✓ Reportes</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="system-info">
          <h3>ℹ️ Información del Sistema</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>📅 Fecha de Elecciones:</strong> 15 de Marzo, 2024
            </div>
            <div className="info-item">
              <strong>🎓 Estudiantes Registrados:</strong> 700
            </div>
            <div className="info-item">
              <strong>🏫 Cursos Participantes:</strong> 28
            </div>
            <div className="info-item">
              <strong>🏆 Cargos en Disputa:</strong> Presidente, Vicepresidente
            </div>
          </div>
        </div>
        
        {/* Temporary Database Test Component */}
        <DatabaseTest />
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Iniciando sistema..." />;
  }

  if (!user) {
    return <HomePage />;
  }

  return (
    <div className="app-authenticated">
      <nav className="app-navbar">
        <div className="navbar-brand">
          <span className="brand-text">🗳️ Votaciones 2024</span>
        </div>
        <div className="navbar-actions">
          <span className="user-badge">
            {user.role === 'admin' ? '🏛️ Admin' : `📱 ${user.course}`}
          </span>
          <button 
            className="logout-button"
            onClick={logout}
            title="Cerrar sesión"
          >
            🚪 Salir
          </button>
        </div>
      </nav>

      <main className="app-main">
        {user.role === 'tutor' && (
          <ElectionConfigProvider>
          <StudentsProvider>
          <CandidatesProvider>
          <TutorPanel />
          </CandidatesProvider>
          </StudentsProvider>
          </ElectionConfigProvider>
        )}
        {user.role === 'admin' && (
          <ElectionConfigProvider>
          <AdminDashboard />
          </ElectionConfigProvider>
        )}
      </main>
    </div>
  );
};

const App = () => {
  const [migrationStatus, setMigrationStatus] = useState({
    checked: false,
    inProgress: false,
    completed: false,
    error: null
  });

  // Check and perform migration on app startup
  useEffect(() => {
    const checkAndPerformMigration = async () => {
      try {
        setMigrationStatus(prev => ({ ...prev, checked: true }));
        
        const migrationNeeded = await migrationService.isMigrationNeeded();
        console.log('🔍 Migration needed:', migrationNeeded);
        
        if (migrationNeeded) {
          console.log('🔄 Starting automatic migration...');
          setMigrationStatus(prev => ({ ...prev, inProgress: true }));
          
          const result = await migrationService.startMigration();
          console.log('✅ Migration completed:', result);
          
          setMigrationStatus(prev => ({ 
            ...prev, 
            inProgress: false, 
            completed: true 
          }));
        } else {
          console.log('ℹ️ No migration needed');
          setMigrationStatus(prev => ({ 
            ...prev, 
            completed: true 
          }));
        }
      } catch (error) {
        console.error('❌ Migration failed:', error);
        setMigrationStatus(prev => ({ 
          ...prev, 
          inProgress: false, 
          error: error.message 
        }));
      }
    };

    // Run migration check after a short delay to ensure services are ready
    setTimeout(checkAndPerformMigration, 1000);
  }, []);

  // Show migration status while in progress
  if (!migrationStatus.checked || migrationStatus.inProgress) {
    return (
      <div className="App">
        <LoadingSpinner 
          message={
            migrationStatus.inProgress 
              ? "Migrando datos a PouchDB..." 
              : "Iniciando sistema..."
          } 
        />
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="App">
        {migrationStatus.error && (
          <div className="migration-error-banner">
            <p>⚠️ Error en migración: {migrationStatus.error}</p>
            <p>El sistema funcionará con datos locales.</p>
          </div>
        )}
        <AppContent />
      </div>
    </AuthProvider>
  );
};

export default App;