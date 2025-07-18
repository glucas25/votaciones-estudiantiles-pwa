import React, { useState } from 'react'
import ConnectionStatus from './components/common/ConnectionStatus'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { TutorRoute } from './components/auth/ProtectedRoute'
import TutorPanel from './components/tutor/TutorPanel'

function App() {
  const [currentView, setCurrentView] = useState('home')

  const handleRoleSelect = (role) => {
    console.log(`Seleccionado rol: ${role}`)
    
    switch (role) {
      case 'tutor':
        setCurrentView('tutor')
        break
      case 'admin':
        alert('Panel de administración se implementará en futuras fases')
        break
      case 'student':
        alert('Interfaz de estudiante se implementará en futuras fases')
        break
      default:
        console.warn('Rol no reconocido:', role)
    }
  }

  const handleBackToHome = () => {
    setCurrentView('home')
  }

  const styles = {
    app: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textAlign: 'center',
      padding: '20px'
    },
    container: {
      maxWidth: '1200px',
      width: '100%'
    },
    button: {
      background: 'rgba(255, 255, 255, 0.95)',
      color: '#1e40af',
      border: 'none',
      borderRadius: '15px',
      padding: '20px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      minWidth: '140px',
      minHeight: '80px',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    }
  }

  if (currentView === 'tutor') {
    return (
      <AuthProvider>
        <div style={styles.app}>
          <div style={styles.container}>
            <button onClick={handleBackToHome} style={styles.button}>
              ⬅️ Volver al inicio
            </button>
            <TutorRoute>
              <TutorPanel />
            </TutorRoute>
          </div>
        </div>
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <div style={styles.app}>
        <div style={styles.container}>
          <h1>🏛️ Sistema de Votación Estudiantil</h1>
          <p>Progressive Web App - Powered by Vite ⚡</p>
          
          <ConnectionStatus />

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            padding: '25px',
            marginBottom: '20px'
          }}>
            <h2>👤 Seleccionar Rol</h2>
            <div style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                style={styles.button}
                onClick={() => handleRoleSelect('admin')}
              >
                <span style={{fontSize: '2rem'}}>👨‍💼</span>
                <span>Administrador</span>
              </button>
              <button 
                style={styles.button}
                onClick={() => handleRoleSelect('tutor')}
              >
                <span style={{fontSize: '2rem'}}>👨‍🏫</span>
                <span>Tutor</span>
              </button>
              <button 
                style={styles.button}
                onClick={() => handleRoleSelect('student')}
              >
                <span style={{fontSize: '2rem'}}>🎓</span>
                <span>Estudiante</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}

export default App